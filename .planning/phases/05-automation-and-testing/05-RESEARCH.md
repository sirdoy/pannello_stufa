# Phase 5: Automation & Testing - Research

**Researched:** 2026-01-26
**Domain:** E2E Testing with Playwright, Automated Token Cleanup, CI/CD Integration
**Confidence:** HIGH

## Summary

Phase 5 requires implementing zero-touch token hygiene with automated cleanup and comprehensive E2E testing infrastructure. The standard approach uses **Playwright 1.58** for cross-browser E2E testing with sharding for parallel execution, **Firebase Admin SDK** for token cleanup automation triggered by **cron-job.org** external cron service, and **GitHub Actions** with matrix strategy for CI/CD integration that runs tests on every PR with merge blocking on failures.

Playwright is the clear industry standard for PWA and service worker testing in 2026, with native support for service worker events, IndexedDB persistence testing, and multi-browser coverage (Chromium, Firefox, WebKit). The Next.js ecosystem has standardized on Playwright over Cypress for E2E testing, with official Next.js documentation recommending the `with-playwright` starter template.

The research reveals that meeting the 5-minute test budget for 3 browsers requires aggressive parallelization using GitHub Actions matrix sharding (4+ shards recommended) with `fullyParallel: true` for test-level distribution. Service worker lifecycle testing requires specific patterns: using `page.context().grantPermissions(['notifications'])` for push notification mocking, `page.addInitScript()` for injecting mocks before page load, and `worker.on('console')` for capturing service worker logs.

**Primary recommendation:** Use Playwright 1.58 with Next.js integration, implement Page Object Model pattern with fixtures for maintainability, configure 4-shard matrix in GitHub Actions for parallel execution, and create webhook-secured API route for cron-triggered token cleanup with HMAC signature verification.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **Playwright** | 1.58+ | E2E testing framework | Industry standard for PWA testing, native service worker support, cross-browser (Chromium/Firefox/WebKit), official Next.js recommendation, active development with 2026 releases |
| **@playwright/test** | 1.58+ | Test runner | Built-in sharding, parallel execution, fixtures, Page Object Model support, blob report merging for CI |
| **firebase-admin** | 13.6.0+ | Token cleanup automation | Already in project, batch operations for Firestore queries, FCM token management APIs |
| **GitHub Actions** | N/A | CI/CD platform | Native to GitHub repos, matrix strategy for parallelization, PR comment integration, secrets management |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@playwright/test-reporter** | 1.58+ | Test result reporting | GitHub PR comment integration for test summaries |
| **daun/playwright-report-summary** | Latest | GitHub Action for PR comments | Automatically posts test results to PRs, updates on re-runs |
| **playwright-indexeddb** | Latest | Type-safe IndexedDB testing | Testing Dexie-based token persistence, device registry operations |
| **cron-job.org** | N/A | External cron service | Zero-infrastructure scheduling, email alerts on failure, webhook support |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Playwright | Cypress | Cypress has weaker service worker support, no WebKit, slower parallel execution, community moving to Playwright for PWAs |
| cron-job.org | Vercel Cron | Vercel Cron requires Hobby/Pro plan, no built-in failure alerts, harder to debug |
| GitHub Actions | CircleCI/Jenkins | More complex setup, less GitHub integration, matrix strategy is GitHub-native pattern |
| External cron | Firebase Scheduled Functions | Requires Cloud Functions pricing tier, less flexible scheduling, harder to test webhooks locally |

**Installation:**
```bash
npm install --save-dev @playwright/test@latest
npx playwright install chromium firefox webkit
npm install --save-dev playwright-indexeddb
```

## Architecture Patterns

### Recommended Project Structure
```
e2e/
├── fixtures/              # Custom test fixtures
│   ├── authenticated.ts   # Pre-authenticated browser context
│   ├── devices.ts         # Device registry fixtures with test data
│   └── notifications.ts   # Notification permission fixtures
├── pages/                 # Page Object Model classes
│   ├── AdminPanel.ts      # Admin testing page object
│   ├── NotificationHistory.ts
│   └── Settings.ts
├── tests/                 # Test files organized by feature
│   ├── token-persistence.spec.ts
│   ├── service-worker-lifecycle.spec.ts
│   ├── notification-delivery.spec.ts
│   └── user-preferences.spec.ts
├── utils/                 # Test helpers
│   ├── fcm-mock.ts        # Mock FCM responses
│   └── db-helpers.ts      # IndexedDB/Dexie test utilities
└── playwright.config.ts   # Playwright configuration
```

