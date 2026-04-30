'use client';
/**
 * IconBtn — automations-local primitive
 * Bundle source: automations.jsx lines 676-684
 * D-02: inline-style + var(--token) only. Zero Tailwind for visual values.
 * D-04: NOT shared with Phase 178 sheets/primitives.
 * D-19: aria-label is REQUIRED for accessibility (passed as required prop).
 */
import type { ReactNode } from 'react';

export interface IconBtnProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /** REQUIRED for accessibility — must describe the button action (D-19) */
  'aria-label': string;
}

export function IconBtn({ children, onClick, disabled = false, ...rest }: IconBtnProps) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      aria-label={rest['aria-label']}
      aria-disabled={disabled}
      style={{
        width: 24,
        height: 24,
        borderRadius: 6,
        border: 'none',
        background: 'rgba(255,255,255,0.05)',
        color: disabled ? 'rgba(255,255,255,0.2)' : 'var(--text-2)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}
