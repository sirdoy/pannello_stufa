---
phase: 87-client-cleanup
plan: 01
subsystem: api
tags: [knip, dead-code, fritzbox, netatmo, barrel-exports]

# Dependency graph
requires:
  - phase: 85-fritz-box-migration
    provides: fritzboxClient function module replacing class-based client
  - phase: 86-netatmo-proxy-cleanup
    provides: netatmoProxyGet/netatmoProxyPost deleted, haGet/haPost are shared transport
provides:
  - "lib/fritzbox/index.ts with only live barrel exports (fritzboxClient, getCachedData, checkRateLimitFritzBox, logDeviceEvent, getDeviceEvents, getDeviceStates, updateDeviceStates)"
  - "lib/fritzbox/fritzboxErrors.ts with FRITZBOX_ERROR_CODES unexported (no external callers)"
  - "Zero unused exports in lib/fritzbox/ and lib/netatmoProxy.ts (knip confirmed)"
  - "lib/envValidator.ts confirmed clean — only HA_API_URL and HA_API_KEY referenced"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dead export removal: remove re-exports from barrel when no route file consumes them"
    - "Keep source files even when their exports are internalized (per plan constraint)"

key-files:
  created: []
  modified:
    - lib/fritzbox/index.ts
    - lib/fritzbox/fritzboxErrors.ts

key-decisions:
  - "Removed invalidateCache and CACHE_TTL_MS from fritzbox barrel — only getCachedData is imported by route files"
  - "Removed FRITZBOX_RATE_LIMIT from fritzbox barrel — only checkRateLimitFritzBox is imported by route files"
  - "Removed FRITZBOX_ERROR_CODES barrel re-export and unexported it in fritzboxErrors.ts — zero route files use it"
  - "Did not delete fritzboxErrors.ts per plan constraint — file remains as internal module"

patterns-established: []

requirements-completed:
  - API-10

# Metrics
duration: 4min
completed: 2026-03-17
---

# Phase 87 Plan 01: Dead Export Removal Summary

**Removed 4 unused barrel exports from lib/fritzbox after knip analysis — zero unused exports in fritzbox and netatmoProxy modules, envValidator confirmed clean.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-17T16:04:49Z
- **Completed:** 2026-03-17T16:08:49Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Ran knip dead export analysis — identified 4 unused exports in lib/fritzbox/
- Removed `invalidateCache`, `CACHE_TTL_MS`, `FRITZBOX_RATE_LIMIT`, `FRITZBOX_ERROR_CODES` from barrel
- Unexported `FRITZBOX_ERROR_CODES` in fritzboxErrors.ts (no external callers)
- Confirmed lib/netatmoProxy.ts has zero unused exports (no changes needed)
- Confirmed lib/envValidator.ts references only HA_API_URL and HA_API_KEY
- 117 tests pass, zero new tsc errors introduced

## Task Commits

Each task was committed atomically:

1. **Task 1: Run knip dead export analysis and remove unused exports** - `0e588bc` (chore)

**Plan metadata:** (included in final commit)

## Files Created/Modified
- `lib/fritzbox/index.ts` - Removed 3 unused re-exports (invalidateCache, CACHE_TTL_MS, FRITZBOX_RATE_LIMIT, FRITZBOX_ERROR_CODES) from barrel
- `lib/fritzbox/fritzboxErrors.ts` - Unexported FRITZBOX_ERROR_CODES (no external callers)

## Decisions Made
- Removed `invalidateCache` and `CACHE_TTL_MS` from barrel: only `getCachedData` is imported by route files (bandwidth, wan, devices)
- Removed `FRITZBOX_RATE_LIMIT` from barrel: only `checkRateLimitFritzBox` is imported by route files
- Removed `FRITZBOX_ERROR_CODES` from barrel and unexported in source: zero route or app files consume it
- Did not delete `fritzboxErrors.ts` per plan's explicit constraint — file stays as internal module
- lib/netatmoProxy.ts required zero changes — all its exports are actively imported by route files

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing tsc errors exist in `.next/types/app/api/config/fritzbox/route.ts` (deleted credential route from Phase 85) and test mock type mismatches in fritzbox route tests — these are out-of-scope and not caused by this plan's changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Dead export cleanup complete for fritzbox and netatmo wrapper modules
- Ready for Phase 87 Plan 02 (if any) or phase sign-off

---
*Phase: 87-client-cleanup*
*Completed: 2026-03-17*