### Pattern 1: Page Object Model with Fixtures
**What:** Combine POM (encapsulate selectors/actions) with fixtures (setup/teardown logic) for maintainable tests
**When to use:** All E2E tests - mandated by Playwright best practices 2026
**Example:**
```typescript
// Source: https://playwright.dev/docs/pom + https://playwright.dev/docs/test-fixtures

// e2e/pages/AdminPanel.ts
export class AdminPanel {
  constructor(private page: Page) {}

  readonly testTemplateDropdown = this.page.locator('[data-testid="test-template"]');
  readonly sendButton = this.page.locator('button', { hasText: 'Send Test' });
  readonly deliveryFeedback = this.page.locator('[data-testid="delivery-status"]');

  async selectTemplate(template: 'Error Alert' | 'Scheduler Success' | 'Maintenance Reminder') {
    await this.testTemplateDropdown.selectOption(template);
  }

  async sendTest() {
    await this.sendButton.click();
    await expect(this.deliveryFeedback).toBeVisible();
  }
}

// e2e/fixtures/authenticated.ts
import { test as base } from '@playwright/test';
import { AdminPanel } from '../pages/AdminPanel';

export const test = base.extend<{ adminPanel: AdminPanel }>({
  adminPanel: async ({ page }, use) => {
    // Setup: Navigate and authenticate
    await page.goto('/admin/notifications');
    // Auth0 authentication would happen here
    const adminPanel = new AdminPanel(page);
    await use(adminPanel);
    // Teardown happens automatically
  },
});

// e2e/tests/admin-testing.spec.ts
import { test } from '../fixtures/authenticated';

test('admin can send test notification with template', async ({ adminPanel }) => {
  await adminPanel.selectTemplate('Error Alert');
  await adminPanel.sendTest();
  // Test is readable, maintainable, reusable
});
```

### Pattern 2: Service Worker Lifecycle Testing
**What:** Test service worker registration, updates, message handling with persistence across "browser restarts"
**When to use:** Critical for PWA reliability - required by success criteria #2
**Example:**
```typescript
// Source: https://playwright.dev/docs/mock-browser-apis + community patterns

test('token persists after browser restart', async ({ browser }) => {
  // First session: register and store token
  const context1 = await browser.newContext();
  const page1 = await context1.newPage();

  await page1.goto('/');
  await page1.context().grantPermissions(['notifications']);

  // Wait for service worker registration
  await page1.waitForFunction(() => 'serviceWorker' in navigator);
  const swRegistered = await page1.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    return !!reg;
  });
  expect(swRegistered).toBe(true);

  // Get FCM token (stored in IndexedDB via Dexie)
  const token1 = await page1.evaluate(async () => {
    const { db } = await import('/app/lib/db');
    const device = await db.devices.get(1);
    return device?.fcmToken;
  });
  expect(token1).toBeTruthy();

  // Save storage state (includes IndexedDB)
  const storage = await context1.storageState();
  await context1.close();

  // Simulate browser restart: new context with saved storage
  const context2 = await browser.newContext({ storageState: storage });
  const page2 = await context2.newPage();

  await page2.goto('/');

  // Verify token persisted
  const token2 = await page2.evaluate(async () => {
    const { db } = await import('/app/lib/db');
    const device = await db.devices.get(1);
    return device?.fcmToken;
  });
  expect(token2).toBe(token1);

  await context2.close();
});
```

### Pattern 3: Sharded Parallel Execution in GitHub Actions
**What:** Use matrix strategy with Playwright sharding to meet 5-minute budget for 3 browsers
**When to use:** CI/CD integration - required by success criteria #4
**Example:**
```yaml
# Source: https://playwright.dev/docs/test-sharding + GitHub Actions docs

name: E2E Tests
on: [pull_request]

jobs:
  test:
    timeout-minutes: 10
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4]
        browser: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright browsers
        run: npx playwright install --with-deps ${{ matrix.browser }}
      - name: Run tests
        run: npx playwright test --project=${{ matrix.browser }} --shard=${{ matrix.shard }}/4
        env:
          CI: true
      - name: Upload blob report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: blob-report-${{ matrix.browser }}-${{ matrix.shard }}
          path: blob-report
          retention-days: 1

  merge-reports:
    if: always()
    needs: [test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - name: Download blob reports
        uses: actions/download-artifact@v4
        with:
          path: all-blob-reports
          pattern: blob-report-*
      - name: Merge reports
        run: npx playwright merge-reports --reporter html ./all-blob-reports
      - name: Upload HTML report
        uses: actions/upload-artifact@v4
        with:
          name: html-report
          path: playwright-report
      - name: Comment PR
        uses: daun/playwright-report-summary@v3
        with:
          report-file: playwright-report/index.html
```

