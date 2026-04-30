'use client';
/**
 * AdvancedSection — Plan 07 Task 1
 * Cooldown controls: min_interval_seconds + max_triggers_per_hour.
 *
 * Bundle source: automations.jsx lines 800-815
 * D-02: inline-style + var(--token) only. Zero Tailwind for visual values.
 * D-04: NOT shared with Phase 178 sheets/primitives.
 * AUTO-06: exposes both numeric inputs with Italian copy and 0=hint.
 */
import { NumInput } from '../primitives/NumInput';
import { FieldLabel } from '../primitives/FieldLabel';

export interface AdvancedSectionProps {
  minInterval: number;
  maxPerHour: number;
  onMinIntervalChange: (v: number) => void;
  onMaxPerHourChange: (v: number) => void;
}

export function AdvancedSection({
  minInterval,
  maxPerHour,
  onMinIntervalChange,
  onMaxPerHourChange,
}: AdvancedSectionProps) {
  return (
    <div>
      {/* Intro copy — UI-SPEC §Copywriting Contract */}
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-2)',
          marginBottom: 14,
          lineHeight: 1.5,
        }}
      >
        Limita la frequenza di esecuzione per evitare cicli o eccessi di eventi.
      </div>

      {/* min_interval_seconds */}
      <div style={{ marginBottom: 14 }}>
        <FieldLabel htmlFor="adv-min-interval">Intervallo minimo fra attivazioni</FieldLabel>
        <NumInput
          id="adv-min-interval"
          value={minInterval}
          min={0}
          unit="sec"
          onChange={(v) => onMinIntervalChange(v ?? 0)}
          aria-label="Intervallo minimo fra attivazioni"
        />
        <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 6 }}>0 = nessun limite</div>
      </div>

      {/* max_triggers_per_hour */}
      <div>
        <FieldLabel htmlFor="adv-max-per-hour">Massimo attivazioni/ora</FieldLabel>
        <NumInput
          id="adv-max-per-hour"
          value={maxPerHour}
          min={0}
          onChange={(v) => onMaxPerHourChange(v ?? 0)}
          aria-label="Massimo attivazioni per ora"
        />
        <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 6 }}>0 = illimitato</div>
      </div>
    </div>
  );
}
