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
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch {
    return;
  }


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
    // Include action buttons from FCM payload (Chrome/Edge/Opera only)
    // iOS Safari ignores this array (no support for notification actions)
    ...(payload.notification?.actions && {
      actions: payload.notification.actions,
    }),
  } as NotificationOptions & { vibrate?: number[]; actions?: Array<{ action: string; title: string; icon?: string }> };

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});

/**
 * Execute a notification action (online: immediate API call, offline: queue for sync)
 */
async function executeNotificationAction(
  endpoint: string,
  data: Record<string, string>
): Promise<void> {
  if (navigator.onLine) {
    try {
      const response = await fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        // Show success notification
        await self.registration.showNotification('Comando eseguito', {
          body: getActionSuccessMessage(endpoint),
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-72.png',
          tag: `action-success-${endpoint.replace('/', '-')}`,
        });
      } else {
        // Show failure notification
        await self.registration.showNotification('Errore comando', {
          body: `Impossibile eseguire il comando. Riprova dall'app.`,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-72.png',
          tag: `action-error-${endpoint.replace('/', '-')}`,
        });
      }
    } catch (error) {
      console.error('[sw.ts] Action execution failed:', error);
      // Network error - queue for later
      await queueActionForSync(endpoint, data);
    }
  } else {
    // Offline - queue for Background Sync
    await queueActionForSync(endpoint, data);
  }
}

/**
 * Queue an action for Background Sync execution
 * Uses existing IndexedDB commandQueue store
 */
async function queueActionForSync(
  endpoint: string,
  data: Record<string, string>
): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(COMMAND_QUEUE_STORE, 'readwrite');
    const store = transaction.objectStore(COMMAND_QUEUE_STORE);

    const command = {
      endpoint,
      method: 'POST',
      data: { ...data, source: 'notification-action-offline' },
      status: 'pending',
      timestamp: new Date().toISOString(),
      retries: 0,
      lastError: null,
    };

    store.add(command);

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    // Register Background Sync
    try {
      await self.registration.sync.register(SYNC_TAG);
    } catch {
      // SyncManager not supported - will retry on next online event
    }

    // Show "queued" notification (tag prevents duplicates from repeated clicks)
    await self.registration.showNotification('Comando in coda', {
      body: 'Il comando verra eseguito al ripristino della connessione',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      tag: `action-queued-${endpoint.replace('/', '-')}`,
    });
  } catch (error) {
    console.error('[sw.ts] Failed to queue action:', error);
  }
}

/**
 * Get success message for action type
 */
function getActionSuccessMessage(endpoint: string): string {
  switch (endpoint) {
    case 'stove/shutdown':
      return 'Stufa spenta con successo';
    default:
      return 'Comando eseguito con successo';
  }
}

/**
 * Open app at specified URL, focusing existing window if available
 */
async function openAppUrl(url: string): Promise<void> {
  const clientList = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });

  // If app is already open, focus it and navigate
  for (const client of clientList) {
    if (client.url.includes(self.location.origin) && 'focus' in client) {
      await client.focus();
      if ('navigate' in client) {
        await (client as WindowClient).navigate(url);
      }
      return;
    }
  }

  // Otherwise open new window
  if (self.clients.openWindow) {
    await self.clients.openWindow(url);
  }
}

