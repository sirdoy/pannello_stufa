'use client';
/**
 * TextInput — automations-local primitive
 * Bundle source: automations.jsx lines 824-834
 * D-02: inline-style + var(--token) only. Zero Tailwind for visual values.
 * D-04: NOT shared with Phase 178 sheets/primitives (38px height, 9px radius).
 */
import type { ChangeEvent, InputHTMLAttributes } from 'react';

export interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Switches to ui-monospace font family (bundle line 831) */
  mono?: boolean;
  readOnly?: boolean;
  type?: 'text' | 'url' | 'time';
  id?: string;
  'aria-label'?: string;
}

export function TextInput({
  value,
  onChange,
  placeholder,
  mono = false,
  readOnly = false,
  type = 'text',
  id,
  ...rest
}: TextInputProps & Pick<InputHTMLAttributes<HTMLInputElement>, 'aria-label'>) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      aria-label={rest['aria-label']}
      style={{
        height: 38,
        borderRadius: 9,
        background: 'rgba(255,255,255,0.05)',
        border: '0.5px solid rgba(255,255,255,0.08)',
        color: '#fff',
        padding: '0 11px',
        fontSize: 13,
        fontFamily: mono ? 'ui-monospace, SF Mono, monospace' : 'inherit',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
      }}
    />
  );
}
