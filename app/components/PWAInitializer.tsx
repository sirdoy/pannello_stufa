'use client';

import { useEffect } from 'react';
import { useUser } from '@/lib/auth/useUser';
import { clearBadge } from '@/lib/pwa/badgeService';
import { requestPersistentStorage } from '@/lib/pwa/persistentStorage';
import { syncPush } from '@/lib/push/pushClient';

/**
 * PWA Initializer Component
 *
 * Handles PWA initialization tasks on app load:
 * - Clears app badge when app is opened (user has seen notifications)
 * - Requests persistent storage to prevent data loss
 * - Sets up visibility change listeners
 * - Re-registers this device for Web Push when notifications are on (ROADMAP M48)
 *
 * The service worker itself is registered by Serwist (`/sw.js`). This component renders nothing.
 */
export default function PWAInitializer() {
  const { user } = useUser();

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        await clearBadge();
      }
    };

    const initializePWA = async () => {
      try {
        // Clear badge - user is viewing the app
        await clearBadge();
        // Request persistent storage (won't prompt user, just requests)
        await requestPersistentStorage();
      } catch (error) {
        console.error('[PWAInitializer] Error:', error);
      }
    };

    initializePWA();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Heal the push subscription (renewed by the browser, or lost on the Pi): needs a session
  useEffect(() => {
    if (!user?.sub) return;
    void syncPush();
  }, [user?.sub]);

  return null;
}