/**
 * Notification click handler with action button support
 *
 * Handles three scenarios:
 * 1. Action button click (event.action has value) - execute action directly
 * 2. Notification body click (event.action is empty) - open app at URL
 * 3. Offline action - queue via Background Sync
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationData = event.notification.data || {};
  const clickedAction = event.action; // empty string if body clicked

  if (clickedAction === NOTIFICATION_ACTION_IDS.STOVE_SHUTDOWN) {
    // User clicked "Spegni stufa" action button
    event.waitUntil(executeNotificationAction('stove/shutdown', {
      source: 'notification-action',
      type: notificationData.type || 'unknown',
    }));

  } else if (clickedAction === NOTIFICATION_ACTION_IDS.THERMOSTAT_MANUAL) {
    // User clicked "Imposta manuale" action button - open thermostat page in manual mode
    event.waitUntil(openAppUrl('/thermostat?mode=manual'));

  } else if (clickedAction === NOTIFICATION_ACTION_IDS.STOVE_VIEW_DETAILS || clickedAction === NOTIFICATION_ACTION_IDS.THERMOSTAT_VIEW) {
    // User clicked "Dettagli" - open app at notification URL
    const url = notificationData.url || '/';
    event.waitUntil(openAppUrl(url));

  } else {
    // User clicked notification body (no action) - open app
    const urlToOpen = notificationData.url || '/';
    event.waitUntil(openAppUrl(urlToOpen));
  }
});

/**
 * Notification close handler (optional analytics)
 */
self.addEventListener('notificationclose', (event) => {
});

// ============================================
// Notification Action Constants
// ============================================
// Duplicated from lib/notificationActions.ts (SW compiled separately by Serwist)
const NOTIFICATION_ACTION_IDS = {
  STOVE_SHUTDOWN: 'stove-shutdown',
  STOVE_VIEW_DETAILS: 'view-details',
  THERMOSTAT_MANUAL: 'thermostat-manual',
  THERMOSTAT_VIEW: 'thermostat-view',
} as const;

// ============================================
// Background Sync Handlers
// ============================================

const SYNC_TAG = 'stove-command-sync';
const DB_NAME = 'pannello-stufa-pwa';
const DB_VERSION = 1;
const COMMAND_QUEUE_STORE = 'commandQueue';

/**
 * Open IndexedDB in Service Worker context
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(COMMAND_QUEUE_STORE)) {
        const store = db.createObjectStore(COMMAND_QUEUE_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains('deviceState')) {
        db.createObjectStore('deviceState', { keyPath: 'deviceId' });
      }
      if (!db.objectStoreNames.contains('appState')) {
        db.createObjectStore('appState', { keyPath: 'key' });
      }
    };
  });
}

/**
 * Get pending commands from IndexedDB
 */
