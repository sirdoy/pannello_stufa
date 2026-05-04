import { test as setup } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { signIn } from './helpers/auth.helpers';
import { TEST_USER, AUTH_FILE } from './helpers/test-context';

/**
 * Playwright Auth Setup
 *
 * Runs ONCE before all feature tests.
 *
 * Two modes:
 *  - BYPASS_AUTH=true (dev default): writes empty storageState. Server returns
 *    MOCK_SESSION via lib/auth0.ts stub, so no real Auth0 round-trip is needed.
 *  - BYPASS_AUTH=false: real Auth0 OAuth flow via signIn(). Saves session state
 *    to tests/.auth/user.json for reuse.
 */
setup('authenticate', async ({ page }) => {
  if (process.env.BYPASS_AUTH === 'true') {
    mkdirSync(dirname(AUTH_FILE), { recursive: true });
    writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  await signIn(page, TEST_USER.email, TEST_USER.password);
  await page.context().storageState({ path: AUTH_FILE });
});
