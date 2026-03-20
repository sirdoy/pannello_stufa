---
phase: 105-fix-debug-panel-urls-stale-routes
plan: 01
subsystem: debug
tags: [debug-panel, routes, stove, gap-closure]

# Dependency graph
requires:
  - phase: 103-thermorossi-cleanup
    provides: Deleted stale API route files (getRoomTemperature, getSettings, setSettings, commands/ignit, commands/shutdown, settings/power, settings/fan-level, settings/temperature/water)
  - phase: 104-fix-command-body-key-mismatch
    provides: Correct POST body key (value) for stove commands
provides:
  - Debug panel StoveTab POST buttons hitting actual Next.js API routes (no more 404s)
  - lib/routes.ts STOVE_ROUTES cleaned of 3 stale entries pointing to deleted route files
affects: [debug-panel, stove-testing]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - app/debug/components/tabs/StoveTab.tsx
    - app/debug/api/components/tabs/StoveTab.tsx
    - lib/routes.ts

key-decisions:
  - "Debug panel POST URLs updated to match actual Next.js file-system routes, not HA proxy internal paths"
  - "STOVE_ROUTES trimmed to 7 live entries: status, ignite, shutdown, getFan, getPower, setFan, setPower"

patterns-established: []

requirements-completed: [DEBUG-01, CLEAN-04]

# Metrics
duration: 5min
completed: 2026-03-20
---

# Phase 105 Plan 01: Fix Debug Panel URLs and Stale Routes Summary

**Debug panel StoveTab POST buttons corrected from HA-proxy-internal paths to actual Next.js API route paths, and 3 deleted routes removed from STOVE_ROUTES in lib/routes.ts**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-20T09:57:12Z
- **Completed:** 2026-03-20T10:02:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Fixed 5 POST endpoint URLs in both debug StoveTab files (10 file edits, 30 string replacements total)
- Removed 3 stale STOVE_ROUTES entries (getRoomTemperature, getSettings, setSettings) whose route files were deleted in Phase 103
- Both debug panel variants (app/debug and app/debug/api) are now consistent with each other and with the actual Next.js API route structure

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix StoveTab POST URLs in both debug panel files** - `afc12be` (fix)
2. **Task 2: Remove stale route entries from lib/routes.ts** - `8fc7a9f` (fix)

## Files Created/Modified
- `app/debug/components/tabs/StoveTab.tsx` - 5 POST endpoint URLs corrected to /api/stove/{ignite,shutdown,setPower,setFan,setWaterTemperature}
- `app/debug/api/components/tabs/StoveTab.tsx` - Identical POST URL corrections (different import path only)
- `lib/routes.ts` - Removed getRoomTemperature, getSettings, setSettings from STOVE_ROUTES

## Decisions Made
None - followed plan as specified.

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- v13.0 milestone gap closure complete for BROKEN-01 and BROKEN-03 audit findings
- Debug panel StoveTab POST operations will return non-404 responses
- lib/routes.ts is clean — no references to deleted API routes remain

---
*Phase: 105-fix-debug-panel-urls-stale-routes*
*Completed: 2026-03-20*

## Self-Check: PASSED

- FOUND: app/debug/components/tabs/StoveTab.tsx
- FOUND: app/debug/api/components/tabs/StoveTab.tsx
- FOUND: lib/routes.ts
- FOUND: .planning/phases/105-fix-debug-panel-urls-stale-routes/105-01-SUMMARY.md
- FOUND commit afc12be (Task 1)
- FOUND commit 8fc7a9f (Task 2)
