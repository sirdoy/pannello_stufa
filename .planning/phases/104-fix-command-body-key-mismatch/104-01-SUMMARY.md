---
phase: 104-fix-command-body-key-mismatch
plan: 01
subsystem: api
tags: [stove, commands, thermorossi, proxy, body-key]

# Dependency graph
requires:
  - phase: 103-winet-infrastructure-cleanup
    provides: Thermorossi proxy with { value: N } body convention for settings commands
provides:
  - Corrected fan/power command body key from shorthand {level} to {value: level} matching route extraction
affects: [useStoveCommands, setFan route, setPower route, stove command tests]

# Tech tracking
tech-stack:
  added: []
  patterns: [Proxy body convention { value: N, source: 'manual' } for all numeric stove settings commands]

key-files:
  created: []
  modified:
    - app/components/devices/stove/hooks/useStoveCommands.ts
    - __tests__/components/devices/stove/hooks/useStoveCommands.test.ts

key-decisions:
  - "Fan and power commands send { value: level, source: 'manual' } -- value key matches route extraction body['value']"
  - "TDD RED/GREEN confirmed: tests failed before fix and passed after, validating the body key mismatch was the root cause"

patterns-established:
  - "Proxy numeric settings convention: POST body uses { value: N } not shorthand { N } -- matches body['value'] extraction in all routes"

requirements-completed: [CMD-03, CMD-04, UI-03]

# Metrics
duration: 2min
completed: 2026-03-20
---

# Phase 104 Plan 01: Fix Command Body Key Mismatch Summary

**Fan/power UI commands now send `{ value: level }` instead of shorthand `{ level }`, resolving the silent undefined reaching the Thermorossi proxy**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-20T09:35:42Z
- **Completed:** 2026-03-20T09:37:20Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Fixed body key mismatch in `handleFanChange`: shorthand `{ level, source: 'manual' }` changed to `{ value: level, source: 'manual' }`
- Fixed body key mismatch in `handlePowerChange`: same fix applied
- Updated test assertions to verify the correct `{ value: N, source: 'manual' }` shape
- TDD cycle confirmed: 2 tests failed (RED) then all 18 tests passed (GREEN)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix body key from level to value in useStoveCommands and update test assertions** - `680ca50` (fix)

## Files Created/Modified
- `app/components/devices/stove/hooks/useStoveCommands.ts` - Line 152 and 178: `{ level, source }` → `{ value: level, source: 'manual' }`
- `__tests__/components/devices/stove/hooks/useStoveCommands.test.ts` - Fan assertion uses `value: 4`, power assertion uses `value: 3`

## Decisions Made
- No changes to route files (setFan/route.ts, setPower/route.ts remain untouched — they already correctly extract `body['value']`)
- The `source: 'manual'` field retained in both commands per existing convention

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None — the fix was two lines in the hook and two lines in tests. TDD cycle provided clean verification.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Fan and power level commands now reach the Thermorossi proxy with the correct numeric value
- All 18 useStoveCommands tests green
- Phase 104 complete

---
*Phase: 104-fix-command-body-key-mismatch*
*Completed: 2026-03-20*
