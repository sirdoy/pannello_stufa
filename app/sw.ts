import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import {
  Serwist,
  NetworkFirst,
  CacheFirst,
  StaleWhileRevalidate,
  ExpirationPlugin,
} from 'serwist';

// This declares the service worker's type
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Navigation requests - Network First for fresh content
    {
      matcher: ({ request }) => request.mode === 'navigate',
      handler: new NetworkFirst({
        cacheName: 'pages-cache',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          }),
        ],
        networkTimeoutSeconds: 10,
      }),
    },
    // Stove API - Network First with short cache
    {
      matcher: ({ url }) => url.hostname === 'wsthermorossi.cloudwinet.it',
      handler: new NetworkFirst({
        cacheName: 'stove-api-cache',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 60, // 1 minute
          }),
        ],
        networkTimeoutSeconds: 10,
      }),
    },
    // Images - Cache First for performance
    {
      matcher: ({ request }) => request.destination === 'image',
      handler: new CacheFirst({
        cacheName: 'image-cache',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          }),
        ],
      }),
    },
    // Static assets (JS, CSS) - Stale While Revalidate
    {
      matcher: ({ request }) =>
        request.destination === 'script' || request.destination === 'style',
      handler: new StaleWhileRevalidate({
        cacheName: 'static-resources',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          }),
        ],
      }),
    },
    // Default cache from Serwist
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher: ({ request }) => request.destination === 'document',
      },
    ],
  },
});

serwist.addEventListeners();

// ============================================
// Push Notification Handlers
// ============================================

/**
 * Push event handler for Firebase Cloud Messaging
 * Triggered when a push notification arrives while app is in background
 */
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('[sw.ts] Push event without data');
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch {
    console.log('[sw.ts] Push data is not JSON:', event.data.text());
    return;
  }

  console.log('[sw.ts] Push notification received:', payload);

  const notificationTitle = payload.notification?.title || 'Pannello Stufa';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    tag: payload.data?.type || 'default',
    requireInteraction: payload.data?.priority === 'high',
    data: {
      url: payload.data?.url || '/',
      ...payload.data,
    },
    vibrate: payload.data?.priority === 'high' ? [200, 100, 200] : [100],
  } as NotificationOptions & { vibrate?: number[] };

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});

/**
 * Notification click handler
 * Opens the app or focuses existing window when user clicks notification
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[sw.ts] Notification clicked:', event.notification);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If app is already open, focus it and navigate
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            if ('navigate' in client) {
              (client as WindowClient).navigate(urlToOpen);
            }
            return;
          }
        }

        // Otherwise open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

/**
 * Notification close handler (optional analytics)
 */
self.addEventListener('notificationclose', (event) => {
  console.log('[sw.ts] Notification dismissed:', event.notification.tag);
});

// ============================================
// Service Worker Lifecycle
// ============================================

console.log('[sw.ts] Service Worker loaded - Serwist v9');
