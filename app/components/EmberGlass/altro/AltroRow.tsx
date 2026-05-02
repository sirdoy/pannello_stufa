'use client';

/**
 * Phase 181 — AltroRow glass row primitive (CONTEXT D-12).
 *
 * Pressable as={Link or 'a'} consumer. tabIndex={0} required (RESEARCH Pitfall 3
 * — Pressable.tsx FOCUSABLE_HOSTS only matches string tags, so polymorphic
 * Link consumer must opt into data-pressable-focusable manually).
 *
 * `external` prop renders <a href> instead of <Link>: used for /auth/logout
 * (Auth0 server-side redirect benefits from full navigation, not client push).
 *
 * Visual analog: app/components/EmberGlass/automations/AutomationRow.tsx
 * (inline-style glass row idiom). Visual values: bg
 * `rgba(255,255,255,0.04)` and border `0.5px solid rgba(255,255,255,0.06)`
 * are bundle-verbatim AUDIT-EXCEPTIONs per UI-SPEC §Color.
 */

import Link from 'next/link';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { Pressable } from '../Pressable';

export interface AltroRowProps {
  icon: LucideIcon;
  label: string;
  href: string;
  /** Optional override (Esci row → '#ff8a4a'). */
  labelColor?: string;
  /** When true, renders <a href> instead of <Link>. Used for /auth/logout. */
  external?: boolean;
}

export function AltroRow({
  icon: Icon,
  label,
  href,
  labelColor,
  external = false,
}: AltroRowProps): React.ReactElement {
  const sharedStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '0.5px solid rgba(255, 255, 255, 0.06)',
    borderRadius: 'var(--r-card)',
    textDecoration: 'none',
    color: labelColor ?? 'var(--text-1)',
    fontFamily: 'var(--font-body)',
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.5,
  };

  if (external) {
    return (
      <Pressable as="a" href={href} tabIndex={0} style={sharedStyle}>
        <Icon size={20} strokeWidth={1.8} />
        <span>{label}</span>
        <div style={{ flex: 1 }} />
        <ChevronRight
          size={18}
          strokeWidth={1.8}
          aria-hidden="true"
          style={{ color: 'var(--text-2)' }}
        />
      </Pressable>
    );
  }

  return (
    <Pressable as={Link} href={href} tabIndex={0} style={sharedStyle}>
      <Icon size={20} strokeWidth={1.8} />
      <span>{label}</span>
      <div style={{ flex: 1 }} />
      <ChevronRight
        size={18}
        strokeWidth={1.8}
        aria-hidden="true"
        style={{ color: 'var(--text-2)' }}
      />
    </Pressable>
  );
}
