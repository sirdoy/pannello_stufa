---
phase: quick-27
plan: "01"
subsystem: network-monitor
tags: [firebase-rtdb, bandwidth-history, health-assessment, persistence]
dependency_graph:
  requires: [lib/fritzbox/deviceEventLogger.ts, lib/firebaseAdmin, lib/environmentHelper]
  provides: [lib/fritzbox/bandwidthHistoryLogger.ts, app/api/fritzbox/bandwidth-history/route.ts]
  affects: [app/network/hooks/useBandwidthHistory.ts, app/components/devices/network/networkHealthUtils.ts, app/components/devices/network/hooks/useNetworkData.ts]
tech_stack:
  added: []
  patterns: [fire-and-forget persistence, date-keyed RTDB paths, weighted average health, sparkline trend]
key_files:
  created:
    - lib/fritzbox/bandwidthHistoryLogger.ts
    - app/api/fritzbox/bandwidth-history/route.ts
    - lib/fritzbox/__tests__/bandwidthHistoryLogger.test.ts
  modified:
    - lib/fritzbox/index.ts
    - app/api/fritzbox/bandwidth/route.ts
    - app/network/hooks/useBandwidthHistory.ts
    - app/components/devices/network/types.ts
    - app/components/devices/network/networkHealthUtils.ts
    - app/components/devices/network/hooks/useNetworkData.ts
    - app/api/fritzbox/bandwidth/__tests__/route.test.ts
    - app/network/hooks/__tests__/useBandwidthHistory.test.ts
decisions:
  - "Fire-and-forget persistence in bandwidth route: appendBandwidthReading + cleanupOldBandwidthHistory called after response, non-blocking"
  - "Sort ascending (oldest first) for chart rendering — getBandwidthHistory returns ascending order"
  - "isLoading starts true: isEmpty and isCollecting are false during server load to avoid false empty-state UI"
  - "70/30 historical/current blend for health: reduces flapping from single noisy readings"
  - "Require 3+ recent sparkline points for historicalAvgSaturation to avoid noise from initial readings"
metrics:
  duration: "~9 minutes"
  completed: "2026-02-17"
  tasks_completed: 3
  files_changed: 11
---

# Quick Task 27: Historical Bandwidth Data Summary

Firebase RTDB persistence for bandwidth readings with date-keyed storage, 7-day cleanup, instant chart pre-population on page load, and trend-aware health assessment using 70/30 weighted saturation blend.

## Objective

Persist bandwidth readings to Firebase RTDB so charts always have historical data on page open (not blank then filling), and enhance health assessment with trend awareness to reduce flapping.

## Tasks Completed

### Task 1: Bandwidth history persistence library + storage in bandwidth route

**Commit:** `9289f26`

Created `lib/fritzbox/bandwidthHistoryLogger.ts` modeled after `deviceEventLogger.ts`:
- `appendBandwidthReading(data)` — writes to `{env}/fritzbox/bandwidth_history/{YYYY-MM-DD}/{timestamp}` using `adminDbSet`
- `getBandwidthHistory(startTime, endTime)` — queries all date nodes in range in parallel, merges, filters by exact timestamp, returns sorted ascending for chart rendering
- `cleanupOldBandwidthHistory()` — deletes date nodes older than 7 days via `adminDbGet` (list keys) + `adminDbRemove` per old key

Updated `lib/fritzbox/index.ts` to barrel-export all three functions.

Updated `app/api/fritzbox/bandwidth/route.ts` to fire-and-forget persist + cleanup after each poll (non-blocking, does not delay response).

### Task 2: GET /api/fritzbox/bandwidth-history route + useBandwidthHistory load on mount

**Commit:** `5841571`

Created `app/api/fritzbox/bandwidth-history/route.ts`:
- GET `/api/fritzbox/bandwidth-history?range={1h|24h|7d}` (default: 24h)
- Returns `{ success: true, data: { points, range, totalCount } }`
- Auth-protected, no rate limiting (read-only, called only on mount)

