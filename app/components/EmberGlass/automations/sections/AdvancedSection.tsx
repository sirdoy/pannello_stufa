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
import type { RuleMode } from '@/types/automations';
import { NumInput } from '../primitives/NumInput';
import { FieldLabel } from '../primitives/FieldLabel';
import { SegmentedControl } from '../primitives/SegmentedControl';

export interface AdvancedSectionProps {
  minInterval: number;
  maxPerHour: number;
  onMinIntervalChange: (v: number) => void;
  onMaxPerHourChange: (v: number) => void;
  mode: RuleMode;
  priority: number;
  onModeChange: (v: RuleMode) => void;
  onPriorityChange: (v: number) => void;
  /** Set when mode is "hold" and an action cannot be held: shown as an error. */
  holdError?: string | null;
}

const MODE_OPTIONS = [
  { value: 'edge', label: 'Una volta' },
  { value: 'hold', label: 'Finché è vero' },
] as const;

const hintStyle = { fontSize: 11, color: 'var(--text-2)', marginTop: 6, lineHeight: 1.5 } as const;

export function AdvancedSection({
  minInterval,
  maxPerHour,
  onMinIntervalChange,
  onMaxPerHourChange,
  mode,
  priority,
  onModeChange,
  onPriorityChange,
  holdError,
}: AdvancedSectionProps) {
  const hold = mode === 'hold';
  return (
    <div>
      {/* Edge / hold (workspace ROADMAP D13) */}
      <div style={{ marginBottom: 18 }}>
        <FieldLabel>Quando agisce</FieldLabel>
        <SegmentedControl
          options={MODE_OPTIONS}
          value={mode}
          onChange={onModeChange}
          aria-label="Quando agisce"
        />
        <div style={hintStyle}>
          {hold
            ? 'Tiene il valore finché le condizioni sono vere e lo restituisce quando non lo sono più (valvola al programma, stufa ai suoi livelli). Solo per setpoint manuale di una valvola e potenza / ventola della stufa.'
            : 'Esegue le azioni una volta, quando le condizioni diventano vere.'}
        </div>
        {hold && holdError && (
          <div role="alert" style={{ ...hintStyle, color: '#ff6676', fontWeight: 600 }}>
            {holdError}
          </div>
        )}
      </div>

      {hold ? (
        <div>
          <FieldLabel htmlFor="adv-priority">Priorità</FieldLabel>
          <NumInput
            id="adv-priority"
            value={priority}
            min={0}
            max={1000}
            onChange={(v) => onPriorityChange(Math.max(0, Math.min(1000, Math.round(v ?? 0))))}
            aria-label="Priorità"
          />
          <div style={hintStyle}>
            Se più regole tengono lo stesso dispositivo vince la priorità più alta (0–1000). Esempio: finestra
            aperta 100, stufa accesa 50.
          </div>
        </div>
      ) : (
        <>
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
            <div style={hintStyle}>0 = nessun limite</div>
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
            <div style={hintStyle}>0 = illimitato</div>
          </div>
        </>
      )}
    </div>
  );
}
