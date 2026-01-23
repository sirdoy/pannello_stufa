/**
 * Token Storage - Dual persistence for FCM tokens
 *
 * Uses IndexedDB (primary) + localStorage (fallback) to ensure
 * tokens survive browser restarts, storage pressure, and iOS quirks.
 */

import Dexie from 'dexie';

// Initialize IndexedDB via Dexie
const db = new Dexie('fcmTokenDB');
db.version(1).stores({
  tokens: 'id, token, createdAt, lastUsed, deviceId'
});

const STORAGE_KEY = 'fcm_token_data';
const TOKEN_ID = 'current';

/**
 * Request persistent storage to prevent eviction
 * @returns {Promise<boolean>} true if persistence granted
 */
export async function requestPersistentStorage() {
  if (typeof navigator === 'undefined') return false;

  if (navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      console.log(`[tokenStorage] Persistent storage: ${isPersisted}`);
      return isPersisted;
    } catch (e) {
      console.warn('[tokenStorage] Could not request persistent storage:', e);
      return false;
    }
  }
  return false;
}

/**
 * Check if storage is persisted
 * @returns {Promise<boolean>}
 */
export async function checkPersistence() {
  if (typeof navigator === 'undefined') return false;

  if (navigator.storage && navigator.storage.persisted) {
    return await navigator.storage.persisted();
  }
  return false;
}

/**
 * Save token to both IndexedDB and localStorage
 * @param {string} token - FCM token
 * @param {Object} metadata - Additional metadata (deviceId, deviceInfo, etc.)
 */
export async function saveToken(token, metadata = {}) {
  if (typeof window === 'undefined') {
    throw new Error('saveToken can only be called in browser');
  }

  const now = new Date().toISOString();
  const tokenData = {
    id: TOKEN_ID,
    token,
    createdAt: metadata.createdAt || now,
    lastUsed: now,
    deviceId: metadata.deviceId || null,
    deviceInfo: metadata.deviceInfo || null,
  };

  // Request persistent storage on first save
  await requestPersistentStorage();

  // Save to IndexedDB (primary)
  try {
    await db.tokens.put(tokenData);
    console.log('[tokenStorage] Saved to IndexedDB');
  } catch (e) {
    console.error('[tokenStorage] IndexedDB save failed:', e);
  }

  // Save to localStorage (fallback)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokenData));
    console.log('[tokenStorage] Saved to localStorage');
  } catch (e) {
    console.error('[tokenStorage] localStorage save failed:', e);
  }
}

/**
 * Load token from storage (IndexedDB first, localStorage fallback)
 * @returns {Promise<Object|null>} Token data or null if not found
 */
export async function loadToken() {
  if (typeof window === 'undefined') return null;

  // Try IndexedDB first
  try {
    const record = await db.tokens.get(TOKEN_ID);
    if (record?.token) {
      console.log('[tokenStorage] Loaded from IndexedDB');
      return record;
    }
  } catch (e) {
    console.warn('[tokenStorage] IndexedDB load failed:', e);
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (data?.token) {
        console.log('[tokenStorage] Loaded from localStorage (fallback)');
        // Sync back to IndexedDB if it was missing
        try {
          await db.tokens.put({ ...data, id: TOKEN_ID });
        } catch (syncError) {
          console.warn('[tokenStorage] Could not sync to IndexedDB:', syncError);
        }
        return data;
      }
    }
  } catch (e) {
    console.warn('[tokenStorage] localStorage load failed:', e);
  }

  return null;
}

/**
 * Update lastUsed timestamp for existing token
 */
export async function updateLastUsed() {
  if (typeof window === 'undefined') return;

  const now = new Date().toISOString();

  // Update IndexedDB
  try {
    await db.tokens.update(TOKEN_ID, { lastUsed: now });
  } catch (e) {
    console.warn('[tokenStorage] IndexedDB update failed:', e);
  }

  // Update localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      data.lastUsed = now;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (e) {
    console.warn('[tokenStorage] localStorage update failed:', e);
  }
}

/**
 * Clear token from all storage
 */
export async function clearToken() {
  if (typeof window === 'undefined') return;

  // Clear IndexedDB
  try {
    await db.tokens.delete(TOKEN_ID);
    console.log('[tokenStorage] Cleared from IndexedDB');
  } catch (e) {
    console.warn('[tokenStorage] IndexedDB clear failed:', e);
  }

  // Clear localStorage
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[tokenStorage] Cleared from localStorage');
  } catch (e) {
    console.warn('[tokenStorage] localStorage clear failed:', e);
  }
}

/**
 * Get token age in days
 * @returns {Promise<number|null>} Age in days or null if no token
 */
export async function getTokenAge() {
  const data = await loadToken();
  if (!data?.createdAt) return null;

  const created = new Date(data.createdAt).getTime();
  const now = Date.now();
  return (now - created) / (1000 * 60 * 60 * 24);
}

/**
 * Check storage health for debugging
 * @returns {Promise<Object>} Storage status
 */
export async function getStorageStatus() {
  if (typeof window === 'undefined') {
    return { available: false, reason: 'SSR' };
  }

  const status = {
    indexedDB: false,
    localStorage: false,
    persisted: await checkPersistence(),
    token: null,
  };

  try {
    const idbRecord = await db.tokens.get(TOKEN_ID);
    status.indexedDB = !!idbRecord?.token;
    status.token = idbRecord;
  } catch (e) {
    status.indexedDBError = e.message;
  }

  try {
    const lsData = localStorage.getItem(STORAGE_KEY);
    status.localStorage = !!lsData;
  } catch (e) {
    status.localStorageError = e.message;
  }

  return status;
}
