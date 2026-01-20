/**
 * Periodic Background Sync Service
 *
 * Registers periodic sync to check stove status even with app closed.
 * Only supported in Chrome/Edge.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Periodic_Background_Sync_API
 */

const PERIODIC_SYNC_TAG = 'check-stove-status';
const DEFAULT_INTERVAL = 15 * 60 * 1000; // 15 minutes

/**
 * Check if Periodic Background Sync is supported
 * @returns {boolean}
 */
export function isPeriodicSyncSupported() {
  return 'serviceWorker' in navigator && 'periodicSync' in ServiceWorkerRegistration.prototype;
}

/**
 * Check permission status for periodic sync
 * @returns {Promise<string>} 'granted', 'denied', or 'prompt'
 */
export async function checkPeriodicSyncPermission() {
  if (!isPeriodicSyncSupported()) {
    return 'not-supported';
  }

  try {
    const status = await navigator.permissions.query({
      name: 'periodic-background-sync',
    });
    return status.state;
  } catch {
    return 'not-supported';
  }
}

/**
 * Register periodic background sync via Service Worker
 * @param {Object} options - Registration options
 * @param {number} [options.interval] - Minimum interval in ms (default: 15 min)
 * @returns {Promise<boolean>} True if registered successfully
 */
export async function registerPeriodicSync(options = {}) {
  if (!isPeriodicSyncSupported()) {
    console.warn('[PeriodicSync] API not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check permission first
    const permission = await checkPeriodicSyncPermission();
    if (permission !== 'granted') {
      console.warn('[PeriodicSync] Permission not granted:', permission);
      return false;
    }

    // Send message to SW to register
    const result = await sendMessageToSW('REGISTER_PERIODIC_SYNC', {
      interval: options.interval || DEFAULT_INTERVAL,
    });

    if (result.success) {
      console.log('[PeriodicSync] Registered successfully');
      return true;
    } else {
      console.warn('[PeriodicSync] Registration failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('[PeriodicSync] Error registering:', error);
    return false;
  }
}

/**
 * Unregister periodic background sync
 * @returns {Promise<boolean>}
 */
export async function unregisterPeriodicSync() {
  if (!isPeriodicSyncSupported()) {
    return true;
  }

  try {
    const result = await sendMessageToSW('UNREGISTER_PERIODIC_SYNC');
    return result.success;
  } catch (error) {
    console.error('[PeriodicSync] Error unregistering:', error);
    return false;
  }
}

/**
 * Check if periodic sync is currently registered
 * @returns {Promise<Object>} Status object
 */
export async function getPeriodicSyncStatus() {
  if (!isPeriodicSyncSupported()) {
    return {
      supported: false,
      registered: false,
    };
  }

  try {
    const result = await sendMessageToSW('GET_PERIODIC_SYNC_STATUS');
    return {
      supported: true,
      registered: result.registered || false,
      tags: result.tags || [],
    };
  } catch (error) {
    console.error('[PeriodicSync] Error getting status:', error);
    return {
      supported: true,
      registered: false,
      error: error.message,
    };
  }
}

/**
 * Send message to Service Worker and wait for response
 * @param {string} type - Message type
 * @param {any} [data] - Optional data
 * @returns {Promise<any>}
 */
function sendMessageToSW(type, data = null) {
  return new Promise(async (resolve, reject) => {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (!registration.active) {
        reject(new Error('No active service worker'));
        return;
      }

      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      registration.active.postMessage(
        { type, data },
        [messageChannel.port2]
      );

      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error('SW message timeout'));
      }, 5000);
    } catch (error) {
      reject(error);
    }
  });
}

export default {
  isSupported: isPeriodicSyncSupported,
  checkPermission: checkPeriodicSyncPermission,
  register: registerPeriodicSync,
  unregister: unregisterPeriodicSync,
  getStatus: getPeriodicSyncStatus,
};
