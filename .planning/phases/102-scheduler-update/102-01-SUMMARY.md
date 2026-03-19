---
phase: 102-scheduler-update
plan: 01
subsystem: api
tags: [scheduler, cron, thermorossi, proxy, stove, maintenance]

# Dependency graph
requires:
  - phase: 100-control-endpoints
    provides: thermorossiProxy command wrappers (sendIgnit, sendShutdown, setPower, setFan, getHealth)
  - phase: 99-proxy-client
    provides: thermorossiProxy read functions (getStatus) and ThermorossiStatusResponse type
  - phase: 101-frontend-hooks
    provides: exact equality pattern for stove_state checks
provides:
  - "Scheduler route fully migrated to thermorossiProxy client — no stoveApi references remain"
  - "Alarm state detection with error_code/error_description and 1-hour notification cooldown"
  - "Thermorossi proxy health saved to Firebase at thermorossi/proxyHealth on every cron tick"
  - "maintenanceServiceAdmin uses exact equality for working/modulating status"
affects: [cron, scheduler, maintenance]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single getStatus() replaces 3-way Promise.all (status + fan + power now unified in proxy response)"
    - "Exact equality === on StoveState union values throughout scheduler logic"
    - "Alarm notification reuses triggerStoveUnexpectedOffServer with 1-hour cooldown via scheduler/lastAlarmNotification"

key-files:
  created: []
  modified:
    - app/api/scheduler/check/route.ts
    - lib/maintenanceServiceAdmin.ts
    - app/api/scheduler/check/__tests__/route.test.ts

key-decisions:
  - "Alarm state reuses triggerStoveUnexpectedOffServer (not a new notification type) — consistent with unexpected-off pattern"
  - "Single getStatus() call replaces separate getStoveStatus/getFanLevel/getPowerLevel — simpler and fewer API calls"
  - "handleIgnition: sendIgnit() + setPower() separated (proxy convention) vs old igniteStove(power) that bundled both"

patterns-established:
  - "Alarm check: stove_state === 'alarm' inside fetchStoveData after getStatus() call"
  - "Health snapshot: getHealth() -> adminDbSet(thermorossi/proxyHealth) after Netatmo health block"

requirements-completed: [CRON-01, CRON-02, CRON-03]

# Metrics
duration: 14min
completed: 2026-03-19
---

# Phase 102 Plan 01: Scheduler Proxy Migration Summary

**Scheduler cron route migrated from stoveApi to thermorossiProxy with alarm notification, proxy health snapshot, and exact equality state checks**

## Performance

- **Duration:** 14 min
- **Started:** 2026-03-19T17:36:30Z
- **Completed:** 2026-03-19T17:50:36Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Replaced 3-way stoveApi parallel fetch (getStoveStatus + getFanLevel + getPowerLevel) with single `getStatus()` returning ThermorossiStatusResponse
- All stove state decisions in scheduler now use `stove_state === 'working'/'igniting'/'modulating'` exact equality — no `.includes('WORK')` substring matching
- CRON-02: alarm state triggers `triggerStoveUnexpectedOffServer` with `error_description + error_code` and 1-hour cooldown at `scheduler/lastAlarmNotification`
- Thermorossi proxy health saved to `thermorossi/proxyHealth` via `getHealth()` on every cron tick (CRON-03)
- `maintenanceServiceAdmin.ts` updated to exact equality: `stoveStatus === 'working' || stoveStatus === 'modulating'`
- Test suite fully migrated: 96 tests pass with `jest.mock('@/lib/thermorossiProxy')` and new alarm notification test

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate scheduler route and maintenanceServiceAdmin** - `664324b` (feat)
2. **Task 2: Update scheduler test suite for proxy client mocks** - `a1d98b4` (test)

## Files Created/Modified
- `app/api/scheduler/check/route.ts` - Migrated from stoveApi to thermorossiProxy; single getStatus() call; alarm notification; proxy health snapshot
- `lib/maintenanceServiceAdmin.ts` - Exact equality for working/modulating status checks
- `app/api/scheduler/check/__tests__/route.test.ts` - Updated all mocks to thermorossiProxy; added alarm notification tests; 96/96 pass

## Decisions Made
- Alarm notification reuses `triggerStoveUnexpectedOffServer` rather than adding a new trigger type — consistent with existing unexpected-off pattern, minimal scope
- `handleIgnition` now calls `sendIgnit()` then `setPower(active.power)` separately (proxy convention), replacing old `igniteStove(power)` that bundled both
- `fetchStoveData` uses a single `getStatus()` call instead of 3 parallel calls — proxy already returns fan_level and power_level in the status response

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Semi-manual test needed explicit `mockSetPower.mockResolvedValue(...)` in addition to `mockSendIgnit` — the test was checking adminDbSet calls and the setPower mock needed to succeed for `changeApplied` to be true. Fixed by adding explicit setPower mock in that test.

## Next Phase Readiness
- Phase 102 complete: scheduler layer fully on thermorossiProxy
- No remaining stoveApi references in scheduler, maintenance, or their tests
- v13.0 Thermorossi Proxy Migration now complete end-to-end (routes, frontend hooks, scheduler)

---
*Phase: 102-scheduler-update*
*Completed: 2026-03-19*
