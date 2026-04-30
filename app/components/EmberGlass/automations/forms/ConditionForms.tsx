'use client';
/**
 * Phase 180 — Plan 05 Task 1: ConditionForms.tsx
 *
 * 4 leaf condition forms + dispatcher (ConditionForm).
 * Field names follow API truth (D-09a applied to conditions):
 *   start → start_time, end → end_time
 *   sensor → sensor_id
 *   min → min_temp, max → max_temp
 *
 * D-09b (conditions parallel): legacy sensor types render "Tipo non supportato" fallback.
 * D-02: inline-style + var(--token) only.
 */
import type {
  TimeWindowCondition,
  DeviceStateCondition,
  TemperatureRangeCondition,
  AlwaysTrueCondition,
  ConditionNode,
} from '@/types/automations';
import { TextInput } from '../primitives/TextInput';
import { NumInput } from '../primitives/NumInput';
import { FieldLabel } from '../primitives/FieldLabel';
import { TwoCol } from '../primitives/TwoCol';

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

// ─── DeviceStateForm ─────────────────────────────────────────────────────────

export function DeviceStateForm({ cond, onChange }: ConditionFormProps<DeviceStateCondition>) {
  return (
    <div>
      <FieldLabel htmlFor="cond-sensor" small>Sensore (ID)</FieldLabel>
      <TextInput
        id="cond-sensor"
        value={cond.sensor_id}
        onChange={(v) => onChange({ ...cond, sensor_id: v })}
        placeholder="es. plug.salotto"
        aria-label="ID sensore"
      />
      <div style={{ height: 8 }} />
      <FieldLabel htmlFor="cond-state" small>Stato atteso</FieldLabel>
      <TextInput
        id="cond-state"
        value={cond.expected_state}
        onChange={(v) => onChange({ ...cond, expected_state: v })}
        placeholder="on"
        aria-label="Stato atteso"
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
      return <DeviceStateForm cond={cond} onChange={onChange} />;
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
      // (sensor_state_change, sensor_threshold, netatmo_temperature_threshold)
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
