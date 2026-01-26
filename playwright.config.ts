import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Testing Configuration
 *
 * Tests run in production mode (npm run build + npm run start) to ensure
 * Serwist service worker is properly generated and registered.
 *
 * Three browser projects (Chromium, Firefox, WebKit) with sharding support
 * for parallel execution in CI/CD.
 */
export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true, // Required for efficient sharding
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'blob' : 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes for build + start
  },
});
