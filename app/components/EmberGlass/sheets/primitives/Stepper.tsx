import { Minus, Plus } from 'lucide-react';

/**
 * Stepper primitive (CONTEXT D-11) — 36×36 minus + 18px Outfit display value + 36×36 plus.
 *
 * **Caller signature wrap caveat** — emits a raw `number` via `onChange`. Callers wrap to fit
 * consuming hook signatures, e.g. `useStoveCommands.handlePowerChange` takes
 * `{ target: { value: String(v) } }`, so StoveSheet does:
 *   `onChange={(v) => handlePowerChange({ target: { value: String(v) } })}`.
 * Phase 179 (Rooms tab) MUST follow the same pattern when reusing Stepper for thermostat ±.
 *
 * Visual contract verbatim from bundle `sheets.jsx:484-500`. NO Pressable wrap (D-24).
 */
export interface StepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}

export function Stepper({ value, min, max, onChange }: StepperProps) {
  return (
    <div
      data-testid="stepper"
      style={{ display: 'flex', alignItems: 'center', gap: 8 }}
    >
      <button
        type="button"
        data-testid="stepper-minus"
        data-sheet-focusable="true"
        aria-label="Diminuisci"
        onClick={() => onChange(Math.max(min, value - 1))}
        style={{
          width: 36,
          height: 36,
          borderRadius: 999,
          border: 'none',
          background: 'rgba(255,255,255,0.1)', // AUDIT-EXCEPTION (sheets.jsx:488)
          color: '#fff', // AUDIT-EXCEPTION
          cursor: 'pointer',
        }}
      >
        <Minus size={14} strokeWidth={2.5} />
      </button>
      <div
        data-testid="stepper-value"
        style={{
          minWidth: 36,
          textAlign: 'center',
          fontFamily: 'var(--font-display)',
          fontSize: 18,
          fontWeight: 600,
          color: '#fff', // AUDIT-EXCEPTION (sheets.jsx:491)
        }}
      >
        {value}
      </div>
      <button
        type="button"
        data-testid="stepper-plus"
        data-sheet-focusable="true"
        aria-label="Aumenta"
        onClick={() => onChange(Math.min(max, value + 1))}
        style={{
          width: 36,
          height: 36,
          borderRadius: 999,
          border: 'none',
          background: 'rgba(255,255,255,0.1)', // AUDIT-EXCEPTION (sheets.jsx:495)
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        <Plus size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}
