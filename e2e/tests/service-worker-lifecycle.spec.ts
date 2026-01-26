import { test, expect } from '@playwright/test';

/**
 * Service Worker Lifecycle Tests
 *
 * Verifies service worker registration, activation, and persistence.
 * Critical for PWA functionality and push notification handling.
 */

test.describe('Service Worker Lifecycle', () => {
  test('service worker registers on first visit', async ({ page, context }) => {
    await context.grantPermissions(['notifications']);

    await page.goto('/');

    // Wait for SW registration
    const swRegistered = await page.waitForFunction(
      () => navigator.serviceWorker.ready.then(() => true),
      { timeout: 30000 }
    );

    expect(swRegistered).toBeTruthy();

    // Check SW state
    const swState = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.ready;
      return {
        scope: reg.scope,
        active: !!reg.active,
        installing: !!reg.installing,
        waiting: !!reg.waiting,
        scriptURL: reg.active?.scriptURL || null
      };
    });

    expect(swState.scope).toContain('/');
    expect(swState.active).toBe(true);
    expect(swState.scriptURL).toBeTruthy();

    console.log('Service Worker registered:', swState.scriptURL);
  });

  test('service worker handles messages', async ({ page, context }) => {
    await context.grantPermissions(['notifications']);

    await page.goto('/');

    // Wait for SW ready
    await page.waitForFunction(
      () => navigator.serviceWorker.ready.then(() => true),
      { timeout: 30000 }
    );

    // Verify SW can receive messages
    const canPostMessage = await page.evaluate(() => {
      return navigator.serviceWorker.controller !== null;
    });

    expect(canPostMessage).toBe(true);

    // Post a test message (SW may or may not respond, but shouldn't crash)
    const messageResult = await page.evaluate(() => {
      return new Promise((resolve) => {
        try {
          navigator.serviceWorker.controller?.postMessage({
            type: 'TEST_MESSAGE',
            payload: 'e2e-test'
          });
          // Give SW time to process (no response expected)
          setTimeout(() => resolve('sent'), 500);
        } catch (error) {
          resolve('error');
        }
      });
    });

    // Message should send without errors
    expect(messageResult).toBe('sent');
  });

  test('service worker persists across page refresh', async ({ page, context }) => {
    await context.grantPermissions(['notifications']);

    await page.goto('/');
    await page.waitForFunction(
      () => navigator.serviceWorker.ready.then(() => true),
      { timeout: 30000 }
    );

    // Get initial SW
    const sw1 = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.ready;
      return {
        scriptURL: reg.active?.scriptURL,
        state: reg.active?.state
      };
    });

    expect(sw1.scriptURL).toBeTruthy();
    expect(sw1.state).toBe('activated');

    console.log('SW before refresh:', sw1.scriptURL);

    // Refresh page
    await page.reload();
    await page.waitForFunction(
      () => navigator.serviceWorker.ready.then(() => true),
      { timeout: 30000 }
    );

    // SW should still be the same
    const sw2 = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.ready;
      return {
        scriptURL: reg.active?.scriptURL,
        state: reg.active?.state
      };
    });

    console.log('SW after refresh:', sw2.scriptURL);

    expect(sw2.scriptURL).toBe(sw1.scriptURL);
    expect(sw2.state).toBe('activated');
  });

  test('service worker scope covers entire app', async ({ page, context }) => {
    await context.grantPermissions(['notifications']);

    await page.goto('/');
    await page.waitForFunction(
      () => navigator.serviceWorker.ready.then(() => true),
      { timeout: 30000 }
    );

    // Check that SW controls the page
    const controlled = await page.evaluate(() =>
      navigator.serviceWorker.controller !== null
    );

    expect(controlled).toBe(true);

    // Navigate to different routes and verify SW control
    const routes = ['/settings', '/settings/notifications', '/debug'];

    for (const route of routes) {
      await page.goto(route);

      // Wait a bit for page to load
      await page.waitForTimeout(500);

      const stillControlled = await page.evaluate(() =>
        navigator.serviceWorker.controller !== null
      );

      console.log(`Route ${route}: controlled = ${stillControlled}`);
      expect(stillControlled).toBe(true);
    }
  });

  test('service worker registration details', async ({ page, context }) => {
    await context.grantPermissions(['notifications']);

    await page.goto('/');
    await page.waitForFunction(
      () => navigator.serviceWorker.ready.then(() => true),
      { timeout: 30000 }
    );

    // Get detailed registration info
    const registrationInfo = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.ready;

      return {
        scope: reg.scope,
        updateViaCache: reg.updateViaCache,
        active: {
          state: reg.active?.state,
          scriptURL: reg.active?.scriptURL
        },
        installing: reg.installing ? {
          state: reg.installing.state
        } : null,
        waiting: reg.waiting ? {
          state: reg.waiting.state
        } : null
      };
    });

    console.log('Registration details:', JSON.stringify(registrationInfo, null, 2));

    // Verify registration is valid
    expect(registrationInfo.scope).toBeTruthy();
    expect(registrationInfo.active.state).toBe('activated');
    expect(registrationInfo.active.scriptURL).toContain('sw.js');

    // Should not have installing or waiting SWs in normal operation
    expect(registrationInfo.installing).toBeNull();
    expect(registrationInfo.waiting).toBeNull();
  });

  test('service worker available check', async ({ page, context }) => {
    await context.grantPermissions(['notifications']);

    // Check before page load
    const swSupported = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });

    expect(swSupported).toBe(true);

    await page.goto('/');

    // Check after page load
    const swReady = await page.evaluate(() => {
      return navigator.serviceWorker.ready.then(() => true).catch(() => false);
    });

    expect(swReady).toBeTruthy();
  });
});
