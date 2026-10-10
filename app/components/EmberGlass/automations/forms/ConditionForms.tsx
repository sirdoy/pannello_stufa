'use client';
/**
 * Phase 180 — Plan 05 Task 1: ConditionForms.tsx
 *
 * Leaf condition forms + dispatcher (ConditionForm).
 * Field names follow API truth (D-09a applied to conditions):
 *   start → start_time, end → end_time
 *   sensor → sensor_id
 *   min → min_temp, max → max_temp
 *
 * A sensor leaf (device_state, sensor_threshold) is picked from the list of sensors the
 * engine sees (ROADMAP M70); sensor_state_change and netatmo_temperature_threshold still
 * render the "Tipo non supportato" fallback.
 * D-02: inline-style + var(--token) only.
 */
import { useState } from 'react';
import type {
  TimeWindowCondition,
  TemperatureRangeCondition,
  AlwaysTrueCondition,
  AutomationSensor,
  ConditionNode,
} from '@/types/automations';
import { TextInput } from '../primitives/TextInput';
import { NumInput } from '../primitives/NumInput';
import { FieldLabel } from '../primitives/FieldLabel';
import { TwoCol } from '../primitives/TwoCol';
import { EmberSelect } from '../primitives/EmberSelect';
import { useAutomationSensors } from '../hooks/useAutomationSensors';
import {
  MAX_FOR_MINUTES,
  OPERATOR_OPTIONS,
  booleanLabels,
  booleanWord,
  buildSensorCondition,
  defaultConditionForSensor,
  findSensor,
  forSecondsToMinutes,
  formatSensorValue,
  groupSensorsByDevice,
  metricLabel,
  minutesToForSeconds,
  optionLabel,
  readComparison,
  type SensorCondition,
  type SensorOperator,
} from '../lib/sensor-catalog';

// ─── Per-type form prop interfaces ─────────────────────────────────────────

export interface ConditionFormProps<T> {
  cond: T;
  onChange: (next: T) => void;
}

// ─── TimeWindowForm ──────────────────────────────────────────────────────────

export function TimeWindowForm({ cond, onChange }: ConditionFormProps<TimeWindowCondition>) {
  return (
    <TwoCol>
      <div>
        <FieldLabel htmlFor="cond-start" small>Da</FieldLabel>
        <TextInput
          id="cond-start"
          type="time"
          value={cond.start_time}
          onChange={(v) => onChange({ ...cond, start_time: v })}
          aria-label="Ora inizio finestra"
        />
      </div>
      <div>
        <FieldLabel htmlFor="cond-end" small>A</FieldLabel>
        <TextInput
          id="cond-end"
          type="time"
          value={cond.end_time}
          onChange={(v) => onChange({ ...cond, end_time: v })}
          aria-label="Ora fine finestra"
        />
      </div>
    </TwoCol>
  );
}

// ─── SensorConditionForm ─────────────────────────────────────────────────────

const MANUAL = '__manual__';
const hintStyle = { fontSize: 11, color: 'var(--text-2)', marginTop: 4 } as const;
const codeStyle = { fontFamily: 'ui-monospace, monospace' } as const;

/**
 * A condition on a sensor: device → what to read → comparison (workspace ROADMAP M70).
 * Edits both leaf types the engine has for a sensor: "equal to" is saved as `device_state`,
 * above / below as `sensor_threshold`. The id is typed by hand only when the sensor is not
 * in the list (provider offline, list not available).
 */
