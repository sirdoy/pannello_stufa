---
phase: 147-tuya-infrastructure
plan: 02
subsystem: api
tags: [tuya, api-routes, next-js, withAuthAndErrorHandler, withErrorHandler, unit-tests]

# Dependency graph
requires:
  - phase: 147-01
    provides: tuyaProxy.ts function module with getHealth/getPlugs/getPlug/setState/setTimer/getHistory

provides:
  - GET /api/tuya/health (no auth, withErrorHandler)
  - GET /api/tuya/plugs (auth required, withAuthAndErrorHandler)
  - GET /api/tuya/plugs/[device_id] (auth required, getPathParam)
  - POST /api/tuya/plugs/[device_id]/state (200 pass-through, not 202)
  - POST /api/tuya/plugs/[device_id]/timer (200 pass-through, not 202)
  - GET /api/tuya/plugs/[device_id]/history (query param forwarding)
  - 6 unit test suites (24 tests total)

affects: [148-tuya-frontend, any phase consuming tuya plug data via Next.js routes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Mock request objects with explicit text()/headers.get() for parseJson tests
    - Mock request objects with nextUrl.searchParams for query param route tests
    - withErrorHandler for health routes (no auth per D-04)
    - withAuthAndErrorHandler for all other routes
    - 200 pass-through (no 202 Accepted) for synchronous Tuya commands

key-files:
  created:
    - app/api/tuya/health/route.ts
    - app/api/tuya/plugs/route.ts
    - app/api/tuya/plugs/[device_id]/route.ts
    - app/api/tuya/plugs/[device_id]/state/route.ts
    - app/api/tuya/plugs/[device_id]/timer/route.ts
    - app/api/tuya/plugs/[device_id]/history/route.ts
    - app/api/tuya/health/__tests__/route.test.ts
    - app/api/tuya/plugs/__tests__/route.test.ts
    - app/api/tuya/plugs/[device_id]/__tests__/route.test.ts
    - app/api/tuya/plugs/[device_id]/state/__tests__/route.test.ts
    - app/api/tuya/plugs/[device_id]/timer/__tests__/route.test.ts
    - app/api/tuya/plugs/[device_id]/history/__tests__/route.test.ts
  modified: []

key-decisions:
  - "Health route uses withErrorHandler (not withAuthAndErrorHandler) per D-04 — no auth required for connectivity checks"
  - "POST state/timer routes return 200 (not 202 Accepted) — Tuya proxy confirms commands synchronously via data_confirmed field"
  - "Mock request objects with text() method used for POST body parsing tests (not new Request()) — avoids stream consumption issue with auth0.getSession mock"
  - "Mock request objects with nextUrl.searchParams used for history GET tests (not new Request()) — follows established pattern from hue/history tests"

patterns-established:
  - "Mock POST requests: { headers: { get: () => 'application/json' }, text: async () => JSON.stringify(body) } for parseJson-based routes"
  - "Mock GET requests with searchParams: { nextUrl: { searchParams: new URLSearchParams(qs) } } for nextUrl.searchParams routes"

requirements-completed: [TUYA-03, TUYA-04, TUYA-05, TUYA-06, TUYA-07, TUYA-08]

# Metrics
duration: 8min
completed: 2026-03-30
---

# Phase 147 Plan 02: Tuya API Routes Summary

**6 Next.js API route proxies for Tuya smart plugs — health (no auth), plugs list/detail, state/timer commands (200 not 202), and paginated history — with 24 passing unit tests.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-30T08:33:00Z
- **Completed:** 2026-03-30T08:41:02Z
- **Tasks:** 3 completed
- **Files modified:** 12 created (6 routes + 6 tests)

## Accomplishments
- 6 route files created under `app/api/tuya/` following D-01 (200 not 202), D-02 (device_id param), D-04 (health no auth)
- 24 unit tests passing — covering auth enforcement, 200 vs 202 assertion, body parsing, query param forwarding
- Zero TypeScript errors throughout
- Mock request patterns established for POST body parsing and query param forwarding (applied consistently across 3 test files)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create health and plugs list routes** - `cdb9980e` (feat)
2. **Task 2: Create single plug, state, timer, and history routes** - `c1d40ba0` (feat)
3. **Task 3: Create unit tests for all 6 route files** - `50949550` (test)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified
- `app/api/tuya/health/route.ts` - GET health, withErrorHandler (no auth per D-04)
- `app/api/tuya/plugs/route.ts` - GET all plugs, withAuthAndErrorHandler
- `app/api/tuya/plugs/[device_id]/route.ts` - GET single plug, getPathParam('device_id')
- `app/api/tuya/plugs/[device_id]/state/route.ts` - POST toggle, 200 with data_confirmed
- `app/api/tuya/plugs/[device_id]/timer/route.ts` - POST timer, 200 with data_confirmed
- `app/api/tuya/plugs/[device_id]/history/route.ts` - GET history, searchParams forwarding
- `app/api/tuya/health/__tests__/route.test.ts` - 2 tests (no auth check)
- `app/api/tuya/plugs/__tests__/route.test.ts` - 3 tests (401 + success + error)
- `app/api/tuya/plugs/[device_id]/__tests__/route.test.ts` - 3 tests (path param verify)
- `app/api/tuya/plugs/[device_id]/state/__tests__/route.test.ts` - 5 tests (200 not 202)
- `app/api/tuya/plugs/[device_id]/timer/__tests__/route.test.ts` - 5 tests (200 not 202)
- `app/api/tuya/plugs/[device_id]/history/__tests__/route.test.ts` - 6 tests (query forwarding)

## Decisions Made
- Mock request objects with explicit `text()` and `headers.get()` methods used for POST body tests rather than `new Request()` — avoids potential stream consumption issues in jsdom environment when `auth0.getSession` is called first
- Mock request objects with `{ nextUrl: { searchParams } }` pattern used for history route tests — follows established pattern from `app/api/hue/history/__tests__/route.test.ts`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test request pattern for POST body parsing**
- **Found during:** Task 3 (tests for state and timer routes)
- **Issue:** Tests using `new Request(..., { body, headers })` resulted in `parseJson` returning `{}` (empty object) — the `auth0.getSession(request)` mock may consume the request stream, or Jest jsdom environment has body reading limitations with real Request objects
- **Fix:** Replaced `new Request()` with mock objects exposing `text()` and `headers.get()` directly — consistent with how other POST route tests in the codebase work (e.g., `setroomthermpoint`)
- **Files modified:** state/__tests__/route.test.ts, timer/__tests__/route.test.ts
- **Verification:** All 10 state/timer tests pass including body parsing assertions
- **Committed in:** 50949550 (Task 3 commit)

**2. [Rule 1 - Bug] Test request pattern for history query params**
- **Found during:** Task 3 (tests for history route)
- **Issue:** Plain `Request` objects don't have `nextUrl` property — history route uses `request.nextUrl.searchParams`, causing 500 errors in tests
- **Fix:** Used `{ nextUrl: { searchParams: new URLSearchParams(qs) } }` mock objects — follows established pattern from `app/api/hue/history/__tests__/route.test.ts`
- **Files modified:** history/__tests__/route.test.ts
- **Verification:** All 6 history tests pass including query param forwarding assertions
- **Committed in:** 50949550 (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - Bug)
**Impact on plan:** Both fixes resolved test failures caused by jsdom/NextRequest incompatibilities. Route implementation unchanged. No scope creep.

## Issues Encountered
- Worktree was behind main — required `git merge main` to get 147-01 tuyaProxy.ts before starting execution

## Next Phase Readiness
- All 6 Tuya API routes are ready for Phase 148 frontend hooks to consume
- Pattern established for testing both POST body parsing and GET query param forwarding in this project's test environment
- No blockers

## Known Stubs
None — all routes wire directly to real tuyaProxy functions.

---
*Phase: 147-tuya-infrastructure*
*Completed: 2026-03-30*
