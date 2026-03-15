---
phase: 75-api-client-foundation-energy-read
plan: 01
subsystem: api
tags: [netatmo, proxy, api-client, typescript, fetch, tdd, rfc9457]

# Dependency graph
requires: []
provides:
  - "lib/netatmoProxy.ts: netatmoProxyGet<T>, getProxyHomestatus, getProxyHomesdata"
  - "types/netatmoProxy.ts: DataFreshness, NetatmoProxyHomestatusResponse, NetatmoProxyHomesdataResponse, all proxy types"
  - "RFC 9457 error mapping to ApiError instances"
affects: [75-02, 75-03, 76, 77, 78, 79]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Proxy client as function module (not class) — simpler than Fritz!Box, no JWT"
    - "RFC 9457 ProblemDetail parsing for structured error mapping"
    - "AbortController + setTimeout for request timeouts"
    - "X-API-Key header authentication for proxy requests"

key-files:
  created:
    - lib/netatmoProxy.ts
    - types/netatmoProxy.ts
    - __tests__/lib/netatmoProxy.test.ts
  modified: []

key-decisions:
  - "Function module (not class) for proxy client — simpler, no state to manage, matches plan spec"
  - "401 maps to UNAUTHORIZED, 503 maps to SERVICE_UNAVAILABLE, others to EXTERNAL_API_ERROR with BAD_GATEWAY"
  - "RFC 9457 detail field used as ApiError message when available, statusText as fallback"
  - "Default timeout 15s matches Fritz!Box client pattern"

patterns-established:
  - "Proxy client pattern: env var validation -> AbortController -> fetch with X-API-Key -> RFC9457 error parsing -> typed return"
  - "Convenience wrappers (getProxyHomestatus, getProxyHomesdata) as thin typed calls over generic netatmoProxyGet<T>"

requirements-completed: [API-01, API-02, API-03, API-04]

# Metrics
duration: 15min
completed: 2026-03-15
---

# Phase 75 Plan 01: API Client Foundation Summary

**Netatmo proxy client with X-API-Key auth, RFC 9457 error mapping, and TypeScript types for homestatus/homesdata endpoints**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-15T10:44:42Z
- **Completed:** 2026-03-15T10:59:00Z
- **Tasks:** 2
- **Files modified:** 3 created

## Accomplishments

- TypeScript types for all Netatmo proxy response shapes including `DataFreshness` union type
- `netatmoProxyGet<T>` generic function with X-API-Key header, configurable timeout, and AbortController
- RFC 9457 problem detail parsing that maps 401 -> UNAUTHORIZED, 503 -> SERVICE_UNAVAILABLE, others -> EXTERNAL_API_ERROR
- `getProxyHomestatus()` and `getProxyHomesdata()` typed convenience wrappers
- 13 tests passing with full coverage of happy path, error paths, timeout, and missing config

## Task Commits

Each task was committed atomically:

1. **Task 1: Create proxy types** - `2462ce8` (feat)
2. **Task 2: Failing tests (RED)** - `4c6e140` (test)
3. **Task 2: Implement proxy client (GREEN)** - `35cd821` (feat)

**Plan metadata:** (docs commit — see below)

_Note: TDD task 2 has two commits: test (RED) + feat (GREEN)_

## Files Created/Modified

- `types/netatmoProxy.ts` — DataFreshness, NetatmoProxyRoomMeasurement, NetatmoProxyHomestatusResponse, NetatmoProxyRoom, NetatmoProxyModule, NetatmoProxySchedule, NetatmoProxyHome, NetatmoProxyHomesdataResponse, RFC9457ProblemDetail
- `lib/netatmoProxy.ts` — netatmoProxyGet<T>, getProxyHomestatus, getProxyHomesdata
- `__tests__/lib/netatmoProxy.test.ts` — 13 tests across all exported functions

## Decisions Made

- Function module (not class) as specified in plan: no JWT token state needed, simpler and more testable
- RFC 9457 `detail` field preferred for error message, `statusText` as fallback when body is not JSON
- Env var validation fails fast with descriptive message naming the missing variable

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. (Env vars NETATMO_PROXY_URL and NETATMO_PROXY_API_KEY are documented in the plan and must be set at runtime.)

## Next Phase Readiness

- Proxy client is ready for use by migrated Netatmo API routes in Plans 02+
- Old lib/netatmoApi.ts untouched — migration is incremental
- Types cover both /homestatus and /homesdata endpoints

## Self-Check

- [x] `types/netatmoProxy.ts` exists and has no tsc errors
- [x] `lib/netatmoProxy.ts` exists and exports netatmoProxyGet, getProxyHomestatus, getProxyHomesdata
- [x] `__tests__/lib/netatmoProxy.test.ts` exists with 13 tests all passing
- [x] Commits 2462ce8, 4c6e140, 35cd821 present in git log

---
*Phase: 75-api-client-foundation-energy-read*
*Completed: 2026-03-15*
