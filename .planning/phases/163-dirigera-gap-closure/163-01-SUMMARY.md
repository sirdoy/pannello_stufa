---
phase: 163
plan: 01
subsystem: dirigera
tags: [api, gap-closure, dirigera, ha-proxy]
requires:
  - lib/haClient.ts (haGet)
  - lib/core (withAuthAndErrorHandler, success)
  - types/dirigeraProxy.ts (future-phase types already declared)
provides:
  - GET /api/v1/dirigera/history (DIR-01)
  - GET /api/v1/dirigera/stats (DIR-02)
  - GET /api/v1/dirigera/telemetry (DIR-03)
  - lib/dirigera/dirigeraProxy.ts::{getHistory, getStats, getTelemetry}
  - types/dirigeraProxy.ts::{SensorHistoryParams, SensorTelemetryParams}
affects: []
tech-stack:
  added: []
  patterns:
    - Raw pass-through (no PaginatedResponse<T> envelope) per D-08
    - URLSearchParams serialization skipping null/undefined/empty per D-05
    - Module-local buildQueryString helper (not exported)
    - success(data as unknown as Record<string, unknown>) double-cast idiom
    - 'new URL(request.url)' for query-param parsing (test-safe vs request.nextUrl)
key-files:
  created:
    - app/api/v1/dirigera/history/route.ts
    - app/api/v1/dirigera/history/__tests__/route.test.ts
    - app/api/v1/dirigera/stats/route.ts
    - app/api/v1/dirigera/stats/__tests__/route.test.ts
    - app/api/v1/dirigera/telemetry/route.ts
    - app/api/v1/dirigera/telemetry/__tests__/route.test.ts
  modified:
    - types/dirigeraProxy.ts
    - lib/dirigera/dirigeraProxy.ts
    - lib/dirigera/__tests__/dirigeraProxy.test.ts
decisions:
  - Reused already-declared response types from types/dirigeraProxy.ts (zero new response type work)
  - Used 'new URL(request.url)' instead of 'request.nextUrl' (Rule 1 fix — plain Request in unit tests has no nextUrl)
  - Cast params through Record<string, string|number|null|undefined> when calling buildQueryString (needed for strict index-signature compat)
metrics:
  duration: ~15min
  tasks: 4
  files: 9
  tests_added: 15 (5 proxy + 4 history + 2 stats + 4 telemetry)
  completed: 2026-04-14
---

# Phase 163 Plan 01: DIRIGERA Gap Closure — History, Stats, Telemetry Summary

Added the three remaining read-only DIRIGERA v1 endpoints (history, stats, telemetry) as thin proxies over the shared HA client, bringing DIRIGERA provider coverage to 100% parity with the other six device providers and unblocking downstream analytics/history UI work.

## Requirements Satisfied

- **DIR-01** — GET /api/v1/dirigera/history returns paginated sensor event history with `events[]`, `total`, `limit`, `offset`, 401 when unauthenticated, typed query-param forwarding (`sensor_id`, `event_type`, `start`, `end`, `limit`, `offset`).
- **DIR-02** — GET /api/v1/dirigera/stats returns aggregation + retention statistics, 401 when unauthenticated.
- **DIR-03** — GET /api/v1/dirigera/telemetry returns paginated sensor telemetry with `telemetry[]`, `total`, `limit`, `offset`, 401 when unauthenticated, typed query-param forwarding (`sensor_id`, `start`, `end`, `limit`, `offset` — no `event_type`).

## Tasks Executed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add SensorHistoryParams/SensorTelemetryParams types, append getHistory/getStats/getTelemetry to dirigeraProxy.ts, extend proxy unit tests | `c940a88c` | types/dirigeraProxy.ts, lib/dirigera/dirigeraProxy.ts, lib/dirigera/__tests__/dirigeraProxy.test.ts |
| 2 | Create history route + 4 route tests | `5e90a653` | app/api/v1/dirigera/history/route.ts + __tests__/route.test.ts |
| 3 | Create stats route + 2 route tests | `5ddbefe6` | app/api/v1/dirigera/stats/route.ts + __tests__/route.test.ts |
| 4 | Create telemetry route + 4 route tests | `a5faa38e` | app/api/v1/dirigera/telemetry/route.ts + __tests__/route.test.ts |

## Test Results

All 20 targeted tests green:

```
PASS app/api/v1/dirigera/stats/__tests__/route.test.ts       (2 tests)
PASS lib/dirigera/__tests__/dirigeraProxy.test.ts            (10 tests, 5 new)
PASS app/api/v1/dirigera/telemetry/__tests__/route.test.ts   (4 tests)
PASS app/api/v1/dirigera/history/__tests__/route.test.ts     (4 tests)

Test Suites: 4 passed, 4 total
Tests:       20 passed, 20 total
```

