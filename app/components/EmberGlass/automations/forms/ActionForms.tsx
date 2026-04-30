'use client';
/**
 * ActionForms.tsx — Phase 180 Plan 06
 * 11 named form components (one per ActionItem type) + ActionForm dispatcher.
 *
 * Design rules:
 *   - D-02: inline-style + var(--token) only. Zero Tailwind for visual values.
 *   - D-09a: all field names match API exactly (home_id, light_id, power_level, etc.)
 *   - D-09b: exhaustive switch + assertNever in dispatcher
 *   - Threat T-180-06-02: http_webhook JSON.parse wrapped in try/catch
 *   - Threat T-180-06-04: command switch resets all conditional fields to null
 *   - Threat T-180-06-05: boolean `on` via SegmentedControl + `value === 'true'` conversion
 */

import { useState } from 'react';
import type {
  ActionItem,
  NetatmoSetRoomTempAction,
  NetatmoSetHomeModeAction,
  NetatmoSwitchScheduleAction,
  HttpWebhookAction,
  LogEventAction,
  HueLightAction,
  HueGroupAction,
  HueSceneAction,
  ThermorossiAction,
  SonosAction,
  TuyaAction,
} from '@/types/automations';
import { assertNever } from '@/lib/utils/assertNever';
import { TextInput } from '../primitives/TextInput';
import { NumInput } from '../primitives/NumInput';
import { SegmentedControl } from '../primitives/SegmentedControl';
import { FieldLabel } from '../primitives/FieldLabel';
import { TwoCol } from '../primitives/TwoCol';

// ─── Shared FormProps ────────────────────────────────────────────────────────

interface FormProps<T> {
  action: T;
  onChange: (next: T) => void;
  onValidationChange?: (isValid: boolean) => void;
}

// ─── Boolean SegmentedControl options ───────────────────────────────────────
const ON_OFF_OPTIONS = [
  { value: 'true' as const, label: 'Accendi' },
  { value: 'false' as const, label: 'Spegni' },
] as const;

// ─── 1. NetatmoSetRoomTempForm ───────────────────────────────────────────────
export function NetatmoSetRoomTempForm({ action, onChange }: FormProps<NetatmoSetRoomTempAction>) {
  return (
    <>
      <TwoCol>
        <div>
          <FieldLabel htmlFor="action-home-id">Home ID</FieldLabel>
          <TextInput
            id="action-home-id"
            value={action.home_id}
            onChange={(v) => onChange({ ...action, home_id: v })}
            aria-label="Home ID"
          />
        </div>
        <div>
          <FieldLabel htmlFor="action-room-id">Room ID</FieldLabel>
          <TextInput
            id="action-room-id"
            value={action.room_id}
            onChange={(v) => onChange({ ...action, room_id: v })}
            aria-label="Room ID"
          />
        </div>
      </TwoCol>
      <FieldLabel>Modalità</FieldLabel>
      <SegmentedControl<'manual' | 'home'>
        options={[
          { value: 'manual', label: 'Manuale' },
          { value: 'home', label: 'Home' },
        ]}
        value={action.mode}
        onChange={(v) => onChange({ ...action, mode: v })}
        aria-label="Modalità setpoint"
      />
      <div style={{ height: 8 }} />
      <FieldLabel htmlFor="action-temp">Temperatura</FieldLabel>
      <NumInput
        id="action-temp"
        value={action.temp ?? null}
        allowNull
        min={5}
        max={30}
        unit="°C"
        onChange={(v) => onChange({ ...action, temp: v })}
        aria-label="Temperatura"
      />
    </>
  );
}

// ─── 2. NetatmoSetHomeModeForm ───────────────────────────────────────────────
export function NetatmoSetHomeModeForm({ action, onChange }: FormProps<NetatmoSetHomeModeAction>) {
  return (
    <>
      <FieldLabel htmlFor="action-home-id">Home ID</FieldLabel>
      <TextInput
        id="action-home-id"
        value={action.home_id}
        onChange={(v) => onChange({ ...action, home_id: v })}
        aria-label="Home ID"
      />
      <div style={{ height: 8 }} />
      <FieldLabel>Modalità</FieldLabel>
      <SegmentedControl<'schedule' | 'away' | 'hg'>
        options={[
          { value: 'schedule', label: 'Schedule' },
          { value: 'away', label: 'Fuori' },
          { value: 'hg', label: 'Antigelo' },
        ]}
        value={action.mode}
        onChange={(v) => onChange({ ...action, mode: v })}
        aria-label="Modalità casa"
      />
    </>
  );
}

