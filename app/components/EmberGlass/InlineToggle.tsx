'use client';

// Stop-propagation rule (D-17): consumers MUST call e.stopPropagation() in
// onChange when nested inside a Pressable (e.g. LightsCard header) to prevent
// the parent press from also firing.

/**
 * InlineToggle — Phase 177 (DASH-04)
 *
 * iOS-style 44x26 switch with a 22x22 thumb that translates left: 2 ↔ 20 on
 * the `on` prop. Transition uses the locked Phase 175 cubic-bezier curve
 * `cubic-bezier(.34,1.56,.64,1)` for visual parity with Pressable.
 *
 * Bundle source:
 *   .planning/inbox/ember-glass-design/project/components/cards.jsx:419-435
 *
 * RC-clean — no manual memoization hooks (D-28 — React Compiler discipline).
 */

import type { ButtonHTMLAttributes, MouseEvent } from 'react';

export interface InlineToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'color' | 'type' | 'role' | 'onClick'> {
  on: boolean;
  color?: string;
  onChange: (e: MouseEvent<HTMLButtonElement>) => void;
}

export function InlineToggle({ on, color = 'var(--accent)', onChange, ...rest }: InlineToggleProps) {
  // Default fallback so axe-core's "Interactive element must have a name" rule
  // does not fire when a consumer forgets aria-label / aria-labelledby. Real
  // copy ("Accendi luci salotto", etc.) should still be passed where context
  // is known; this is a safety net, not an excuse.
  const ariaLabel = rest['aria-label'] ?? (rest['aria-labelledby'] ? undefined : 'Interruttore');
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      data-testid="inline-toggle"
      onClick={onChange}
      {...rest}
      aria-label={ariaLabel}
      style={{
        width: 44,
        height: 26,
        borderRadius: 999,
        position: 'relative',
        border: 'none',
        padding: 0,
        background: on ? color : 'rgba(255,255,255,0.1)',
        boxShadow: on ? `0 0 12px ${color}` : 'none',
        cursor: 'pointer',
        transition: 'background .22s cubic-bezier(.34,1.56,.64,1)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 2,
          left: on ? 20 : 2,
          width: 22,
          height: 22,
          borderRadius: 999,
          background: '#fff',
          transition: 'left .22s cubic-bezier(.34,1.56,.64,1)',
        }}
      />
    </button>
  );
}
