'use client';

import { useEffect, useState } from 'react';
import type React from 'react';
import { FlameViz } from './FlameViz';

/**
 * Splash — Phase 176 (SPLASH-02, SPLASH-03)
 *
 * Z-INDEX RESERVATION: 1000 (lifted verbatim from bundle splash.jsx:23).
 * Phases 178-181 in-session UI MUST stay below 1000.
 *
 * Bundle source (PRIMARY visual + behavior contract):
 *   .planning/inbox/ember-glass-design/project/components/splash.jsx:1-91
 *
 * Pure presentational. Owns the 4-phase timer state machine (full-motion) and the
 * 2-phase variant (reduced-motion). Does NOT touch sessionStorage, Auth0, or
 * matchMedia — those concerns are owned by <SplashGate> (Plan 03).
 *
 * Full-motion timeline (per CONTEXT.md D-13):
 *   t=0      → phase 0 (flame at scale(0.4), all secondary content invisible)
 *   t=600ms  → phase 1 (flame scale(1), wordmark/caption/badge fade-in)
 *   t=1500ms → phase 2 (flame scale(1.08), overlay starts opacity fade-out)
 *   t=2100ms → phase 3 (onDone() fires, overlay returns null)
 *
 * Reduced-motion timeline (per CONTEXT.md D-17/D-18/D-19):
 *   t=0     → phase 0 (all content opacity:1; ZERO transforms; pulse animation suppressed)
 *   t=200ms → phase 1 (overlay opacity-only fade; onDone() fires; returns null)
 *
 * AUDIT-EXCEPTION (DS-02): the #1c1917 + #0a0908 splash gradient, AUDIT-EXCEPTION (DS-02) #fff wordmark,
 * AUDIT-EXCEPTION (DS-02) #6aa86a status dot, position:'fixed' (vs bundle 'absolute' — UI-SPEC §"Position
 * resolution"), and three non-4-multiple offsets (marginTop:26, marginTop:6,
 * gap:6) are intentional bundle-fidelity literals (UI-SPEC §Color §Spacing).
 */

export interface SplashProps {
  /** Called once when splash transition completes (full-motion: t=2100; reduced-motion: t=200). */
  onDone: () => void;
  /** When true, collapses to a 200ms opacity-only fade with no scale/transform. Default: false. */
  reducedMotion?: boolean;
}

