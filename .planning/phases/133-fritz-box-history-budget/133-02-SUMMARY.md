---
phase: 133
plan: "02"
subsystem: fritzbox
tags: [api, fritzbox, history, devices, budget, routes]
dependency_graph:
  requires:
    - "133-01: fritzboxClient getDevicesDaily + getBudgetStats methods"
  provides:
    - "GET /api/fritzbox/history/devices/daily"
    - "GET /api/fritzbox/budget-stats"
  affects:
    - "Phase 134 frontend: device trends + budget consumption display"
tech_stack:
  added: []
  patterns:
    - "withAuthAndErrorHandler + checkRateLimitFritzBox + getCachedData + success() route pattern"
    - "Paginated pass-through with days/limit/offset forwarding"
    - "Flat-object pass-through with _request (no query params)"
    - "Auto-mock guard: if (!mockFritzboxClient.method) { (mockFritzboxClient as any).method = jest.fn() }"
key_files:
  created:
    - app/api/fritzbox/history/devices/daily/route.ts
    - app/api/fritzbox/history/devices/daily/__tests__/route.test.ts
    - app/api/fritzbox/budget-stats/route.ts
    - app/api/fritzbox/budget-stats/__tests__/route.test.ts
  modified:
    - lib/fritzbox/fritzboxClient.ts (updated from main to include Phase 133 methods)
decisions:
  - "devices/daily uses paginated pattern: forwards days/limit/offset URLSearchParams to fritzboxClient.getDevicesDaily"
  - "budget-stats uses flat-object pattern: _request (no query params), fritzboxClient.getBudgetStats() with no args"
  - "Auto-mock guard applied to getDevicesDaily and getBudgetStats methods in test beforeEach blocks"
metrics:
  duration_minutes: 8
  completed_date: "2026-03-25"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 1
---

# Phase 133 Plan 02: Fritz!Box History & Budget Routes Summary

Created 2 Fritz!Box API routes (daily device count history + budget statistics) with 10 tests, completing the Phase 133 API surface for Phase 134 frontend consumption.

## Tasks Completed

| Task | Description | Commit | Status |
|------|-------------|--------|--------|
| 1 | Create history/devices/daily route + test | b3ab1ca8 | Done |
| 2 | Create budget-stats route + test | ed388127 | Done |

## What Was Built

### history/devices/daily Route (FRITZ-10)

`app/api/fritzbox/history/devices/daily/route.ts` — Paginated pattern matching bandwidth history routes:
- `checkRateLimitFritzBox(session.user.sub, 'history-devices-daily')`
- Extracts `days`, `limit`, `offset` from searchParams, forwards via URLSearchParams
- `getCachedData('history-devices-daily', () => fritzboxClient.getDevicesDaily(params))`
- Returns `success({ deviceCounts })` — DeviceDailyRecord items with day_timestamp + hour_bucket (0-23)

### budget-stats Route (FRITZ-12)

`app/api/fritzbox/budget-stats/route.ts` — Flat-object pattern:
- Uses `_request` (no query params per D-08)
- `checkRateLimitFritzBox(session.user.sub, 'budget-stats')`
- `getCachedData('budget-stats', () => fritzboxClient.getBudgetStats())`
- Returns `success({ stats })` — BudgetStats with status, utilization_percent, window/limit fields

### Test Files (10 tests, all passing)

Both test files follow the bandwidth test pattern: 401 unauthenticated, 200 with data, 429 rate limited, cache key assertion, 500 error propagation. Auto-mock guard applied for new Phase 133 methods.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Worktree fritzboxClient.ts missing Phase 133 additions**
- **Found during:** Task 1
- **Issue:** Worktree had old fritzboxClient.ts (7 methods, pre-Phase-132/133) — `getDevicesDaily` and `getBudgetStats` methods did not exist in working tree.
- **Fix:** Copied main branch version (`git show main:lib/fritzbox/fritzboxClient.ts`) to worktree before creating routes. Same fix as Plan 01 applied for Plan 02 worktree context.
- **Files modified:** `lib/fritzbox/fritzboxClient.ts`
- **Commit:** b3ab1ca8 (included in Task 1 commit)

## Self-Check

Files created/modified check:
- `app/api/fritzbox/history/devices/daily/route.ts` — created, exports GET + dynamic
- `app/api/fritzbox/history/devices/daily/__tests__/route.test.ts` — created, 5 tests passing
- `app/api/fritzbox/budget-stats/route.ts` — created, exports GET + dynamic, uses _request
- `app/api/fritzbox/budget-stats/__tests__/route.test.ts` — created, 5 tests passing
- Full Fritz!Box suite: 57 tests passing, 0 regressions

## Self-Check: PASSED
