import { test as base } from '@playwright/test';

/**
 * Notification Permission Fixture
 *
 * Grants notification permissions and mocks Push API to prevent
 * real FCM calls during E2E tests.
 *
 * Usage:
 *   import { test } from '../fixtures/notifications';
 *   test('my test', async ({ notificationContext }) => { ... });
 */

type NotificationFixtures = {
  notificationContext: any;
};

export const test = base.extend<NotificationFixtures>({
  notificationContext: async ({ context, page }, use) => {
    // Grant notification permissions
    await context.grantPermissions(['notifications']);

    // Mock Push API to prevent real FCM calls
    await page.addInitScript(() => {
      // Override PushManager.subscribe with mock implementation
      class MockPushManager {
        async subscribe() {
          return {
            endpoint: 'https://fcm.googleapis.com/fcm/send/mock-endpoint-test',
            toJSON: () => ({
              endpoint: 'https://fcm.googleapis.com/fcm/send/mock-endpoint-test',
              keys: {
                auth: 'mock-auth-key-e2e-test',
                p256dh: 'mock-p256dh-key-e2e-test',
              },
            }),
          };
        }

        async getSubscription() {
          return null;
        }

        async unsubscribe() {
          return true;
        }
      }

      // Replace PushManager
      if ('serviceWorker' in navigator) {
        Object.defineProperty(ServiceWorkerRegistration.prototype, 'pushManager', {
          get: () => new MockPushManager(),
        });
      }
    });

    await use({ context, page });
  },
});

export { expect } from '@playwright/test';
