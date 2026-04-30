'use client';
/**
 * Pill — automations-local primitive
 * Bundle source: automations.jsx lines 214-225
 * D-02: inline-style + var(--token) only. Zero Tailwind for visual values.
 * D-04: NOT shared with Phase 178 sheets/primitives.
 *
 * Three modes (discriminated):
 *  1. tone-colored: pass `tone` string (hex or CSS var)
 *  2. muted: pass `muted={true}` (transparent bg, var(--text-2) text)
 *  3. neutral (default): neither `tone` nor `muted`
 * Never pass both `tone` and `muted` simultaneously.
 */
import type { ReactNode } from 'react';

export interface PillProps {
  children: ReactNode;
  /** Tone color (hex string or CSS var) — applies tone-colored mode */
  tone?: string;
  /** When true, applies muted mode (transparent bg, var(--text-2) text) */
  muted?: boolean;
}

export function Pill({ children, tone, muted = false }: PillProps) {
  let background: string;
  let color: string;
  let border: string;

  if (tone) {
    // Tone-colored mode
    background = `color-mix(in oklab, ${tone} 16%, transparent)`;
    color = tone;
    border = `0.5px solid color-mix(in oklab, ${tone} 25%, transparent)`;
  } else if (muted) {
    // Muted mode
    background = 'transparent';
    color = 'var(--text-2)';
    border = '0.5px solid rgba(255,255,255,0.08)';
  } else {
    // Neutral (default) mode
    background = 'rgba(255,255,255,0.06)';
    color = '#fff';
    border = '0.5px solid rgba(255,255,255,0.08)';
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 9px',
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: 0.2,
        background,
        color,
        border,
      }}
    >
      {children}
    </span>
  );
}
