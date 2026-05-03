'use client';
/**
 * CircBtn — Phase 182 (D-05)
 *
 * 34x34 circular button. Primary variant uses `tone` as background with dark text.
 * Default variant uses translucent white bg with white text.
 *
 * Bundle source:
 *   .planning/inbox/ember-glass-design/project/components/cards.jsx:298-308
 *
 * Adaptation: bundle's `sw` prop renamed to `strokeWidth` (lucide-react prop name).
 * D-08: styles verbatim; only prop passing adapted for TypeScript + lucide-react.
 * RC-clean — no manual memoization hooks (React Compiler discipline).
 */
import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface CircBtnProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'type'> {
  Icon: LucideIcon;
  onClick: () => void;
  primary?: boolean;
  tone: string;  // pass 'var(--accent)' for live recolor (DSREF-03)
}

export function CircBtn({ Icon, onClick, primary, tone, ...rest }: CircBtnProps): React.ReactElement {
  return (
    <button
      type="button"
      data-testid={primary ? 'circ-btn-primary' : 'circ-btn'}
      onClick={onClick}
      {...rest}
      style={{
        width: 34,
        height: 34,
        borderRadius: 999,
        border: 'none',
        cursor: 'pointer',
        background: primary ? tone : 'rgba(255,255,255,0.08)',
        color: primary ? '#1a0f08' : '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
      }}
    >
      <Icon size={16} strokeWidth={2.2} />
    </button>
  );
}