// ─── 3. NetatmoSwitchScheduleForm ────────────────────────────────────────────
export function NetatmoSwitchScheduleForm({ action, onChange }: FormProps<NetatmoSwitchScheduleAction>) {
  return (
    <>
      <FieldLabel htmlFor="action-home-id">Home ID</FieldLabel>
      <TextInput
        id="action-home-id"
        value={action.home_id}
        onChange={(v) => onChange({ ...action, home_id: v })}
        aria-label="Home ID"
      />
      <div style={{ height: 8 }} />
      <FieldLabel htmlFor="action-schedule-id">Schedule ID</FieldLabel>
      <TextInput
        id="action-schedule-id"
        value={action.schedule_id}
        onChange={(v) => onChange({ ...action, schedule_id: v })}
        aria-label="Schedule ID"
      />
    </>
  );
}

// ─── 4. HttpWebhookForm — JSON validation (T-180-06-02) ──────────────────────
export function HttpWebhookForm({
  action,
  onChange,
  onValidationChange,
}: FormProps<HttpWebhookAction>) {
  const [jsonError, setJsonError] = useState<string | null>(null);
  const initialPayloadStr = action.payload ? JSON.stringify(action.payload, null, 2) : '';
  const [payloadStr, setPayloadStr] = useState(initialPayloadStr);

  const handlePayloadChange = (raw: string) => {
    setPayloadStr(raw);
    if (raw.trim() === '') {
      setJsonError(null);
      onValidationChange?.(true);
      onChange({ ...action, payload: null });
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      setJsonError(null);
      onValidationChange?.(true);
      onChange({ ...action, payload: parsed });
    } catch {
      setJsonError('JSON non valido');
      onValidationChange?.(false);
      // Do NOT call onChange — keep previous payload until valid
    }
  };

  return (
    <>
      <FieldLabel htmlFor="action-url">URL</FieldLabel>
      <TextInput
        id="action-url"
        type="url"
        mono
        value={action.url}
        onChange={(v) => onChange({ ...action, url: v })}
        aria-label="URL webhook"
      />
      <div style={{ height: 8 }} />
      <FieldLabel>Metodo</FieldLabel>
      <SegmentedControl<'GET' | 'POST'>
        options={[
          { value: 'GET', label: 'GET' },
          { value: 'POST', label: 'POST' },
        ]}
        value={action.method}
        onChange={(v) => onChange({ ...action, method: v })}
        aria-label="Metodo HTTP"
      />
      <div style={{ height: 8 }} />
      <FieldLabel htmlFor="action-payload">Payload (JSON)</FieldLabel>
      <textarea
        id="action-payload"
        value={payloadStr}
        onChange={(e) => handlePayloadChange(e.target.value)}
        aria-label="Payload JSON"
        rows={4}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          minHeight: 80,
          borderRadius: 9,
          background: 'rgba(255,255,255,0.05)',
          border: '0.5px solid rgba(255,255,255,0.08)',
          color: '#fff',
          padding: 10,
          fontSize: 12,
          fontFamily: 'ui-monospace, SF Mono, monospace',
          outline: 'none',
          resize: 'vertical',
        }}
      />
      {jsonError && (
        <div style={{ fontSize: 11, fontWeight: 600, color: '#ff6676', marginTop: 6 }}>
          {jsonError}
        </div>
      )}
    </>
  );
}

// ─── 5. LogEventForm ─────────────────────────────────────────────────────────
export function LogEventForm({ action, onChange }: FormProps<LogEventAction>) {
  return (
    <>
      <FieldLabel htmlFor="action-message">Messaggio</FieldLabel>
      <TextInput
        id="action-message"
        value={action.message}
        onChange={(v) => onChange({ ...action, message: v })}
        aria-label="Messaggio"
      />
    </>
  );
}

