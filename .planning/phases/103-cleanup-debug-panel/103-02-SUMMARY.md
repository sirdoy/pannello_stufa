---
phase: 103-cleanup-debug-panel
plan: 02
subsystem: ui
tags: [debug-panel, stove, thermorossi, proxy]

# Dependency graph
requires:
  - phase: 103-01
    provides: StoveTab exists to be updated; proxy endpoints already wired in API layer
provides:
  - StoveTab (main debug page) showing proxy GET and POST endpoints
  - StoveTab (API debug page) showing proxy GET and POST endpoints
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - NetatmoTab proxy pattern applied to StoveTab (no externalUrl, no cleanApiResponse, connectionStatus from health)

key-files:
  created: []
  modified:
    - app/debug/components/tabs/StoveTab.tsx
    - app/debug/api/components/tabs/StoveTab.tsx

key-decisions:
  - "connectionStatus from health endpoint: data.status === 'ok' -> connected (matches ThermorossiHealthResponse type)"
  - "POST body uses { value: N } for settings (proxy convention), empty {} for commands (ignit/shutdown)"
  - "Both StoveTab copies are identical except for the EndpointCard import path (absolute vs relative)"

patterns-established:
  - "Proxy debug tab pattern: import Badge, add connectionStatus state, fetchGetEndpoint stores data directly (no cleanApiResponse), no externalUrl prop"

requirements-completed:
  - DEBUG-01

# Metrics
duration: 5min
completed: 2026-03-19
---

# Phase 103 Plan 02: StoveTab Debug Panel Rewrite Summary

**StoveTab debug panels rewritten for proxy architecture: 5 GET endpoints (health/status/power/fan/history) + 5 POST endpoints (commands/ignit, commands/shutdown, settings/power, settings/fan-level, settings/temperature/water), removing all WiNet/stoveApi references**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-19T20:28:00Z
- **Completed:** 2026-03-19T20:31:27Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments

- Both StoveTab components rewritten to follow NetatmoTab proxy pattern
- All WiNet cloud URLs, stoveApi imports, API_KEY, cleanApiResponse, and isSandbox references removed
- Connection status badge added (green/red) driven by proxy health endpoint `status` field
- POST bodies updated to `{ value: N }` proxy format for settings; empty `{}` for commands
- Dead routes removed: getRoomTemperature, getActualWaterTemperature, getWaterSetTemperature, /settings

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite StoveTab for proxy endpoints** - `2ab77d8` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `app/debug/components/tabs/StoveTab.tsx` - Main debug page StoveTab, now proxy-only
- `app/debug/api/components/tabs/StoveTab.tsx` - API debug page StoveTab, now proxy-only (identical except relative import)

## Decisions Made

- Health endpoint connection status uses `data.status === 'ok'` check (matching `ThermorossiHealthResponse.status: 'ok' | 'degraded'`), consistent with proxy health contract
- Both files kept identical except for one import line (`@/app/debug/components/ApiTab` vs `../ApiTab`), matching pre-existing pattern between the two copies

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both StoveTab debug panel components now reflect the proxy architecture accurately
- Debug panel accurately shows which Next.js API routes proxy to the HA home assistant backend
- Phase 103 complete — cleanup-debug-panel phase fully executed

---
*Phase: 103-cleanup-debug-panel*
*Completed: 2026-03-19*
