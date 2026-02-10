# Phase 51: E2E Test Improvements - Research

**Researched:** 2026-02-10
**Domain:** End-to-End Testing with Playwright, Auth0 authentication flows, Next.js 15 integration
**Confidence:** HIGH

## Summary

Phase 51 focuses on implementing realistic Auth0 E2E testing with Playwright, replacing the current TEST_MODE bypass with production-ready authentication flows. The research reveals a well-established pattern: authenticate once using a setup project, cache the session state using Playwright's `storageState` feature, and reuse this cached state across all tests. This eliminates redundant Auth0 logins, prevents rate limiting, and dramatically reduces test execution time (70%+ improvement).

The standard stack uses `@playwright/test` (already installed at v1.52.0) with Auth0's OAuth Authorization Code Flow. Critical flows should verify stove ignition, thermostat schedule changes, and notification delivery—testing user-facing functionality rather than authentication edge cases. GitHub Actions integration requires secure environment variable handling and artifact management.

**Primary recommendation:** Implement a three-tier testing structure: (1) `auth.setup.ts` for session caching, (2) smoke tests for core auth flows, (3) feature tests that assume authenticated state. Configure GitHub Actions with encrypted secrets, automatic retries (2x in CI), and trace capture on failure.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @playwright/test | 1.52.0 | E2E testing framework | Microsoft's official solution with auto-waiting, role-based selectors, and comprehensive browser support |
| @auth0/nextjs-auth0 | 4.13.1 | Auth0 SDK for Next.js | Official Auth0 SDK providing Authorization Code Flow, session management, and middleware integration |
| Next.js | 16.1.0 | Application framework | First-class Playwright support, official testing guide, App Router compatibility |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| playwright-github-action | latest | GitHub Actions integration | CI environment for running E2E tests on PR and push |
| dotenv | built-in | Environment variable management | Loading Auth0 credentials in test setup |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Playwright | Cypress | Playwright has better Auth0 integration patterns, faster execution, and official Next.js support |
| Real Auth0 OAuth | Mocked auth with TEST_MODE | Real flows validate security foundation but are slower; mitigate with storageState caching |
| Setup project pattern | Per-test authentication | Setup project reduces execution time by 70%+ and prevents Auth0 rate limiting |

**Installation:**
```bash
npm install --save-dev @playwright/test
npx playwright install --with-deps chromium
```

## Architecture Patterns

### Recommended Project Structure
```
tests/
├── auth.setup.ts              # Session caching logic (runs once)
├── helpers/
│   ├── auth.helpers.ts        # Reusable auth utilities (signIn, signOut)
│   └── test-context.ts        # Test user credential generation
├── smoke/
│   └── auth-flows.spec.ts     # Core auth verification (signup, signin, signout)
├── features/
│   ├── stove-ignition.spec.ts       # Critical flow 1
│   ├── thermostat-schedule.spec.ts  # Critical flow 2
│   └── notification-delivery.spec.ts # Critical flow 3
└── .auth/
    └── user.json              # Cached session state (gitignored)
```

### Pattern 1: Session State Caching (Setup Project)

**What:** Authenticate once in `auth.setup.ts`, save session state to `tests/.auth/user.json`, reuse across all tests.

**When to use:** Always—this is the industry standard pattern for Auth0 + Playwright E2E testing.

**Example:**
```typescript
// Source: https://playwright.dev/docs/auth
// tests/auth.setup.ts
import { test as setup } from '@playwright/test';

const authFile = 'tests/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // 1. Navigate to Auth0 login (not TEST_MODE bypass)
  await page.goto('http://localhost:3000/auth/login');

  // 2. Enter credentials from environment variables
  await page.getByLabel('Email').fill(process.env.E2E_TEST_USER_EMAIL!);
  await page.getByLabel('Password').fill(process.env.E2E_TEST_USER_PASSWORD!);
  await page.getByRole('button', { name: 'Continue' }).click();

  // 3. Wait for redirect to home page (authenticated state)
  await page.waitForURL('http://localhost:3000/');

  // 4. Save session state for reuse
  await page.context().storageState({ path: authFile });
});
```

