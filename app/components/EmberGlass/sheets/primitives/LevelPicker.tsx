import type { LucideIcon } from 'lucide-react';

/**
 * Level picker primitive (ROADMAP M77) — a row of numbered segments for a small discrete range
 * (stove power 1..5, fan 1..6). One tap sets the level: a Stepper would send one command per step.
 *
 * Segments up to the current value are tinted like a meter, the current one is solid. `pending` is
 * the level just requested and not yet confirmed by the device: it pulses and the row is locked.
 * Tapping the current level does nothing.
 *
 * NO Pressable wrap (D-24), like the other sheet sub-primitives.
 */
export interface LevelPickerProps {
  label: string;
  /** Current level; null when the device has not reported one */
  value: number | null;
  min: number;
  max: number;
  onChange: (next: number) => void;
  /** Level requested and waiting for the device */
  pending?: number | null;
  disabled?: boolean;
  /** Default var(--accent) */
  color?: string;
  Icon?: LucideIcon;
}

export function LevelPicker({
  label,
  value,
  min,
  max,
  onChange,
  pending = null,
  disabled = false,
  color = 'var(--accent)',
  Icon,
}: LevelPickerProps) {
  const levels = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const locked = disabled || pending !== null;
  const shown = pending ?? value;

  return (
    <div data-testid="level-picker" style={{ marginTop: 18 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 10,
        }}
      >
        <div
          data-testid="level-picker-label"
          style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: '#fff' }}
        >
          {Icon && <Icon size={16} stroke="var(--text-2)" aria-hidden />}
          {label}
        </div>
        <div
          data-testid="level-picker-value"
          style={{ fontSize: 12, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}
        >
          {shown === null ? '—' : `${shown} di ${max}`}
        </div>
      </div>
      <div role="radiogroup" aria-label={label} style={{ display: 'flex', gap: 6 }}>
        {levels.map((level) => {
          const selected = shown === level;
          const filled = shown !== null && level < shown;
          return (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${label} ${level}`}
              data-testid={`level-picker-option-${level}`}
              data-sheet-focusable="true"
              disabled={locked}
              className={pending === level ? 'animate-pulse' : undefined}
              onClick={() => {
                if (level !== value) onChange(level);
              }}
              style={{
                flex: 1,
                minWidth: 0,
                height: 44,
                padding: 0,
                borderRadius: 12,
                border: selected
                  ? 'none'
                  : `0.5px solid ${filled ? `color-mix(in oklab, ${color} 30%, transparent)` : 'rgba(255,255,255,0.06)'}`,
                background: selected
                  ? color
                  : filled
                    ? `color-mix(in oklab, ${color} 22%, transparent)`
                    : 'rgba(255,255,255,0.05)',
                color: selected ? '#1a0f08' : filled ? '#fff' : 'var(--text-2)',
                fontFamily: 'var(--font-display)',
                fontSize: 16,
                fontWeight: 600,
                cursor: locked ? 'default' : 'pointer',
                opacity: locked && !selected ? 0.55 : 1,
                transition: 'background .2s, opacity .2s',
              }}
            >
              {level}
            </button>
          );
        })}
      </div>
    </div>
  );
}
