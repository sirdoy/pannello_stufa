import { test as setup } from '@playwright/test';
import { signIn } from './helpers/auth.helpers';
import { TEST_USER, AUTH_FILE } from './helpers/test-context';

/**
 * Playwright Auth Setup
 *
 * Runs ONCE before all feature tests.
 * Authenticates via real Auth0 OAuth flow (not TEST_MODE bypass).
 * Saves session state to tests/.auth/user.json for reuse.
 *
 * This prevents redundant Auth0 logins and rate limiting.
 */
setup('authenticate', async ({ page }) => {
  await signIn(page, TEST_USER.email, TEST_USER.password);
  await page.context().storageState({ path: AUTH_FILE });
});
