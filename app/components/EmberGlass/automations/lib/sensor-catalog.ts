/**
 * Sensor catalog helpers for the condition editor (workspace ROADMAP M70).
 *
 * The backend lists the sensors the engine sees (GET /api/v1/automations/sensors);
 * here they become "device → what to read → comparison" choices, and a choice becomes
 * the condition leaf the engine understands: `device_state` for "equal to",
 * `sensor_threshold` for above / below. Pure functions, no React.
 */
import type {
  AutomationSensor,
  ConditionNode,
  DeviceStateCondition,
  SensorThresholdLeaf,
} from '@/types/automations';

export type SensorCondition = DeviceStateCondition | SensorThresholdLeaf;
export type SensorOperator = 'eq' | 'lt' | 'lte' | 'gt' | 'gte';

export const OPERATOR_OPTIONS: ReadonlyArray<{ value: SensorOperator; label: string }> = [
  { value: 'lt', label: 'minore di' },
  { value: 'lte', label: 'minore o uguale a' },
  { value: 'gt', label: 'maggiore di' },
  { value: 'gte', label: 'maggiore o uguale a' },
  { value: 'eq', label: 'uguale a' },
];

const PROVIDER_LABELS: Record<string, string> = {
  netatmo: 'Netatmo',
  hue: 'Luce Hue',
  tuya: 'Presa',
  thermorossi: 'Stufa',
  sonos: 'Sonos',
  dirigera: 'Sensore IKEA',
};

const METRIC_LABELS: Record<string, string> = {
  'netatmo:temperature': 'Temperatura',
  'netatmo:setpoint': 'Temperatura impostata',
  'hue:on': 'Accesa / spenta',
  'hue:bri': 'Luminosità (1–254)',
  'hue:ct': 'Temperatura colore',
  'hue:hue': 'Tonalità',
  'hue:sat': 'Saturazione',
  'hue:reachable': 'Raggiungibile',
  'tuya:switch_on': 'Accesa / spenta',
  'tuya:power_w': 'Potenza assorbita',
  'tuya:voltage_v': 'Tensione',
  'tuya:current_ma': 'Corrente',
  'tuya:energy_kwh': 'Energia consumata',
  'tuya:countdown_s': 'Timer residuo',
  'thermorossi:stove_state': 'Stato della stufa',
  'thermorossi:stove_state_raw': 'Stato (codice)',
  'thermorossi:power_level': 'Livello di potenza',
  'thermorossi:fan_level': 'Livello della ventola',
  'thermorossi:error_code': 'Codice di errore',
  'thermorossi:error_description': 'Descrizione errore',
  'thermorossi:pellet_low': 'Pellet in riserva',
  'thermorossi:pellet_reserve': 'Riserva pellet (codice)',
  'sonos:is_playing': 'In riproduzione',
  'sonos:transport_state': 'Stato riproduzione',
  'sonos:source_type': 'Sorgente',
  'sonos:volume': 'Volume',
  'sonos:mute': 'Muto',
  'dirigera:is_open': 'Aperta / chiusa',
  'dirigera:is_detected': 'Movimento',
  'dirigera:light_level': 'Luce ambiente',
  'dirigera:temperature': 'Temperatura',
  'dirigera:humidity': 'Umidità',
  'dirigera:co2': 'CO₂',
  'dirigera:pm25': 'Polveri PM2.5',
  'dirigera:battery_percentage': 'Batteria',
  'dirigera:is_reachable': 'Raggiungibile',
};

/** [label when true, label when false] */
const BOOLEAN_LABELS: Record<string, [string, string]> = {
  on: ['accesa', 'spenta'],
  switch_on: ['accesa', 'spenta'],
  is_open: ['aperta', 'chiusa'],
  is_detected: ['movimento rilevato', 'nessun movimento'],
  is_playing: ['in riproduzione', 'ferma'],
  reachable: ['raggiungibile', 'non raggiungibile'],
  is_reachable: ['raggiungibile', 'non raggiungibile'],
  pellet_low: ['in riserva', 'pellet sufficiente'],
  mute: ['muto', 'audio attivo'],
};

