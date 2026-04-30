'use client';
/**
 * SegmentedControl — automations-local primitive
 * Bundle source: automations.jsx lines 855-871
 * D-02: inline-style + var(--token) only. Zero Tailwind for visual values.
 * D-04: NOT shared with Phase 178 sheets/primitives (different segment heights).
 */

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: ReadonlyArray<SegmentOption<T>>;
  value: T;
  onChange: (value: T) => void;
  'aria-label'?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ...rest
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={rest['aria-label']}
      style={{
        display: 'flex',
        padding: 3,
        borderRadius: 9,
        background: 'rgba(255,255,255,0.05)',
        border: '0.5px solid rgba(255,255,255,0.08)',
      }}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1,
              padding: '7px 4px',
              borderRadius: 7,
              border: 'none',
              background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: active ? '#fff' : 'var(--text-2)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