async function getPendingCommands(): Promise<any[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(COMMAND_QUEUE_STORE, 'readonly');
    const store = transaction.objectStore(COMMAND_QUEUE_STORE);
    const index = store.index('status');
    const request = index.getAll('pending');
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update command status in IndexedDB
 */
async function updateCommandStatus(
  id: number,
  status: string,
  error?: string
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(COMMAND_QUEUE_STORE, 'readwrite');
    const store = transaction.objectStore(COMMAND_QUEUE_STORE);
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const command = getRequest.result;
      if (command) {
        command.status = status;
        if (error) command.lastError = error;
        if (status === 'processing') command.retries = (command.retries || 0) + 1;
        store.put(command);
      }
      resolve();
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Remove command from IndexedDB
 */
async function removeCommand(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(COMMAND_QUEUE_STORE, 'readwrite');
    const store = transaction.objectStore(COMMAND_QUEUE_STORE);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Execute a queued command
 */
async function executeCommand(command: any): Promise<void> {
  const url = `/api/${command.endpoint}`;
  const options: RequestInit = {
    method: command.method || 'POST',
    headers: { 'Content-Type': 'application/json' },
  };

  if (command.method !== 'GET' && command.data) {
    options.body = JSON.stringify(command.data);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }
}

/**
 * Process all pending commands in the queue
 */
async function processCommandQueue(): Promise<void> {

  const commands = await getPendingCommands();
  if (commands.length === 0) {
    return;
  }


  for (const command of commands) {
    try {
      await updateCommandStatus(command.id, 'processing');
      await executeCommand(command);
      await removeCommand(command.id);

      // Notify clients of successful sync
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) => {
        client.postMessage({
          type: 'COMMAND_SYNCED',
          commandId: command.id,
          endpoint: command.endpoint,
        });
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[sw.ts] Command ${command.id} failed:`, errorMessage);

      if ((command.retries || 0) >= 2) {
        await updateCommandStatus(command.id, 'failed', errorMessage);
      } else {
        await updateCommandStatus(command.id, 'pending', errorMessage);
      }
    }
  }
}

/**
 * Background Sync event handler
 * Triggered when connection is restored and sync is registered
 */
self.addEventListener('sync', (event: SyncEvent) => {

  if (event.tag === SYNC_TAG) {
    event.waitUntil(processCommandQueue());
  }
});

// ============================================
// App Badge Management
// ============================================

/**
 * Update app badge count
 * @param count - Number to show on badge (0 to clear)
 */
async function updateBadge(count: number): Promise<void> {
  if (!('setAppBadge' in navigator)) {
    return;
  }

  try {
    if (count > 0) {
      await (navigator as any).setAppBadge(count);
    } else {
      await (navigator as any).clearAppBadge();
    }
  } catch (error) {
    console.error('[sw.ts] Failed to update badge:', error);
  }
}

/**
 * Get current badge count from IndexedDB
 */
async function getBadgeCount(): Promise<number> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction('appState', 'readonly');
      const store = transaction.objectStore('appState');
      const request = store.get('badgeCount');
      request.onsuccess = () => resolve(request.result?.value || 0);
      request.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

/**
 * Save badge count to IndexedDB
 */
async function saveBadgeCount(count: number): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction('appState', 'readwrite');
      const store = transaction.objectStore('appState');
      store.put({ key: 'badgeCount', value: count });
      transaction.oncomplete = () => resolve();
    });
  } catch {
    // Ignore errors
  }
}

/**
 * Increment badge count (called on new notification)
 */
async function incrementBadge(): Promise<void> {
  const current = await getBadgeCount();
  const newCount = current + 1;
  await saveBadgeCount(newCount);
  await updateBadge(newCount);
}

// ============================================
// Device State Caching
// ============================================

/**
 * Cache device state for offline viewing
 */
async function cacheDeviceState(
  deviceId: string,
  state: any
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction('deviceState', 'readwrite');
      const store = transaction.objectStore('deviceState');
      store.put({
        deviceId,
        state,
        timestamp: new Date().toISOString(),
      });
      transaction.oncomplete = () => resolve();
    });
  } catch (error) {
    console.error('[sw.ts] Failed to cache device state:', error);
  }
}

// Intercept stove status API responses to cache for offline
self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url);

  // Cache stove status responses
  if (url.pathname === '/api/stove/status' && event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          if (response.ok) {
            const clone = response.clone();
            try {
              const data = await clone.json();
              await cacheDeviceState('stove', data);
            } catch {
              // Ignore parsing errors
            }
          }
          return response;
        })
        .catch((error) => {
          throw error;
        })
    );
  }

  // Cache thermostat status responses
  if (url.pathname === '/api/netatmo/status' && event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          if (response.ok) {
            const clone = response.clone();
            try {
              const data = await clone.json();
              await cacheDeviceState('thermostat', data);
            } catch {
              // Ignore parsing errors
            }
          }
          return response;
        })
        .catch((error) => {
          throw error;
        })
    );
  }
});

// ============================================
// Enhanced Push Handler with Badge
// ============================================

// Update push handler to also increment badge
const originalPushHandler = self.addEventListener;
self.addEventListener('push', async (event) => {
  // Increment badge on new notification
  event.waitUntil(incrementBadge());
});

// ============================================
// Message Handler for Client Communication
// ============================================

self.addEventListener('message', async (event) => {
  const { type, data } = event.data || {};

  switch (type) {
    case 'CLEAR_BADGE':
      await saveBadgeCount(0);
      await updateBadge(0);
      break;

    case 'GET_CACHED_STATE':
      try {
        const db = await openDB();
        const transaction = db.transaction('deviceState', 'readonly');
        const store = transaction.objectStore('deviceState');
        const request = store.get(data?.deviceId);
        request.onsuccess = () => {
          event.ports[0]?.postMessage({
            success: true,
            data: request.result,
          });
        };
      } catch (error) {
        event.ports[0]?.postMessage({
          success: false,
          error: String(error),
        });
      }
      break;

    case 'PROCESS_QUEUE':
      await processCommandQueue();
      break;

    default:
  }
});

// ============================================
// Periodic Background Sync (v1.62.0+)
// ============================================

const PERIODIC_SYNC_TAG = 'check-stove-status';

/**
 * Periodic Background Sync event handler
 * Triggered at intervals to check stove status even with app closed
 * Note: Only supported in Chrome/Edge
 */
self.addEventListener('periodicsync', (event: any) => {

  if (event.tag === PERIODIC_SYNC_TAG) {
    event.waitUntil(checkStoveStatusBackground());
  }
});

/**
 * Check stove status in background
 * Sends notification if there's an issue
 */
async function checkStoveStatusBackground(): Promise<void> {

  try {
    const response = await fetch('/api/stove/status');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Cache the state for offline viewing
    await cacheDeviceState('stove', data);

    // Check for errors or issues that need notification
    if (data.error || data.errorCode) {
      await self.registration.showNotification('Errore Stufa', {
        body: data.errorMessage || `Codice errore: ${data.errorCode}`,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        tag: 'stove-error',
        requireInteraction: true,
        data: { url: '/' },
        vibrate: [200, 100, 200, 100, 200],
        // Add action buttons for quick shutdown
        actions: [
          { action: NOTIFICATION_ACTION_IDS.STOVE_SHUTDOWN, title: 'Spegni stufa' },
          { action: NOTIFICATION_ACTION_IDS.STOVE_VIEW_DETAILS, title: 'Dettagli' },
        ],
      } as NotificationOptions & { vibrate?: number[]; actions?: Array<{ action: string; title: string }> });

      await incrementBadge();
    }

    // Check maintenance needs
    if (data.maintenance?.needsCleaning) {
      await self.registration.showNotification('Manutenzione Richiesta', {
        body: 'La stufa necessita pulizia del braciere',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        tag: 'maintenance-alert',
        data: { url: '/maintenance' },
      });

      await incrementBadge();
    }

  } catch (error) {
    console.error('[sw.ts] Background status check failed:', error);
  }
}

// ============================================
// Enhanced Message Handler
// ============================================

// Extend message handler for periodic sync registration
self.addEventListener('message', async (event) => {
  const { type, data } = event.data || {};

  switch (type) {
    case 'REGISTER_PERIODIC_SYNC':
      try {
        if ('periodicSync' in self.registration) {
          await (self.registration as any).periodicSync.register(PERIODIC_SYNC_TAG, {
            minInterval: data?.interval || 15 * 60 * 1000, // Default 15 minutes
          });
          event.ports[0]?.postMessage({ success: true });
        } else {
          event.ports[0]?.postMessage({
            success: false,
            error: 'Periodic Sync not supported',
          });
        }
      } catch (error) {
        event.ports[0]?.postMessage({
          success: false,
          error: String(error),
        });
      }
      break;

    case 'UNREGISTER_PERIODIC_SYNC':
      try {
        if ('periodicSync' in self.registration) {
          await (self.registration as any).periodicSync.unregister(PERIODIC_SYNC_TAG);
          event.ports[0]?.postMessage({ success: true });
        }
      } catch (error) {
        event.ports[0]?.postMessage({
          success: false,
          error: String(error),
        });
      }
      break;

    case 'GET_PERIODIC_SYNC_STATUS':
      try {
        if ('periodicSync' in self.registration) {
          const tags = await (self.registration as any).periodicSync.getTags();
          event.ports[0]?.postMessage({
            success: true,
            registered: tags.includes(PERIODIC_SYNC_TAG),
            tags,
          });
        } else {
          event.ports[0]?.postMessage({
            success: false,
            supported: false,
          });
        }
      } catch (error) {
        event.ports[0]?.postMessage({
          success: false,
          error: String(error),
        });
      }
      break;

    // Keep other cases handled by the original handler
  }
});

// ============================================
// Service Worker Lifecycle
// ============================================

