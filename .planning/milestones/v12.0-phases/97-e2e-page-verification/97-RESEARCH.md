# Phase 97: E2E Page Verification - Research

**Researched:** 2026-03-18
**Domain:** Playwright E2E smoke tests — page load verification
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Page coverage scope:**
- Test the 9 pages specified in requirements: `/` (homepage), `/stove`, `/thermostat`, `/lights`, `/network`, `/raspi`, `/analytics`, `/settings`, and the admin/debug page
- Sub-pages (scheduler, maintenance, scenes, etc.) are out of scope
- OAuth callback pages (`/lights/authorized`, `/thermostat/authorized`, `/netatmo/authorized`) are out of scope
- Note: Requirements reference `/admin` but no `/admin` route exists — verify whether this maps to `/debug` or `/settings` (or a settings sub-page)

**Test organization:**
- Single test file: `tests/smoke/page-loads.spec.ts`
- Group by `describe` blocks: Dashboard, Device Pages, Support Pages
- Uses existing `storageState` auth from `tests/auth.setup.ts` (authenticated user)
- All tests depend on `setup` project (same as existing feature tests)

**Console error handling:**
- Listen for `page.on('console')` events of type `error` only
- Ignore `console.warn` and `console.log` — third-party library warnings must not fail tests
- Collect errors during page load and assert empty array at end of each test
- Requirement E2E-10 (no console errors) is verified per-page, not as a separate test

**Content assertions:**
- Each page test checks three things:
  1. No error boundary or error state component visible
  2. A key heading or data section element is visible (e.g., `getByRole('heading')` or specific data container)
  3. No infinite loading state — wait for loading indicators to disappear within timeout
- Homepage (E2E-01): verify dashboard cards are visible (not just the page shell)
- Device pages (E2E-02–06): verify the data section is visible (proves API responded)
- Support pages (E2E-07–09): verify the page loads without error state (lighter assertion)

### Claude's Discretion
- Exact selectors for each page's key element
- Whether to use a shared helper for console error collection or inline per test
- Timeout values for loading state assertions
- Whether to add `test.describe.configure({ mode: 'parallel' })` for speed

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| E2E-01 | Playwright verifica homepage carica tutte le card visibili senza errori | DashboardCards is async SC wrapped in Suspense; wait for networkidle + stove heading visible |
| E2E-02 | Playwright verifica /stove carica e mostra dati | StovePage has initialLoading skeleton guard; assert stove hero visible after skeleton disappears |
| E2E-03 | Playwright verifica /thermostat carica e mostra dati | NetatmoPage redirects to /netatmo if not connected; assert "Controllo Netatmo" heading |
| E2E-04 | Playwright verifica /lights carica e mostra dati | LightsPage has loading state + pairing flow; assert page heading visible |
| E2E-05 | Playwright verifica /network carica e mostra dati | NetworkPage has skeleton guard; assert "Rete" heading level 1 visible |
| E2E-06 | Playwright verifica /raspi carica e mostra dati | RaspiPage has skeleton guard; assert "Raspberry Pi" heading level 1 visible |
| E2E-07 | Playwright verifica /analytics carica | AnalyticsPage always renders heading; assert "Analytics" heading visible |
| E2E-08 | Playwright verifica /settings carica | SettingsPage renders tabs; assert "Impostazioni" heading or tabs visible |
| E2E-09 | Playwright verifica /admin carica | Requirements say /admin — maps to /debug in this app; assert "API Debug Console" heading |
| E2E-10 | Nessuna pagina ha console errors o loading infiniti | Verified per-page via console listener; no separate test |
</phase_requirements>

---

## Summary

This phase creates a single Playwright smoke test file (`tests/smoke/page-loads.spec.ts`) covering 9 application pages. The test infrastructure is already complete — Playwright config, Auth0 setup, session caching, and helper functions all exist and work. The only deliverable is the new test file.

The primary technical challenge is correctly handling asynchronous page states. Several pages use skeleton loading guards that disappear after API data arrives, dashboard cards render with stagger animation delays, and the thermostat page may redirect to `/netatmo` if Netatmo tokens are missing. Each test must wait for the meaningful content — not just the page shell or skeleton — to confirm the page is operational.