// ─── 6. HueLightForm ─────────────────────────────────────────────────────────
export function HueLightForm({ action, onChange }: FormProps<HueLightAction>) {
  const onValue = action.on === null || action.on === undefined ? 'true' : String(action.on);
  return (
    <>
      <FieldLabel htmlFor="action-light-id">Light ID</FieldLabel>
      <TextInput
        id="action-light-id"
        value={action.light_id}
        onChange={(v) => onChange({ ...action, light_id: v })}
        aria-label="Light ID"
      />
      <div style={{ height: 8 }} />
      <FieldLabel>Stato</FieldLabel>
      <SegmentedControl<'true' | 'false'>
        options={ON_OFF_OPTIONS}
        value={onValue as 'true' | 'false'}
        onChange={(v) => onChange({ ...action, on: v === 'true' })}
        aria-label="Stato luce"
      />
      <div style={{ height: 8 }} />
      <FieldLabel htmlFor="action-brightness">Luminosità</FieldLabel>
      <NumInput
        id="action-brightness"
        value={action.brightness ?? null}
        allowNull
        min={1}
        max={254}
        onChange={(v) => onChange({ ...action, brightness: v })}
        aria-label="Luminosità"
      />
      <div style={{ height: 8 }} />
      <FieldLabel htmlFor="action-color-temp">Temp. colore</FieldLabel>
      <NumInput
        id="action-color-temp"
        value={action.color_temp ?? null}
        allowNull
        min={153}
        max={500}
        onChange={(v) => onChange({ ...action, color_temp: v })}
        aria-label="Temp. colore"
      />
      <div style={{ height: 8 }} />
      <FieldLabel htmlFor="action-hue">Tonalità</FieldLabel>
      <NumInput
        id="action-hue"
        value={action.hue ?? null}
        allowNull
        min={0}
        max={65535}
        onChange={(v) => onChange({ ...action, hue: v })}
        aria-label="Tonalità"
      />
      <div style={{ height: 8 }} />
      <FieldLabel htmlFor="action-sat">Saturazione</FieldLabel>
      <NumInput
        id="action-sat"
        value={action.sat ?? null}
        allowNull
        min={0}
        max={254}
        onChange={(v) => onChange({ ...action, sat: v })}
        aria-label="Saturazione"
      />
    </>
  );
}

// ─── 7. HueGroupForm ─────────────────────────────────────────────────────────
export function HueGroupForm({ action, onChange }: FormProps<HueGroupAction>) {
  const onValue = action.on === null || action.on === undefined ? 'true' : String(action.on);
  return (
    <>
      <FieldLabel htmlFor="action-group-id">Group ID</FieldLabel>
      <TextInput
        id="action-group-id"
        value={action.group_id}
        onChange={(v) => onChange({ ...action, group_id: v })}
        aria-label="Group ID"
      />
      <div style={{ height: 8 }} />
      <FieldLabel>Stato</FieldLabel>
      <SegmentedControl<'true' | 'false'>
        options={ON_OFF_OPTIONS}
        value={onValue as 'true' | 'false'}
        onChange={(v) => onChange({ ...action, on: v === 'true' })}
        aria-label="Stato gruppo"
      />
      <div style={{ height: 8 }} />
      <FieldLabel htmlFor="action-brightness">Luminosità</FieldLabel>
      <NumInput
        id="action-brightness"
        value={action.brightness ?? null}
        allowNull
        min={1}
        max={254}
        onChange={(v) => onChange({ ...action, brightness: v })}
        aria-label="Luminosità"
      />
      <div style={{ height: 8 }} />
      <FieldLabel htmlFor="action-color-temp">Temp. colore</FieldLabel>
      <NumInput
        id="action-color-temp"
        value={action.color_temp ?? null}
        allowNull
        min={153}
        max={500}
        onChange={(v) => onChange({ ...action, color_temp: v })}
        aria-label="Temp. colore"
      />
    </>
  );
}

// ─── 8. HueSceneForm ─────────────────────────────────────────────────────────
export function HueSceneForm({ action, onChange }: FormProps<HueSceneAction>) {
  return (
    <>
      <FieldLabel htmlFor="action-group-id">Group ID</FieldLabel>
      <TextInput
        id="action-group-id"
        value={action.group_id}
        onChange={(v) => onChange({ ...action, group_id: v })}
        aria-label="Group ID"
      />
      <div style={{ height: 8 }} />
      <FieldLabel htmlFor="action-scene-id">Scene ID</FieldLabel>
      <TextInput
        id="action-scene-id"
        value={action.scene_id}
        onChange={(v) => onChange({ ...action, scene_id: v })}
        aria-label="Scene ID"
      />
    </>
  );
}

