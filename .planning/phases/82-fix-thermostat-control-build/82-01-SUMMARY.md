---
phase: 82-fix-thermostat-control-build
plan: 01
subsystem: api
tags: [netatmo, thermostat, home_id, type-fix]

requires:
  - phase: 76-energy-control-endpoints
    provides: setroomthermpoint and setthermmode API routes requiring home_id
  - phase: 77-camera-migration
    provides: camera event snapshot route with withAuthAndErrorHandler
provides:
  - home_id included in all thermostat POST call sites (setroomthermpoint and setthermmode)
  - Camera snapshot route compiles without type errors
  - RoomCard mode:'off' replaced with valid mode:'home'
affects: [thermostat, energy-control, camera]

tech-stack:
  added: []
  patterns:
    - "home_id sourced from topology (ThermostatCard, thermostat/page) or passed as prop (RoomCard, ManualOverrideSheet, ActiveOverrideBadge)"

key-files:
  created: []
  modified:
    - app/api/netatmo/camera/events/[eventId]/snapshot/route.ts
    - app/components/netatmo/RoomCard.tsx
    - app/components/devices/thermostat/ThermostatCard.tsx
    - app/thermostat/page.tsx
    - app/thermostat/schedule/components/ManualOverrideSheet.tsx
    - app/thermostat/schedule/components/ActiveOverrideBadge.tsx
    - app/thermostat/schedule/page.tsx

key-decisions:
  - "homeId passed as optional prop through component trees rather than fetched independently in each component"
  - "RoomCard mode:'off' replaced with mode:'home' since VALID_MODES for setroomthermpoint is only ['manual', 'home']"

patterns-established:
  - "home_id in POST body: all Netatmo control endpoints require home_id from topology or useScheduleData"

requirements-completed: [ENERGY-03, ENERGY-04]

duration: 3min
completed: 2026-03-16
---

# Phase 82 Plan 01: Fix Thermostat Control Build Summary

**Added home_id to all 8 thermostat POST call sites and fixed camera snapshot route type error to close ENERGY-03/04 gaps**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-16T10:34:35Z
- **Completed:** 2026-03-16T10:37:30Z
- **Tasks:** 1
- **Files modified:** 7

## Accomplishments
- All 6 setroomthermpoint callers now include home_id in POST body (RoomCard x3, ThermostatCard x1, ManualOverrideSheet x1, ActiveOverrideBadge x1)
- Both setthermmode callers now include home_id in POST body (ThermostatCard x1, thermostat/page x1)
- RoomCard "Off" button sends mode:'home' instead of invalid mode:'off'
- Camera event snapshot route compiles without TS2345 error (removed explicit unknown annotations)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix camera snapshot route type and add home_id to all thermostat POST callers** - `64c5b60` (fix)

## Files Created/Modified
- `app/api/netatmo/camera/events/[eventId]/snapshot/route.ts` - Removed explicit unknown type annotations, uses inferred AuthedHandler types
- `app/components/netatmo/RoomCard.tsx` - Added homeId prop, included home_id in all 3 fetch bodies, changed mode:'off' to mode:'home'
- `app/components/devices/thermostat/ThermostatCard.tsx` - Added home_id: topology.home_id to handleModeChange and handleTemperatureChange
- `app/thermostat/page.tsx` - Added home_id: topology?.home_id to handleModeChange, passed homeId prop to RoomCard
- `app/thermostat/schedule/components/ManualOverrideSheet.tsx` - Added homeId prop, included home_id in handleSubmit body
- `app/thermostat/schedule/components/ActiveOverrideBadge.tsx` - Added homeId prop, included home_id in handleCancel body
- `app/thermostat/schedule/page.tsx` - Passes homeId from useScheduleData to ManualOverrideSheet and ActiveOverrideBadge

## Decisions Made
- homeId passed as optional prop through component trees rather than fetched independently -- avoids duplicate API calls
- RoomCard mode:'off' replaced with mode:'home' since API VALID_MODES for setroomthermpoint is only ['manual', 'home']

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All thermostat control POST calls now include required home_id field
- ENERGY-03 and ENERGY-04 gaps closed
- Ready for Phase 83 or further gap closure work

---
*Phase: 82-fix-thermostat-control-build*
*Completed: 2026-03-16*
