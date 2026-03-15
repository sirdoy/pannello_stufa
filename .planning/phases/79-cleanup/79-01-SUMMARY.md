---
phase: 79-cleanup
plan: 01
subsystem: api
tags: [netatmo, cleanup, dead-code, oauth, coordination]

# Dependency graph
requires:
  - phase: 75-netatmo-proxy
    provides: netatmoProxy.ts replaces netatmoApi.ts
  - phase: 76-energy-control-endpoints
    provides: proxy routes replace dead netatmo API routes
  - phase: 77-camera-migration
    provides: camera routes migrated to proxy pattern
  - phase: 78-valve-health
    provides: calibration service and health monitoring migrated to proxy
provides:
  - Codebase free of dead Netatmo OAuth infrastructure (17 lib modules deleted)
  - Codebase free of dead API routes and OAuth UI (9 files deleted)
  - Codebase free of test files for deleted modules (16 test files deleted)
affects: [future-phases, maintenance]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "git rm preserves deletion history for dead modules"
    - "Empty directories automatically cleaned by git rm"

key-files:
  created: []
  modified: []

key-decisions:
  - "All dead Netatmo OAuth infrastructure deleted — proxy owns token management, rate limiting, caching"
  - "Coordination orchestrator chain (9 modules) fully removed — proxy handles stove sync coordination"
  - "app/netatmo/authorized/ subdirectory kept — only page.tsx was dead, not the whole netatmo directory"
  - "app/components/netatmo/ kept — still contains RoomCard, PidAutomationPanel, StoveSyncPanel"

patterns-established: []

requirements-completed: [CLEAN-01, CLEAN-02, CLEAN-03, CLEAN-04, CLEAN-05]

# Metrics
duration: 15min
completed: 2026-03-15
---

# Phase 79 Plan 01: Netatmo Dead Code Deletion Summary

**42 files deleted (17 lib modules + 9 routes/components + 16 test files) removing all dead Netatmo OAuth infrastructure and coordination chain superseded by the local proxy**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-15T16:40:00Z
- **Completed:** 2026-03-15T16:55:10Z
- **Tasks:** 3
- **Files modified:** 42 deleted

## Accomplishments
- Deleted all 17 dead lib modules: netatmoTokenHelper, netatmoCredentials, netatmoRateLimiter, netatmoRateLimiterPersistent, netatmoCacheService, netatmoApi, netatmoStoveSync, core/netatmoHelpers, and the full 9-module coordination chain (orchestrator, userIntent, pauseCalculator, eventLogger, debounce, preferences, state, throttlePersistent, schemas/coordinationPreferences)
- Deleted 9 dead routes and UI files: OAuth callback route, 5 dead netatmo API routes (devices, devices-temperatures, debug, temperature, stove-sync), coordination enforce endpoint, NetatmoAuthCard, netatmo page
- Deleted 16 test files matching all deleted modules; confirmed living tests (netatmoProxy, netatmoCameraApi, coordinationNotificationThrottle, netatmoCalibrationService) remain untouched

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete dead lib modules** - `ed2d17f` (chore)
2. **Task 2: Delete dead routes, UI components, and page** - `68341a5` (chore)
3. **Task 3: Delete test files for deleted modules** - `1211882` (chore)

## Files Created/Modified

All 42 files were deleted:

**Lib modules (17):**
- `lib/netatmoTokenHelper.ts` - OAuth token management (proxy handles)
- `lib/netatmoCredentials.ts` - OAuth credentials helper (proxy uses API key)
- `lib/netatmoRateLimiter.ts` - In-memory rate limiter (proxy rate-limits)
- `lib/netatmoRateLimiterPersistent.ts` - Firebase RTDB rate limiter (proxy rate-limits)
- `lib/netatmoCacheService.ts` - Response caching (proxy caches in SQLite)
- `lib/netatmoApi.ts` - Old API client (replaced by netatmoProxy.ts)
- `lib/netatmoStoveSync.ts` - Stove sync (proxy handles coordination)
- `lib/core/netatmoHelpers.ts` - requireNetatmoToken helper (only used by dead routes)
- `lib/coordinationOrchestrator.ts` + 7 coordination modules + `lib/schemas/coordinationPreferences.ts`

**Routes and UI (9):**
- `app/api/netatmo/callback/route.ts` - OAuth callback
- `app/api/netatmo/devices/route.ts`, `devices-temperatures/route.ts`, `debug/route.ts`, `temperature/route.ts`, `stove-sync/route.ts`
- `app/api/coordination/enforce/route.ts`
- `app/components/netatmo/NetatmoAuthCard.tsx`
- `app/netatmo/page.tsx`

**Test files (16):** matching all deleted lib modules

## Decisions Made

- `app/netatmo/authorized/` subdirectory kept — only `page.tsx` was dead (OAuth setup page), not the full netatmo section
- `app/components/netatmo/` directory kept — still contains active components (RoomCard, PidAutomationPanel, StoveSyncPanel, authorized/)
- All deletions via `git rm` to preserve history in git log

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Dead code elimination complete; codebase now contains only proxy-based Netatmo infrastructure
- Plan 02 (env var cleanup, CLEAN-06) can proceed — will target OAuth env vars in .env, .env.example, docs, and GitHub Actions workflows
- Remaining active components: netatmoProxy.ts, netatmoCameraApi.ts, coordinationNotificationThrottle.ts, netatmoCalibrationService.ts

---
*Phase: 79-cleanup*
*Completed: 2026-03-15*
