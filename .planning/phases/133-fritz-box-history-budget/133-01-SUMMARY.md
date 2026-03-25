---
phase: 133
plan: "01"
subsystem: fritzbox
tags: [api, fritzbox, bandwidth, history, budget]
dependency_graph:
  requires: []
  provides:
    - "fritzboxClient getBandwidthHourly/Daily/Auto/DevicesDaily/BudgetStats methods"
    - "GET /api/fritzbox/history/bandwidth/hourly"
    - "GET /api/fritzbox/history/bandwidth/daily"
    - "GET /api/fritzbox/history/bandwidth/auto"
  affects:
    - "lib/fritzbox/fritzboxClient.ts"
tech_stack:
  added: []
  patterns:
    - "paginated pass-through haGet method"
    - "withAuthAndErrorHandler + rate limit + getCachedData + success() route pattern"
key_files:
  created:
    - app/api/fritzbox/history/bandwidth/hourly/route.ts
    - app/api/fritzbox/history/bandwidth/daily/route.ts
    - app/api/fritzbox/history/bandwidth/auto/route.ts
    - app/api/fritzbox/history/bandwidth/hourly/__tests__/route.test.ts
    - app/api/fritzbox/history/bandwidth/daily/__tests__/route.test.ts
    - app/api/fritzbox/history/bandwidth/auto/__tests__/route.test.ts
  modified:
    - lib/fritzbox/fritzboxClient.ts
decisions:
  - "Auto-mock workaround: new methods not in main repo yet — guard with if (!mockFritzboxClient.getBandwidthXxx) before assigning jest.fn() in beforeEach"
metrics:
  duration_minutes: 15
  completed_date: "2026-03-25"
  tasks_completed: 2
  tasks_total: 2
  files_created: 6
  files_modified: 1
---

# Phase 133 Plan 01: Fritz!Box History & Budget Client Methods Summary

Expanded fritzboxClient.ts with 5 new history/budget interfaces and methods (FRITZ-08 through FRITZ-12), and created 3 bandwidth history API routes with 15 passing tests.

## Tasks Completed

| Task | Description | Commit | Status |
|------|-------------|--------|--------|
| 1 | Add 5 interfaces and 5 methods to fritzboxClient.ts | 27285f59 | Done |
| 2 | Create 3 bandwidth history routes + tests | 87187736 | Done |

## What Was Built

### fritzboxClient.ts — 5 new interfaces + 5 new methods (18 total)

Added after `getMeshTopology` (before the export object):

- `BandwidthHourlyRecord` — `hour_timestamp` + 9 aggregation fields (FRITZ-08)
- `BandwidthDailyRecord` — `day_timestamp` + 9 aggregation fields (FRITZ-09)
- `DeviceDailyRecord` — `day_timestamp`, `hour_bucket` (0-23), online/offline/total counts (FRITZ-10)
- `BandwidthAggregatedRecord` — `timestamp`, `granularity: 'hourly' | 'daily'` discriminator + 9 aggregation fields (FRITZ-11)
- `BudgetStats` — `status: 'ok' | 'warning' | 'danger'`, utilization_percent, window/limit fields (FRITZ-12)

Methods: `getBandwidthHourly`, `getBandwidthDaily`, `getDevicesDaily`, `getBandwidthAuto`, `getBudgetStats` — all raw pass-through haGet calls (no transformation per D-05).

### 3 Route Files

All follow the canonical DHCP reservations pattern: `withAuthAndErrorHandler` + `checkRateLimitFritzBox` + `getCachedData` at 60s TTL + `success()` response.

- `hourly/route.ts` — rate limit key `history-bandwidth-hourly`, cache key `history-bandwidth-hourly`, forwards `days/limit/offset`
- `daily/route.ts` — rate limit key `history-bandwidth-daily`, cache key `history-bandwidth-daily`, forwards `days/limit/offset`
- `auto/route.ts` — rate limit key `history-bandwidth-auto`, cache key `history-bandwidth-auto`, forwards `days/limit/offset`

### 3 Test Files (15 tests, all passing)

Each test file: 401 unauthenticated, 200 with data, 429 rate limited, cache key assertion, 500 error propagation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Auto-mock missing new methods during parallel worktree execution**
- **Found during:** Task 2 test run
- **Issue:** `jest.mock('@/lib/fritzbox')` creates auto-mocks from main repo's fritzboxClient.ts which lacks the Phase 133 methods (not yet merged). `mockFritzboxClient.getBandwidthHourly` was `undefined`.
- **Fix:** Added `if (!mockFritzboxClient.getBandwidthXxx) { (mockFritzboxClient as any).getBandwidthXxx = jest.fn(); }` guard in each `beforeEach`. Idiomatic workaround — once merged to main the guard is a no-op.
- **Files modified:** All 3 `__tests__/route.test.ts` files
- **Commits:** 87187736

**2. [Rule 3 - Blocking] Worktree fritzboxClient.ts missing Phase 132 additions**
- **Found during:** Task 1
- **Issue:** Worktree had 202-line fritzboxClient.ts (pre-Phase-132) vs main branch 378-line version with 13 methods. Plan required extending a 378-line file with 13 methods.
- **Fix:** Copied main branch version to worktree before making Phase 133 additions.
- **Files modified:** `lib/fritzbox/fritzboxClient.ts`
- **Commits:** 27285f59

## Self-Check

Files created/modified check:
- `lib/fritzbox/fritzboxClient.ts` — modified, 18 methods, export updated
- `app/api/fritzbox/history/bandwidth/hourly/route.ts` — created, exports GET + dynamic
- `app/api/fritzbox/history/bandwidth/daily/route.ts` — created, exports GET + dynamic
- `app/api/fritzbox/history/bandwidth/auto/route.ts` — created, exports GET + dynamic
- 3 test files created, 15 tests passing

## Self-Check: PASSED