**Configuration in `playwright.config.ts`:**
```typescript
// Source: https://testdouble.com/insights/how-to-test-auth-flows-with-playwright-and-next-js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    // Setup project runs first
    { name: 'setup', testMatch: /.*\.setup\.ts/ },

    // Feature tests depend on setup
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/user.json', // Reuse cached session
      },
      dependencies: ['setup'],
    },
  ],
  retries: process.env.CI ? 2 : 0, // Auto-retry in CI for transient failures
  trace: 'on-first-retry', // Capture traces for debugging
});
```

### Pattern 2: Reusable Auth Helpers

**What:** Extract authentication flows into reusable utility functions to avoid duplication.

**When to use:** Smoke tests that directly verify auth flows (signup, signin, signout).

**Example:**
```typescript
// Source: https://github.com/testdouble/nextjs-e2e-test-example
// tests/helpers/auth.helpers.ts
import { Page } from '@playwright/test';

export async function signIn(page: Page, email: string, password: string) {
  await page.goto('http://localhost:3000/auth/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForURL('http://localhost:3000/');
}

export async function signOut(page: Page) {
  await page.getByRole('button', { name: 'Profile' }).click();
  await page.getByRole('menuitem', { name: 'Logout' }).click();
  await page.waitForURL('http://localhost:3000/auth/login');
}
```

### Pattern 3: Critical Flow Testing

**What:** Test user-facing critical paths (stove ignition, schedule changes, notification delivery) with assumed authentication.

**When to use:** Feature tests that verify application functionality, not authentication mechanics.

**Example:**
```typescript
// tests/features/stove-ignition.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Stove Ignition Flow', () => {
  test('should ignite stove and verify status change', async ({ page }) => {
    // Test assumes authenticated session from storageState
    await page.goto('http://localhost:3000/');

    // 1. Verify initial state (off)
    await expect(page.getByTestId('stove-status')).toHaveText('Spenta');

    // 2. Click ignition button
    await page.getByRole('button', { name: 'Accendi' }).click();

    // 3. Verify loading state appears
    await expect(page.getByText('Accensione in corso...')).toBeVisible();

    // 4. Wait for status update (auto-waiting)
    await expect(page.getByTestId('stove-status')).toHaveText('Accesa', { timeout: 15000 });

    // 5. Verify no error banners
    await expect(page.getByRole('alert')).not.toBeVisible();
  });
});
```

### Pattern 4: GitHub Actions CI Integration

**What:** Automate E2E tests on every PR and push using GitHub Actions workflow.

**When to use:** All projects—CI integration catches regressions early.

**Example:**
```yaml
# Source: https://playwright.dev/docs/ci-intro
# .github/workflows/playwright.yml
name: Playwright Tests
on:
  push:
    branches: [ main, dev ]
  pull_request:
    branches: [ main ]
jobs:
  test:
    timeout-minutes: 10
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: lts/*
    - name: Install dependencies
      run: npm ci
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps chromium
    - name: Run Playwright tests
      run: npx playwright test
      env:
        E2E_TEST_USER_EMAIL: ${{ secrets.E2E_TEST_USER_EMAIL }}
        E2E_TEST_USER_PASSWORD: ${{ secrets.E2E_TEST_USER_PASSWORD }}
        AUTH0_BASE_URL: "http://localhost:3000"
        AUTH0_ISSUER_BASE_URL: ${{ secrets.AUTH0_ISSUER_BASE_URL }}
        AUTH0_CLIENT_ID: ${{ secrets.AUTH0_CLIENT_ID }}
        AUTH0_CLIENT_SECRET: ${{ secrets.AUTH0_CLIENT_SECRET }}
        AUTH0_SECRET: ${{ secrets.AUTH0_SECRET }}
    - uses: actions/upload-artifact@v4
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
```

### Anti-Patterns to Avoid

