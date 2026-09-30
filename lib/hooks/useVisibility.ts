'use client';

import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void): () => void {
  document.addEventListener('visibilitychange', onChange);
  return () => document.removeEventListener('visibilitychange', onChange);
}

/**
 * Hook that tracks the Page Visibility API state.
 * Returns true when the page is visible, false when hidden.
 * SSR-safe: assumes visible on server/initial mount.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
 */
export function useVisibility(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => !document.hidden,
    () => true // assume visible on the server
  );
}
