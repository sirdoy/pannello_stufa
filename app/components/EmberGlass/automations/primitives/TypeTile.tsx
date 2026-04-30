'use client';
/**
 * TypeTile — automations-local primitive
 * Bundle source: automations.jsx lines 877-896
 * D-02: inline-style + var(--token) only. Zero Tailwind for visual values.
 * D-04: NOT shared with Phase 178 sheets/primitives.
 * D-12: supports `disabled` prop for trigger read-only edit mode.
 *
 * Security note (T-180-03-01): disabled tiles use THREE layers of prevention:
 *   1. onClick={disabled ? undefined : onClick} — handler removed
 *   2. pointerEvents: 'none' — CSS-level block
 *   3. aria-disabled="true" — semantic signal
 */
import type { ReactNode, CSSProperties } from 'react';

export interface TypeTileProps {
  icon: ReactNode;
  label: string;
  desc?: string;
  /** Tone color (hex or CSS var) — used for icon bg, selected state glow, icon color */
  tone: string;
  selected: boolean;
  /** When true, renders as opacity 0.45 + not-allowed cursor + no pointer events (D-12) */
  disabled?: boolean;
  onClick?: () => void;
  'aria-label'?: string;
}

export function TypeTile({
  icon,
  label,
  desc,
  tone,
  selected,
  disabled = false,
  onClick,
  ...rest
}: TypeTileProps) {
  const containerStyle: CSSProperties = {
    padding: 10,
    borderRadius: 11,
    border: selected
      ? `0.5px solid color-mix(in oklab, ${tone} 40%, transparent)`
      : '0.5px solid rgba(255,255,255,0.06)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    textAlign: 'left',
    background: selected
      ? `color-mix(in oklab, ${tone} 18%, transparent)`
      : 'rgba(255,255,255,0.04)',
    boxShadow: selected
      ? `0 0 14px color-mix(in oklab, ${tone} 25%, transparent)`
      : 'none',
    color: '#fff',
    width: '100%',
    boxSizing: 'border-box',
    ...(disabled ? ({ opacity: 0.45, pointerEvents: 'none' } as CSSProperties) : {}),
  };

  const iconAreaStyle: CSSProperties = {
    width: 26,
    height: 26,
    borderRadius: 7,
    marginBottom: 6,
    background: `color-mix(in oklab, ${tone} 20%, rgba(255,255,255,0.05))`,
    color: tone,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
  };

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      aria-pressed={selected}
      aria-disabled={disabled}
      aria-label={rest['aria-label']}
      style={containerStyle}
    >
      <div style={iconAreaStyle}>{icon}</div>
      <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.2 }}>{label}</div>
      {desc && (
        <div
          style={{
            fontSize: 10,
            color: 'var(--text-2)',
            lineHeight: 1.3,
            marginTop: 2,
          }}
        >
          {desc}
        </div>
      )}
    </button>
  );
}