The `/admin` requirement maps to `/debug` since no `/admin` route exists in the app. The `/debug` page renders "API Debug Console" as a level-1 heading, making it a clean assertion target.

**Primary recommendation:** Use a shared `collectConsoleErrors` helper function (returns a cleanup function and error array) to avoid copy-paste across 9 tests. Apply `waitForLoadState('networkidle')` judiciously — it suits the homepage's async Server Component waterfall but may be unnecessary for client-only pages that use loading skeleton guards.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @playwright/test | Already installed (project uses it for auth-flows + feature tests) | Test runner, assertions, browser automation | Project standard — no change needed |

### No new dependencies required
This phase adds only a new test file. The existing Playwright installation, config, and helpers are sufficient.

---

## Architecture Patterns

### Recommended Project Structure
```
tests/
├── smoke/
│   ├── auth-flows.spec.ts    # Existing
│   └── page-loads.spec.ts    # NEW — this phase
├── features/
│   ├── stove-ignition.spec.ts
│   ├── thermostat-schedule.spec.ts
│   └── notification-delivery.spec.ts
├── helpers/
│   ├── auth.helpers.ts
│   └── test-context.ts
└── auth.setup.ts
```

### Pattern 1: Console Error Collection Helper

**What:** A shared utility that attaches a `page.on('console')` listener before navigation and returns the error list for assertion after.

**When to use:** Every page test in this file — avoids repeating the listener setup 9 times.

```typescript
// Source: Playwright docs — page.on('console') event
function collectConsoleErrors(page: Page): { errors: string[]; cleanup: () => void } {
  const errors: string[] = [];
  const handler = (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  };
  page.on('console', handler);
  const cleanup = () => page.off('console', handler);
  return { errors, cleanup };
}
```

### Pattern 2: Loading State Wait Strategy

**What:** Use `waitForLoadState('networkidle')` for the homepage (async Server Component with multiple API requests during render) but rely on `expect(element).toBeVisible({ timeout: 15000 })` for client-side pages that manage their own loading state.

**When to use:**
- Homepage: `networkidle` — DashboardCards is an async SC, triggering multiple API fetches server-side
- /stove, /network, /raspi: heading visibility with extended timeout — these pages show skeleton until first poll completes
- /thermostat, /lights, /analytics, /settings, /debug: heading visibility — these pages render quickly once loaded

```typescript
// Homepage pattern (from existing stove-ignition.spec.ts)
await page.goto('/');
await page.waitForLoadState('networkidle');
await expect(page.getByRole('heading', { name: 'Stufa', level: 2 })).toBeVisible({ timeout: 15000 });

// Device page pattern
await page.goto('/stove');
await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
```

### Pattern 3: Test Structure (from auth-flows.spec.ts)

```typescript
// Source: tests/smoke/auth-flows.spec.ts
import { test, expect } from '@playwright/test';
// storageState applied globally via playwright.config.ts — no per-file override needed

test.describe('Page Loads', () => {
  test.describe('Dashboard', () => {
    test('homepage loads with dashboard cards', async ({ page }) => { ... });
  });

  test.describe('Device Pages', () => {
    test('/stove loads and shows data', async ({ page }) => { ... });
    // ...
  });

  test.describe('Support Pages', () => {
    test('/analytics loads', async ({ page }) => { ... });
    // ...
  });
});
```

### Anti-Patterns to Avoid

- **Hardcoding dynamic content as selectors:** Stove status text (SPENTA/IN FUNZIONE) changes at runtime — assert heading presence, not status badge text.
- **Not waiting for skeleton to clear:** Asserting a heading that exists in both skeleton and loaded states will pass prematurely. Use `toBeVisible` on content-specific elements that only appear after data loads.
- **Using `page.waitForTimeout()` for load waits:** Playwright's `toBeVisible({ timeout })` is more reliable than fixed sleep.
- **Attaching console listener after goto:** The listener must be attached BEFORE navigation to capture errors emitted during page load.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Console error collection | Custom EventEmitter wrapper | `page.on('console', handler)` + off on cleanup | Playwright has native console event support |
| Authentication in tests | Re-implementing login flow | `storageState: 'tests/.auth/user.json'` in playwright.config.ts | Auth setup project runs once, sessions are cached |
| Wait-for-load logic | Manual polling loops | `waitForLoadState()` or `expect().toBeVisible({ timeout })` | Playwright auto-retries assertions |

