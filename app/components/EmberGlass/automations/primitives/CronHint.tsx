'use client';
/**
 * CronHint — automations-local primitive (no codebase analog — bundle-verbatim)
 * Bundle source: automations.jsx lines 907-924
 * D-02: inline-style + var(--token) only. Zero Tailwind for visual values.
 * D-04: NOT shared with Phase 178 sheets/primitives.
 *
 * Parses a cron expression into 5 labeled segments.
 * Italian labels: 'min' / 'ora' / 'giorno' / 'mese' / 'giorno sett.'
 * Missing tokens (fewer than 5) render '—' placeholder.
 * Extra whitespace between tokens is tolerated via split(/\s+/).
 */

const LABELS = ['min', 'ora', 'giorno', 'mese', 'giorno sett.'] as const;

export interface CronHintProps {
  /** Cron expression string (e.g. "0 8 * * *") */
  expr: string;
}

export function CronHint({ expr }: CronHintProps) {
  const parts = expr.trim().split(/\s+/);
  const segments = LABELS.map((_, i) => parts[i] ?? '—');

  return (
    <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
      {LABELS.map((label, i) => (
        <div
          key={label}
          style={{
            flex: 1,
            padding: '4px 6px',
            borderRadius: 6,
            background: 'rgba(255,255,255,0.04)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: 'var(--text-2)',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: 12,
              color: '#fff',
              fontFamily: 'ui-monospace, monospace',
              marginTop: 1,
            }}
          >
            {segments[i]}
          </div>
        </div>
      ))}
    </div>
  );
}
