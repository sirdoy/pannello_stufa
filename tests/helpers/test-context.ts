/**
 * Shared E2E Test Context
 *
 * Provides environment-sourced credentials and path constants.
 * All values come from environment variables (no hardcoded secrets).
 */

export const TEST_USER = {
  email: process.env.E2E_TEST_USER_EMAIL!,
  password: process.env.E2E_TEST_USER_PASSWORD!,
};

export const AUTH_FILE = 'tests/.auth/user.json';

export const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
