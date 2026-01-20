'use client';

import { useEffect } from 'react';
import { clearBadge } from '@/lib/pwa/badgeService';
import { requestPersistentStorage } from '@/lib/pwa/persistentStorage';

/**
 * PWA Initializer Component
 *
 * Handles PWA initialization tasks on app load:
 * - Clears app badge when app is opened (user has seen notifications)
 * - Requests persistent storage to prevent data loss
 * - Sets up visibility change listeners
 *
 * This component renders nothing, it's just for side effects.
 */
export default function PWAInitializer() {
  useEffect(() => {
    const initializePWA = async () => {
      try {
        // 1. Clear badge - user is viewing the app
        await clearBadge();

        // 2. Request persistent storage (won't prompt user, just requests)
        const persisted = await requestPersistentStorage();
        if (persisted) {
          console.log('[PWAInitializer] Persistent storage granted');
        }

        // 3. Listen for visibility changes to clear badge when app becomes visible
        const handleVisibilityChange = async () => {
          if (document.visibilityState === 'visible') {
            await clearBadge();
          }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup
        return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
      } catch (error) {
        console.error('[PWAInitializer] Error:', error);
      }
    };

    initializePWA();
  }, []);

  // Render nothing
  return null;
}
