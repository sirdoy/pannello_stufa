import { test as base, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { signIn } from './helpers/auth.helpers';
import { TEST_USER } from './helpers/test-context';

/**
 * Shared Playwright fixtures — import `test` / `expect` from here, not from '@playwright/test'.
 *
 * Login session per worker (M39). The backend rotates the refresh token on every refresh and
 * revokes the whole session when an old one is reused (access token TTL 15 min). A single
 * storageState shared by every test breaks as soon as the run outlives the access token:
 * the first test that refreshes rotates the token, the next contexts replay the stale
 * cookie and the session is revoked (401 on every backend call). So each worker signs in
 * once and, after each test that used its session, saves the cookie back, keeping the
 * rotated refresh token for the next test of the same worker.
 */
type WorkerFixtures = { workerStorageState: string };

export const test = base.extend<object, WorkerFixtures>({
  storageState: ({ workerStorageState }, provide) => provide(workerStorageState),

  workerStorageState: [
    async ({ browser }, provide, workerInfo) => {
      const file = path.resolve(workerInfo.project.outputDir, `.auth/worker-${workerInfo.parallelIndex}.json`);
      mkdirSync(path.dirname(file), { recursive: true });

      const { baseURL, serviceWorkers } = workerInfo.project.use;
      const context = await browser.newContext({ baseURL, serviceWorkers });
      const page = await context.newPage();
      await signIn(page, TEST_USER.email, TEST_USER.password);
      await context.storageState({ path: file });
      await context.close();
      await provide(file);
    },
    { scope: 'worker', timeout: 60_000 },
  ],

  context: async ({ context, storageState, workerStorageState }, provide) => {
    await provide(context);
    // Tests that override storageState (logged-out flows) must not touch the worker session.
    if (storageState === workerStorageState) {
      await context.storageState({ path: workerStorageState });
    }
  },
});

export { expect };
