'use client';
/**
 * StatChip — Phase 179 rooms primitive
 * Bundle source: rooms.jsx:516-528
 * Small label/value chip used by Stove/Plug/Sensor/TV bodies.
 * D-02: inline-style + var(--token) only. D-37: no useMemo/useCallback.
 * D-62: bare element, NOT a glass surface — no Pressable wrap.
 */
import type { CSSProperties } from 'react';

export interface StatChipProps {
  label: string;
  value: string | number;
  /** Accepted for API symmetry with DualTempReadout; visually unused inside the chip body (CONTEXT D-36). */
  tone?: string;
}

export function StatChip({ label, value }: StatChipProps){
  return (
    <div
      data-testid="stat-chip"
      style={{
        background: 'rgba(255,255,255,0.04)', // AUDIT-EXCEPTION (rooms.jsx:518)
        border: '0.5px solid rgba(255,255,255,0.06)', // AUDIT-EXCEPTION (rooms.jsx:519)
        borderRadius: 10,
        padding: '8px 10px',
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: 'var(--text-2)',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}
      >
        {label}
      </div>
      <div
        data-testid="stat-chip-value"
        style={
          {
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            fontWeight: 600,
            color: '#fff', // AUDIT-EXCEPTION (rooms.jsx:524)
            letterSpacing: -0.3,
            marginTop: 2,
            fontVariantNumeric: 'tabular-nums',
          } as CSSProperties
        }
      >
        {value}
      </div>
    </div>
  );
}
