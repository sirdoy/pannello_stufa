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
import Spinner from '@/app/components/ui/Spinner';

export interface InlineToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'color' | 'type' | 'role' | 'onClick'> {
  on: boolean;
  color?: string;
  onChange: (e: MouseEvent<HTMLButtonElement>) => void;
  /** Command sent and not yet settled (ROADMAP M80): spinner in the thumb, taps ignored */
  pending?: boolean;
}

export function InlineToggle({ on, color = 'var(--accent)', onChange, pending = false, disabled, ...rest }: InlineToggleProps) {
  // Default fallback so axe-core's "Interactive element must have a name" rule
  // does not fire when a consumer forgets aria-label / aria-labelledby. Real
  // copy ("Accendi luci salotto", etc.) should still be passed where context
  // is known; this is a safety net, not an excuse.
  const ariaLabel = rest['aria-label'] ?? (rest['aria-labelledby'] ? undefined : 'Interruttore');
  const locked = pending || disabled === true;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-busy={pending || undefined}
      data-testid="inline-toggle"
      // Pending keeps the button enabled and swallows the tap: a natively disabled button inside a
      // Pressable card would let the tap reach the card and open the sheet.
      aria-disabled={pending || undefined}
      onClick={(e) => {
        if (pending) {
          e.stopPropagation();
          return;
        }
        onChange(e);
      }}
      {...rest}
      disabled={disabled}
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
        cursor: locked ? 'default' : 'pointer',
        opacity: locked && !pending ? 0.45 : 1,
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
          color: '#1a0f08',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'left .22s cubic-bezier(.34,1.56,.64,1)',
        }}
      >
        {pending && <Spinner size="xs" variant="current" aria-hidden data-testid="inline-toggle-spinner" />}
      </div>
    </button>
  );
}