// ─── 9. ThermorossiForm — conditional fields (T-180-06-04) ───────────────────
export function ThermorossiForm({ action, onChange }: FormProps<ThermorossiAction>) {
  // When command changes, reset ALL conditional level fields to null
  // (Pitfall 1 — prevents stale field leakage on save, T-180-06-04)
  const setCommand = (cmd: ThermorossiAction['command']) =>
    onChange({ ...action, command: cmd, power_level: null, fan_level: null, water_temp: null });

  return (
    <>
      <FieldLabel>Comando</FieldLabel>
      <SegmentedControl<ThermorossiAction['command']>
        options={[
          { value: 'ignite', label: 'Accendi' },
          { value: 'shutdown', label: 'Spegni' },
          { value: 'set_power', label: 'Potenza' },
          { value: 'set_fan', label: 'Ventola' },
          { value: 'set_water_temp', label: 'Temp. acqua' },
        ]}
        value={action.command}
        onChange={setCommand}
        aria-label="Comando stufa"
      />
      {action.command === 'set_power' && (
        <>
          <div style={{ height: 8 }} />
          <FieldLabel htmlFor="action-power-level">Livello potenza</FieldLabel>
          <NumInput
            id="action-power-level"
            value={action.power_level ?? null}
            allowNull
            min={1}
            max={5}
            onChange={(v) => onChange({ ...action, power_level: v })}
            aria-label="Livello potenza"
          />
        </>
      )}
      {action.command === 'set_fan' && (
        <>
          <div style={{ height: 8 }} />
          <FieldLabel htmlFor="action-fan-level">Livello ventola</FieldLabel>
          <NumInput
            id="action-fan-level"
            value={action.fan_level ?? null}
            allowNull
            min={1}
            max={6}
            onChange={(v) => onChange({ ...action, fan_level: v })}
            aria-label="Livello ventola"
          />
        </>
      )}
      {action.command === 'set_water_temp' && (
        <>
          <div style={{ height: 8 }} />
          <FieldLabel htmlFor="action-water-temp">Temp. acqua</FieldLabel>
          <NumInput
            id="action-water-temp"
            value={action.water_temp ?? null}
            allowNull
            min={40}
            max={80}
            unit="°C"
            onChange={(v) => onChange({ ...action, water_temp: v })}
            aria-label="Temperatura acqua"
          />
        </>
      )}
    </>
  );
}

// ─── 10. SonosForm — conditional fields ──────────────────────────────────────
export function SonosForm({ action, onChange }: FormProps<SonosAction>) {
  // When command changes, reset all conditional fields to null
  const setCommand = (cmd: SonosAction['command']) =>
    onChange({ ...action, command: cmd, volume: null, source: null });

  const sourceValue = action.source ?? 'tv';

  return (
    <>
      <FieldLabel htmlFor="action-speaker-uid">Speaker UID</FieldLabel>
      <TextInput
        id="action-speaker-uid"
        value={action.speaker_uid}
        onChange={(v) => onChange({ ...action, speaker_uid: v })}
        aria-label="Speaker UID"
      />
      <div style={{ height: 8 }} />
      <FieldLabel>Comando</FieldLabel>
      <SegmentedControl<SonosAction['command']>
        options={[
          { value: 'play', label: 'Play' },
          { value: 'pause', label: 'Pausa' },
          { value: 'set_volume', label: 'Volume' },
          { value: 'switch_source', label: 'Sorgente' },
        ]}
        value={action.command}
        onChange={setCommand}
        aria-label="Comando Sonos"
      />
      {action.command === 'set_volume' && (
        <>
          <div style={{ height: 8 }} />
          <FieldLabel htmlFor="action-volume">Volume</FieldLabel>
          <NumInput
            id="action-volume"
            value={action.volume ?? null}
            allowNull
            min={0}
            max={100}
            onChange={(v) => onChange({ ...action, volume: v })}
            aria-label="Volume"
          />
        </>
      )}
      {action.command === 'switch_source' && (
        <>
          <div style={{ height: 8 }} />
          <FieldLabel>Sorgente</FieldLabel>
          <SegmentedControl<'tv' | 'line_in'>
            options={[
              { value: 'tv', label: 'TV' },
              { value: 'line_in', label: 'Line In' },
            ]}
            value={sourceValue as 'tv' | 'line_in'}
            onChange={(v) => onChange({ ...action, source: v })}
            aria-label="Sorgente"
          />
        </>
      )}
    </>
  );
}

