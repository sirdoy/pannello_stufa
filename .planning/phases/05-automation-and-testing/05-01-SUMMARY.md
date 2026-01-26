---
phase: 05-automation-and-testing
plan: 01
subsystem: testing
tags: [playwright, e2e, testing, page-object-model, indexeddb, fixtures]

# Dependency graph
requires:
  - phase: 04-notification-history-and-devices
    provides: UI components for history, devices, admin test panel
provides:
  - Playwright E2E testing infrastructure with 3 browser projects
  - Page Object Model classes for admin pages
  - Authentication and notification permission fixtures
  - IndexedDB helpers for token persistence testing
  - Stable data-testid selectors on UI components
affects: [05-02, 05-03, 05-04, 05-05]

# Tech tracking
tech-stack:
  added: ["@playwright/test@^1.52.0"]
  patterns:
    - "Page Object Model for maintainable E2E tests"
    - "Fixtures for pre-authenticated and notification-enabled contexts"
    - "data-testid selectors for stable E2E test targeting"
    - "IndexedDB helpers for Dexie database testing"

key-files:
  created:
    - playwright.config.ts
    - e2e/fixtures/authenticated.ts
    - e2e/fixtures/notifications.ts
    - e2e/pages/AdminNotifications.ts
    - e2e/pages/NotificationHistory.ts
    - e2e/pages/Settings.ts
    - e2e/utils/db-helpers.ts
  modified:
    - package.json
    - app/debug/notifications/test/page.js
    - components/notifications/NotificationInbox.js
    - components/notifications/NotificationItem.js
    - components/notifications/NotificationFilters.js
    - app/settings/notifications/devices/page.js
    - components/notifications/DeviceListItem.js

key-decisions:
  - "Use Playwright 1.52 for cross-browser E2E testing (Chromium, Firefox, WebKit)"
  - "Page Object Model pattern for maintainability and selector encapsulation"
  - "data-testid attributes for stable selectors (immune to UI changes)"
  - "Mock Push API in fixtures to prevent real FCM calls during tests"
  - "IndexedDB helpers for testing Dexie token persistence"
  - "Production webServer (npm run build + npm run start) required for Serwist SW testing"

patterns-established:
  - "Page Object classes encapsulate locators and actions per page"
  - "Fixtures extend base test with pre-configured contexts"
  - "data-testid attributes on all interactive UI elements for E2E stability"
  - "IndexedDB helpers provide page.evaluate wrappers for Dexie operations"

# Metrics
duration: 4.7min
completed: 2026-01-26
---

# Phase 5 Plan 1: Playwright Infrastructure Setup Summary

**Playwright 1.52 E2E infrastructure with Page Object Model, authentication fixtures, and data-testid selectors for stable cross-browser testing**

## Performance

- **Duration:** 4.7 min
- **Started:** 2026-01-26T11:17:00Z
- **Completed:** 2026-01-26T11:21:42Z
- **Tasks:** 3
- **Files modified:** 14

## Accomplishments

- Playwright configured for 3 browsers (Chromium, Firefox, WebKit) with sharding support
- Page Object Model classes created for admin notifications, history, and settings pages
- Authentication and notification permission fixtures with Push API mocking
- IndexedDB helpers for testing token persistence across "browser restarts"
- data-testid attributes added to 15+ UI elements across admin and user-facing pages

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Playwright and Configure Project** - `5bc7480` (chore)
2. **Task 2: Create Page Objects and Fixtures** - `ba856db` (feat)
3. **Task 3: Add data-testid Attributes to UI Components** - `cc37c6f` (feat)

## Files Created/Modified

**Created:**
- `playwright.config.ts` - Playwright config with 3 browser projects, production webServer, sharding support
- `e2e/fixtures/authenticated.ts` - Pre-authenticated test fixture (Auth0 placeholder)
- `e2e/fixtures/notifications.ts` - Notification permission fixture with Push API mocking
- `e2e/pages/AdminNotifications.ts` - Page Object for /debug/notifications/test
- `e2e/pages/NotificationHistory.ts` - Page Object for /settings/notifications/history
- `e2e/pages/Settings.ts` - Page Object for notification settings
- `e2e/utils/db-helpers.ts` - IndexedDB helpers for token persistence testing

**Modified:**
- `package.json` - Added @playwright/test, test:e2e scripts
- `app/debug/notifications/test/page.js` - Added 8 data-testid attributes
- `components/notifications/NotificationInbox.js` - Added notification-list, load-more testids
- `components/notifications/NotificationItem.js` - Added notification-item testid
- `components/notifications/NotificationFilters.js` - Added history-filter testid
- `app/settings/notifications/devices/page.js` - Added device-list testid
- `components/notifications/DeviceListItem.js` - Added device-item, device-name-input, remove-device testids

## Decisions Made

**1. Playwright 1.52 chosen over Cypress**
- Rationale: Better service worker support, WebKit coverage, official Next.js recommendation
- Impact: E2E tests can verify PWA behavior across all major browsers

**2. Production webServer mode required**
- Rationale: Serwist service worker only generated in production builds
- Impact: Tests must wait for `npm run build && npm run start` (2-minute timeout)

**3. data-testid attributes for all interactive elements**
- Rationale: Immune to CSS class changes, stable across UI refactors
- Impact: Test selectors won't break when design system changes

**4. Mock Push API in fixtures**
- Rationale: Prevent real FCM calls during tests, avoid rate limits
- Impact: Tests can run without Firebase credentials, faster execution

**5. Page Object Model pattern enforced**
- Rationale: Centralize selectors, improve maintainability, recommended by Playwright docs
- Impact: Tests remain readable, selector changes localized to Page Objects

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - infrastructure setup completed without blockers.

## User Setup Required

**Before running E2E tests, user must:**

1. Install Playwright browsers:
   ```bash
   npm install
   npx playwright install chromium firefox webkit
   ```

2. Build project in production mode (required for Serwist):
   ```bash
   npm run build
   ```

3. Run E2E tests:
   ```bash
   npm run test:e2e           # Headless mode
   npm run test:e2e:ui        # Interactive UI mode
   npm run test:e2e:headed    # Watch tests run in browser
   ```

**Note:** Tests will not work until Plan 05-03 implements actual test specs.

## Next Phase Readiness

**Ready for Plan 05-02 (HMAC-secured cron webhook):**
- E2E infrastructure complete
- No dependencies on cron implementation

**Ready for Plan 05-03 (E2E test specs):**
- Page Objects ready for test authoring
- Fixtures provide authenticated and notification-enabled contexts
- IndexedDB helpers enable token persistence verification
- data-testid selectors stable for all user flows

**Blockers:**
- None

**Concerns:**
- Auth0 authentication not yet mocked in authenticated.ts fixture (will be enhanced in Plan 05-03)
- 2-minute webServer timeout may be tight in CI with cold cache (monitor in Plan 05-05)

---
*Phase: 05-automation-and-testing*
*Completed: 2026-01-26*
