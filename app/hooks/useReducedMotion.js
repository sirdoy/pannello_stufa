'use client';

import { useState, useEffect } from 'react';

/**
 * Media query to detect if user has no motion preference (motion allowed)
 * We check for 'no-preference' instead of 'reduce' to default to reduced motion on SSR
 */
const QUERY = '(prefers-reduced-motion: no-preference)';

/**
 * useReducedMotion - Hook for respecting user motion preferences
 *
 * Returns true when user prefers reduced motion, false when motion is allowed.
 * Defaults to true (reduced motion) on server-side rendering for accessibility safety.
 *
 * Uses the prefers-reduced-motion media query:
 * - 'reduce': User prefers reduced motion (returns true)
 * - 'no-preference': User allows motion (returns false)
 *
 * @returns {boolean} True if reduced motion preferred, false if motion allowed
 *
 * @example
 * // Conditionally disable animation
 * const prefersReducedMotion = useReducedMotion();
 * const animationDuration = prefersReducedMotion ? 0 : 300;
 *
 * @example
 * // Skip animation entirely
 * const prefersReducedMotion = useReducedMotion();
 * if (!prefersReducedMotion) {
 *   triggerAnimation();
 * }
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    // SSR-safe: default to reduced motion on server for accessibility
    if (typeof window === 'undefined') return true;
    return !window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    const mediaQueryList = window.matchMedia(QUERY);
    const listener = (event) => {
      setPrefersReducedMotion(!event.matches);
    };

    // Support both modern and legacy browsers
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', listener);
    } else {
      // Safari < 14 fallback
      mediaQueryList.addListener(listener);
    }

    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', listener);
      } else {
        // Safari < 14 fallback
        mediaQueryList.removeListener(listener);
      }
    };
  }, []);

  return prefersReducedMotion;
}