// ─── 11. TuyaForm — conditional fields ───────────────────────────────────────
export function TuyaForm({ action, onChange }: FormProps<TuyaAction>) {
  // When command changes, reset all conditional fields to null
  const setCommand = (cmd: TuyaAction['command']) =>
    onChange({ ...action, command: cmd, on: null, timer_seconds: null });

  const onValue = action.on === null || action.on === undefined ? 'true' : String(action.on);

  return (
    <>
      <FieldLabel htmlFor="action-device-id">Device ID</FieldLabel>
      <TextInput
        id="action-device-id"
        value={action.device_id}
        onChange={(v) => onChange({ ...action, device_id: v })}
        aria-label="Device ID"
      />
      <div style={{ height: 8 }} />
      <FieldLabel>Comando</FieldLabel>
      <SegmentedControl<TuyaAction['command']>
        options={[
          { value: 'set_status', label: 'Stato' },
          { value: 'set_timer', label: 'Timer' },
        ]}
        value={action.command}
        onChange={setCommand}
        aria-label="Comando Tuya"
      />
      {action.command === 'set_status' && (
        <>
          <div style={{ height: 8 }} />
          <FieldLabel>Stato</FieldLabel>
          <SegmentedControl<'true' | 'false'>
            options={ON_OFF_OPTIONS}
            value={onValue as 'true' | 'false'}
            onChange={(v) => onChange({ ...action, on: v === 'true' })}
            aria-label="Stato dispositivo"
          />
        </>
      )}
      {action.command === 'set_timer' && (
        <>
          <div style={{ height: 8 }} />
          <FieldLabel htmlFor="action-timer-seconds">Timer</FieldLabel>
          <NumInput
            id="action-timer-seconds"
            value={action.timer_seconds ?? null}
            allowNull
            min={0}
            max={86400}
            unit="sec"
            onChange={(v) => onChange({ ...action, timer_seconds: v })}
            aria-label="Timer"
          />
        </>
      )}
    </>
  );
}

// ─── ActionForm dispatcher (exhaustive switch + assertNever) ─────────────────
export function ActionForm({
  action,
  onChange,
  onValidationChange,
}: {
  action: ActionItem;
  onChange: (next: ActionItem) => void;
  onValidationChange?: (isValid: boolean) => void;
}) {
  switch (action.type) {
    case 'netatmo_set_room_temp':
      return (
        <NetatmoSetRoomTempForm
          action={action}
          onChange={onChange as (a: NetatmoSetRoomTempAction) => void}
        />
      );
    case 'netatmo_set_home_mode':
      return (
        <NetatmoSetHomeModeForm
          action={action}
          onChange={onChange as (a: NetatmoSetHomeModeAction) => void}
        />
      );
    case 'netatmo_switch_schedule':
      return (
        <NetatmoSwitchScheduleForm
          action={action}
          onChange={onChange as (a: NetatmoSwitchScheduleAction) => void}
        />
      );
    case 'http_webhook':
      return (
        <HttpWebhookForm
          action={action}
          onChange={onChange as (a: HttpWebhookAction) => void}
          onValidationChange={onValidationChange}
        />
      );
    case 'log_event':
      return (
        <LogEventForm
          action={action}
          onChange={onChange as (a: LogEventAction) => void}
        />
      );
    case 'hue_light':
      return (
        <HueLightForm
          action={action}
          onChange={onChange as (a: HueLightAction) => void}
        />
      );
    case 'hue_group':
      return (
        <HueGroupForm
          action={action}
          onChange={onChange as (a: HueGroupAction) => void}
        />
      );
    case 'hue_scene':
      return (
        <HueSceneForm
          action={action}
          onChange={onChange as (a: HueSceneAction) => void}
        />
      );
    case 'thermorossi':
      return (
        <ThermorossiForm
          action={action}
          onChange={onChange as (a: ThermorossiAction) => void}
        />
      );
    case 'sonos':
      return (
        <SonosForm
          action={action}
          onChange={onChange as (a: SonosAction) => void}
        />
      );
    case 'tuya':
      return (
        <TuyaForm
          action={action}
          onChange={onChange as (a: TuyaAction) => void}
        />
      );
    default:
      return assertNever(action);
  }
}