export function Splash({ onDone, reducedMotion = false }: SplashProps): React.ReactElement | null {
  const [phase, setPhase] = useState(0);

  // Full-motion phase state machine (D-13). Skipped entirely under reducedMotion.
  useEffect(() => {
    if (reducedMotion) return;
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 1500);
    const t3 = setTimeout(() => {
      setPhase(3);
      onDone();
    }, 2100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [reducedMotion, onDone]);

  // Reduced-motion 2-phase variant (D-18): single 200ms opacity-only fade.
  useEffect(() => {
    if (!reducedMotion) return;
    const t = setTimeout(() => {
      setPhase(1);
      onDone();
    }, 200);
    return () => clearTimeout(t);
  }, [reducedMotion, onDone]);

  // Phase-3 (full-motion) and phase-1 (reduced-motion) terminal states return null (D-07).
  if (reducedMotion) {
    if (phase >= 1) return null;
  } else {
    if (phase >= 3) return null;
  }

  const overlayPointerEvents: 'none' | 'auto' = (reducedMotion ? phase >= 1 : phase >= 2) ? 'none' : 'auto';

  return (
    <div
      data-testid="splash-overlay"
      aria-hidden="true"
      style={{
        position: 'fixed', // AUDIT-EXCEPTION (DS-02): deliberate divergence from bundle's 'absolute' (UI-SPEC §"Position resolution")
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, #1c1917 0%, #0a0908 70%)', // AUDIT-EXCEPTION (DS-02): bundle splash.jsx:25 — splash gradient
        opacity: reducedMotion ? (phase >= 1 ? 0 : 1) : (phase >= 2 ? 0 : 1),
        transition: reducedMotion ? 'opacity .2s linear' : 'opacity .55s cubic-bezier(.4,0,.2,1)',
        pointerEvents: overlayPointerEvents,
      }}
    >
      {/* Ambient glow blob — Phase 174 token (color-mix on var(--accent)). Visible from phase ≥ 1 in full-motion; from t=0 in reduced-motion. */}
      <div
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: 999,
          background: 'color-mix(in oklab, var(--accent) 40%, transparent)',
          filter: 'blur(60px)',
          opacity: reducedMotion ? 0.7 : phase >= 1 ? 0.7 : 0,
          transform: reducedMotion ? 'none' : phase >= 1 ? 'scale(1.2)' : 'scale(0.6)',
          transition: reducedMotion ? undefined : 'opacity 1s, transform 1.2s cubic-bezier(.22,1,.36,1)',
        }}
      />

      {/* Flame container — bundle splash.jsx:42 (88x96 wrapper around <FlameViz>). */}
      <div
        data-testid="splash-flame"
        style={{
          position: 'relative',
          width: 88,
          height: 96,
          opacity: reducedMotion ? 1 : phase >= 1 ? 1 : 0,
          transform: reducedMotion
            ? 'none'
            : phase >= 2
              ? 'scale(1.08)'
              : phase >= 1
                ? 'scale(1)'
                : 'scale(0.4)',
          transition: reducedMotion ? undefined : 'opacity .5s, transform .7s cubic-bezier(.22,1.2,.36,1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <FlameViz on intensity={0.95} />
      </div>

      {/* Wordmark — bundle splash.jsx:51-62 verbatim. */}
      <div
        data-testid="splash-wordmark"
        style={{
          marginTop: 26, // AUDIT-EXCEPTION (DS-02): non-4-multiple, bundle splash.jsx:52
          fontFamily: 'var(--font-display)',
          fontSize: 28,
          fontWeight: 600,
          letterSpacing: -0.8,
          color: '#fff', // AUDIT-EXCEPTION (DS-02): bundle splash.jsx:55
          opacity: reducedMotion ? 1 : phase >= 1 ? 1 : 0,
          transform: reducedMotion ? 'none' : phase >= 1 ? 'translateY(0)' : 'translateY(12px)',
          transition: reducedMotion ? undefined : 'opacity .5s .15s, transform .6s .15s cubic-bezier(.22,1,.36,1)',
        }}
      >
        Home
      </div>

      {/* Caption — bundle splash.jsx:65-72 verbatim. U+2026 ellipsis. */}
      <div
        style={{
          marginTop: 6, // AUDIT-EXCEPTION (DS-02): non-4-multiple, bundle splash.jsx:66
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: 0.3,
          color: 'var(--text-2)',
          opacity: reducedMotion ? 1 : phase >= 1 ? 1 : 0,
          transform: reducedMotion ? 'none' : phase >= 1 ? 'translateY(0)' : 'translateY(8px)',
          transition: reducedMotion ? undefined : 'opacity .5s .3s, transform .6s .3s cubic-bezier(.22,1,.36,1)',
        }}
      >
        Connessione al gateway…
      </div>

      {/* Badge — bundle splash.jsx:76-87 verbatim. U+00B7 middle dot. */}
      <div
        data-testid="splash-badge"
        style={{
          position: 'absolute',
          bottom: 40,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 11,
          color: 'var(--text-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6, // AUDIT-EXCEPTION (DS-02): non-4-multiple, bundle splash.jsx:80
          opacity: reducedMotion ? 0.7 : phase >= 1 ? 0.7 : 0,
          transition: reducedMotion ? undefined : 'opacity .5s .4s',
        }}
      >
        <div
          style={{
            width: 6, // AUDIT-EXCEPTION (DS-02): non-4-multiple dot diameter, bundle splash.jsx:83
            height: 6,
            borderRadius: 999,
            background: '#6aa86a', // AUDIT-EXCEPTION (DS-02): bundle splash.jsx:83
            boxShadow: '0 0 8px #6aa86a', // AUDIT-EXCEPTION (DS-02): bundle splash.jsx:84
            // Reduced-motion suppression (D-19): pulse keyframe disabled to avoid any
            // motion. Keyframe `pulse` defined in app/globals.css (Plan 01).
            animation: reducedMotion ? 'none' : 'pulse 1.6s infinite',
          }}
        />
        Autenticato · Auth0
      </div>
    </div>
  );
}
