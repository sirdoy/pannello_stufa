/**
 * Token Storage - Dual persistence for FCM tokens
 *
 * Uses IndexedDB (primary) + localStorage (fallback) to ensure
 * tokens survive browser restarts, storage pressure, and iOS quirks.
 */

import Dexie from 'dexie';
import type { FCMToken } from '@/types/firebase';

interface TokenStorageRecord {
  id: string;
  token: string;
  createdAt: string;
  lastUsed: string;
  deviceId: string | null;
  deviceInfo: Record<string, unknown> | null;
  platform?: string;
  isPWA?: boolean;
}

// Initialize IndexedDB via Dexie
const db = new Dexie('fcmTokenDB');
db.version(1).stores({
  tokens: 'id, token, createdAt, lastUsed, deviceId'
});

const STORAGE_KEY = 'fcm_token_data';
const TOKEN_ID = 'current';

/**
 * Request persistent storage to prevent eviction
 * @returns true if persistence granted
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;

  if (navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
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
 */
export async function checkPersistence(): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;

  if (navigator.storage && navigator.storage.persisted) {
    return await navigator.storage.persisted();
  }
  return false;
}

/**
 * Save token to both IndexedDB and localStorage
 * @param token - FCM token
 * @param metadata - Additional metadata (deviceId, deviceInfo, etc.)
 */
export async function saveToken(token: string, metadata: Partial<FCMToken> & { deviceInfo?: Record<string, unknown> } = {}): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('saveToken can only be called in browser');
  }

  const now = new Date().toISOString();
  const tokenData: TokenStorageRecord = {
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
    await (db as Dexie & { tokens: Dexie.Table<TokenStorageRecord, string> }).tokens.put(tokenData);
  } catch (e) {
    console.error('[tokenStorage] IndexedDB save failed:', e);
  }

  // Save to localStorage (fallback)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokenData));
  } catch (e) {
    console.error('[tokenStorage] localStorage save failed:', e);
  }
}

/**
 * Load token from storage (IndexedDB first, localStorage fallback)
 * @returns Token data or null if not found
 */
export async function loadToken(): Promise<TokenStorageRecord | null> {
  if (typeof window === 'undefined') return null;

  // Try IndexedDB first
  try {
    const record = await (db as Dexie & { tokens: Dexie.Table<TokenStorageRecord, string> }).tokens.get(TOKEN_ID);
    if (record?.token) {
      return record;
    }
  } catch (e) {
    console.warn('[tokenStorage] IndexedDB load failed:', e);
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as TokenStorageRecord;
      if (data?.token) {
        // Sync back to IndexedDB if it was missing
        try {
          await (db as Dexie & { tokens: Dexie.Table<TokenStorageRecord, string> }).tokens.put({ ...data, id: TOKEN_ID });
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
export async function updateLastUsed(): Promise<void> {
  if (typeof window === 'undefined') return;

  const now = new Date().toISOString();

  // Update IndexedDB
  try {
    await (db as Dexie & { tokens: Dexie.Table<TokenStorageRecord, string> }).tokens.update(TOKEN_ID, { lastUsed: now });
  } catch (e) {
    console.warn('[tokenStorage] IndexedDB update failed:', e);
  }

  // Update localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as TokenStorageRecord;
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
export async function clearToken(): Promise<void> {
  if (typeof window === 'undefined') return;

  // Clear IndexedDB
  try {
    await (db as Dexie & { tokens: Dexie.Table<TokenStorageRecord, string> }).tokens.delete(TOKEN_ID);
  } catch (e) {
    console.warn('[tokenStorage] IndexedDB clear failed:', e);
  }

  // Clear localStorage
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('[tokenStorage] localStorage clear failed:', e);
  }
}

/**
 * Get token age in days
 * @returns Age in days or null if no token
 */
export async function getTokenAge(): Promise<number | null> {
  const data = await loadToken();
  if (!data?.createdAt) return null;

  const created = new Date(data.createdAt).getTime();
  const now = Date.now();
  return (now - created) / (1000 * 60 * 60 * 24);
}

interface StorageStatus {
  available: boolean;
  reason?: string;
  indexedDB?: boolean;
  localStorage?: boolean;
  persisted?: boolean;
  token?: TokenStorageRecord | null;
  indexedDBError?: string;
  localStorageError?: string;
}

/**
 * Check storage health for debugging
 * @returns Storage status
 */
export async function getStorageStatus(): Promise<StorageStatus> {
  if (typeof window === 'undefined') {
    return { available: false, reason: 'SSR' };
  }

  const status: StorageStatus = {
    available: true,
    indexedDB: false,
    localStorage: false,
    persisted: await checkPersistence(),
    token: null,
  };

  try {
    const idbRecord = await (db as Dexie & { tokens: Dexie.Table<TokenStorageRecord, string> }).tokens.get(TOKEN_ID);
    status.indexedDB = !!idbRecord?.token;
    status.token = idbRecord || null;
  } catch (e) {
    status.indexedDBError = (e as Error).message;
  }

  try {
    const lsData = localStorage.getItem(STORAGE_KEY);
    status.localStorage = !!lsData;
  } catch (e) {
    status.localStorageError = (e as Error).message;
  }

  return status;
}
