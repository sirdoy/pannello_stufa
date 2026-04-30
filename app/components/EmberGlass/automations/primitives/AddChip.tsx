'use client';
/**
 * AddChip — automations-local primitive
 * Bundle source: automations.jsx lines 898-905
 * D-02: inline-style only. Zero Tailwind for visual values.
 * D-04: NOT shared with Phase 178 sheets/primitives.
 */
import type { ReactNode } from 'react';

export interface AddChipProps {
  children: ReactNode;
  onClick?: () => void;
  'aria-label'?: string;
}

export function AddChip({ children, onClick, ...rest }: AddChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rest['aria-label']}
      style={{
        padding: '7px 12px',
        borderRadius: 999,
        border: '0.5px dashed rgba(255,255,255,0.15)',
        background: 'rgba(255,255,255,0.05)',
        color: '#fff',
        fontSize: 11,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}