### Pattern 4: Webhook Signature Verification for Cron Triggers
**What:** Secure API route for cron-job.org webhooks using HMAC signature verification
**When to use:** Token cleanup automation - prevents unauthorized cleanup triggers
**Example:**
```typescript
// Source: https://docs.lemonsqueezy.com/guides/tutorials/webhooks-nextjs + HMAC patterns

// app/api/cron/cleanup-tokens/route.ts
import { createHmac, timingSafeEqual } from 'crypto';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds for cleanup operation

// Disable Next.js body parsing to get raw body
export async function POST(request: Request) {
  // Read raw body for signature verification
  const rawBody = await request.text();
  const headersList = await headers();
  const signature = headersList.get('x-cron-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  // Verify HMAC signature
  const secret = process.env.CRON_WEBHOOK_SECRET!;
  const hmac = createHmac('sha256', secret);
  hmac.update(rawBody);
  const digest = hmac.digest('hex');

  // Timing-safe comparison to prevent timing attacks
  const signatureBuffer = Buffer.from(signature, 'hex');
  const digestBuffer = Buffer.from(digest, 'hex');

  if (signatureBuffer.length !== digestBuffer.length ||
      !timingSafeEqual(signatureBuffer, digestBuffer)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Signature valid - execute cleanup
  const result = await cleanupStaleTokens();

  return NextResponse.json(result, { status: 200 });
}

async function cleanupStaleTokens() {
  const admin = await import('firebase-admin');
  const db = admin.firestore();

  // 90 days ago timestamp
  const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);

  // Query stale tokens
  const staleTokensSnapshot = await db.collection('devices')
    .where('lastUsed', '<', ninetyDaysAgo)
    .get();

  const deletions = [];
  staleTokensSnapshot.forEach(doc => {
    deletions.push(doc.ref.delete());
  });

  await Promise.all(deletions);

  return {
    success: true,
    deletedCount: deletions.length,
    timestamp: new Date().toISOString()
  };
}
```

### Anti-Patterns to Avoid
- **Hard-coding selectors in tests:** Use Page Object Model to centralize selectors
- **Using `page.waitForTimeout()`:** Use `page.waitForSelector()` or `expect()` with auto-wait instead
- **Shared state between tests:** Each test should be independent - use fixtures for setup
- **Testing service workers with Jest/JSDOM:** Service workers require real browsers - use Playwright
- **Storing secrets in code:** Use Vercel environment variables (encrypted) or external secret managers
- **Manual test retry logic:** Use Playwright's built-in `retries` config, don't roll your own
- **Single shard in CI:** Won't meet 5-minute budget - use 4+ shards for 3 browsers

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Browser automation | Custom Selenium wrapper | Playwright | Native async/await, auto-wait, cross-browser, active maintenance, service worker support |
| Test parallelization | Custom process spawning | Playwright sharding + GitHub Actions matrix | Built-in test distribution, blob report merging, handles test isolation |
| Webhook signature verification | Custom crypto logic | Standard HMAC + `timingSafeEqual` | Prevents timing attacks, cryptographically secure, audited patterns |
| FCM token cleanup | Loop through all tokens | Firestore `where()` queries + batch deletes | Scales to thousands of tokens, optimized queries, Firebase Admin SDK handles retries |
| Test reporting to PR | Custom GitHub API calls | `daun/playwright-report-summary` action | Handles comment creation/update, formats results, includes pass/fail summary |
| IndexedDB testing | Mock IndexedDB in Jest | Playwright with real IndexedDB + `playwright-indexeddb` | Tests real persistence, catches browser-specific bugs, type-safe operations |
| Service worker lifecycle | Custom SW registration logic | Playwright context with `storageState` | Persists SW registration + IndexedDB across "restarts", simulates real browser behavior |

