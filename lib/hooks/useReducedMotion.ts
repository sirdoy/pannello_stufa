'use client';

import { useEffect, useState } from 'react';

/**
 * SSR-safe `prefers-reduced-motion: reduce` detection.
 *
 * Returns `false` during SSR + first client render (full-motion default per
 * Phase 176 UI-SPEC §"Reduced-motion contract"); flips to `true` after mount
 * if the user prefers reduced motion. Subscribes to the `change` event so a
 * runtime toggle (rare but cheap) is honored mid-session.
 *
 * Phase 176 consumer: `<SplashGate>`. Phase 177+ glass-card consumers may use
 * this same hook for their own motion-aware visual effects.
 *
 * Pattern source: lib/hooks/useVisibility.ts (sibling SSR-safe browser-API hook).
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false); // SSR-safe default — full motion

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}
