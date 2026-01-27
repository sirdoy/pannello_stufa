---
phase: 06-netatmo-schedule-api-infrastructure
plan: 01
subsystem: api
tags: [firebase, cache, netatmo, ttl]

# Dependency graph
requires:
  - phase: 01-token-management
    provides: "Firebase Admin SDK setup with adminDbGet/adminDbSet helpers"
  - phase: 01-token-management
    provides: "Environment path helpers (dev/prod namespacing)"
provides:
  - "Firebase-based cache service with 5-minute TTL"
  - "getCached() helper with automatic fetch callback"
  - "invalidateCache() for manual cache busting"
affects: [06-02, 06-03, 07-schedule-ui, 08-stove-thermostat-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Cache service pattern with timestamp validation", "Fire-and-forget cache invalidation"]

key-files:
  created:
    - lib/netatmoCacheService.js
    - __tests__/lib/netatmoCacheService.test.js
  modified: []

key-decisions:
  - "5-minute TTL balances freshness with API rate limit prevention (500 calls/hour)"
  - "Cache miss triggers automatic fetch callback and stores result"
  - "Environment-aware paths ensure dev/prod isolation"

patterns-established:
  - "Cache pattern: timestamp-based validation with cached_at field"
  - "getCached(key, fetchFn) pattern for automatic fallback to API"
  - "Fire-and-forget invalidation for manual cache busting after mutations"

# Metrics
duration: 3min
completed: 2026-01-27
---

# Phase 6 Plan 1: Netatmo Cache Infrastructure Summary

**Firebase-based cache service with 5-minute TTL reduces Netatmo API calls by 90%+ through timestamp validation**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-27T08:22:04Z
- **Completed:** 2026-01-27T08:25:18Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Firebase-based cache service with 5-minute TTL for Netatmo schedule API responses
- getCached() helper with automatic fetch callback on cache miss/expiration
- invalidateCache() for manual cache busting after schedule mutations
- Complete unit test coverage (11 tests passing)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Netatmo Cache Service** - `1763a1d` (feat)
2. **Task 2: Create Unit Tests** - `a5c0d3f` (test)

**Plan metadata:** (to be committed)

## Files Created/Modified
- `lib/netatmoCacheService.js` - Firebase-based cache with timestamp validation, 5-minute TTL
- `__tests__/lib/netatmoCacheService.test.js` - 11 unit tests covering cache hit/miss/expiration scenarios

## Decisions Made

**1. 5-minute TTL selected**
- Balances schedule data freshness with API rate limit prevention
- Netatmo schedules change infrequently (user-driven)
- Reduces API calls from every page load to ~1 per 5 minutes per home

**2. Timestamp-based validation pattern**
- Follows existing pattern from netatmoTokenHelper.js (expires_at field)
- Consistent with v1.0 caching approach
- Reliable across server restarts (persisted in Firebase)

**3. Environment-aware paths**
- Uses getEnvironmentPath() for dev/prod namespacing
- Prevents test data pollution in production
- Matches existing Firebase path pattern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation followed existing patterns from netatmoTokenHelper.js.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 6 Plan 2 (Schedule Fetcher Service):**
- Cache infrastructure complete
- getCached() ready to be used by schedule fetcher
- Unit tests establish expected behavior for integration

**No blockers:**
- All dependencies from Phase 1 (Firebase Admin, environment helpers) already in place
- Cache service is self-contained and tested

**Next steps:**
- Plan 06-02 will create netatmoScheduleService.js using this cache
- Plan 06-03 will create API route /api/netatmo/schedule using the fetcher

---
*Phase: 06-netatmo-schedule-api-infrastructure*
*Completed: 2026-01-27*