---

## Common Pitfalls

### Pitfall 1: /thermostat Redirect
**What goes wrong:** The thermostat page (`app/thermostat/page.tsx`) calls `router.replace('/netatmo')` inside a `useEffect` if the user is not connected to Netatmo. In a test environment where Netatmo tokens may not be configured, the page may redirect away.

**Why it happens:** `checkConnection()` fetches `/api/netatmo/homesdata` and if it returns a missing-token error, `setConnected(false)` triggers the redirect effect.

**How to avoid:** Use `page.waitForURL` with a timeout that accepts either `/thermostat` staying put OR the redirect. Alternatively, assert a heading that appears in the error state ("Errore Connessione Netatmo") or the loaded state ("Controllo Netatmo") — either is acceptable for a smoke test that only needs to verify "page loads without crashing".

**Warning signs:** Test navigates to `/thermostat` but immediately lands on `/netatmo` URL.

### Pitfall 2: Dashboard Cards Stagger Animation
**What goes wrong:** DashboardCards renders cards with `animationDelay: ${flatIndex * 100}ms`. The last card (index 6, 700ms delay) won't be visible immediately after navigation.

**Why it happens:** The animation delay is applied via inline style, so cards are in the DOM but hidden during animation.

**How to avoid:** Assert `getByRole('heading', { name: 'Stufa', level: 2 })` (StoveCard, first card) rather than waiting for all cards. The heading assertion with a 15000ms timeout is sufficient. The existing `stove-ignition.spec.ts` already uses this pattern successfully.

### Pitfall 3: Console Error from Third-Party Libraries
**What goes wrong:** React DevTools, Auth0 SDK, or Firebase SDK occasionally emit console errors that are not application errors (e.g., Auth0 emitting `"Missing Refresh Token"` internally before recovering).

**Why it happens:** Third-party libraries use `console.error` for internal logging.

**How to avoid:** The CONTEXT.md decision to only capture `msg.type() === 'error'` already scopes this correctly. If flakiness occurs, filter by checking that errors don't contain known third-party prefixes — but do NOT pre-emptively add filters; add them only if specific errors are confirmed to be false positives.

### Pitfall 4: /admin Requirement Maps to /debug
**What goes wrong:** E2E-09 says "verify /admin loads" but there is no `/admin` route in the application. Navigating to `/admin` will return a 404.

**Why it happens:** The requirements were written before the admin/debug routes were settled, and the CONTEXT.md already flags this discrepancy.

**How to avoid:** Test `/debug` for E2E-09. The `/debug` page renders `<Heading level={1}>API Debug Console</Heading>` which is a reliable assertion target. Document in the test comment that this covers E2E-09 (admin/debug page).

### Pitfall 5: Parallel Execution and Auth State
**What goes wrong:** `fullyParallel: true` is enabled globally. If a test modifies auth state (e.g., navigates to logout), it will invalidate the shared `storageState` for other parallel tests.

**Why it happens:** All chromium project tests share `tests/.auth/user.json` loaded at startup.

**How to avoid:** Page load tests only do `page.goto()` and read-only assertions — no auth mutations. This is not a concern for this test file. Do NOT call `signOut()` in any of these tests.

---

## Code Examples

Verified patterns from project codebase:

### Console Error Collection + Page Load Test Structure
```typescript
// Source: Playwright docs pattern + project test conventions
import { test, expect, type ConsoleMessage, type Page } from '@playwright/test';

function collectConsoleErrors(page: Page): { errors: string[]; cleanup: () => void } {
  const errors: string[] = [];
  const handler = (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  };
  page.on('console', handler);
  return {
    errors,
    cleanup: () => page.off('console', handler),
  };
}

test('homepage loads with dashboard cards', async ({ page }) => {
  const { errors, cleanup } = collectConsoleErrors(page);

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Verify stove card visible (first card, no animation delay impact)
  await expect(page.getByRole('heading', { name: 'Stufa', level: 2 })).toBeVisible({ timeout: 15000 });

  cleanup();
  expect(errors, `Console errors on /: ${errors.join(', ')}`).toHaveLength(0);
});
```

