'use client';
/**
 * EmberSelect — automations-local primitive (Phase 180.1)
 * Native <select> styled to match TextInput contract: 38px height, 9px radius,
 * 0.5px border, ember accent on focus. Used by DeviceIdField to surface
 * device pickers populated from per-category proxy hooks.
 *
 * D-02: inline-style + var(--token) only. Zero Tailwind for visual values.
 * D-04: NOT shared with Phase 178 sheets/primitives.
 */
import type { ChangeEvent, SelectHTMLAttributes } from 'react';

export interface EmberSelectOption {
  value: string;
  label: string;
}

export interface EmberSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: EmberSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
}

export function EmberSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  id,
  ...rest
}: EmberSelectProps & Pick<SelectHTMLAttributes<HTMLSelectElement>, 'aria-label'>) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      disabled={disabled}
      aria-label={rest['aria-label']}
      style={{
        height: 38,
        borderRadius: 9,
        background: 'rgba(255,255,255,0.05)',
        border: '0.5px solid rgba(255,255,255,0.08)',
        color: '#fff',
        padding: '0 11px',
        fontSize: 13,
        fontFamily: 'inherit',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
        appearance: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 11px center',
        paddingRight: 32,
      }}
    >
      {placeholder !== undefined && (
        <option value="" disabled style={{ background: '#1c1917', color: '#9ca3af' }}>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} style={{ background: '#1c1917', color: '#fff' }}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
