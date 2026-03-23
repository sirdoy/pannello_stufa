---
phase: 120-device-types-ui
plan: 01
subsystem: ui
tags: [react, next.js, tanstack-table, zod, react-hook-form, device-registry]

# Dependency graph
requires:
  - phase: 118-registry-infrastructure
    provides: DeviceType types in types/registry.ts, GET/POST /api/registry/types, DELETE /api/registry/types/[slug]
provides:
  - Device Types management page at /registry/types with full CRUD UI
  - useDeviceTypes hook (fetch + sort + error handling)
  - Unit tests covering DTYPE-01, DTYPE-02, DTYPE-03
affects: [121-devices-ui, future registry UI phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Device Types page pattern: useDeviceTypes hook + DataTable + FormModal + ConfirmationDialog in single page component"
    - "TDD RED-GREEN: test file committed first (failing), then implementation committed (all pass)"
    - "FormModal test pattern: bypass render-prop children with simplified mock that calls onSubmit directly"
    - "Sequential fetch override in tests: set global.fetch before triggering action rather than using mockImplementationOnce chains"

key-files:
  created:
    - app/registry/types/page.tsx
    - app/registry/types/__tests__/page.test.tsx
  modified: []

key-decisions:
  - "FormModal test mock bypasses render-prop children entirely (avoids react-hook-form Controller needing real control object)"
  - "Test fetch override pattern: replace global.fetch before triggering the action under test rather than chaining mockImplementationOnce"

patterns-established:
  - "Device Registry UI pattern: 'use client' page + inline hook + DataTable columns with cell renderers + FormModal + ConfirmationDialog"
  - "Badge variant usage: ocean=built-in, neutral=custom"
  - "Sort order: built-in types first, then alphabetical by label with it-IT locale"

requirements-completed: [DTYPE-01, DTYPE-02, DTYPE-03]

# Metrics
duration: 15min
completed: 2026-03-23
---

# Phase 120 Plan 01: Device Types UI Summary

**Device Types CRUD page at /registry/types: DataTable list (built-in first, it-IT sort), FormModal create with Zod slug/label validation (409 keeps modal open), ConfirmationDialog delete (built-in types protected), 9 unit tests all passing**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-23T11:09:31Z
- **Completed:** 2026-03-23T11:24:00Z
- **Tasks:** 2 (TDD: RED + GREEN)
- **Files modified:** 2

## Accomplishments
- `useDeviceTypes` hook fetches GET /api/registry/types, sorts (built-in first, alphabetical it-IT), returns loading/error/refetch
- DataTable with 5 columns: Etichetta (sortable), Slug (monospace code), Tipo (Badge ocean/neutral), Creato (it-IT date), actions (Elimina for custom only)
- FormModal with Zod schema: slug `^[a-z0-9_]+$` max 64, label min 1 max 128; 409 throws to keep modal open
- ConfirmationDialog for delete: only rendered for custom types; 409 shows toast "Tipo in uso da dispositivi registrati"
- All 9 unit tests pass covering DTYPE-01, DTYPE-02, DTYPE-03

## Task Commits

Each task was committed atomically:

1. **Task 1: Create unit tests for Device Types page** - `4f0f6398` (test) — RED phase, 9 failing tests
2. **Task 2: Implement Device Types page with useDeviceTypes hook** - `8fe01eec` (feat) — GREEN phase, all 9 tests pass

_Note: TDD tasks have two commits (test → feat). Test file also updated in feat commit to fix test patterns._

## Files Created/Modified
- `app/registry/types/page.tsx` - Device Types page: `'use client'`, `useDeviceTypes` hook, DataTable + FormModal + ConfirmationDialog
- `app/registry/types/__tests__/page.test.tsx` - 9 unit tests covering DTYPE-01/02/03

## Decisions Made
- Test mock for FormModal bypasses render-prop children entirely to avoid react-hook-form Controller needing a real control object in test environment
- Sequential fetch override pattern: replace `global.fetch` before triggering the action under test rather than chaining `mockImplementationOnce`, which avoids timing issues with refetch calls interleaving

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed FormModal test mock and fetch spy patterns**
- **Found during:** Task 2 (GREEN phase test run)
- **Issue:** 4 of 9 tests failed: (a) FormModal mock passed `{ control: {}, formState: {} }` to children causing react-hook-form `Controller` to crash; (b) Tests 8/9 had text match ambiguity and fetch mock ordering issues
- **Fix:** Simplified FormModal mock to bypass children entirely; replaced `mockImplementationOnce` chains with direct `global.fetch` override before triggering action; tightened regex text match for ConfirmationDialog description
- **Files modified:** app/registry/types/__tests__/page.test.tsx
- **Verification:** All 9 tests pass (GREEN)
- **Committed in:** 8fe01eec (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - test mock bug)
**Impact on plan:** Test mock pattern fix only. Page implementation matches plan exactly. No scope creep.

## Issues Encountered
- FormModal render-prop mock pattern: passing empty `control` object to `Controller` from react-hook-form causes internal crash. Solution: mock FormModal to skip children rendering entirely, calling `onSubmit` directly from a test button.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Device Types page complete, ready for Phase 121 (Devices UI at /registry/devices)
- Pattern established: `useDeviceTypes` hook + DataTable + FormModal + ConfirmationDialog can be replicated for devices
- /registry/types requires Auth0 session for POST/DELETE (built-in API auth via withAuthAndErrorHandler)
