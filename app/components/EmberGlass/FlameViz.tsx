'use client';

import type React from 'react';

/**
 * FlameViz — Phase 176 (SPLASH-02 primitive; Phase 177 will reuse for StoveCard DASH-02).
 *
 * Pure presentational; no state, no effects.
 *
 * Bundle source (PRIMARY visual contract):
 *   .planning/inbox/ember-glass-design/project/components/cards.jsx:109-129
 *
 * Phase 176 ships ONLY the primitive + splash usage (CONTEXT.md D-03).
 * Phase 177 will additionally import it from <StoveCard>.
 * No other v20.0 phase may redefine FlameViz.
 *
 * AUDIT-EXCEPTION (DS-02): #6a1a00 mix-target (cards.jsx:117), #fff5c0/#ffd27a tip
 * gradient (cards.jsx:125) are intentional non-token literals (UI-SPEC §Color).
 *
 * The `data-flame-viz="true"` attribute on the wrapper enables the global
 * reduced-motion override `[data-flame-viz="true"] > div { animation: none }`
 * defined in app/globals.css.
 */

export interface FlameVizProps {
  on: boolean;
  /** Default 0.6. Splash uses 0.95. Phase 177 StoveCard will pass dynamic stove power. */
  intensity?: number;
}

export function FlameViz({ on, intensity = 0.6 }: FlameVizProps): React.ReactElement {
  return (
    <div
      data-flame-viz="true"
      style={{
        width: 64,
        height: 80,
        position: 'relative',
        opacity: on ? 1 : 0.25,
        transition: 'opacity .4s',
      }}
    >
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 48,
          height: 64 * (0.5 + intensity * 0.5),
          borderRadius: '50% 50% 45% 45% / 60% 60% 40% 40%',
          background: `radial-gradient(ellipse at 50% 80%, color-mix(in oklab, var(--accent) 80%, white) 0%, var(--accent) 40%, color-mix(in oklab, var(--accent) 60%, #6a1a00) 90%)`, // AUDIT-EXCEPTION (DS-02): #6a1a00 mix-target — bundle cards.jsx:117
          filter: 'blur(0.5px)',
          boxShadow: on
            ? `0 0 40px color-mix(in oklab, var(--accent) 70%, transparent), 0 0 80px color-mix(in oklab, var(--accent) 40%, transparent)`
            : 'none',
          animation: on ? 'flamePulse 1.8s ease-in-out infinite' : 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 4,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 28,
          height: 40 * (0.5 + intensity * 0.5),
          borderRadius: '50% 50% 40% 40%',
          background: `radial-gradient(ellipse at 50% 90%, #fff5c0 0%, #ffd27a 50%, transparent 75%)`, // AUDIT-EXCEPTION (DS-02): #fff5c0/#ffd27a tip gradient — bundle cards.jsx:125
          animation: on ? 'flamePulse 1.4s ease-in-out infinite alternate' : 'none',
        }}
      />
    </div>
  );
}
