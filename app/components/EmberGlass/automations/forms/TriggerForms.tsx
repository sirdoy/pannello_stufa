'use client';
/**
 * TriggerForms — ScheduleCronForm + ManualApiCallForm + TriggerForm dispatcher
 *
 * Bundle source: automations.jsx lines 347-397 (schedule_cron + manual_api_call branches only)
 * D-02: inline-style + var(--token) only. Zero Tailwind for visual values.
 * D-08: exactly 2 trigger types per API truth. Sensor triggers NOT supported.
 * D-12: readOnly prop enforced in edit mode (isNew=false).
 * D-08b: ManualApiCallForm renders ONLY static info copy (Italian, bundle verbatim).
 * Security T-180-04-01: cron_expression is rendered verbatim in CronHint (no shell execution).
 */
import type { ScheduleCronTrigger, ManualApiCallTrigger, TriggerType } from '@/types/automations';
import { TextInput } from '../primitives/TextInput';
import { CronHint } from '../primitives/CronHint';
import { FieldLabel } from '../primitives/FieldLabel';

// ─── ScheduleCronForm ───────────────────────────────────────────────────────

export interface ScheduleCronFormProps {
  trigger: ScheduleCronTrigger;
  onChange: (next: ScheduleCronTrigger) => void;
  isNew: boolean;
}

export function ScheduleCronForm({
  trigger,
  onChange,
  isNew,
}: ScheduleCronFormProps) {
  return (
    <div>
      <FieldLabel htmlFor="trigger-cron">Espressione cron</FieldLabel>
      <TextInput
        id="trigger-cron"
        value={trigger.cron_expression}
        onChange={(v) => onChange({ type: 'schedule_cron', cron_expression: v })}
        placeholder="0 8 * * *"
        mono
        readOnly={!isNew}
        aria-label="Espressione cron"
      />
      <div
        style={{
          fontSize: 11,
          color: 'var(--text-2)',
          marginTop: 6,
          fontFamily: 'var(--font-body)',
        }}
      >
        Formato: min ora giorno mese giorno_sett.
      </div>
      <CronHint expr={trigger.cron_expression} />
    </div>
  );
}

// ─── ManualApiCallForm ───────────────────────────────────────────────────────

export interface ManualApiCallFormProps {
  trigger: ManualApiCallTrigger;
  onChange: (next: ManualApiCallTrigger) => void;
  isNew: boolean;
}

export function ManualApiCallForm(_: ManualApiCallFormProps) {
  return (
    <div
      style={{
        fontSize: 12,
        color: 'var(--text-2)',
        lineHeight: 1.5,
        padding: 4,
      }}
    >
      Questa automazione si avvia solo quando viene invocata manualmente dall&apos;app o via API.
    </div>
  );
}

// ─── TriggerForm dispatcher ─────────────────────────────────────────────────

export interface TriggerFormProps {
  trigger: TriggerType;
  onChange: (next: TriggerType) => void;
  isNew: boolean;
}

/**
 * Dispatches to the correct form based on trigger.type.
 * Two-branch union — TS narrows to never in default.
 * Returns null for any unknown type at runtime (fail-open, no data loss).
 */
export function TriggerForm({ trigger, onChange, isNew }: TriggerFormProps) {
  switch (trigger.type) {
    case 'schedule_cron':
      return (
        <ScheduleCronForm
          trigger={trigger}
          onChange={onChange}
          isNew={isNew}
        />
      );
    case 'manual_api_call':
      return (
        <ManualApiCallForm
          trigger={trigger}
          onChange={onChange}
          isNew={isNew}
        />
      );
  }
  // TS narrows to never here; runtime safety: return null for unexpected types
  return null;
}
