/**
 * IndexedDB Utility for PWA
 *
 * Provides a simple Promise-based wrapper around IndexedDB
 * for storing offline data like command queues, cached device states, etc.
 *
 * Database: pannello-stufa-pwa
 * Stores:
 * - commandQueue: Queued commands for background sync
 * - deviceState: Cached device states for offline viewing
 * - appState: General app state (badge count, etc.)
 */

const DB_NAME = 'pannello-stufa-pwa';
const DB_VERSION = 1;

// Store names
export const STORES = {
  COMMAND_QUEUE: 'commandQueue',
  DEVICE_STATE: 'deviceState',
  APP_STATE: 'appState',
} as const;

let dbInstance: IDBDatabase | null = null;

/**
 * Open or get existing database connection
 * @returns {Promise<IDBDatabase>}
 */
export async function openDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[IndexedDB] Error opening database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;

      // Handle connection close
      dbInstance.onclose = () => {
        dbInstance = null;
      };

      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Command queue store - for background sync
      if (!db.objectStoreNames.contains(STORES.COMMAND_QUEUE)) {
        const commandStore = db.createObjectStore(STORES.COMMAND_QUEUE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        commandStore.createIndex('status', 'status', { unique: false });
        commandStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Device state store - for offline viewing
      if (!db.objectStoreNames.contains(STORES.DEVICE_STATE)) {
        db.createObjectStore(STORES.DEVICE_STATE, { keyPath: 'deviceId' });
      }

      // App state store - for general app state
      if (!db.objectStoreNames.contains(STORES.APP_STATE)) {
        db.createObjectStore(STORES.APP_STATE, { keyPath: 'key' });
      }

      console.log('[IndexedDB] Database upgraded to version', DB_VERSION);
    };
  });
}

/**
 * Get a value from a store
 * @param {string} storeName - Store name
 * @param {string|number} key - Key to retrieve
 * @returns {Promise<any>}
 */
export async function get<T = unknown>(storeName: string, key: string | number): Promise<T | undefined> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all values from a store
 * @param {string} storeName - Store name
 * @returns {Promise<any[]>}
 */
export async function getAll<T = unknown>(storeName: string): Promise<T[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve((request.result || []) as T[]);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get values from a store by index
 * @param {string} storeName - Store name
 * @param {string} indexName - Index name
 * @param {any} value - Value to match
 * @returns {Promise<any[]>}
 */
export async function getByIndex<T = unknown>(storeName: string, indexName: string, value: IDBValidKey): Promise<T[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    request.onsuccess = () => resolve((request.result || []) as T[]);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Put a value into a store (add or update)
 * @param {string} storeName - Store name
 * @param {any} value - Value to store
 * @returns {Promise<any>} The key of the stored value
 */
export async function put<T = unknown>(storeName: string, value: T): Promise<IDBValidKey> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(value);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Add a value to a store (fails if key exists)
 * @param {string} storeName - Store name
 * @param {any} value - Value to store
 * @returns {Promise<any>} The key of the stored value
 */
export async function add<T = unknown>(storeName: string, value: T): Promise<IDBValidKey> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(value);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete a value from a store
 * @param {string} storeName - Store name
 * @param {string|number} key - Key to delete
 * @returns {Promise<void>}
 */
export async function remove(storeName: string, key: string | number): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all values from a store
 * @param {string} storeName - Store name
 * @returns {Promise<void>}
 */
export async function clear(storeName: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Count items in a store
 * @param {string} storeName - Store name
 * @returns {Promise<number>}
 */
export async function count(storeName: string): Promise<number> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Check if IndexedDB is supported
 * @returns {boolean}
 */
export function isSupported(): boolean {
  return typeof indexedDB !== 'undefined';
}

export default {
  openDB,
  get,
  getAll,
  getByIndex,
  put,
  add,
  remove,
  clear,
  count,
  isSupported,
  STORES,
};
