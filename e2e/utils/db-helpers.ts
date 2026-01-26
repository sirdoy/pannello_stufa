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
export async function clearIndexedDB(page: Page, dbName: string = 'DeviceRegistry'): Promise<void> {
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
      // Import Dexie database
      const { db } = await import('/lib/db.js');

      // Get the first device (or last device)
      const device = await db.devices.orderBy('id').last();

      return device?.fcmToken || null;
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
      const { db } = await import('/lib/db.js');
      const device = await db.devices.orderBy('id').last();
      return device?.deviceId || null;
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
 * Get all devices from IndexedDB
 */
export async function getAllDevices(page: Page): Promise<any[]> {
  return await page.evaluate(async () => {
    try {
      const { db } = await import('/lib/db.js');
      return await db.devices.toArray();
    } catch (error) {
      console.error('Error reading all devices from IndexedDB:', error);
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
