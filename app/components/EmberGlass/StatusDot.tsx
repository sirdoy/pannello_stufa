'use client';

/**
 * StatusDot — Phase 177 (DASH-01)
 *
 * 8x8 round indicator. On state shows accent glow; off state shows neutral
 * fill with no shadow. Default color is var(--accent).
 *
 * Bundle source:
 *   .planning/inbox/ember-glass-design/project/components/cards.jsx:71-77
 *
 * RC-clean — no manual memoization hooks (D-28 — React Compiler discipline).
 */

import type { CSSProperties } from 'react';

export interface StatusDotProps {
  on: boolean;
  color?: string;
}

export function StatusDot({ on, color }: StatusDotProps) {
  const c = color ?? 'var(--accent)';
  const style: CSSProperties = {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: on ? c : 'rgba(255,255,255,0.18)',
    boxShadow: on ? `0 0 12px ${c}` : 'none',
  };
  return (
    <div
      data-testid="status-dot"
      data-on={on ? 'true' : 'false'}
      style={style}
    />
  );
}
