'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for monitoring online/offline status
 *
 * Provides real-time connection status with event-based updates.
 * Uses navigator.onLine as primary source with online/offline events.
 *
 * @returns {Object} Online status state and utilities
 * @returns {boolean} isOnline - Whether device has internet connection
 * @returns {boolean} wasOffline - Whether device was recently offline (for showing reconnect messages)
 * @returns {Date|null} lastOnlineAt - Timestamp when connection was last detected
 * @returns {Date|null} offlineSince - Timestamp when connection was lost (null if online)
 * @returns {Function} checkConnection - Manually check connection status
 *
 * @example
 * const { isOnline, wasOffline, offlineSince } = useOnlineStatus();
 *
 * if (!isOnline) {
 *   return <OfflineBanner since={offlineSince} />;
 * }
 *
 * if (wasOffline) {
 *   return <ReconnectedBanner />;
 * }
 */
export function useOnlineStatus(): { isOnline: boolean; wasOffline: boolean; lastOnlineAt: Date | null; offlineSince: Date | null; checkConnection: () => Promise<boolean> } {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(null);
  const [offlineSince, setOfflineSince] = useState<Date | null>(null);

  /**
   * Check connection by attempting to fetch a small resource
   * More reliable than navigator.onLine alone
   */
  const checkConnection = useCallback(async () => {
    // navigator.onLine is false = definitely offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return false;
    }

    // Try to fetch to verify actual connectivity
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-store',
      });
      return response.ok;
    } catch {
      // If fetch fails, try navigator.onLine as fallback
      return typeof navigator !== 'undefined' ? navigator.onLine : true;
    }
  }, []);

  // Initialize state on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const online = navigator.onLine;
      setIsOnline(online);
      if (online) {
        setLastOnlineAt(new Date());
      } else {
        setOfflineSince(new Date());
      }
    }
  }, []);

  // Listen to online/offline events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      setLastOnlineAt(new Date());

      // If we were offline, set wasOffline flag temporarily
      if (offlineSince) {
        setWasOffline(true);
        setOfflineSince(null);

        // Clear wasOffline after 5 seconds
        setTimeout(() => {
          setWasOffline(false);
        }, 5000);
      }

    };

    const handleOffline = () => {
      setIsOnline(false);
      setOfflineSince(new Date());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineSince]);

  // Periodic connection check (every 30 seconds when online, every 10 when offline)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const interval = setInterval(
      async () => {
        const online = await checkConnection();
        if (online !== isOnline) {
          if (online) {
            setIsOnline(true);
            setLastOnlineAt(new Date());
            if (offlineSince) {
              setWasOffline(true);
              setOfflineSince(null);
              setTimeout(() => setWasOffline(false), 5000);
            }
          } else {
            setIsOnline(false);
            if (!offlineSince) {
              setOfflineSince(new Date());
            }
          }
        }
      },
      isOnline ? 30000 : 10000
    );

    return () => clearInterval(interval);
  }, [isOnline, offlineSince, checkConnection]);

  return {
    isOnline,
    wasOffline,
    lastOnlineAt,
    offlineSince,
    checkConnection,
  };
}

export default useOnlineStatus;