Updated `app/network/hooks/useBandwidthHistory.ts`:
- Added `isLoading` state (starts `true`)
- `loadHistoryFromServer` fetches 7 days of stored history on mount, sets history, caps at MAX_POINTS
- `isEmpty = history.length === 0 && !isLoading` — stays `false` while loading (avoids false empty-state UI)
- `isCollecting = history.length > 0 && history.length < COLLECTING_THRESHOLD && !isLoading`
- Added `isLoading: boolean` to `UseBandwidthHistoryReturn` type in `types.ts`

### Task 3: Trend-aware health assessment + tests

**Commit:** `7a4f061`

Updated `app/components/devices/network/networkHealthUtils.ts`:
- Added optional `historicalAvgSaturation?: number` to `ComputeNetworkHealthParams`
- Computes `effectiveSaturation = 0.3 * current + 0.7 * historical` when historical data available
- Falls back to current reading when `historicalAvgSaturation` is undefined
- All threshold comparisons use `effectiveSaturation`

Updated `app/components/devices/network/hooks/useNetworkData.ts`:
- Computes `historicalAvgSaturation` from sparkline buffers (last 30 min, requires 3+ points)
- Passes to `computeNetworkHealth` on each poll cycle

Created `lib/fritzbox/__tests__/bandwidthHistoryLogger.test.ts`:
- Tests `appendBandwidthReading`: correct path pattern, date key, environment path usage
- Tests `getBandwidthHistory`: single/multi-date queries, merge, filter, sort, structure
- Tests `cleanupOldBandwidthHistory`: removes old nodes only, handles empty data
- Tests `computeNetworkHealth` with `historicalAvgSaturation`: weighted blend behavior

Fixed `app/api/fritzbox/bandwidth/__tests__/route.test.ts`:
- Added mocks for `appendBandwidthReading` and `cleanupOldBandwidthHistory` (auto-mock from `@/lib/fritzbox` was returning `undefined` instead of Promise)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Bandwidth route test broken by fire-and-forget addition**
- **Found during:** Task 3 (full test run)
- **Issue:** `appendBandwidthReading` and `cleanupOldBandwidthHistory` were called with `.catch()` but the auto-mock returned `undefined` instead of a Promise, causing a runtime error in tests
- **Fix:** Added explicit `mockResolvedValue(undefined)` for both functions in the bandwidth route test `beforeEach`
- **Files modified:** `app/api/fritzbox/bandwidth/__tests__/route.test.ts`
- **Commit:** `7a4f061`

**2. [Rule 2 - Enhancement] useBandwidthHistory test updated for isLoading property**
- **Found during:** Task 2
- **Issue:** Existing "Hook interface" test did not check for `isLoading` property in return type
- **Fix:** Added `expect(result.current).toHaveProperty('isLoading')` assertion
- **Files modified:** `app/network/hooks/__tests__/useBandwidthHistory.test.ts`
- **Commit:** `5841571`

## Success Criteria Verification

- Firebase RTDB path `fritzbox/bandwidth_history/{date}/{timestamp}` accumulates readings on each bandwidth poll
- `/api/fritzbox/bandwidth-history?range=7d` returns stored points array
- `useBandwidthHistory` loads 7 days of stored history on mount — `isEmpty=false` immediately if history exists
- `computeNetworkHealth` uses `historicalAvgSaturation` when provided (70% weight), falls back to current reading only
- 75 tests pass across all affected test suites (0 regressions introduced)

## Self-Check: PASSED

Files verified:
- `lib/fritzbox/bandwidthHistoryLogger.ts` — FOUND
- `app/api/fritzbox/bandwidth-history/route.ts` — FOUND
- `lib/fritzbox/__tests__/bandwidthHistoryLogger.test.ts` — FOUND
- `lib/fritzbox/index.ts` exports `appendBandwidthReading, getBandwidthHistory, cleanupOldBandwidthHistory` — VERIFIED
- `useBandwidthHistory.ts` imports `useEffect`, has `isLoading` state — VERIFIED
- `types.ts` has `isLoading: boolean` in `UseBandwidthHistoryReturn` — VERIFIED
- `networkHealthUtils.ts` has `historicalAvgSaturation` in params — VERIFIED

Commits verified:
- `9289f26` — FOUND (Task 1)
- `5841571` — FOUND (Task 2)
- `7a4f061` — FOUND (Task 3)
