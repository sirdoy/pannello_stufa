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

// Badging API augmentation
declare global {
  interface Navigator {
    setAppBadge?(count?: number): Promise<void>;
    clearAppBadge?(): Promise<void>;
  }
}

// Periodic Background Sync API augmentation
declare global {
  interface PeriodicSyncManager {
    register(tag: string, options?: { minInterval: number }): Promise<void>;
    unregister(tag: string): Promise<void>;
    getTags(): Promise<string[]>;
  }
  interface ServiceWorkerRegistration {
    readonly periodicSync?: PeriodicSyncManager;
  }
  interface PeriodicSyncEvent extends ExtendableEvent {
    readonly tag: string;
  }
  interface ServiceWorkerGlobalScopeEventMap {
    periodicsync: PeriodicSyncEvent;
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
 * Push event handler (standard Web Push sent by the Pi, ROADMAP M48).
 * Payload: { title, body, url, tag, priority, event, ts } (../docs/api/notifications.md).
 * Works whatever the login state: the subscription belongs to the browser, not to the session.
 */
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  let payload: PushPayloadIn;
  try {
    payload = event.data.json() as PushPayloadIn;
  } catch {
    payload = { body: event.data.text() };
  }

  const notification = buildNotification(payload);
  event.waitUntil(Promise.all([
    self.registration.showNotification(notification.title, notification.options),
    incrementBadge(),
  ]));
});

/** Subscription renewed or expired by the browser: register the new one (no session needed). */
self.addEventListener('pushsubscriptionchange', (event) => {
  const change = event as PushSubscriptionChangeEventLike;
  change.waitUntil(renewSubscription(change.oldSubscription ?? null, change.newSubscription ?? null));
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

    await new Promise<void>((resolve, reject) => {
      const addReq = store.add(command);
      addReq.onerror = () => reject(addReq.error);
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
    case 'v1/thermorossi/commands/shutdown':
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

  // If app is already open, prefer a visible tab over a hidden one
  const visible = clientList.find(
    (c) => c.url.includes(self.location.origin) && (c as WindowClient).visibilityState === 'visible'
  );
  const target = visible ?? clientList.find((c) => c.url.includes(self.location.origin));
  if (target && 'focus' in target) {
    await (target as WindowClient).focus();
    if ('navigate' in target) {
      await (target as WindowClient).navigate(url);
    }
    return;
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
    event.waitUntil(executeNotificationAction('v1/thermorossi/commands/shutdown', {
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
self.addEventListener('notificationclose', (_event) => {
});

// ============================================
// Web Push helpers (ROADMAP M48)
// ============================================

/** Pi payload, plus the legacy FCM shape ({ notification, data }) still queued on push services. */
interface PushPayloadIn {
  title?: string;
  body?: string;
  url?: string;
  tag?: string;
  priority?: string;
  event?: string;
  notification?: { title?: string; body?: string; icon?: string };
  data?: Record<string, string>;
}

interface PushSubscriptionChangeEventLike extends ExtendableEvent {
  readonly oldSubscription?: PushSubscription | null;
  readonly newSubscription?: PushSubscription | null;
}

function buildNotification(payload: PushPayloadIn): {
  title: string;
  options: NotificationOptions & { vibrate?: number[] };
} {
  const priority = payload.priority ?? payload.data?.priority;
  const url = payload.url ?? payload.data?.url ?? '/';
  return {
    title: payload.title ?? payload.notification?.title ?? 'Pannello Stufa',
    options: {
      body: payload.body ?? payload.notification?.body ?? '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      tag: payload.tag ?? payload.data?.type ?? 'default',
      requireInteraction: priority === 'high',
      data: { url, event: payload.event ?? payload.data?.type ?? 'unknown' },
      vibrate: priority === 'high' ? [200, 100, 200] : [100],
    },
  };
}

// Written by lib/push/pushClient.ts after each registration
const PUSH_META_CACHE = 'push-meta';
const PUSH_META_URL = '/__push-meta/endpoint';

async function storedEndpoint(): Promise<string | null> {
  try {
    const res = await (await caches.open(PUSH_META_CACHE)).match(PUSH_META_URL);
    return res ? await res.text() : null;
  } catch {
    return null;
  }
}

async function renewSubscription(
  oldSub: PushSubscription | null,
  newSub: PushSubscription | null
): Promise<void> {
  const oldEndpoint = oldSub?.endpoint ?? (await storedEndpoint());
  if (!oldEndpoint) return; // the page re-registers at the next app start (syncPush)
  let sub = newSub;
  if (!sub) {
    const key = oldSub?.options.applicationServerKey;
    if (!key) return;
    sub = await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  }
  const json = sub.toJSON();
  const res = await fetch('/api/v1/notifications/subscriptions/rotate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ old_endpoint: oldEndpoint, subscription: { endpoint: json.endpoint, keys: json.keys } }),
  });
  if (res.ok && json.endpoint) {
    await (await caches.open(PUSH_META_CACHE)).put(PUSH_META_URL, new Response(json.endpoint));
  }
}

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
 * Command queued in IndexedDB by lib/pwa/backgroundSync.ts
 */
interface QueuedSwCommand {
  id: number;
  endpoint: string;
  method?: string;
  data?: Record<string, unknown>;
  status?: string;
  timestamp?: string;
  retries?: number;
  lastError?: string | null;
}

/**
 * Get pending commands from IndexedDB
 */
async function getPendingCommands(): Promise<QueuedSwCommand[]> {
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
async function executeCommand(command: QueuedSwCommand): Promise<void> {
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
      await navigator.setAppBadge?.(count);
    } else {
      await navigator.clearAppBadge?.();
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
  state: unknown
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
  if (url.pathname === '/api/v1/thermorossi/status' && event.request.method === 'GET') {
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

  // Netatmo status caching removed — legacy path never existed (no v1 equivalent).
  // If thermostat offline caching is reintroduced, target the canonical /api/v1/netatmo/homestatus path.
});

// ============================================
// Message Handler for Client Communication
// ============================================

self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};
  event.waitUntil((async () => {
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
          await new Promise<void>((resolve) => {
            const request = store.get(data?.deviceId);
            request.onsuccess = () => {
              event.ports[0]?.postMessage({
                success: true,
                data: request.result,
              });
              resolve();
            };
            request.onerror = () => {
              event.ports[0]?.postMessage({
                success: false,
                error: String(request.error),
              });
              resolve();
            };
          });
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

      case 'REGISTER_PERIODIC_SYNC':
        try {
          if ('periodicSync' in self.registration) {
            await self.registration.periodicSync?.register(PERIODIC_SYNC_TAG, {
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
            await self.registration.periodicSync?.unregister(PERIODIC_SYNC_TAG);
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
            const tags = await self.registration.periodicSync?.getTags() ?? [];
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

      default:
        // Unknown message type - no-op
    }
  })());
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
self.addEventListener('periodicsync', (event: PeriodicSyncEvent) => {

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
    const response = await fetch('/api/v1/thermorossi/status');
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
// Service Worker Lifecycle
// ============================================