15 net-new tests added (5 proxy + 4 history + 2 stats + 4 telemetry).

## TypeScript

- Zero new tsc errors from this plan's files.
- Four pre-existing tsc errors remain (in `app/api/v1/automations/route.ts` and `app/api/v1/thermorossi/settings/*`) — logged to `deferred-items.md`, out of scope per scope-boundary rule.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Switched from `request.nextUrl.searchParams` to `new URL(request.url)`**
- **Found during:** Task 2 verification (3 of 4 route tests failed with status 500 because the mock `Request` object has no `nextUrl` getter).
- **Issue:** The literal template in RESEARCH/PLAN used `request.nextUrl.searchParams`, which only works on `NextRequest` instances. The unit tests pass a plain `new Request(...)` object (matching the pattern used by every existing v1 route test), so the route threw at `request.nextUrl` and `withErrorHandler` wrapped it as a 500.
- **Fix:** Replaced `const { searchParams } = request.nextUrl;` with `const { searchParams } = new URL(request.url);` in both history and telemetry routes. This is the exact pattern used by `app/api/v1/netatmo/getroommeasure/route.ts`, the reference template cited by RESEARCH. Behavior is identical at runtime (NextRequest extends Request; `request.url` is stable), and tests now pass.
- **Files modified:** `app/api/v1/dirigera/history/route.ts`, `app/api/v1/dirigera/telemetry/route.ts`
- **Commits:** `5e90a653` (Task 2 initial), `a5faa38e` (Task 4 already using the fix).

**2. [Rule 3 — Blocking] Cast SensorHistoryParams/SensorTelemetryParams to Record<string, …> at call site**
- **Found during:** Task 1 tsc verification.
- **Issue:** Under `strict: true`, an interface with only optional properties is NOT assignable to `Record<string, …>` because it lacks an index signature. `buildQueryString` parameter type `Record<string, string | number | null | undefined>` rejected the typed param interfaces.
- **Fix:** Added `as Record<string, string | number | null | undefined> | undefined` cast at each call site in `getHistory` and `getTelemetry`. Keeps `buildQueryString` generic (reusable if promoted to shared) and the public function signatures strictly typed.
- **Files modified:** `lib/dirigera/dirigeraProxy.ts`
- **Commit:** `c940a88c`.

No architectural changes. No scope expansion. All locked decisions D-01 through D-14 honored verbatim.

## Known Stubs

None — all three routes return live proxy data.

## Threat Flags

None — no new security surface beyond what T-163-01..T-163-05 already enumerate in the plan's threat model. `withAuthAndErrorHandler` + hard-coded proxy paths + HA proxy clamping cover all enumerated threats.

## Self-Check: PASSED

- [x] `types/dirigeraProxy.ts` — `SensorHistoryParams` + `SensorTelemetryParams` present (grep verified)
- [x] `lib/dirigera/dirigeraProxy.ts` — `getHistory`, `getStats`, `getTelemetry` named exports (grep verified)
- [x] `lib/dirigera/__tests__/dirigeraProxy.test.ts` — 5 new test cases (jest output verified 10 passing, was 5)
- [x] `app/api/v1/dirigera/history/route.ts` — exists with `Dirigera/History` operation label
- [x] `app/api/v1/dirigera/history/__tests__/route.test.ts` — exists with 4 test cases
- [x] `app/api/v1/dirigera/stats/route.ts` — exists with `Dirigera/Stats` operation label
- [x] `app/api/v1/dirigera/stats/__tests__/route.test.ts` — exists with 2 test cases
- [x] `app/api/v1/dirigera/telemetry/route.ts` — exists with `Dirigera/Telemetry` operation label, no `event_type` field
- [x] `app/api/v1/dirigera/telemetry/__tests__/route.test.ts` — exists with 4 test cases
- [x] Commit `c940a88c` present (Task 1)
- [x] Commit `5e90a653` present (Task 2)
- [x] Commit `5ddbefe6` present (Task 3)
- [x] Commit `a5faa38e` present (Task 4)
- [x] `npm test -- lib/dirigera app/api/v1/dirigera` exits 0 (20/20 pass)
- [x] `npx tsc --noEmit` exits 0 for all files touched by this plan
- [x] `app/api/dirigera/*` untouched (D-02 honored)
- [x] `PaginatedResponse<T>` NOT used (D-08 honored)
- [x] `SensorHistoryParams`/`SensorTelemetryParams` NOT exported from `types/common.ts` (D-07 honored)
