'use client';

/**
 * PageHeader — the one page header of the app (workspace ROADMAP M72).
 *
 * Every page starts with it: a top row that holds the back button (and keeps
 * the title clear of the floating connection chip), an optional eyebrow, the
 * page title as the only <h1>, an optional description and an actions slot.
 *
 * Tab roots (Casa, Stanze, Automazioni, Altro) have no back button; every
 * other page passes `backHref` with its parent route.
 */

import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export interface PageHeaderProps {
  title: ReactNode;
  /** Small uppercase line above the title (counter, section name). */
  eyebrow?: ReactNode;
  description?: ReactNode;
  /** Parent route; omitted on the tab roots. */
  backHref?: string;
  /** Right side of the title row (buttons, toggles). */
  actions?: ReactNode;
  style?: CSSProperties;
  'data-testid'?: string;
}

const TOP_ROW_HEIGHT = 36;

const backStyle: CSSProperties = {
  width: TOP_ROW_HEIGHT,
  height: TOP_ROW_HEIGHT,
  borderRadius: 999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255,255,255,0.06)',
  border: '0.5px solid var(--glass-border)',
  color: 'var(--text-1)',
};

export function PageHeader({
  title,
  eyebrow,
  description,
  backHref,
  actions,
  style,
  ...rest
}: PageHeaderProps) {
  return (
    <header data-testid={rest['data-testid'] ?? 'page-header'} style={{ marginBottom: 20, ...style }}>
      <div style={{ height: TOP_ROW_HEIGHT, marginBottom: 14, display: 'flex', alignItems: 'center' }}>
        {backHref && (
          <Link href={backHref} aria-label="Indietro" style={backStyle}>
            <ChevronLeft size={20} strokeWidth={2} />
          </Link>
        )}
      </div>
      {/* Actions that do not fit next to the title wrap below it */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: '1 1 160px', minWidth: 0 }}>
          {eyebrow && (
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-2)',
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 2,
              }}
            >
              {eyebrow}
            </div>
          )}
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              fontWeight: 600,
              color: 'var(--text-1)',
              letterSpacing: -0.8,
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            {title}
          </h1>
        </div>
        {actions && <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>{actions}</div>}
      </div>
      {description && (
        <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.45, margin: '6px 0 0', maxWidth: 640 }}>
          {description}
        </p>
      )}
    </header>
  );
}
