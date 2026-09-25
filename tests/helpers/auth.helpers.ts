import { Page } from '@playwright/test';

/**
 * Reusable Auth Helpers for E2E Tests
 *
 * First-party login (roadmap Fase 8): email/password form on /auth/login backed
 * by the users table on the Pi. Use the internal `test` account
 * (E2E_TEST_USER_EMAIL / E2E_TEST_USER_PASSWORD in .env.local).
 */

/**
 * Sign in through the /auth/login form.
 *
 * @param page - Playwright page instance
 * @param email - account email
 * @param password - account password
 */
export async function signIn(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Accedi' }).click();

  // Any app page other than the login screen = success
  await page.waitForURL((url) => !url.pathname.startsWith('/auth/'));
}

/**
 * Sign out and verify redirect to login
 *
 * @param page - Playwright page instance
 */
export async function signOut(page: Page): Promise<void> {
  await page.goto('/auth/logout');
  await page.waitForURL(/.*auth\/login.*/);
}
