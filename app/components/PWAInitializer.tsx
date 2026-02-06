'use client';

import { useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { clearBadge } from '@/lib/pwa/badgeService';
import { requestPersistentStorage } from '@/lib/pwa/persistentStorage';
import { onForegroundMessage, initializeNotifications } from '@/lib/notificationService';

/**
 * PWA Initializer Component
 *
 * Handles PWA initialization tasks on app load:
 * - Clears app badge when app is opened (user has seen notifications)
 * - Requests persistent storage to prevent data loss
 * - Sets up visibility change listeners
 * - Registers Firebase Messaging service worker
 * - Initializes notification listeners
 *
 * This component renders nothing, it's just for side effects.
 */
export default function PWAInitializer() {
  const { user } = useUser();

  useEffect(() => {
    const initializePWA = async () => {
      try {
        // 1. Register Firebase Messaging service worker
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
              scope: '/',
            });
            console.log('[PWAInitializer] Service Worker registered:', registration.scope);
          } catch (swError) {
            console.error('[PWAInitializer] Service Worker registration failed:', swError);
          }
        }

        // 2. Clear badge - user is viewing the app
        await clearBadge();

        // 3. Request persistent storage (won't prompt user, just requests)
        const persisted = await requestPersistentStorage();
        if (persisted) {
          console.log('[PWAInitializer] Persistent storage granted');
        }

        // 4. Listen for visibility changes to clear badge when app becomes visible
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

  // Initialize notifications for authenticated users
  useEffect(() => {
    if (!user?.sub) return;

    const initNotifications = async () => {
      try {
        // Initialize token management (loads existing token, refreshes if needed)
        const result = await initializeNotifications(user.sub);
        console.log('[PWAInitializer] Notifications initialized:', {
          hasToken: result.hasToken,
          wasRefreshed: result.wasRefreshed,
        });
      } catch (error) {
        console.error('[PWAInitializer] Error initializing notifications:', error);
      }
    };

    initNotifications();
  }, [user?.sub]);

  // Setup foreground message listener
  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      console.log('[PWAInitializer] Foreground notification received:', payload);
      // The notification will be shown automatically by onForegroundMessage
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Render nothing
  return null;
}