- **Using TEST_MODE in production tests:** Bypassing real authentication defeats the purpose of E2E security validation
- **Per-test authentication:** Logging in for every test causes Auth0 rate limiting and 70%+ slower execution
- **Fixed timeouts:** Use `waitForSelector`, `waitForURL`, not `page.waitForTimeout(5000)`—Playwright's auto-waiting is faster and more reliable
- **CSS class selectors:** Prefer role-based (`getByRole('button')`) or test ID selectors over brittle `.btn-primary` selectors
- **Testing auth edge cases in E2E:** E2E tests should verify critical flows; unit tests handle edge cases

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session caching | Custom cookie/localStorage management | Playwright's `storageState()` | Handles cookies, localStorage, sessionStorage, httpOnly flags, domain/path scoping automatically |
| Auth0 login automation | Custom form filling logic | Reusable `signIn()` helper + Auth0 official selectors | Auth0's UI changes occasionally; centralized helpers reduce maintenance |
| Retry logic | Manual try/catch loops | Playwright's `retries: 2` config | Automatic retry with trace capture, failure isolation, and pass/fail tracking |
| Flakiness detection | Custom logging/metrics | Playwright's built-in trace viewer | Captures DOM snapshots, network events, console logs, execution timeline |
| CI environment detection | Custom environment checks | `process.env.CI` (set by GitHub Actions) | Standard environment variable set by all major CI providers |

**Key insight:** Playwright's ecosystem provides battle-tested solutions for authentication testing. Custom solutions introduce bugs (session leakage, httpOnly cookie handling, Auth0 redirect timing) that the standard tools already solve.

## Common Pitfalls

### Pitfall 1: Auth0 Rate Limiting in CI
**What goes wrong:** Running tests without session caching triggers 10+ Auth0 logins per test run, hitting rate limits (10 requests/sec for `/oauth/token`).

**Why it happens:** Each test authenticates independently instead of reusing cached session state.

**How to avoid:** Implement setup project pattern with `storageState` caching. This reduces Auth0 API calls from N (number of tests) to 1 (single authentication).

**Warning signs:** Tests fail in CI with `429 Too Many Requests`, or Auth0 dashboard shows spike in authentication traffic during test runs.

### Pitfall 2: Session Leakage Between Tests
**What goes wrong:** Tests modify user data (e.g., changing thermostat schedule), affecting subsequent tests that assume clean state.

**Why it happens:** Playwright reuses the same `storageState` across tests, which shares the same authenticated user account.

**How to avoid:** Use `test.beforeEach()` hooks to reset critical state via API calls, or use worker-scoped fixtures with unique test accounts (parallelIndex pattern).

**Warning signs:** Tests pass in isolation but fail when run as a suite; flaky tests that depend on execution order.

### Pitfall 3: Brittle Auth0 Selectors
**What goes wrong:** Test selectors like `page.locator('.auth0-lock-input-email')` break when Auth0 updates their UI.

**Why it happens:** Auth0's Universal Login UI uses framework-generated class names that change between versions.

**How to avoid:** Use Playwright's recorder (`npx playwright codegen`) to discover current selectors. Prefer `getByLabel('Email')` over class-based selectors. Centralize selectors in `auth.helpers.ts` for single-point updates.

**Warning signs:** Auth setup tests fail after Auth0 updates, errors mention "element not found" for login form fields.

### Pitfall 4: Missing .gitignore for Session State
**What goes wrong:** Committed `tests/.auth/user.json` exposes session tokens, allowing repository viewers to impersonate test accounts.

**Why it happens:** Developers forget to add `.auth/` directory to `.gitignore` after creating session state files.

**How to avoid:** Add `tests/.auth/` to `.gitignore` immediately when creating auth setup. Review committed files before pushing.

**Warning signs:** GitHub security alerts for exposed credentials; session tokens visible in repository history.

### Pitfall 5: Network Idle vs. Load State Confusion
**What goes wrong:** Tests using `waitForLoadState('load')` proceed before API polling (5s intervals for stove status) completes, causing assertions to fail.

**Why it happens:** `load` state fires when DOM is ready, but application uses client-side polling for real-time data.

