import { test, expect } from '@playwright/test';
import { signIn, signOut } from '../helpers/auth.helpers';
import { TEST_USER } from '../helpers/test-context';

test.describe('Authentication Flows', () => {
  // Clear auth state - these tests verify the actual auth flow
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should complete signin flow via Auth0', async ({ page }) => {
    await signIn(page, TEST_USER.email, TEST_USER.password);

    // After successful login, user should be on the home page
    await expect(page).toHaveURL(/localhost:3000\/?$/);

    // Dashboard should be visible (proves authenticated state)
    await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible();
  });

  test('should redirect unauthenticated user to login', async ({ page }) => {
    // Try to access protected page without auth
    await page.goto('/');

    // Should redirect to Auth0 login
    await expect(page).toHaveURL(/auth\/login|auth0/);
  });

  test('should complete signout flow', async ({ page }) => {
    // First sign in
    await signIn(page, TEST_USER.email, TEST_USER.password);

    // Then sign out
    await signOut(page);

    // Should be redirected to login page
    await expect(page).toHaveURL(/auth\/login/);
  });
});
