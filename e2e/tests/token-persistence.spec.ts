import { test, expect, Browser } from '@playwright/test';

/**
 * Token Persistence Tests
 *
 * CRITICAL: Verifies FCM tokens persist after browser restart
 * Per ROADMAP.md Success Criteria #2
 */

test.describe('Token Persistence', () => {
  test('FCM token persists after browser restart', async ({ browser }) => {
    // Session 1: Load app and capture token
    const context1 = await browser.newContext({
      permissions: ['notifications']
    });
    const page1 = await context1.newPage();

    await page1.goto('/');

    // Wait for service worker to be ready
    await page1.waitForFunction(
      () => navigator.serviceWorker.ready.then(() => true),
      { timeout: 30000 }
    );

    // Get token from IndexedDB (fcmTokenDB database)
    const token1 = await page1.evaluate(async () => {
      try {
        // Access fcmTokenDB database directly
        const dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open('fcmTokenDB');
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });

        const db = await dbPromise;

        return new Promise<string | null>((resolve, reject) => {
          const tx = db.transaction('tokens', 'readonly');
          const store = tx.objectStore('tokens');
          const getRequest = store.get('current');

          getRequest.onsuccess = () => {
            const record = getRequest.result;
            resolve(record?.token || null);
          };
          getRequest.onerror = () => reject(getRequest.error);
        });
      } catch (error) {
        console.error('Error reading from IndexedDB:', error);
        return null;
      }
    });

    // Token should exist after initial load
    expect(token1).toBeTruthy();
    console.log('Session 1 token:', token1?.substring(0, 20) + '...');

    // Save storage state (includes IndexedDB and localStorage)
    const storageState = await context1.storageState();
    await context1.close();

    // Session 2: Simulate browser restart with persisted storage
    const context2 = await browser.newContext({
      storageState,
      permissions: ['notifications']
    });
    const page2 = await context2.newPage();

    await page2.goto('/');

    // Get token again - should be the same
    const token2 = await page2.evaluate(async () => {
      try {
        const dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open('fcmTokenDB');
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });

        const db = await dbPromise;

        return new Promise<string | null>((resolve, reject) => {
          const tx = db.transaction('tokens', 'readonly');
          const store = tx.objectStore('tokens');
          const getRequest = store.get('current');

          getRequest.onsuccess = () => {
            const record = getRequest.result;
            resolve(record?.token || null);
          };
          getRequest.onerror = () => reject(getRequest.error);
        });
      } catch (error) {
        console.error('Error reading from IndexedDB:', error);
        return null;
      }
    });

    console.log('Session 2 token:', token2?.substring(0, 20) + '...');

    // CRITICAL ASSERTION: Token persists across restart
    expect(token2).toBe(token1);

    // Verify service worker is still active
    const swActive = await page2.evaluate(() =>
      navigator.serviceWorker.controller !== null
    );
    expect(swActive).toBe(true);

    await context2.close();
  });

  test('token survives multiple page navigations', async ({ page, context }) => {
    await context.grantPermissions(['notifications']);

    // Load home page
    await page.goto('/');
    await page.waitForFunction(
      () => navigator.serviceWorker.ready.then(() => true),
      { timeout: 30000 }
    );

    // Get initial token
    const getToken = async () => {
      return await page.evaluate(async () => {
        try {
          const dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open('fcmTokenDB');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });

          const db = await dbPromise;

          return new Promise<string | null>((resolve) => {
            const tx = db.transaction('tokens', 'readonly');
            const store = tx.objectStore('tokens');
            const getRequest = store.get('current');

            getRequest.onsuccess = () => {
              const record = getRequest.result;
              resolve(record?.token || null);
            };
            getRequest.onerror = () => resolve(null);
          });
        } catch (error) {
          return null;
        }
      });
    };

    const initialToken = await getToken();
    expect(initialToken).toBeTruthy();

    // Navigate to settings
    await page.goto('/settings/notifications');
    const tokenAfterSettings = await getToken();
    expect(tokenAfterSettings).toBe(initialToken);

    // Navigate to history
    await page.goto('/settings/notifications/history');
    const tokenAfterHistory = await getToken();
    expect(tokenAfterHistory).toBe(initialToken);

    // Navigate back to home
    await page.goto('/');
    const tokenAfterHome = await getToken();
    expect(tokenAfterHome).toBe(initialToken);
  });

  test('token persists in localStorage fallback', async ({ page, context }) => {
    await context.grantPermissions(['notifications']);

    await page.goto('/');
    await page.waitForFunction(
      () => navigator.serviceWorker.ready.then(() => true),
      { timeout: 30000 }
    );

    // Get token from localStorage
    const localStorageToken = await page.evaluate(() => {
      const stored = localStorage.getItem('fcm_token_data');
      if (!stored) return null;

      try {
        const data = JSON.parse(stored);
        return data?.token || null;
      } catch {
        return null;
      }
    });

    // Token should be in localStorage as fallback
    expect(localStorageToken).toBeTruthy();

    // Get token from IndexedDB
    const idbToken = await page.evaluate(async () => {
      try {
        const dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open('fcmTokenDB');
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });

        const db = await dbPromise;

        return new Promise<string | null>((resolve) => {
          const tx = db.transaction('tokens', 'readonly');
          const store = tx.objectStore('tokens');
          const getRequest = store.get('current');

          getRequest.onsuccess = () => {
            resolve(getRequest.result?.token || null);
          };
          getRequest.onerror = () => resolve(null);
        });
      } catch {
        return null;
      }
    });

    // Both should match (dual persistence)
    expect(localStorageToken).toBe(idbToken);
  });
});
