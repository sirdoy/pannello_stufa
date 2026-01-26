import { Page } from '@playwright/test';

/**
 * IndexedDB Test Helpers
 *
 * Utilities for testing Dexie database persistence in E2E tests.
 * Enables verification of FCM token persistence across browser restarts.
 */

/**
 * Clear IndexedDB database
 */
export async function clearIndexedDB(page: Page, dbName: string = 'fcmTokenDB'): Promise<void> {
  await page.evaluate((name) => {
    return indexedDB.deleteDatabase(name);
  }, dbName);
}

/**
 * Get FCM token from IndexedDB
 */
export async function getTokenFromIndexedDB(page: Page): Promise<string | null> {
  return await page.evaluate(async () => {
    try {
      // Open fcmTokenDB database (as per Plan 05-03 Decision #1)
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('fcmTokenDB');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      // Get current token from 'tokens' object store
      return new Promise<string | null>((resolve) => {
        const tx = db.transaction('tokens', 'readonly');
        const store = tx.objectStore('tokens');
        const getRequest = store.get('current');
        getRequest.onsuccess = () => resolve(getRequest.result?.token || null);
        getRequest.onerror = () => resolve(null);
      });
    } catch (error) {
      console.error('Error reading from IndexedDB:', error);
      return null;
    }
  });
}

/**
 * Get device ID from IndexedDB
 */
export async function getDeviceIdFromIndexedDB(page: Page): Promise<string | null> {
  return await page.evaluate(async () => {
    try {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('fcmTokenDB');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      return new Promise<string | null>((resolve) => {
        const tx = db.transaction('tokens', 'readonly');
        const store = tx.objectStore('tokens');
        const getRequest = store.get('current');
        getRequest.onsuccess = () => resolve(getRequest.result?.deviceId || null);
        getRequest.onerror = () => resolve(null);
      });
    } catch (error) {
      console.error('Error reading device ID from IndexedDB:', error);
      return null;
    }
  });
}

/**
 * Verify token persists after context reload
 *
 * Helper to test token persistence across "browser restarts".
 * Compares token before and after browser context reload.
 */
export async function verifyTokenPersistence(
  page: Page,
  expectedToken: string
): Promise<boolean> {
  const actualToken = await getTokenFromIndexedDB(page);
  return actualToken === expectedToken;
}

/**
 * Get all tokens from IndexedDB
 */
export async function getAllTokens(page: Page): Promise<any[]> {
  return await page.evaluate(async () => {
    try {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('fcmTokenDB');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      return new Promise<any[]>((resolve) => {
        const tx = db.transaction('tokens', 'readonly');
        const store = tx.objectStore('tokens');
        const getAllRequest = store.getAll();
        getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
        getAllRequest.onerror = () => resolve([]);
      });
    } catch (error) {
      console.error('Error reading all tokens from IndexedDB:', error);
      return [];
    }
  });
}

/**
 * Check if service worker is registered
 */
export async function isServiceWorkerRegistered(page: Page): Promise<boolean> {
  return await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      return !!registration;
    } catch (error) {
      return false;
    }
  });
}

/**
 * Wait for service worker to be ready
 */
export async function waitForServiceWorker(page: Page, timeout: number = 10000): Promise<void> {
  await page.waitForFunction(
    () => {
      if (!('serviceWorker' in navigator)) {
        return false;
      }
      return navigator.serviceWorker.ready.then(() => true);
    },
    { timeout }
  );
}
