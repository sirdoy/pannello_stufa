import { test as base } from '@playwright/test';

/**
 * Authenticated Test Fixture
 *
 * Extends base Playwright test with pre-authenticated browser context.
 *
 * Usage:
 *   import { test } from '../fixtures/authenticated';
 *   test('my test', async ({ page }) => { ... });
 *
 * For Phase 5, this fixture will handle Auth0 authentication flow.
 * Currently provides a standard authenticated page for E2E tests.
 */

type AuthenticatedFixtures = {
  authenticatedPage: any;
};

export const test = base.extend<AuthenticatedFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Setup: Navigate to app and authenticate
    // For now, navigate to home page
    // Future enhancement: Add Auth0 mock or test user login
    await page.goto('/');

    // Use the page
    await use(page);

    // Teardown happens automatically
  },
});

export { expect } from '@playwright/test';
