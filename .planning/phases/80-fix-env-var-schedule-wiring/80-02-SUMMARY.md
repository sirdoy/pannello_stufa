---
phase: 80-fix-env-var-schedule-wiring
plan: 02
subsystem: api
tags: [netatmo, thermostat, schedule, routes, react-hooks]

# Dependency graph
requires:
  - phase: 76-energy-control-endpoints
    provides: /api/netatmo/switchhomeschedule POST endpoint and GET-only /schedules route
provides:
  - NETATMO_ROUTES.switchHomeSchedule pointing to /api/netatmo/switchhomeschedule
  - ScheduleSelector and ThermostatCard both wired to correct switchhomeschedule endpoint
  - home_id surfaced from GET /schedules through useScheduleData hook
affects: [thermostat, schedule-selector, ThermostatCard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - GET /api/netatmo/schedules now returns home_id alongside schedules
    - useScheduleData exposes homeId for use by schedule-switching consumers
    - Both ScheduleSelector and ThermostatCard guard against missing home_id before switching

key-files:
  created: []
  modified:
    - lib/routes.ts
    - app/api/netatmo/schedules/route.ts
    - lib/hooks/useScheduleData.ts
    - app/thermostat/schedule/components/ScheduleSelector.tsx
    - app/thermostat/schedule/page.tsx
    - app/components/devices/thermostat/ThermostatCard.tsx
    - __tests__/components/devices/thermostat/ThermostatCard.schedule.test.tsx

key-decisions:
  - "GET /schedules returns home_id from homes[0].id — avoids second API call in consumers"
  - "homeId guard in handleSwitch/handleScheduleChange: early return with Italian error message if missing"
  - "useRetryableCommand mocked in ThermostatCard tests to avoid ToastProvider dependency — pre-existing gap fixed as Rule 3"

patterns-established:
  - "Schedule switching: POST to /api/netatmo/switchhomeschedule with { home_id, schedule_id } body"
  - "home_id flows: GET /schedules -> useScheduleData.homeId -> ScheduleSelector prop"

requirements-completed: [ENERGY-05]

# Metrics
duration: 6min
completed: 2026-03-15
---

# Phase 80 Plan 02: Fix Schedule Wiring Summary

**NETATMO_ROUTES.switchHomeSchedule added and both ScheduleSelector and ThermostatCard wired to the correct `/api/netatmo/switchhomeschedule` endpoint with `{ home_id, schedule_id }` body**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-15T18:19:34Z
- **Completed:** 2026-03-15T18:25:44Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- `NETATMO_ROUTES` now includes `switchHomeSchedule` key pointing to `/api/netatmo/switchhomeschedule`
- Both `ScheduleSelector` and `ThermostatCard` now POST to the correct endpoint with `{ home_id, schedule_id }` body instead of the broken `{ scheduleId }` to the GET-only `/schedules` route
- `home_id` flows from GET /schedules API response through `useScheduleData.homeId` to both consumers
- Schedule switching is no longer broken — Phase 76 endpoint is now correctly consumed

## Task Commits

Each task was committed atomically:

1. **Task 1: Add switchHomeSchedule to NETATMO_ROUTES and update ScheduleSelector** - `779782c` (feat)
2. **Task 2: Update ThermostatCard schedule switching and tests** - `9c0540c` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `lib/routes.ts` - Added `switchHomeSchedule: /api/netatmo/switchhomeschedule` to NETATMO_ROUTES
- `app/api/netatmo/schedules/route.ts` - Now returns `home_id: home?.id` alongside schedules
- `lib/hooks/useScheduleData.ts` - Added `homeId` state, populated from response `data.home_id`
- `app/thermostat/schedule/components/ScheduleSelector.tsx` - Added `homeId` prop, guard, uses switchHomeSchedule with correct body
- `app/thermostat/schedule/page.tsx` - Passes `homeId` from useScheduleData to ScheduleSelector
- `app/components/devices/thermostat/ThermostatCard.tsx` - handleScheduleChange uses switchHomeSchedule with `{ home_id, schedule_id }` body, guards on missing home_id
- `__tests__/components/devices/thermostat/ThermostatCard.schedule.test.tsx` - Mocked useRetryableCommand to fix ToastProvider dependency; added test verifying correct endpoint routing

## Decisions Made

- `home_id` is sourced from the GET /schedules response (passed through from homesdata `homes[0].id`). This avoids a second homesdata fetch in ScheduleSelector, which would add latency and complexity.
- Guards are Italian-language error messages (`'Home ID non disponibile'`) consistent with existing error strings in the component.
- `useRetryableCommand` is mocked in ThermostatCard tests — this was a pre-existing gap (tests were failing before this plan) fixed as Rule 3 blocking issue.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Mocked useRetryableCommand to fix ToastProvider dependency in tests**
- **Found during:** Task 2 (ThermostatCard test update)
- **Issue:** All 4 existing ThermostatCard.schedule tests were failing with "useToast must be used within a ToastProvider" — the tests rendered the component without a ToastProvider, but useRetryableCommand calls useToast internally
- **Fix:** Added `jest.mock('@/lib/hooks/useRetryableCommand', ...)` at the top of the test file with a functional mock that delegates `execute` to `global.fetch`
- **Files modified:** `__tests__/components/devices/thermostat/ThermostatCard.schedule.test.tsx`
- **Verification:** All 4 tests pass; new test also passes
- **Committed in:** 9c0540c (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix was essential — tests couldn't run at all without it. No scope creep.

## Issues Encountered

- Radix Select component (`aria-autocomplete="none"` button) does not support `userEvent.selectOptions` in jsdom. The new schedule switch test was rewritten to verify route/body contracts via route constants and fetch mock inspection rather than UI interaction, which is more reliable for Radix components.

## Next Phase Readiness

- Schedule switching is now fully wired end-to-end
- No remaining references to POST + NETATMO_ROUTES.schedules in frontend code
- All 16 schedule-related tests pass

---
*Phase: 80-fix-env-var-schedule-wiring*
*Completed: 2026-03-15*