const OPTION_LABELS: Record<string, string> = {
  'stove_state:off': 'spenta',
  'stove_state:igniting': 'in accensione',
  'stove_state:working': 'accesa',
  'stove_state:cleaning': 'pulizia',
  'stove_state:alarm': 'allarme',
  'stove_state:modulating': 'modulazione',
  'transport_state:PLAYING': 'in riproduzione',
  'transport_state:PAUSED_PLAYBACK': 'in pausa',
  'transport_state:STOPPED': 'ferma',
  'transport_state:TRANSITIONING': 'in caricamento',
  'source_type:tv': 'TV',
  'source_type:streaming': 'streaming',
  'source_type:radio': 'radio',
  'source_type:line_in': 'ingresso audio',
  'source_type:airplay': 'AirPlay',
  'source_type:unknown': 'sconosciuta',
};

/** What a device is mostly asked about comes first in its list. */
const METRIC_ORDER = [
  'is_open',
  'is_detected',
  'temperature',
  'stove_state',
  'on',
  'switch_on',
  'is_playing',
  'light_level',
  'setpoint',
  'power_w',
  'volume',
];

// Same words the backend accepts for a boolean sensor (docs/api/automations.md).
const TRUE_WORDS = ['true', 'on', 'yes', 'open', '1'];
const FALSE_WORDS = ['false', 'off', 'no', 'closed', '0'];

export interface SensorDevice {
  /** `provider:device_id` */
  key: string;
  label: string;
  sensors: AutomationSensor[];
}

export function metricLabel(sensor: AutomationSensor): string {
  return METRIC_LABELS[`${sensor.provider}:${sensor.metric}`] ?? sensor.metric;
}

export function booleanLabels(metric: string): [string, string] {
  return BOOLEAN_LABELS[metric] ?? ['sì', 'no'];
}

export function optionLabel(metric: string, option: string): string {
  return OPTION_LABELS[`${metric}:${option}`] ?? option;
}

/** Current value in plain words: "19.5 °C", "aperta", "accesa". */
export function formatSensorValue(sensor: AutomationSensor): string {
  const { value } = sensor;
  if (value === null || value === undefined) return 'nessun valore';
  if (typeof value === 'boolean') return booleanLabels(sensor.metric)[value ? 0 : 1];
  if (typeof value === 'number') return sensor.unit ? `${value} ${sensor.unit}` : String(value);
  return optionLabel(sensor.metric, value);
}

function deviceLabel(sensor: AutomationSensor): string {
  const kind = PROVIDER_LABELS[sensor.provider] ?? sensor.provider;
  if (sensor.provider === 'thermorossi') return kind;
  const name = sensor.device_name ?? sensor.device_id;
  const room = sensor.room && !name.toLowerCase().includes(sensor.room.toLowerCase()) ? ` · ${sensor.room}` : '';
  return `${name}${room} (${kind})`;
}

function metricRank(metric: string): number {
  const i = METRIC_ORDER.indexOf(metric);
  return i === -1 ? METRIC_ORDER.length : i;
}

/** Sensors grouped by device, devices by name, each device's main metric first. */
export function groupSensorsByDevice(sensors: AutomationSensor[]): SensorDevice[] {
  const byKey = new Map<string, SensorDevice>();
  for (const sensor of sensors) {
    const key = `${sensor.provider}:${sensor.device_id}`;
    const device = byKey.get(key) ?? { key, label: deviceLabel(sensor), sensors: [] };
    device.sensors.push(sensor);
    byKey.set(key, device);
  }
  const devices = [...byKey.values()];
  for (const device of devices) {
    device.sensors.sort(
      (a, b) => metricRank(a.metric) - metricRank(b.metric) || metricLabel(a).localeCompare(metricLabel(b), 'it'),
    );
  }
  return devices.sort((a, b) => a.label.localeCompare(b.label, 'it'));
}

/** The stove is one device: the engine ignores the middle part of its ids. */
function canonicalSensorId(sensorId: string): string {
  const parts = sensorId.split(':');
  return parts.length >= 3 && parts[0] === 'thermorossi'
    ? `thermorossi:_:${parts.slice(2).join(':')}`
    : sensorId;
}

export function findSensor(sensors: AutomationSensor[], sensorId: string): AutomationSensor | null {
  if (!sensorId) return null;
  const wanted = canonicalSensorId(sensorId);
  return sensors.find((s) => canonicalSensorId(s.sensor_id) === wanted) ?? null;
}

