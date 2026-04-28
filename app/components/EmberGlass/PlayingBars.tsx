'use client';

/**
 * PlayingBars — Phase 177 (DASH-05 enabling primitive).
 *
 * 3-bar Sonos animation. Pure presentational; no props, no state.
 *
 * Bundle source (PRIMARY visual contract):
 *   .planning/inbox/ember-glass-design/project/components/cards.jsx:272-282
 *
 * Animation depends on three keyframes (sonosBar0/1/2) defined in
 * app/globals.css. The reduced-motion guard
 *   [data-testid="playing-bars"] > div { animation: none !important; }
 * is also defined in app/globals.css alongside the existing splash badge dot
 * + FlameViz reduced-motion overrides (Phase 176).
 */
export function PlayingBars() {
  return (
    <div
      data-testid="playing-bars"
      style={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 9 }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 2,
            borderRadius: 1,
            background: '#b080ff',
            animation: `sonosBar${i} 0.9s ease-in-out ${i * 0.15}s infinite`,
            height: 4,
          }}
        />
      ))}
    </div>
  );
}
