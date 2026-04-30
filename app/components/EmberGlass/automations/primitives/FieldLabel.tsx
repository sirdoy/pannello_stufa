'use client';
/**
 * FieldLabel — automations-local primitive
 * Bundle source: automations.jsx lines 818-822
 * D-02: inline-style + var(--token) only. Zero Tailwind for visual values.
 * D-04: NOT shared with Phase 178 sheets/primitives (different visual scale).
 */
import type { ReactNode } from 'react';

export interface FieldLabelProps {
  children: ReactNode;
  htmlFor?: string;
  /** When true, font shrinks from 11 to 10px (bundle line 819 footnote) */
  small?: boolean;
}

export function FieldLabel({ children, htmlFor, small = false }: FieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        display: 'block',
        fontSize: small ? 10 : 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        color: 'var(--text-2)',
        marginBottom: 6,
      }}
    >
      {children}
    </label>
  );
}
