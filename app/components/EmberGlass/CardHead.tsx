'use client';

/**
 * CardHead — Phase 177 (DASH-01)
 *
 * 46px-tall row: 32x32 colored icon tile (gradient via color-mix on the tone),
 * 13px semibold label in var(--text-2), optional right slot pushed by flex:1.
 *
 * Bundle source:
 *   .planning/inbox/ember-glass-design/project/components/cards.jsx:53-69
 *
 * RC-clean — no manual memoization hooks (D-28 — React Compiler discipline).
 */

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface CardHeadProps {
  Icon: LucideIcon;
  label: string;
  tone: string;
  right?: ReactNode;
}

export function CardHead({ Icon, label, tone, right }: CardHeadProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, minHeight: 32 }}>
      <div
        style={{
          width: 32,
          height: 32,
          minWidth: 32,
          minHeight: 32,
          flexShrink: 0,
          borderRadius: 10,
          background: `color-mix(in oklab, ${tone} 22%, transparent)`,
          color: tone,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `0.5px solid color-mix(in oklab, ${tone} 30%, transparent)`,
        }}
      >
        <Icon size={18} strokeWidth={2} />
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-2)',
          letterSpacing: 0.2,
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>
      {right}
    </div>
  );
}