export function SensorConditionForm({ cond, onChange }: ConditionFormProps<SensorCondition>) {
  const { sensors, loading, error } = useAutomationSensors();
  const [manualChosen, setManualChosen] = useState(false);

  if (loading) {
    return (
      <EmberSelect value="" onChange={() => {}} options={[]} placeholder="Caricamento…" disabled aria-label="Caricamento sensori" />
    );
  }

  const devices = groupSensorsByDevice(sensors);
  const sensor = findSensor(sensors, cond.sensor_id);
  const { operator, value } = readComparison(cond);
  const unknownId = cond.sensor_id !== '' && sensor === null;
  const manual = manualChosen || error !== null || devices.length === 0 || unknownId;
  const forSeconds = cond.for_seconds ?? null;
  const setComparison = (nextOperator: SensorOperator, nextValue: string) =>
    onChange(buildSensorCondition(cond.sensor_id, nextOperator, nextValue, forSeconds));
  const heldFor = (
    <HeldFor
      forSeconds={forSeconds}
      onChange={(next) => onChange(buildSensorCondition(cond.sensor_id, operator, value, next))}
    />
  );

  if (manual) {
    const why =
      error !== null
        ? `Elenco dei sensori non disponibile (${error}).`
        : devices.length === 0
          ? 'Nessun sensore disponibile in questo momento.'
          : unknownId && !manualChosen
            ? 'Questo sensore non è fra quelli che il sistema vede ora.'
            : null;
    return (
      <div>
        <FieldLabel htmlFor="cond-sensor" small>Sensore (ID)</FieldLabel>
        <TextInput
          id="cond-sensor"
          value={cond.sensor_id}
          onChange={(v) => onChange(buildSensorCondition(v, operator, value, forSeconds))}
          placeholder="es. dirigera:<id sensore>:is_open"
          aria-label="ID sensore"
        />
        <div style={hintStyle}>
          {why !== null && <>{why} </>}
          Formato <code style={codeStyle}>provider:id:metrica</code>, es.{' '}
          <code style={codeStyle}>thermorossi:default:stove_state</code>, <code style={codeStyle}>hue:5:on</code>.
        </div>
        {devices.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setManualChosen(false);
              onChange({ type: 'device_state', sensor_id: '', expected_state: '' });
            }}
            style={{
              ...hintStyle,
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'var(--accent)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Scegli dall&apos;elenco
          </button>
        )}
        <div style={{ height: 8 }} />
        <TwoCol>
          <div>
            <FieldLabel htmlFor="cond-operator" small>Confronto</FieldLabel>
            <EmberSelect
              id="cond-operator"
              value={operator}
              onChange={(v) => setComparison(v as SensorOperator, value)}
              options={[...OPERATOR_OPTIONS]}
              aria-label="Confronto"
            />
          </div>
          <div>
            <FieldLabel htmlFor="cond-state" small>Valore</FieldLabel>
            {operator === 'eq' ? (
              <TextInput
                id="cond-state"
                value={value}
                onChange={(v) => setComparison('eq', v)}
                placeholder="es. on, off, working"
                aria-label="Valore"
              />
            ) : (
              <NumInput
                id="cond-state"
                value={Number.isFinite(Number(value)) ? Number(value) : 0}
                onChange={(v) => setComparison(operator, String(v ?? 0))}
                aria-label="Valore"
              />
            )}
          </div>
        </TwoCol>
        {heldFor}
      </div>
    );
  }

  const device = sensor ? devices.find((d) => d.key === `${sensor.provider}:${sensor.device_id}`) : undefined;
  const pick = (next: AutomationSensor | undefined) => {
    if (next) onChange({ ...defaultConditionForSensor(next), ...(forSeconds ? { for_seconds: forSeconds } : {}) });
  };

  return (
    <div>
      <FieldLabel htmlFor="cond-device" small>Dispositivo</FieldLabel>
      <EmberSelect
        id="cond-device"
        value={device?.key ?? ''}
        onChange={(key) => {
          if (key === MANUAL) setManualChosen(true);
          else pick(devices.find((d) => d.key === key)?.sensors[0]);
        }}
        options={[
          ...devices.map((d) => ({ value: d.key, label: d.label })),
          { value: MANUAL, label: 'Altro: scrivi l’ID a mano…' },
        ]}
        placeholder="Scegli il dispositivo…"
        aria-label="Dispositivo"
      />
      {sensor && device && (
        <>
          <div style={{ height: 8 }} />
          <FieldLabel htmlFor="cond-metric" small>Cosa leggere</FieldLabel>
          <EmberSelect
            id="cond-metric"
            value={sensor.sensor_id}
            onChange={(id) => pick(device.sensors.find((s) => s.sensor_id === id))}
            options={device.sensors.map((s) => ({
              value: s.sensor_id,
              label: `${metricLabel(s)} · ora ${formatSensorValue(s)}`,
            }))}
            aria-label="Cosa leggere"
          />
          <div style={{ height: 8 }} />
          <SensorComparison sensor={sensor} operator={operator} value={value} onChange={setComparison} />
          {heldFor}
        </>
      )}
    </div>
  );
}

interface HeldForProps {
  forSeconds: number | null;
  onChange: (forSeconds: number | null) => void;
}

/** How long the comparison must have held before the leaf is true (`for_seconds`, ROADMAP D26). */
function HeldFor({ forSeconds, onChange }: HeldForProps) {
  return (
    <>
      <div style={{ height: 8 }} />
      <FieldLabel htmlFor="cond-held-for" small>Da almeno (vuoto = subito)</FieldLabel>
      <NumInput
        id="cond-held-for"
        value={forSecondsToMinutes(forSeconds)}
        allowNull
        min={1}
        max={MAX_FOR_MINUTES}
        unit="min"
        onChange={(v) => onChange(minutesToForSeconds(v))}
        aria-label="Da almeno, in minuti"
      />
    </>
  );
}

interface SensorComparisonProps {
  sensor: AutomationSensor;
  operator: SensorOperator;
  value: string;
  onChange: (operator: SensorOperator, value: string) => void;
}

