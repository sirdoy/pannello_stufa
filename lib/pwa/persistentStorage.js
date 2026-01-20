/**
 * Persistent Storage Service
 *
 * Requests persistent storage to prevent browser from clearing IndexedDB data.
 * Important for maintaining command queue and device state cache.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/StorageManager
 */

/**
 * Check if Storage API is supported
 * @returns {boolean}
 */
export function isStorageSupported() {
  return 'storage' in navigator && 'persist' in navigator.storage;
}

/**
 * Check if storage is already persisted
 * @returns {Promise<boolean>}
 */
export async function isPersisted() {
  if (!isStorageSupported()) {
    return false;
  }

  try {
    return await navigator.storage.persisted();
  } catch (error) {
    console.error('[PersistentStorage] Error checking persisted:', error);
    return false;
  }
}

/**
 * Request persistent storage
 * @returns {Promise<boolean>} True if granted
 */
export async function requestPersistentStorage() {
  if (!isStorageSupported()) {
    console.warn('[PersistentStorage] API not supported');
    return false;
  }

  try {
    // Check if already persisted
    const alreadyPersisted = await navigator.storage.persisted();
    if (alreadyPersisted) {
      console.log('[PersistentStorage] Already persisted');
      return true;
    }

    // Request persistence
    const granted = await navigator.storage.persist();
    console.log('[PersistentStorage] Request result:', granted);
    return granted;
  } catch (error) {
    console.error('[PersistentStorage] Error requesting:', error);
    return false;
  }
}

/**
 * Get storage estimate (used and quota)
 * @returns {Promise<Object>} Storage estimate
 */
export async function getStorageEstimate() {
  if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
    return { supported: false };
  }

  try {
    const estimate = await navigator.storage.estimate();
    return {
      supported: true,
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
      usagePercent: estimate.quota ? ((estimate.usage / estimate.quota) * 100).toFixed(2) : 0,
      usageFormatted: formatBytes(estimate.usage || 0),
      quotaFormatted: formatBytes(estimate.quota || 0),
    };
  } catch (error) {
    console.error('[PersistentStorage] Error getting estimate:', error);
    return { supported: true, error: error.message };
  }
}

/**
 * Format bytes to human readable string
 * @param {number} bytes - Bytes to format
 * @returns {string} Formatted string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get detailed storage breakdown (if available)
 * @returns {Promise<Object>}
 */
export async function getStorageDetails() {
  const estimate = await getStorageEstimate();
  const persisted = await isPersisted();

  return {
    ...estimate,
    persisted,
    isSupported: isStorageSupported(),
  };
}

export default {
  isSupported: isStorageSupported,
  isPersisted,
  request: requestPersistentStorage,
  getEstimate: getStorageEstimate,
  getDetails: getStorageDetails,
};