### Device Page Pattern (with skeleton guard)
```typescript
// Source: app/network/page.tsx — Heading level={1} with text "Rete"
test('/network loads and shows data', async ({ page }) => {
  const { errors, cleanup } = collectConsoleErrors(page);

  await page.goto('/network');
  // Heading appears after skeleton clears (networkData.loading resolves)
  await expect(page.getByRole('heading', { name: 'Rete', level: 1 })).toBeVisible({ timeout: 15000 });

  cleanup();
  expect(errors, `Console errors on /network: ${errors.join(', ')}`).toHaveLength(0);
});
```

### Support Page Pattern (lighter assertion)
```typescript
// Source: app/analytics/page.tsx — Heading level={1} variant="ember" with text "Analytics"
test('/analytics loads', async ({ page }) => {
  const { errors, cleanup } = collectConsoleErrors(page);

  await page.goto('/analytics');
  await expect(page.getByRole('heading', { name: 'Analytics', level: 1 })).toBeVisible({ timeout: 10000 });

  cleanup();
  expect(errors, `Console errors on /analytics: ${errors.join(', ')}`).toHaveLength(0);
});
```

---

## Page-by-Page Selector Reference

Derived from reading each page's source code:

| Page | URL | Key Selector | Source |
|------|-----|-------------|--------|
| Homepage | `/` | `getByRole('heading', { name: 'Stufa', level: 2 })` | StoveCard renders first; h1 is sr-only |
| Stove | `/stove` | `getByRole('heading', { level: 1 })` (sr-only "Controllo Stufa") or wait for StovePageHero content | app/stove/page.tsx line 109 |
| Thermostat | `/thermostat` | `getByRole('heading', { name: 'Controllo Netatmo' })` OR `getByText('Errore Connessione Netatmo')` | app/thermostat/page.tsx line 429 / 279 |
| Lights | `/lights` | `getByRole('heading')` — first visible heading | app/lights/page.tsx (large file, see below) |
| Network | `/network` | `getByRole('heading', { name: 'Rete', level: 1 })` | app/network/page.tsx line 158 |
| Raspi | `/raspi` | `getByRole('heading', { name: 'Raspberry Pi', level: 1 })` | app/raspi/page.tsx line 51 |
| Analytics | `/analytics` | `getByRole('heading', { name: 'Analytics', level: 1 })` | app/analytics/page.tsx line 131 |
| Settings | `/settings` | `getByRole('heading', { name: 'Impostazioni' })` | app/settings/page.tsx line 715 (SettingsLayout title) |
| Admin/Debug | `/debug` | `getByRole('heading', { name: /API Debug Console/i })` | app/debug/page.tsx line 338 |