**Key insight:** E2E testing complexity is hidden - race conditions, browser differences, service worker lifecycle edge cases, and IndexedDB persistence quirks only appear in real browsers. Playwright handles these with 10+ years of Chromium team experience, auto-wait, and cross-browser normalization. Custom solutions always underestimate this complexity.

## Common Pitfalls

### Pitfall 1: Flaky Tests from Race Conditions
**What goes wrong:** Tests pass locally but fail randomly in CI, especially service worker registration and IndexedDB operations
**Why it happens:** Service worker activation is async, IndexedDB transactions are async, FCM token generation is async - tests don't wait properly
**How to avoid:** Use Playwright's auto-wait assertions (`expect(locator).toBeVisible()`) and explicit waits (`page.waitForFunction(() => 'serviceWorker' in navigator)`) instead of `waitForTimeout()`
**Warning signs:** Tests fail with "Element not found" or "Service worker not registered" in CI but pass locally

### Pitfall 2: Service Worker Test Isolation
**What goes wrong:** Tests interfere with each other because service workers persist across page navigations
**Why it happens:** Service workers are registered at scope level (`/`) and remain active across test runs in same browser context
**How to avoid:** Use fresh `browser.newContext()` for each test (Playwright does this automatically with fixtures), unregister service workers in teardown if testing SW updates
**Warning signs:** First test passes, subsequent tests fail with "Service worker already registered" or stale cache responses

### Pitfall 3: Serwist Requires Webpack in Next.js 16+
**What goes wrong:** `npm run build` fails or service worker not generated because Next.js 16 uses Turbopack by default
**Why it happens:** Serwist (PWA library used in this project) requires Webpack to generate service workers, incompatible with Turbopack
**How to avoid:** Use `next build --webpack` in package.json and Playwright config's `webServer.command`, already documented in project's package.json: `"build": "next build --webpack"`
**Warning signs:** Build succeeds but `public/sw.js` not generated, or build fails with Serwist plugin errors

### Pitfall 4: GitHub Actions Timeout with 5-Minute Budget
**What goes wrong:** E2E tests timeout at 5 minutes with 3 browsers, blocking all PRs
**Why it happens:** 3 browsers × full test suite × serial execution exceeds budget, especially with service worker tests (slow)
**How to avoid:** Use 4+ shards with matrix strategy (`matrix.shard: [1,2,3,4]`), enable `fullyParallel: true` in Playwright config for test-level distribution, set `timeout-minutes: 10` in workflow as buffer
**Warning signs:** CI runs consistently taking 4:30-5:00 minutes, occasional timeouts

### Pitfall 5: HMAC Signature Timing Attacks
**What goes wrong:** Webhook endpoint vulnerable to timing attacks that can leak signature
**Why it happens:** Using `===` or `signature === expected` allows attacker to measure timing differences to guess signature byte-by-byte
**How to avoid:** Use `crypto.timingSafeEqual()` for constant-time comparison, verify buffer lengths match before comparing
**Warning signs:** Security audit flags webhook verification, reading webhook payloads without verification in logs

### Pitfall 6: Stale IndexedDB State in Tests
**What goes wrong:** Tests fail because previous test data persists in IndexedDB (Dexie database)
**Why it happens:** Playwright's `storageState` saves IndexedDB by default for persistence testing, but this causes pollution
**How to avoid:** Clear IndexedDB before each test using `page.evaluate(() => indexedDB.deleteDatabase('db-name'))` or use separate test databases per test
**Warning signs:** Tests pass when run individually (`--grep`) but fail when run together, duplicate key errors in IndexedDB

### Pitfall 7: Mock Service Worker (MSW) Confusion
**What goes wrong:** Developer tries to use Mock Service Worker (MSW) library thinking it helps with service worker testing
**Why it happens:** Name confusion - MSW is for **mocking HTTP requests**, not testing **service workers**
**How to avoid:** Use Playwright's `page.route()` for HTTP mocking, use real service worker with Playwright for SW lifecycle testing, MSW is for unit tests (Jest) not E2E
**Warning signs:** Installing MSW in E2E tests, trying to use MSW handlers in Playwright tests

## Code Examples

Verified patterns from official sources:

