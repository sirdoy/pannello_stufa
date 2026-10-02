import { defineConfig, devices } from '@playwright/test';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local' });
loadEnv();

// E2E always runs against the real login (M39): `.env.local` may enable the local dev bypass,
// which the test runner and the web server would otherwise both inherit.
const authEnv = { BYPASS_AUTH: 'false', TEST_MODE: 'false' };
Object.assign(process.env, authEnv);

/**
 * Playwright E2E Test Configuration
 *
 * Authenticates via the real /auth/login form with the `test` account (not TEST_MODE bypass),
 * once per worker: see tests/fixtures.ts (specs import `test` from there).
 * See tests/helpers/test-context.ts for environment configuration.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'blob' : [['list'], ['html', { open: 'never' }]],
  timeout: 30000,

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    // The PWA service worker crashes the renderer under chromium-headless-shell (M39/M54)
    // and no e2e test relies on it.
    serviceWorkers: 'block',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Production build, not `next dev` (M39): with Turbopack + React Compiler the dev server
  // takes 60-90 s to compile `/` and 10-20 s per route, so parallel workers time out.
  // CI builds in its own step; locally PW_SKIP_BUILD=1 reuses the current `.next` build.
  // E2E_ALLOW_DEBUG_PAGES serves /debug/* (blocked in production by middleware.ts).
  webServer: {
    command: process.env.CI || process.env.PW_SKIP_BUILD ? 'npm run start' : 'npm run build && npm run start',
    url: 'http://localhost:3000/auth/login',
    env: { ...authEnv, E2E_ALLOW_DEBUG_PAGES: 'true' },
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