export function isSensorCondition(cond: ConditionNode): cond is SensorCondition {
  return cond.type === 'device_state' || cond.type === 'sensor_threshold';
}

/** The comparison a sensor leaf holds, whichever of the two leaf types stores it. */
export function readComparison(cond: SensorCondition): { operator: SensorOperator; value: string } {
  if (cond.type === 'sensor_threshold') {
    return { operator: cond.operator, value: String(cond.threshold) };
  }
  return { operator: 'eq', value: cond.expected_state };
}

/** "true" / "false" for a stored boolean word ("on", "True", "open", ...), else null. */
export function booleanWord(value: string): 'true' | 'false' | null {
  const word = value.trim().toLowerCase();
  if (TRUE_WORDS.includes(word)) return 'true';
  if (FALSE_WORDS.includes(word)) return 'false';
  return null;
}

function metricOf(sensorId: string): string {
  return sensorId.split(':').slice(2).join(':');
}

/** Longest wait the engine accepts on a sensor leaf (`for_seconds`, ROADMAP D26). */
export const MAX_FOR_MINUTES = 1440;

/** Minutes typed in the form → `for_seconds`, or null when the leaf must match at once. */
export function minutesToForSeconds(minutes: number | null): number | null {
  if (minutes === null || !Number.isFinite(minutes) || minutes <= 0) return null;
  return Math.min(Math.max(Math.round(minutes * 60), 1), MAX_FOR_MINUTES * 60);
}

/** `for_seconds` of a leaf as the minutes the form shows, null when it has none. */
export function forSecondsToMinutes(forSeconds: number | null | undefined): number | null {
  return typeof forSeconds === 'number' && forSeconds > 0 ? Math.round((forSeconds / 60) * 100) / 100 : null;
}

/**
 * The leaf for "sensor <operator> value": equality is `device_state`, the rest a threshold.
 * `forSeconds` makes it match only after the comparison has held that long (D26).
 */
export function buildSensorCondition(
  sensorId: string,
  operator: SensorOperator,
  value: string,
  forSeconds: number | null = null,
): SensorCondition {
  const held = forSeconds !== null && forSeconds > 0 ? { for_seconds: forSeconds } : {};
  if (operator === 'eq') {
    return { type: 'device_state', sensor_id: sensorId, expected_state: value, ...held };
  }
  const threshold = Number(value);
  return {
    type: 'sensor_threshold',
    sensor_id: sensorId,
    metric: metricOf(sensorId),
    operator,
    threshold: value.trim() !== '' && Number.isFinite(threshold) ? threshold : 0,
    ...held,
  };
}

/** The leaf a freshly picked sensor starts with: a comparison that is true or close to it now. */
export function defaultConditionForSensor(sensor: AutomationSensor): SensorCondition {
  if (sensor.value_type === 'boolean') {
    return buildSensorCondition(sensor.sensor_id, 'eq', 'true');
  }
  if (sensor.value_type === 'number') {
    const current = typeof sensor.value === 'number' ? sensor.value : 0;
    return buildSensorCondition(sensor.sensor_id, 'lt', String(current));
  }
  const first = sensor.options?.[0];
  return buildSensorCondition(sensor.sensor_id, 'eq', typeof sensor.value === 'string' ? sensor.value : (first ?? ''));
}

/** Italian message for the first sensor leaf that cannot work, or null. */
export function incompleteConditionMessage(node: unknown): string | null {
  const n = node as { kind?: string; type?: string; items?: unknown[]; sensor_id?: string; expected_state?: string };
  if (n.kind === 'group') {
    for (const item of n.items ?? []) {
      const message = incompleteConditionMessage(item);
      if (message) return message;
    }
    return null;
  }
  if (n.type !== 'device_state' && n.type !== 'sensor_threshold') return null;
  if (!n.sensor_id || n.sensor_id.split(':').length < 3 || n.sensor_id.split(':').some((part) => part === '')) {
    return 'Condizione: scegli il dispositivo da leggere.';
  }
  if (n.type === 'device_state' && !(n.expected_state ?? '').trim()) {
    return 'Condizione: indica il valore da confrontare.';
  }
  return null;
}
