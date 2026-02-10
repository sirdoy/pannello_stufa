import { Page } from '@playwright/test';

/**
 * Reusable Auth Helpers for E2E Tests
 *
 * Centralizes Auth0 Universal Login interaction patterns.
 * If Auth0 UI changes, only these helpers need updating.
 */

/**
 * Sign in via Auth0 Universal Login
 *
 * Auth0 uses a 2-step flow:
 * 1. Email submission → Continue
 * 2. Password submission → Continue
 *
 * @param page - Playwright page instance
 * @param email - Auth0 user email
 * @param password - Auth0 user password
 */
export async function signIn(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  // Navigate to app login route (redirects to Auth0)
  await page.goto('/auth/login');

  // Wait for Auth0 Universal Login page
  await page.waitForURL(/.*auth0.*/);

  // Step 1: Email submission
  await page.getByLabel('Email address').fill(email);
  await page.getByRole('button', { name: 'Continue' }).click();

  // Step 2: Password submission
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Continue' }).click();

  // Wait for redirect back to app (any app page = success)
  await page.waitForURL('http://localhost:3000/**');
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
