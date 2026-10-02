/**
 * Shared E2E Test Context
 *
 * Provides environment-sourced credentials.
 * All values come from environment variables (no hardcoded secrets).
 */

export const TEST_USER = {
  email: process.env.E2E_TEST_USER_EMAIL!,
  password: process.env.E2E_TEST_USER_PASSWORD!,
};
