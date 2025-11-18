import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for UI/UX Testing
 *
 * Tests:
 * - Contrast compliance (WCAG AA)
 * - Component uniformity (Button, Card, Banner)
 * - Responsive design (mobile/desktop)
 * - Dark mode & liquid glass effect
 * - Accessibility (ARIA)
 */

export default defineConfig({
  testDir: './e2e',

  // Maximum time one test can run for
  timeout: 30 * 1000,

  // Test artifacts
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['list']
  ],

  use: {
    // Base URL for tests (server must be running manually)
    baseURL: 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Ignore HTTPS errors for local development
    ignoreHTTPSErrors: true,
  },

  // Configure projects for major browsers and viewports
  projects: [
    // Desktop browsers - Light mode
    {
      name: 'chromium-desktop-light',
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'light',
      },
    },
    {
      name: 'firefox-desktop-light',
      use: {
        ...devices['Desktop Firefox'],
        colorScheme: 'light',
      },
    },
    {
      name: 'webkit-desktop-light',
      use: {
        ...devices['Desktop Safari'],
        colorScheme: 'light',
      },
    },

    // Desktop browsers - Dark mode
    {
      name: 'chromium-desktop-dark',
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'dark',
      },
    },
    {
      name: 'firefox-desktop-dark',
      use: {
        ...devices['Desktop Firefox'],
        colorScheme: 'dark',
      },
    },
    {
      name: 'webkit-desktop-dark',
      use: {
        ...devices['Desktop Safari'],
        colorScheme: 'dark',
      },
    },

    // Mobile devices - Light mode
    {
      name: 'mobile-chrome-light',
      use: {
        ...devices['Pixel 5'],
        colorScheme: 'light',
      },
    },
    {
      name: 'mobile-safari-light',
      use: {
        ...devices['iPhone 12'],
        colorScheme: 'light',
      },
    },

    // Mobile devices - Dark mode
    {
      name: 'mobile-chrome-dark',
      use: {
        ...devices['Pixel 5'],
        colorScheme: 'dark',
      },
    },
    {
      name: 'mobile-safari-dark',
      use: {
        ...devices['iPhone 12'],
        colorScheme: 'dark',
      },
    },

    // Tablet devices
    {
      name: 'tablet-light',
      use: {
        ...devices['iPad Pro'],
        colorScheme: 'light',
      },
    },
    {
      name: 'tablet-dark',
      use: {
        ...devices['iPad Pro'],
        colorScheme: 'dark',
      },
    },
  ],

  // Note: Server must be running manually with TEST_MODE=true before running tests
  // Run: TEST_MODE=true npm run dev
  // Then run tests in another terminal
});
