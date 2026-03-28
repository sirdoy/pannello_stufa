'use client';

import { useOnlineStatusContext } from '@/app/context/OnlineStatusContext';

/**
 * Hook for monitoring online/offline status.
 *
 * Thin wrapper around OnlineStatusContext — all consumers share a single
 * timer instance (no duplicate HEAD /api/health polling).
 */
export function useOnlineStatus() {
  return useOnlineStatusContext();
}

export default useOnlineStatus;