function SensorComparison({ sensor, operator, value, onChange }: SensorComparisonProps) {
  if (sensor.value_type === 'boolean') {
    const [whenTrue, whenFalse] = booleanLabels(sensor.metric);
    return (
      <div>
        <FieldLabel htmlFor="cond-state" small>È vera quando</FieldLabel>
        <EmberSelect
          id="cond-state"
          value={booleanWord(value) ?? ''}
          onChange={(v) => onChange('eq', v)}
          options={[
            { value: 'true', label: whenTrue },
            { value: 'false', label: whenFalse },
          ]}
          placeholder="Scegli…"
          aria-label="Valore"
        />
      </div>
    );
  }

  if (sensor.value_type === 'number') {
    const parsed = Number(value);
    return (
      <TwoCol>
        <div>
          <FieldLabel htmlFor="cond-operator" small>È vera quando è</FieldLabel>
          <EmberSelect
            id="cond-operator"
            value={operator}
            onChange={(v) => onChange(v as SensorOperator, value.trim() === '' ? '0' : value)}
            options={[...OPERATOR_OPTIONS]}
            aria-label="Confronto"
          />
        </div>
        <div>
          <FieldLabel htmlFor="cond-state" small>Valore</FieldLabel>
          <NumInput
            id="cond-state"
            value={value.trim() !== '' && Number.isFinite(parsed) ? parsed : null}
            onChange={(v) => onChange(operator, String(v ?? 0))}
            unit={sensor.unit ?? undefined}
            step={0.5}
            aria-label="Valore"
          />
        </div>
      </TwoCol>
    );
  }

  const options = sensor.options ?? [];
  if (options.length === 0) {
    return (
      <div>
        <FieldLabel htmlFor="cond-state" small>È vera quando è uguale a</FieldLabel>
        <TextInput id="cond-state" value={value} onChange={(v) => onChange('eq', v)} aria-label="Valore" />
      </div>
    );
  }
  const current = options.find((o) => o.toLowerCase() === value.trim().toLowerCase());
  return (
    <div>
      <FieldLabel htmlFor="cond-state" small>È vera quando è</FieldLabel>
      <EmberSelect
        id="cond-state"
        value={current ?? value}
        onChange={(v) => onChange('eq', v)}
        options={[
          ...options.map((o) => ({ value: o, label: optionLabel(sensor.metric, o) })),
          ...(value !== '' && current === undefined ? [{ value, label: value }] : []),
        ]}
        placeholder="Scegli…"
        aria-label="Valore"
      />
    </div>
  );
}

// ─── TemperatureRangeForm ────────────────────────────────────────────────────

export function TemperatureRangeForm({
  cond,
  onChange,
}: ConditionFormProps<TemperatureRangeCondition>) {
  return (
    <>
      <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 6 }}>
        Questa condizione non legge nessun sensore: è sempre vera. Toglila o usa «Sensore o dispositivo».
      </div>
      <TwoCol>
        <div>
          <FieldLabel htmlFor="cond-min-temp" small>Min</FieldLabel>
          <NumInput
            id="cond-min-temp"
            value={cond.min_temp ?? null}
            allowNull
            unit="°C"
            onChange={(v) => onChange({ ...cond, min_temp: v })}
            aria-label="Temperatura minima"
          />
        </div>
        <div>
          <FieldLabel htmlFor="cond-max-temp" small>Max</FieldLabel>
          <NumInput
            id="cond-max-temp"
            value={cond.max_temp ?? null}
            allowNull
            unit="°C"
            onChange={(v) => onChange({ ...cond, max_temp: v })}
            aria-label="Temperatura massima"
          />
        </div>
      </TwoCol>
    </>
  );
}

// ─── AlwaysTrueForm ──────────────────────────────────────────────────────────

export function AlwaysTrueForm(_: ConditionFormProps<AlwaysTrueCondition>) {
  return (
    <div style={{ fontSize: 12, color: 'var(--text-2)', padding: 4 }}>
      Nessun parametro — sempre vero.
    </div>
  );
}

// ─── ConditionForm dispatcher ─────────────────────────────────────────────────

export interface ConditionFormDispatchProps {
  cond: ConditionNode;
  onChange: (next: ConditionNode) => void;
}

/**
 * Dispatches to the right form based on cond.type.
 * D-09b (conditions parallel): legacy sensor leaves render as readonly fallback.
 */
export function ConditionForm({ cond, onChange }: ConditionFormDispatchProps) {
  switch (cond.type) {
    case 'time_window':
      return <TimeWindowForm cond={cond} onChange={onChange} />;
    case 'device_state':
    case 'sensor_threshold':
      return <SensorConditionForm cond={cond} onChange={onChange} />;
    case 'temperature_range':
      return <TemperatureRangeForm cond={cond} onChange={onChange} />;
    case 'always_true':
      return <AlwaysTrueForm cond={cond} onChange={() => undefined} />;
    case 'and':
    case 'or':
      // Composite nodes are handled by ConditionGroup — never dispatched here
      return null;
    default:
      // D-09b applied to conditions: fail-open for legacy sensor leaves loaded from API
      // (sensor_state_change, netatmo_temperature_threshold)
      return (
        <div style={{ fontSize: 12, color: 'var(--text-2)', padding: 4 }}>
          Tipo non supportato —{' '}
          <code style={{ fontFamily: 'ui-monospace, monospace' }}>
            {(cond as { type: string }).type}
          </code>
        </div>
      );
  }
}