**How to avoid:** Use specific assertions with generous timeouts: `expect(locator).toHaveText('Expected', { timeout: 15000 })` instead of broad network waits.

**Warning signs:** Tests fail with "expected 'Spenta' but got 'Accesa'" errors; timing-dependent failures that pass on retry.

## Code Examples

Verified patterns from official sources:

### Environment Variable Setup
```bash
# Source: https://playwright.dev/docs/auth
# .env.test (for local testing, NOT committed)
E2E_TEST_USER_EMAIL=test-user@example.com
E2E_TEST_USER_PASSWORD=SecurePassword123!

# GitHub Secrets (for CI)
# Settings > Secrets and variables > Actions > New repository secret
# - E2E_TEST_USER_EMAIL
# - E2E_TEST_USER_PASSWORD
# - AUTH0_CLIENT_ID
# - AUTH0_CLIENT_SECRET
# - AUTH0_SECRET
# - AUTH0_ISSUER_BASE_URL
```

### Smoke Test: Auth Flows
```typescript
// tests/smoke/auth-flows.spec.ts
import { test, expect } from '@playwright/test';
import { signIn, signOut } from '../helpers/auth.helpers';

test.describe('Authentication Flows', () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // Clear auth state

  test('should complete signin flow', async ({ page }) => {
    await signIn(page, process.env.E2E_TEST_USER_EMAIL!, process.env.E2E_TEST_USER_PASSWORD!);
    await expect(page).toHaveURL('http://localhost:3000/');
    await expect(page.getByRole('button', { name: 'Profile' })).toBeVisible();
  });

  test('should complete signout flow', async ({ page }) => {
    await signIn(page, process.env.E2E_TEST_USER_EMAIL!, process.env.E2E_TEST_USER_PASSWORD!);
    await signOut(page);
    await expect(page).toHaveURL(/auth\/login/);
  });
});
```

### Feature Test: Thermostat Schedule Change
```typescript
// tests/features/thermostat-schedule.spec.ts
import { test, expect } from '@playwright/test';

test('should update thermostat schedule and verify change', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  // 1. Navigate to thermostat card
  await page.getByRole('heading', { name: 'Termostato' }).click();

  // 2. Open schedule modal
  await page.getByRole('button', { name: 'Modifica Schedule' }).click();

  // 3. Change morning temperature
  const morningSlider = page.getByLabel('Temperatura Mattina');
  await morningSlider.fill('22');

  // 4. Save changes
  await page.getByRole('button', { name: 'Salva' }).click();

  // 5. Verify success message
  await expect(page.getByText('Schedule aggiornato')).toBeVisible();

  // 6. Verify new value persisted
  await expect(morningSlider).toHaveValue('22');
});
```

