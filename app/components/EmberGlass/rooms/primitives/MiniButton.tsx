'use client';
/**
 * MiniButton — Phase 179 rooms primitive
 * Bundle source: rooms.jsx:591-604
 * 34px-tall pill button with optional icon + label, filled/outlined variants.
 * D-02: inline-style + var(--token) only. D-37: no useMemo/useCallback.
 * D-62: bare <button> element, NOT a glass surface — no Pressable wrap (browser :active sufficient).
 * D-67: inline event handlers allowed — do NOT extract to useCallback.
 */
import type { CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface MiniButtonProps {
  Icon?: LucideIcon;
  label?: string;
  filled?: boolean;
  tone?: string;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function MiniButton({
  Icon,
  label,
  filled = false,
  tone = 'var(--accent)',
  onClick,
  disabled = false,
  ariaLabel,
}: MiniButtonProps){
  const slug = label ? slugify(label) : 'icon';

  const style: CSSProperties = {
    flex: 1,
    height: 34,
    borderRadius: 10,
    border: filled
      ? `0.5px solid color-mix(in oklab, ${tone} 35%, transparent)`
      : '0.5px solid rgba(255,255,255,0.06)', // AUDIT-EXCEPTION (rooms.jsx:596)
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: filled
      ? `color-mix(in oklab, ${tone} 22%, rgba(255,255,255,0.04))` // AUDIT-EXCEPTION (rooms.jsx:594)
      : 'rgba(255,255,255,0.05)', // AUDIT-EXCEPTION (rooms.jsx:594)
    color: filled ? tone : '#fff', // AUDIT-EXCEPTION '#fff' (rooms.jsx:595)
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 0.2,
    boxShadow: filled
      ? `0 0 10px color-mix(in oklab, ${tone} 25%, transparent)`
      : 'none',
    opacity: disabled ? 0.5 : 1,
  };

  return (
    <button
      type="button"
      data-component="mini-button"
      data-testid={`mini-button-${slug}`}
      style={style}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-label={ariaLabel ?? label ?? 'button'}
    >
      {Icon ? <Icon size={12} strokeWidth={2.4} /> : null}
      {label ? <span>{label}</span> : null}
    </button>
  );
}