### Testing Token Persistence After "Browser Restart"
```typescript
// Source: https://playwright.dev/docs/auth (storageState pattern)

import { test, expect } from '@playwright/test';

test('FCM token persists after browser restart', async ({ browser }) => {
  // Session 1: Register for notifications and get token
  const context1 = await browser.newContext({
    permissions: ['notifications']
  });
  const page1 = await context1.newPage();
  await page1.goto('/');

  // Wait for service worker ready
  await page1.waitForFunction(() =>
    navigator.serviceWorker.ready.then(() => true)
  );

  // Trigger FCM token generation (app-specific logic)
  await page1.click('[data-testid="enable-notifications"]');

  // Verify token stored in IndexedDB
  const token1 = await page1.evaluate(async () => {
    const { db } = await import('/app/lib/db');
    const device = await db.devices.orderBy('id').last();
    return device?.fcmToken;
  });
  expect(token1).toBeTruthy();

  // Save complete storage state (cookies, localStorage, IndexedDB)
  const storageState = await context1.storageState();
  await context1.close();

  // Session 2: Simulate browser restart with persisted storage
  const context2 = await browser.newContext({ storageState });
  const page2 = await context2.newPage();
  await page2.goto('/');

  // Verify token still exists without re-registration
  const token2 = await page2.evaluate(async () => {
    const { db } = await import('/app/lib/db');
    const device = await db.devices.orderBy('id').last();
    return device?.fcmToken;
  });
  expect(token2).toBe(token1);

  // Verify service worker still active
  const swActive = await page2.evaluate(() =>
    navigator.serviceWorker.controller !== null
  );
  expect(swActive).toBe(true);

  await context2.close();
});
```

### Admin Panel Quick Test with Template Dropdown
```typescript
// Source: https://playwright.dev/docs/pom (Page Object Model pattern)

// e2e/pages/AdminNotifications.ts
export class AdminNotifications {
  constructor(private page: Page) {}

  // Locators using test IDs (stable selectors)
  readonly templateDropdown = this.page.locator('[data-testid="test-template"]');
  readonly deviceSelector = this.page.locator('[data-testid="device-selector"]');
  readonly prioritySelector = this.page.locator('[data-testid="priority-selector"]');
  readonly sendButton = this.page.locator('[data-testid="send-test-notification"]');
  readonly deliveryStatus = this.page.locator('[data-testid="delivery-status"]');

  async selectTemplate(template: 'Error Alert' | 'Scheduler Success' | 'Maintenance Reminder') {
    await this.templateDropdown.selectOption(template);
    // Verify template auto-filled notification content
    await expect(this.page.locator('[data-testid="notification-title"]')).not.toBeEmpty();
  }

  async selectDevice(deviceName: string) {
    await this.deviceSelector.click();
    await this.page.locator(`text=${deviceName}`).click();
  }

  async selectPriority(priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW') {
    await this.prioritySelector.selectOption(priority);
  }

  async sendTestNotification() {
    await this.sendButton.click();
    // Wait for delivery feedback (Phase 2 tracking)
    await expect(this.deliveryStatus).toBeVisible({ timeout: 10000 });
  }

  async getDeliveryResult() {
    return await this.deliveryStatus.textContent();
  }
}

// e2e/tests/admin-testing.spec.ts
import { test, expect } from '@playwright/test';
import { AdminNotifications } from '../pages/AdminNotifications';

test.describe('Admin Quick Test', () => {
  let adminPage: AdminNotifications;

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/notifications');
    // Authenticate (Auth0 flow would go here)
    adminPage = new AdminNotifications(page);
  });

  test('can send test notification with Error Alert template', async () => {
    await adminPage.selectTemplate('Error Alert');
    await adminPage.selectDevice('Test Device');
    await adminPage.selectPriority('HIGH');
    await adminPage.sendTestNotification();

    const result = await adminPage.getDeliveryResult();
    expect(result).toContain('Delivered');
  });

  test('test notification appears in history', async ({ page }) => {
    await adminPage.selectTemplate('Maintenance Reminder');
    await adminPage.sendTestNotification();

    // Navigate to notification history
    await page.goto('/admin/notifications/history');

    // Verify test notification logged (Phase 4 + Phase 5 integration)
    await expect(page.locator('text=Maintenance Reminder').first()).toBeVisible();
  });
});
```

