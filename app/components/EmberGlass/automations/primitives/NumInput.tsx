'use client';
/**
 * NumInput — automations-local primitive
 * Bundle source: automations.jsx lines 836-853
 * D-02: inline-style + var(--token) only. Zero Tailwind for visual values.
 * D-04: NOT shared with Phase 178 sheets/primitives.
 * Supports optional unit label (right: 11px absolute) + allowNull behavior.
 */
import type { ChangeEvent, InputHTMLAttributes } from 'react';

export interface NumInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  /** When true, empty input fires onChange(null); when false, fires onChange(0) */
  allowNull?: boolean;
  /** Optional unit label shown at right: 11px, var(--text-2) color */
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  id?: string;
  placeholder?: string;
  'aria-label'?: string;
}

export function NumInput({
  value,
  onChange,
  allowNull = false,
  unit,
  min,
  max,
  step,
  id,
  placeholder,
  ...rest
}: NumInputProps & Pick<InputHTMLAttributes<HTMLInputElement>, 'aria-label'>) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(allowNull ? null : 0);
      return;
    }
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        id={id}
        type="number"
        value={value === null ? '' : value}
        onChange={handleChange}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        aria-label={rest['aria-label']}
        style={{
          height: 38,
          borderRadius: 9,
          background: 'rgba(255,255,255,0.05)',
          border: '0.5px solid rgba(255,255,255,0.08)',
          color: '#fff',
          padding: unit ? '0 36px 0 11px' : '0 11px',
          fontSize: 13,
          fontVariantNumeric: 'tabular-nums',
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
      {unit && (
        <span
          style={{
            position: 'absolute',
            right: 11,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 11,
            color: 'var(--text-2)',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {unit}
        </span>
      )}
    </div>
  );
}
