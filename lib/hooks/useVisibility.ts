'use client';

import { useState, useEffect } from 'react';

/**
 * Hook that tracks the Page Visibility API state.
 * Returns true when the page is visible, false when hidden.
 * SSR-safe: assumes visible on server/initial mount.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
 */
export function useVisibility(): boolean {
  // Initialize to true (assume visible on SSR/mount)
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof document === 'undefined') {
      return true;
    }
    return !document.hidden;
  });

  useEffect(() => {
    // Set actual visibility state on mount
    setIsVisible(!document.hidden);

    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}