### Configuring Playwright for Next.js with Serwist
```typescript
// Source: https://nextjs.org/docs/pages/guides/testing/playwright

// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true, // Required for efficient sharding
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0, // Retry flaky tests in CI
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'blob' : 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry', // Capture trace for flaky tests
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
    command: 'npm run build && npm run start', // Production mode required for Serwist
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes for build + start
  },
});
```

### Mocking Push Notifications in Playwright
```typescript
// Source: https://playwright.dev/docs/mock-browser-apis

test('service worker receives push notification', async ({ page, context }) => {
  // Grant notification permission
  await context.grantPermissions(['notifications']);

  // Mock Push API before page loads
  await page.addInitScript(() => {
    // Override PushManager to prevent real FCM calls
    class MockPushManager {
      async subscribe() {
        return {
          endpoint: 'https://fcm.googleapis.com/fcm/send/mock-endpoint',
          toJSON: () => ({
            endpoint: 'https://fcm.googleapis.com/fcm/send/mock-endpoint',
            keys: {
              auth: 'mock-auth-key',
              p256dh: 'mock-p256dh-key'
            }
          })
        };
      }
    }

    Object.defineProperty(ServiceWorkerRegistration.prototype, 'pushManager', {
      get: () => new MockPushManager()
    });
  });

  await page.goto('/');

  // Listen for service worker messages
  const swMessagePromise = page.evaluate(() => {
    return new Promise(resolve => {
      navigator.serviceWorker.addEventListener('message', event => {
        resolve(event.data);
      });
    });
  });

  // Trigger push notification flow
  await page.click('[data-testid="enable-notifications"]');

  // Send mock push event to service worker
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    registration.active?.postMessage({
      type: 'PUSH_NOTIFICATION',
      notification: {
        title: 'Test Alert',
        body: 'This is a test',
        priority: 'HIGH'
      }
    });
  });

  const message = await swMessagePromise;
  expect(message).toBeTruthy();
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Cypress for E2E | Playwright | 2023-2024 | Playwright has better service worker support, cross-browser (including WebKit), faster parallel execution, official Next.js recommendation |
| Manual token cleanup | Automated cron with Firebase queries | 2025+ | Zero manual intervention, timestamp-based cleanup (90 days), scales to thousands of tokens |
| Jest for service worker tests | Playwright with real browsers | Ongoing | Jest/JSDOM can't test service workers (not implemented), Playwright uses real browser engines |
| Vercel Cron | External cron services | 2024+ | Vercel Cron requires paid plan, external services (cron-job.org) have free tier with monitoring |
| Sequential CI test runs | Sharded parallel execution | 2023+ | GitHub Actions matrix + Playwright sharding reduces CI time by 75%+ (4 shards = 4x faster) |
| Chrome-only E2E tests | Multi-browser (Chromium, Firefox, WebKit) | 2024+ | Catches browser-specific bugs, PWAs must work on iOS Safari (WebKit) |

**Deprecated/outdated:**
- **next-pwa**: Deprecated in favor of Serwist (active fork, same API, Next.js 16 support)
- **Selenium WebDriver**: Playwright supersedes it with better API, auto-wait, cross-browser
- **Puppeteer-only**: Chromium-only, Playwright supports Firefox and WebKit
- **`vercel secrets` CLI**: Replaced by environment variables in Vercel dashboard (simpler, encrypted by default)

## Open Questions

Things that couldn't be fully resolved:

1. **Email delivery for cron-job.org failure alerts**
   - What we know: cron-job.org supports email alerts on failure, this was chosen over Vercel Cron
   - What's unclear: Email delivery service (SendGrid/Mailgun/SMTP) not configured in project, cron-job.org may require configuring email endpoint
   - Recommendation: Verify cron-job.org's email alert mechanism during implementation - may need to add email service or use admin's email directly

2. **Test user cleanup strategy**
   - What we know: Test users (test@example.com) will be created in production Firebase for E2E tests
   - What's unclear: How to prevent test notifications from appearing in production notification history UI, whether to use separate Firebase project for testing
   - Recommendation: Add `isTest: true` flag to test notifications, filter them out in Phase 4 history UI, or use Firebase emulator for E2E tests (tradeoff: less realistic)

3. **Playwright test timeout with Serwist build**
   - What we know: `npm run build` with Webpack takes 30-60 seconds, `webServer.timeout` set to 120s
   - What's unclear: Whether 2-minute timeout is sufficient for CI environment with cold cache
   - Recommendation: Monitor CI build times, increase timeout to 180s if needed, consider caching `node_modules` and `.next` in GitHub Actions

4. **FCM token batch deletion limits**
   - What we know: Firebase Admin SDK supports batch operations, cleanup queries use `where('lastUsed', '<', timestamp)`
   - What's unclear: Firestore batch size limits (500 per batch), whether cleanup should paginate for 1000+ stale tokens
   - Recommendation: Implement pagination in cleanup script if > 500 tokens, use `Promise.all()` with chunked batches

5. **IndexedDB storageState persistence across Playwright versions**
   - What we know: Playwright 1.58 supports IndexedDB in `storageState()`, feature was added in 1.56
   - What's unclear: Stability of this feature, potential bugs with Dexie-specific operations
   - Recommendation: Use `playwright-indexeddb` library as fallback for explicit IndexedDB operations, test browser restart flow in multiple browsers

## Sources

### Primary (HIGH confidence)
- [Playwright Official Release Notes](https://playwright.dev/docs/release-notes) - Version 1.58 features and API changes
- [Next.js Official Playwright Guide](https://nextjs.org/docs/pages/guides/testing/playwright) - Official integration recommendations
- [Playwright Test Sharding Documentation](https://playwright.dev/docs/test-sharding) - Sharding configuration and GitHub Actions matrix
- [Playwright Page Object Model Documentation](https://playwright.dev/docs/pom) - POM pattern and best practices
- [Firebase FCM Token Management](https://firebase.google.com/docs/cloud-messaging/manage-tokens) - Token cleanup best practices, stale token detection
- [Playwright Test Fixtures](https://playwright.dev/docs/test-fixtures) - Fixture patterns and test isolation
- [Playwright Mock Browser APIs](https://playwright.dev/docs/mock-browser-apis) - Push notification mocking patterns

### Secondary (MEDIUM confidence)
- [BrowserStack Playwright Best Practices 2026](https://www.browserstack.com/guide/playwright-best-practices) - Industry best practices verified with official docs
- [Playwright Service Worker Testing Guide](https://vite-pwa-org.netlify.app/guide/testing-service-worker) - Community patterns for SW testing
- [GitHub Actions Playwright Parallel Execution](https://docs.currents.dev/getting-started/ci-setup/github-actions/playwright-github-actions) - Matrix strategy patterns
- [Next.js Serwist PWA Guide](https://serwist.pages.dev/docs/next/getting-started) - Serwist setup and Webpack requirement
- [Playwright Flaky Tests Retry Strategy](https://playwright.dev/docs/test-retries) - Official retry configuration
- [Webhook HMAC Signature Verification](https://docs.lemonsqueezy.com/guides/tutorials/webhooks-nextjs) - Standard HMAC pattern for Next.js
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables) - Secrets management

### Tertiary (LOW confidence)
- [playwright-indexeddb library](https://github.com/vrknetha/playwright-indexeddb) - Type-safe IndexedDB testing, verify API in implementation
- [daun/playwright-report-summary](https://github.com/daun/playwright-report-summary) - PR comment action, verify active maintenance
- cron-job.org capabilities - No official docs found, verify webhook signature format and email alerts during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Playwright 1.58 verified from official release notes, Firebase Admin SDK already in project, GitHub Actions is standard
- Architecture: HIGH - All patterns verified from official Playwright and Next.js documentation, POM and fixtures are documented best practices
- Pitfalls: MEDIUM-HIGH - Serwist Webpack requirement verified from official docs, service worker isolation from community experience, HMAC timing attacks from security patterns

**Research date:** 2026-01-26
**Valid until:** 2026-02-26 (30 days) - Playwright releases monthly, Next.js stable, patterns are mature

**Notes:**
- Phase 5 builds on Phase 4 (notification history) and Phase 2 (delivery tracking) - admin testing page will integrate with existing infrastructure
- 5-minute CI budget is aggressive - requires 4 shards minimum, may need to increase to 6 shards or optimize test count
- cron-job.org choice over Vercel Cron means external dependency - acceptable tradeoff for free tier with monitoring
- Test users in production Firebase is pragmatic but requires `isTest` flag discipline to avoid UI pollution
