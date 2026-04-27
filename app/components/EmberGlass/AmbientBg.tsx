'use client';

import { useEffect, useState } from 'react';

/**
 * AmbientBg — Phase 174 (DS-05)
 *
 * Renders three radial-gradient blob divs at z-index 0 behind the app shell when
 * `<html data-ambient="on">` is set (by the inline pre-paint script in app/layout.tsx
 * on hard reload, or by the picker on /debug/design-system-v2 dispatching
 * `ember-glass-ambient-change` events).
 *
 * Initial state mirrors document.documentElement.dataset.ambient so there is zero
 * flash on hard reload (the inline script runs before paint, sets the attribute,
 * and useState's initializer reads it synchronously).
 *
 * Blob geometry + colors lifted from the design bundle:
 *   .planning/inbox/ember-glass-design/project/components/app.jsx:175-200
 *
 * AUDIT-EXCEPTION (DS-02): blob B mix-target #301010 and blob C static rgba color
 * are intentional non-token literals per UI-SPEC §"Claude's Discretion".
 */
export default function AmbientBg(): React.ReactElement | null {
  const [on, setOn] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.dataset.ambient === 'on';
  });

  useEffect(() => {
    const handler = (e: Event): void => {
      const detail = (e as CustomEvent<boolean>).detail;
      setOn(Boolean(detail));
    };
    window.addEventListener('ember-glass-ambient-change', handler);
    return () => {
      window.removeEventListener('ember-glass-ambient-change', handler);
    };
  }, []);

  if (!on) return null;

  return (
    <div
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}
    >
      <div
        className="ember-ambient-blob"
        style={{
          position: 'fixed',
          top: -60,
          left: -60,
          width: 320,
          height: 320,
          borderRadius: 999,
          filter: 'blur(60px)',
          opacity: 0.5,
          background:
            'radial-gradient(circle, color-mix(in oklab, var(--accent) 60%, transparent) 0%, transparent 70%)',
          animation: 'ambientA 14s ease-in-out infinite',
        }}
      />
      <div
        className="ember-ambient-blob"
        style={{
          position: 'fixed',
          bottom: 120,
          right: -80,
          width: 360,
          height: 360,
          borderRadius: 999,
          filter: 'blur(70px)',
          opacity: 0.4,
          // AUDIT-EXCEPTION (DS-02): #301010 lifted verbatim from design bundle app.jsx:184
          background:
            'radial-gradient(circle, color-mix(in oklab, var(--accent) 40%, #301010) 0%, transparent 70%)',
          animation: 'ambientB 18s ease-in-out infinite',
        }}
      />
      <div
        className="ember-ambient-blob"
        style={{
          position: 'fixed',
          top: '40%',
          left: '30%',
          width: 260,
          height: 260,
          borderRadius: 999,
          filter: 'blur(80px)',
          opacity: 0.4,
          // AUDIT-EXCEPTION (DS-02): static cool-blue counterpoint per UI-SPEC §Color
          background: 'radial-gradient(circle, rgba(94, 175, 255, 0.25) 0%, transparent 70%)',
          animation: 'ambientC 22s ease-in-out infinite',
        }}
      />
    </div>
  );
}
