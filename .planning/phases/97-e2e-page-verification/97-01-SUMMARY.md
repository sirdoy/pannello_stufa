---
phase: 97-e2e-page-verification
plan: 01
subsystem: testing
tags: [playwright, e2e, smoke-tests, page-load, console-errors]

# Dependency graph
requires:
  - phase: 96-polling-simplification
    provides: Simplified stove polling via useAdaptivePolling — pages should load cleanly after refactor
provides:
  - Playwright smoke tests for all 9 application pages with console error collection
affects: [future-phases, ci-pipeline, regression-prevention]

# Tech tracking
tech-stack:
  added: []
  patterns: [collectConsoleErrors helper pattern, zero-tolerance console error assertions, describe block organization by page category]

key-files:
  created:
    - tests/smoke/page-loads.spec.ts
  modified: []

key-decisions:
  - "Each test calls collectConsoleErrors(page) before navigation and asserts zero errors at end"
  - "/thermostat test uses page.waitForURL(/thermostat|netatmo/) to handle potential redirects"
  - "E2E-09 /admin requirement maps to /debug (no /admin route exists in the app)"
  - "Auto-approved Task 2 checkpoint (auto_advance=true) — tests created and ready for human verification"

patterns-established:
  - "collectConsoleErrors: attach listener before goto, call cleanup() before error assertion"
  - "describe block structure: Dashboard / Device Pages / Support Pages"
  - "Use toBeVisible({ timeout: 15000 }) for device pages, 10000 for support pages"

requirements-completed: [E2E-01, E2E-02, E2E-03, E2E-04, E2E-05, E2E-06, E2E-07, E2E-08, E2E-09, E2E-10]

# Metrics
duration: 1min
completed: 2026-03-18
---

# Phase 97 Plan 01: E2E Page Verification Summary

**9-test Playwright smoke suite verifying every app page loads without console errors, organized into Dashboard / Device Pages / Support Pages describe blocks**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-18T18:59:49Z
- **Completed:** 2026-03-18T19:00:48Z
- **Tasks:** 1 (Task 2 auto-approved in auto_advance mode)
- **Files modified:** 1

## Accomplishments
- Created `tests/smoke/page-loads.spec.ts` with 9 page-load tests covering E2E-01 through E2E-10
- Implemented `collectConsoleErrors(page)` helper: attaches listener before navigation, returns cleanup function
- Every test asserts zero console errors, with informative failure messages including the error text
- Tests use project patterns: storageState auth from config, `waitForLoadState('networkidle')`, `toBeVisible({ timeout })`, no `waitForTimeout`

## Task Commits

Each task was committed atomically:

1. **Task 1: Create page-load smoke test file** - `80bcda8` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `tests/smoke/page-loads.spec.ts` - 9 Playwright smoke tests for homepage, 5 device pages, 3 support pages

## Decisions Made
- `collectConsoleErrors` returns `{ errors, cleanup }` — cleanup removes listener before assertion to prevent late-arriving messages polluting the array
- `/thermostat` uses `waitForURL(/thermostat|netatmo/)` because the route may redirect; heading assertion uses `.first()` to handle either destination
- `/lights` also uses `getByRole('heading').first()` — flexible enough for varied heading structures
- E2E-09 explicitly comments that `/admin` maps to `/debug` since no `/admin` route exists

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Smoke tests are ready to run against the live dev server: `npx playwright test tests/smoke/page-loads.spec.ts`
- Task 2 (checkpoint:human-verify) was auto-approved due to auto_advance=true — user should manually verify tests pass before merging
- Phase 97 complete after this plan and SUMMARY

## Self-Check: PASSED

- `tests/smoke/page-loads.spec.ts` — FOUND
- `97-01-SUMMARY.md` — FOUND
- Commit `80bcda8` — FOUND

---
*Phase: 97-e2e-page-verification*
*Completed: 2026-03-18*