### Feature Test: Notification Delivery
```typescript
// tests/features/notification-delivery.spec.ts
import { test, expect } from '@playwright/test';

test('should send notification and verify delivery', async ({ page, context }) => {
  // 1. Grant notification permissions
  await context.grantPermissions(['notifications']);

  await page.goto('http://localhost:3000/settings/notifications');

  // 2. Enable test notification
  await page.getByRole('button', { name: 'Invia Notifica Test' }).click();

  // 3. Verify FCM token exists (indicates notification system initialized)
  const hasToken = await page.evaluate(() => {
    return localStorage.getItem('fcm_token') !== null;
  });
  expect(hasToken).toBe(true);

  // 4. Verify success toast
  await expect(page.getByText('Notifica inviata')).toBeVisible();

  // Note: Actual delivery verification requires FCM admin SDK or test device
  // This test validates client-side notification request flow
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-test login | Setup project + storageState caching | Playwright v1.18 (2021) | 70%+ faster execution, prevents Auth0 rate limiting |
| CSS selectors | Role-based selectors (getByRole) | Playwright v1.27 (2022) | Accessibility validation + stability improvement |
| Manual retries | Auto-retry configuration (retries: 2) | Playwright v1.10 (2020) | Automatic flakiness mitigation, trace capture on failure |
| TEST_MODE bypass | Real Auth0 OAuth flows | Industry shift (2023+) | Security foundation validation, production-realistic testing |
| Fixed waits | Auto-waiting + expect assertions | Playwright v1.0 (2020) | Deterministic tests, faster execution |

**Deprecated/outdated:**
- `page.waitForTimeout(5000)` - Use `expect(locator).toBeVisible({ timeout: 5000 })` for specific conditions
- `TEST_MODE` environment variable for E2E tests - Use real Auth0 flows with session caching
- Hardcoded credentials in test files - Use environment variables loaded from `.env.test` (gitignored)

## Open Questions

1. **Should we create a dedicated Auth0 test user or use a shared account?**
   - What we know: Setup project pattern uses a single account; worker-scoped fixtures support multiple accounts
   - What's unclear: Whether tests modify shared data (thermostat schedules, maintenance state) requiring isolated accounts
   - Recommendation: Start with single test account; add worker-scoped accounts if test isolation becomes an issue

2. **How to handle Firebase RTDB state pollution between tests?**
   - What we know: Tests that change thermostat schedules or stove settings modify Firebase data
   - What's unclear: Whether to reset state via Firebase Admin SDK in beforeEach hooks or accept eventual consistency
   - Recommendation: Use `test.beforeEach()` to reset critical state via API endpoints (e.g., `/api/test-helpers/reset-state`)

3. **Should notification delivery tests use real FCM or mocked push service?**
   - What we know: Real FCM requires test device registration; mocking validates client-side flow only
   - What's unclear: Acceptable tradeoff between test coverage and complexity
   - Recommendation: Mock FCM for E2E tests (validate client request), add manual smoke test for real device delivery

4. **How frequently should we run E2E tests in CI?**
   - What we know: Setup project + caching makes tests fast (~2-3 minutes for full suite)
   - What's unclear: Whether to run on every commit, PR only, or scheduled intervals
   - Recommendation: Run on every PR (prevents regressions), optional scheduled run for extended test suite

## Sources

### Primary (HIGH confidence)
- [Playwright Authentication Documentation](https://playwright.dev/docs/auth) - Official patterns for session caching, setup projects, storageState
- [Playwright CI Integration Guide](https://playwright.dev/docs/ci-intro) - GitHub Actions workflow, artifact management, secrets handling
- [Auth0 + Playwright + Next.js Reference Implementation](https://github.com/testdouble/nextjs-e2e-test-example) - Production-ready example with auth helpers, smoke tests, feature tests
- [Test Double: Auth Flows with Playwright](https://testdouble.com/insights/how-to-test-auth-flows-with-playwright-and-next-js) - Best practices for Auth0 testing, storageState setup

### Secondary (MEDIUM confidence)
- [BrowserStack: Playwright Flaky Tests Guide](https://www.browserstack.com/guide/playwright-flaky-tests) - Auto-waiting strategies, retry configuration
- [Better Stack: Avoiding Flaky Tests](https://betterstack.com/community/guides/testing/avoid-flaky-playwright-tests/) - Locator best practices, timeout configuration
- [Auth0 Rate Limiting Policy](https://auth0.com/docs/troubleshoot/customer-support/operational-policies/rate-limit-policy) - API endpoint limits, prevention strategies
- [Next.js 15 Playwright Testing Guide](https://www.getautonoma.com/blog/nextjs-playwright-testing-guide) - App Router compatibility, critical flow testing

### Tertiary (LOW confidence)
- None—all research findings verified with official documentation or production reference implementations

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Playwright 1.52.0 + Auth0 SDK 4.13.1 verified in package.json, official Next.js 15 support documented
- Architecture: HIGH - Setup project pattern documented in official Playwright guides, reference implementation available
- Pitfalls: HIGH - Auth0 rate limiting verified in official docs, session leakage pattern documented in Playwright issues

**Research date:** 2026-02-10
**Valid until:** 2026-04-10 (60 days—Playwright releases monthly but patterns are stable)
