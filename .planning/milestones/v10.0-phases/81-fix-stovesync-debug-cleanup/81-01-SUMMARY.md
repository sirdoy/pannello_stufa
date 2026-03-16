---
phase: 81-fix-stovesync-debug-cleanup
plan: 01
subsystem: ui, api
tags: [netatmo, cleanup, debug-panel, stove-sync]

# Dependency graph
requires:
  - phase: 79-cleanup
    provides: deletion of coordination orchestrator chain and stove sync constants
  - phase: 80-fix-env-var-schedule-wiring
    provides: switchhomeschedule wired, proxy-era endpoints confirmed active
provides:
  - StoveSyncPanel removed from thermostat and settings pages
  - disconnect and stoveSync keys removed from NETATMO_ROUTES
  - debug NetatmoTab panels showing proxy-era endpoints (valves, camera/status, schedules)
  - connectionStatus derived from /health provider_status
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - lib/routes.ts
    - app/thermostat/page.tsx
    - app/thermostat/page.test.tsx
    - app/settings/thermostat/page.tsx
    - __tests__/app/settings/thermostat/page.test.tsx
    - app/debug/components/tabs/NetatmoTab.tsx
    - app/debug/api/components/tabs/NetatmoTab.tsx
    - lib/coordinationNotificationThrottle.ts

key-decisions:
  - "StoveSyncPanel deleted entirely (600 LOC) — proxy handles stove sync coordination; UI panel is obsolete"
  - "disconnect route deleted — proxy owns auth token management; client-side disconnect is meaningless"
  - "debug NetatmoTab connection status now reads from /health provider_status field instead of deleted /debug endpoint"
  - "externalUrl props removed from all endpoint cards — all endpoints are local proxy, no direct Netatmo API links"

patterns-established:
  - "Proxy-era debug endpoints: health, homesdata, homestatus, valves, camera/status, schedules"

requirements-completed: [CLEAN-02]

# Metrics
duration: 6min
completed: 2026-03-15
---

# Phase 81 Plan 01: Stove Sync & Debug Cleanup Summary

**Deleted StoveSyncPanel (600 LOC), disconnect route, and stoveSync/disconnect from NETATMO_ROUTES; updated both debug NetatmoTab variants to show proxy-era endpoints (valves, camera/status, schedules) with connectionStatus derived from /health provider_status**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-15T19:11:49Z
- **Completed:** 2026-03-15T19:17:49Z
- **Tasks:** 2
- **Files modified:** 8 (3 deleted)

## Accomplishments

- Deleted StoveSyncPanel.tsx, its test, and app/api/netatmo/disconnect/route.ts
- Removed stoveSync and disconnect entries from NETATMO_ROUTES in lib/routes.ts
- Cleaned thermostat page (import, JSX block, Riconnetti button) and settings page (import, JSX)
- Updated both NetatmoTab debug variants to use proxy-era endpoints and fix connectionStatus source
- Updated coordinationNotificationThrottle JSDoc to remove stale USE_PERSISTENT_RATE_LIMITER references

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete StoveSyncPanel, disconnect route, and clean consumers** - `e97ce85` (feat)
2. **Task 2: Clean debug NetatmoTab endpoints and stale JSDoc** - `e0d8a7d` (feat)

## Files Created/Modified

- `app/components/netatmo/StoveSyncPanel.tsx` - DELETED (600 LOC, obsolete)
- `__tests__/components/StoveSyncPanel.test.tsx` - DELETED
- `app/api/netatmo/disconnect/route.ts` - DELETED
- `lib/routes.ts` - Removed disconnect and stoveSync keys from NETATMO_ROUTES
- `app/thermostat/page.tsx` - Removed StoveSyncPanel import/JSX, Riconnetti Account button
- `app/thermostat/page.test.tsx` - Removed StoveSyncPanel mock
- `app/settings/thermostat/page.tsx` - Removed StoveSyncPanel import and JSX
- `__tests__/app/settings/thermostat/page.test.tsx` - Removed StoveSyncPanel mock and stove-sync-panel assertions
- `app/debug/components/tabs/NetatmoTab.tsx` - Replaced dead endpoints with proxy-era ones, fixed connectionStatus, removed externalUrl props
- `app/debug/api/components/tabs/NetatmoTab.tsx` - Same changes as above
- `lib/coordinationNotificationThrottle.ts` - Updated JSDoc to remove USE_PERSISTENT_RATE_LIMITER references

## Decisions Made

- StoveSyncPanel and disconnect route deleted without replacement — proxy migration made them obsolete
- Settings page thermostat now contains only PidAutomationPanel (space-y-6 wrapper kept for future additions)
- connectionStatus badge in debug tabs now reads `provider_status === 'ok'` from /health endpoint

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CLEAN-02 requirement is complete
- Phase 81 cleanup is done
- Codebase has zero references to deleted Netatmo routes in functional code (lib/version.ts historical changelog entries are intentionally preserved)

---
*Phase: 81-fix-stovesync-debug-cleanup*
*Completed: 2026-03-15*
