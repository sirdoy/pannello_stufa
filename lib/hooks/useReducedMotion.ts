'use client';

import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void): () => void {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

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
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false // SSR + hydration: full motion
  );
}
