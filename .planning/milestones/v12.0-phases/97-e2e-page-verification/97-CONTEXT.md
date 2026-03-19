# Phase 97: E2E Page Verification - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Every application page has a Playwright test that verifies it loads, shows content, and produces no console errors. Covers homepage, 5 device pages, and 3 support pages per requirements E2E-01 through E2E-10.

</domain>

<decisions>
## Implementation Decisions

### Page coverage scope
- Test the 9 pages specified in requirements: `/` (homepage), `/stove`, `/thermostat`, `/lights`, `/network`, `/raspi`, `/analytics`, `/settings`, and the admin/debug page
- Sub-pages (scheduler, maintenance, scenes, etc.) are out of scope
- OAuth callback pages (`/lights/authorized`, `/thermostat/authorized`, `/netatmo/authorized`) are out of scope
- Note: Requirements reference `/admin` but no `/admin` route exists — verify whether this maps to `/debug` or `/settings` (or a settings sub-page)

### Test organization
- Single test file: `tests/smoke/page-loads.spec.ts`
- Group by `describe` blocks: Dashboard, Device Pages, Support Pages
- Uses existing `storageState` auth from `tests/auth.setup.ts` (authenticated user)
- All tests depend on `setup` project (same as existing feature tests)

### Console error handling
- Listen for `page.on('console')` events of type `error` only
- Ignore `console.warn` and `console.log` — third-party library warnings must not fail tests
- Collect errors during page load and assert empty array at end of each test
- Requirement E2E-10 (no console errors) is verified per-page, not as a separate test

### Content assertions
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Playwright infrastructure
- `playwright.config.ts` — Test config: Auth0 auth setup, chromium project, storageState
- `tests/auth.setup.ts` — Authentication setup (real Auth0 flow, session caching)
- `tests/helpers/auth.helpers.ts` — signIn/signOut helper functions
- `tests/helpers/test-context.ts` — Environment config (TEST_USER, baseURL)

### Existing E2E tests (patterns to follow)
- `tests/smoke/auth-flows.spec.ts` — Auth flow tests (pattern for page assertions)
- `tests/features/stove-ignition.spec.ts` — Feature test (pattern for device page interaction)
- `tests/features/thermostat-schedule.spec.ts` — Feature test pattern
- `tests/features/notification-delivery.spec.ts` — Feature test pattern

### App pages (test targets)
- `app/page.tsx` — Homepage/dashboard
- `app/stove/page.tsx` — Stove device page
- `app/thermostat/page.tsx` — Thermostat device page
- `app/lights/page.tsx` — Lights device page
- `app/network/page.tsx` — Network device page
- `app/raspi/page.tsx` — Raspberry Pi device page
- `app/analytics/page.tsx` — Analytics page
- `app/settings/page.tsx` — Settings page

### Requirements
- `.planning/REQUIREMENTS.md` — E2E-01 through E2E-10

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tests/auth.setup.ts`: Auth0 login flow with session caching via `storageState` — all page tests reuse this
- `tests/helpers/auth.helpers.ts`: `signIn`/`signOut` functions — may be useful if tests need re-auth
- `tests/helpers/test-context.ts`: `TEST_USER` credentials and environment config
- Existing `tests/smoke/auth-flows.spec.ts`: Pattern for `expect(page).toHaveURL()` and `getByRole` assertions

### Established Patterns
- Playwright config uses `storageState: 'tests/.auth/user.json'` for authenticated tests
- `setup` project dependency ensures auth runs before tests
- `fullyParallel: true` enabled — page load tests will run in parallel by default
- `baseURL: 'http://localhost:3000'` — use relative paths in `page.goto()`

### Integration Points
- All pages require authentication (Auth0) — tests must use `storageState` from setup project
- Device pages fetch from API routes — tests run against live dev server (`reuseExistingServer: !process.env.CI`)
- Dashboard cards load asynchronously with `initialDelay` stagger — homepage test needs to wait for cards

</code_context>

<specifics>
## Specific Ideas

No specific requirements — straightforward smoke test suite following existing Playwright patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 97-e2e-page-verification*
*Context gathered: 2026-03-18*
