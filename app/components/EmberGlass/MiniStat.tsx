'use client';

/**
 * MiniStat — Phase 177 (DASH-09)
 *
 * Compact 3-line stat: 11px label, 15px display-font value, 3px progress bar
 * filled with var(--accent). Bar input is clamped to [0..1].
 *
 * Bundle source:
 *   .planning/inbox/ember-glass-design/project/components/cards.jsx:375-383
 *
 * RC-clean — no manual memoization hooks (D-28 — React Compiler discipline).
 */

export interface MiniStatProps {
  label: string;
  value: string;
  /** 0..1 — values outside the range are clamped */
  bar: number;
}

export function MiniStat({ label, value, bar }: MiniStatProps) {
  const clamped = Math.min(1, Math.max(0, bar));
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 3 }}>{label}</div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: '#fff',
          fontFamily: 'var(--font-display)',
        }}
      >
        {value}
      </div>
      <div
        style={{
          height: 3,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.08)',
          marginTop: 5,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${clamped * 100}%`,
            background: 'var(--accent)',
            borderRadius: 999,
          }}
        />
      </div>
    </div>
  );
}