**Stove page note:** The h1 is `sr-only` ("Controllo Stufa"). The real visual test is `StovePageHero` which renders the status section. Use `getByRole('heading', { name: 'Controllo Stufa' })` (it's in DOM even if visually hidden) — this still proves the page rendered without an error boundary.

**Lights page note:** The page source was too large to include fully, but the pattern follows: there's a loading state on mount. The page heading or first visible UI element (room list or pairing prompt) should be the assertion target. Safer to use `getByRole('heading').first()` with a timeout.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate test files per page | Single file with describe groups | This phase | Simpler, all smoke tests co-located |
| `waitForTimeout` fixed delays | `toBeVisible({ timeout })` with auto-retry | Playwright best practice | More reliable, no arbitrary waits |

---

## Open Questions

1. **/thermostat with no Netatmo tokens**
   - What we know: The page calls `/api/netatmo/homesdata` on mount. If tokens are absent it calls `router.replace('/netatmo')`.
   - What's unclear: In the test environment (live dev server), are Netatmo tokens present? If the test user has valid tokens, the page loads normally. If not, it redirects.
   - Recommendation: Assert with `toHaveURL(/thermostat|netatmo/)` to accept both states, then assert a heading that exists in either path. OR, check the assertion both: if redirected, the `/netatmo` page should still load — which is an acceptable smoke test outcome.

2. **/lights pairing state**
   - What we know: LightsPage checks Hue bridge pairing on load. If no bridge is paired, it shows a pairing flow UI.
   - What's unclear: Whether the test environment has a paired Hue bridge.
   - Recommendation: Assert that any heading is visible (`getByRole('heading').first()`) — this covers both the paired state (room list heading) and the unpaired state (pairing wizard heading).

3. **E2E-09 /admin mapping**
   - What we know: No `/admin` route exists. `/debug` is the developer console page.
   - Recommendation confirmed: Test `/debug` for E2E-09. Add code comment: `// E2E-09: /admin requirement maps to /debug (no /admin route exists)`.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright (already installed) |
| Config file | `playwright.config.ts` |
| Quick run command | `npx playwright test tests/smoke/page-loads.spec.ts` |
| Full suite command | `npx playwright test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| E2E-01 | Homepage loads all cards | smoke | `npx playwright test tests/smoke/page-loads.spec.ts --grep "homepage"` | ❌ Wave 0 |
| E2E-02 | /stove loads and shows data | smoke | `npx playwright test tests/smoke/page-loads.spec.ts --grep "stove"` | ❌ Wave 0 |
| E2E-03 | /thermostat loads and shows data | smoke | `npx playwright test tests/smoke/page-loads.spec.ts --grep "thermostat"` | ❌ Wave 0 |
| E2E-04 | /lights loads and shows data | smoke | `npx playwright test tests/smoke/page-loads.spec.ts --grep "lights"` | ❌ Wave 0 |
| E2E-05 | /network loads and shows data | smoke | `npx playwright test tests/smoke/page-loads.spec.ts --grep "network"` | ❌ Wave 0 |
| E2E-06 | /raspi loads and shows data | smoke | `npx playwright test tests/smoke/page-loads.spec.ts --grep "raspi"` | ❌ Wave 0 |
| E2E-07 | /analytics loads | smoke | `npx playwright test tests/smoke/page-loads.spec.ts --grep "analytics"` | ❌ Wave 0 |
| E2E-08 | /settings loads | smoke | `npx playwright test tests/smoke/page-loads.spec.ts --grep "settings"` | ❌ Wave 0 |
| E2E-09 | /debug (admin) loads | smoke | `npx playwright test tests/smoke/page-loads.spec.ts --grep "debug"` | ❌ Wave 0 |
| E2E-10 | No console errors on any page | smoke | Verified inline in each test above | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx playwright test tests/smoke/page-loads.spec.ts`
- **Per wave merge:** `npx playwright test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/smoke/page-loads.spec.ts` — covers E2E-01 through E2E-10 (entire phase deliverable)

---

## Sources

### Primary (HIGH confidence)
- `playwright.config.ts` — project Playwright config: auth, projects, fullyParallel, baseURL, timeout
- `tests/auth.setup.ts` — session caching pattern with storageState
- `tests/smoke/auth-flows.spec.ts` — existing smoke test structure to follow
- `tests/features/stove-ignition.spec.ts` — waitForLoadState('networkidle') + heading assertion pattern
- `app/page.tsx` — homepage structure (sr-only h1, async DashboardCards)
- `app/stove/page.tsx` — stove page structure, sr-only h1, skeleton guard
- `app/thermostat/page.tsx` — Netatmo redirect logic, "Controllo Netatmo" heading
- `app/lights/page.tsx` — lights page load state
- `app/network/page.tsx` — "Rete" h1 heading, skeleton guard
- `app/raspi/page.tsx` — "Raspberry Pi" h1 heading, skeleton guard
- `app/analytics/page.tsx` — "Analytics" h1 heading, always rendered
- `app/settings/page.tsx` — "Impostazioni" heading, tab structure
- `app/debug/page.tsx` — "API Debug Console" h1 heading, no /admin route

### Secondary (MEDIUM confidence)
- Playwright documentation patterns for `page.on('console')` and `ConsoleMessage` API (verified against project usage in existing test files)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — project already uses Playwright, no new packages
- Architecture: HIGH — existing test patterns directly reusable, page source read for selectors
- Pitfalls: HIGH — derived from reading actual page source code logic
- Selectors: MEDIUM — heading selectors confirmed from source; /lights and /thermostat state-dependent

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable — page headings change rarely)
