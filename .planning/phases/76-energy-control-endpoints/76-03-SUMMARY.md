---
phase: 76-energy-control-endpoints
plan: 03
subsystem: api
tags: [netatmo, proxy, schedules, firebase, route-migration]

# Dependency graph
requires:
  - phase: 76-energy-control-endpoints/76-01
    provides: netatmoProxyPost + proxySwitchHomeSchedule + proxySyncHomeSchedule + proxyCreateNewHomeSchedule wrappers in lib/netatmoProxy.ts
  - phase: 75-api-client-foundation-energy-read/75-02
    provides: getProxyHomesdata in lib/netatmoProxy.ts

provides:
  - GET /api/netatmo/schedules: returns schedules from proxy homesdata — no OAuth, no cache, no rate limiter
  - POST /api/netatmo/switchhomeschedule: switches active schedule via proxy + writes userSelectedScheduleId to Firebase
  - POST /api/netatmo/synchomeschedule: transparent proxy for syncing schedule definitions to Netatmo
  - POST /api/netatmo/createnewhomeschedule: transparent proxy for creating new schedule on Netatmo

affects: [76-energy-control-endpoints, 79-cleanup, frontend-schedule-components]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Schedules GET via getProxyHomesdata extraction (body.homes[0]?.schedules ?? [])
    - Firebase userSelectedScheduleId write after successful schedule switch
    - Transparent proxy POST routes with home_id validation and result cast (as unknown as Record<string, unknown>)

key-files:
  created:
    - app/api/netatmo/switchhomeschedule/route.ts
    - app/api/netatmo/synchomeschedule/route.ts
    - app/api/netatmo/createnewhomeschedule/route.ts
    - __tests__/api/netatmo/switchhomeschedule.test.ts
  modified:
    - app/api/netatmo/schedules/route.ts
    - __tests__/api/netatmo/schedules.test.ts

key-decisions:
  - "ProxyControlResponse requires (as unknown as Record<string, unknown>) cast for success() — same pattern as getroommeasure route"
  - "schedules GET removes POST entirely; POST moves to dedicated /switchhomeschedule route"
  - "userSelectedScheduleId written after proxySwitchHomeSchedule succeeds — preserves user intent across auto-calibration cycles"

patterns-established:
  - "Transparent proxy POST: parseJsonOrThrow → validateRequired(home_id) → proxyFn(body) → success(result as unknown as Record<string, unknown>)"
  - "Schedule switch: proxySwitchHomeSchedule({home_id, schedule_id}) → adminDbSet(getEnvironmentPath('netatmo/userSelectedScheduleId'), schedule_id)"

requirements-completed: [ENERGY-05, ENERGY-06]

# Metrics
duration: 5min
completed: 2026-03-15
---

# Phase 76 Plan 03: Schedule Route Migration + New Control Routes Summary

**GET /schedules migrated to proxy homesdata; POST /switchhomeschedule + synchomeschedule + createnewhomeschedule created as thin proxy routes with Firebase userSelectedScheduleId side effect**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-15T11:40:00Z
- **Completed:** 2026-03-15T11:43:27Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Rewrote `schedules/route.ts` from 169 LOC (legacy OAuth + cache + rate limiter) to 16 LOC (proxy-only GET)
- Created `switchhomeschedule/route.ts` with proxy call + Firebase userSelectedScheduleId write
- Created `synchomeschedule/route.ts` and `createnewhomeschedule/route.ts` as transparent proxy POST routes
- 9 tests passing (4 schedules GET tests + 5 switchhomeschedule POST tests)

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate schedules GET + create switchhomeschedule route (TDD)** - `13a77ec` (feat)
2. **Task 2: Create synchomeschedule and createnewhomeschedule routes** - `afb1041` (feat)

_Note: TDD task had single commit (RED phase confirmed failures, GREEN phase all 9 tests pass)._

## Files Created/Modified

- `app/api/netatmo/schedules/route.ts` - Rewrote: GET only, uses getProxyHomesdata(), all legacy imports stripped
- `app/api/netatmo/switchhomeschedule/route.ts` - NEW: POST proxy + Firebase userSelectedScheduleId write
- `app/api/netatmo/synchomeschedule/route.ts` - NEW: POST transparent proxy, home_id validation
- `app/api/netatmo/createnewhomeschedule/route.ts` - NEW: POST transparent proxy, home_id validation
- `__tests__/api/netatmo/schedules.test.ts` - Rewrote: proxy-based GET tests, no legacy mocks
- `__tests__/api/netatmo/switchhomeschedule.test.ts` - NEW: 5 tests for POST + Firebase write

## Decisions Made

- `ProxyControlResponse` type is not directly assignable to `Record<string, unknown>` so `(result as unknown as Record<string, unknown>)` cast is required — same pattern as existing `getroommeasure` route.
- `validateRequired` throws `ApiError` (not returns badRequest), so no explicit `return badRequest(...)` needed in validation path.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added `as unknown as Record<string, unknown>` cast for ProxyControlResponse**
- **Found during:** Task 2 (synchomeschedule/createnewhomeschedule creation)
- **Issue:** `success(result)` rejected by TypeScript — `ProxyControlResponse` interface not assignable to `Record<string, unknown>`
- **Fix:** Applied `result as unknown as Record<string, unknown>` — same cast used in `getroommeasure/route.ts`
- **Files modified:** `app/api/netatmo/synchomeschedule/route.ts`, `app/api/netatmo/createnewhomeschedule/route.ts`
- **Verification:** `npx tsc --noEmit` returned no errors for new routes
- **Committed in:** `afb1041` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - type cast)
**Impact on plan:** Necessary for TypeScript correctness. No scope creep.

## Issues Encountered

None — plan executed with only a minor type-cast deviation automatically resolved.

## Next Phase Readiness

- All four schedule-related routes migrated/created via proxy
- ENERGY-05 and ENERGY-06 requirements complete
- Phase 76 plan 04 (getroommeasure) already committed (af88fe1) — phase progressing normally
- Phase 79 cleanup can delete legacy schedules POST and related cache/rate-limiter code once all routes are migrated

---
*Phase: 76-energy-control-endpoints*
*Completed: 2026-03-15*
