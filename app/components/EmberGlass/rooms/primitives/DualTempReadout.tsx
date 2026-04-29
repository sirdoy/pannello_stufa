'use client';
/**
 * DualTempReadout — Phase 179 rooms primitive
 * Bundle source: rooms.jsx:530-557
 * Attuale → Target dual readout for Thermo/Valve bodies.
 * D-02: inline-style + var(--token) only. D-37: no useMemo/useCallback.
 * D-62: bare element, NOT a glass surface — no Pressable wrap.
 */
import { ChevronRight } from 'lucide-react';
import type { CSSProperties } from 'react';

export interface DualTempReadoutProps {
  current: number;
  target: number;
  tone: string;
}

export function DualTempReadout({ current, target, tone }: DualTempReadoutProps): JSX.Element {
  const numStyle: CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: -0.6,
    fontVariantNumeric: 'tabular-nums',
    marginTop: 2,
  };

  const labelStyle: CSSProperties = {
    fontSize: 10,
    color: 'var(--text-2)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  };

  return (
    <div
      data-testid="dual-temp-readout"
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 14,
        background: 'rgba(255,255,255,0.04)', // AUDIT-EXCEPTION (rooms.jsx:533)
        border: '0.5px solid rgba(255,255,255,0.06)', // AUDIT-EXCEPTION (rooms.jsx:534)
        borderRadius: 12,
        padding: '10px 14px',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={labelStyle}>Attuale</div>
        <div style={{ ...numStyle, color: '#fff' /* AUDIT-EXCEPTION (rooms.jsx:540) */ }}>
          {current.toFixed(1)}<span style={{ fontSize: 13, opacity: 0.5 }}>°</span>
        </div>
      </div>
      <ChevronRight size={14} strokeWidth={2} color="var(--text-2)" />
      <div style={{ flex: 1, textAlign: 'right' }}>
        <div style={labelStyle}>Target</div>
        <div style={{ ...numStyle, color: tone }}>
          {target.toFixed(1)}<span style={{ fontSize: 13, opacity: 0.5 }}>°</span>
        </div>
      </div>
    </div>
  );
}
