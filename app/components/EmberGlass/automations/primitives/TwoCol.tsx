'use client';
/**
 * TwoCol — automations-local primitive
 * Bundle source: automations.jsx lines 873-875
 * D-02: inline-style only. Zero Tailwind for visual values.
 * D-04: NOT shared with Phase 178 sheets/primitives.
 */
import type { ReactNode } from 'react';

export interface TwoColProps {
  children: ReactNode;
}

export function TwoCol({ children }: TwoColProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}
