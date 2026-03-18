---
phase: 94-component-hook-test-fixes
plan: "02"
subsystem: network-hooks
tags: [bug-fix, stale-closure, test-mock, useNetworkData, useDeviceHistory]
dependency_graph:
  requires: []
  provides: [TFIX-10, TFIX-11]
  affects: [app/components/devices/network/hooks/useNetworkData.ts, app/network/hooks/__tests__/useDeviceHistory.test.ts]
tech_stack:
  added: []
  patterns: [useRef for stale-closure-safe reads, flat API shape assertion in tests]
key_files:
  created: []
  modified:
    - app/components/devices/network/hooks/useNetworkData.ts
    - app/network/hooks/__tests__/useDeviceHistory.test.ts
decisions:
  - "Refs (bandwidthRef/wanRef) preferred over adding state to useCallback deps — avoids unnecessary re-renders"
  - "Test mocks corrected to flat API shape; hook source left unchanged (source was already correct)"
metrics:
  duration: "~3 minutes"
  completed: "2026-03-18"
---

# Phase 94 Plan 02: useNetworkData Stale Closure & useDeviceHistory Mock Fix Summary

Fixed 1 failing stale-closure test in useNetworkData.test.ts (TFIX-10) by adding two refs, and corrected 5 incorrect mock shapes in useDeviceHistory.test.ts (TFIX-11) to match the actual flat API response.

## What Was Done

### Task 1 — Source Fix: useNetworkData stale closure (TFIX-10)

**Root cause:** `fetchData` is memoized with `useCallback([enrichDevicesWithCategories])`. The `FRITZBOX_TIMEOUT` error handler and the network-error `catch` block both guarded error display with `!bandwidth && !wan`. Since `bandwidth` and `wan` are React state and are NOT in the deps array, the callback captured their initial values (`null`) at creation time. After the first successful fetch set bandwidth state, `fetchData` was never recreated, so the guard always saw `null && null = true` and incorrectly set a generic error even when cached data existed.

**Fix:** Added two refs (`bandwidthRef`, `wanRef`) next to the existing `healthRef`/`consecutiveReadingsRef`/`enrichedMacsRef` block. Both refs are kept in sync after `setBandwidth` and `setWan` in the success path. Both `!bandwidth && !wan` guards replaced with `!bandwidthRef.current && !wanRef.current`.

**Fix type:** Source-side bug fix. The useCallback deps array is NOT changed.

**Lines changed:**
- Added `bandwidthRef` and `wanRef` declarations (~line 63)
- Added `bandwidthRef.current = bw` after `setBandwidth(bw)` (~line 225)
- Added `wanRef.current = wanData.wan || null` after `setWan(...)` (~line 235)
- Replaced guard in FRITZBOX_TIMEOUT handler (~line 190)
- Replaced guard in catch block (~line 282)

### Task 2 — Test Fix: useDeviceHistory response key mismatch (TFIX-11)

**Root cause:** The hook reads `data.events` at top level — correct, because `lib/core/apiResponse.ts` `success()` does `{ success: true, ...data }` (flat spread). The route calls `success({ events, range, totalCount })` yielding `{ success: true, events: [...] }`. The test mocks incorrectly used `{ success: true, data: { events: [...] } }` (nested under `data` key).

**Fix:** Updated 5 mock responses from nested shape to flat shape. The hook source was NOT modified.

**Fix type:** Test-side mock correction only.

**Occurrences fixed:**
1. "fetch events on mount" test — `mockResolvedValueOnce` with `mockEvents`
2. "re-fetch when timeRange changes" — `mockResolvedValue` with `[]`
3. "re-fetch when deviceFilter changes" — `mockResolvedValue` with `[]`
4. "isEmpty when events empty" — `mockResolvedValueOnce` with `[]`
5. "refresh function" test — `mockResolvedValue` with `mockEvents`

## Test Results Before/After

| Suite | Before | After |
|-------|--------|-------|
| useNetworkData.test.ts | 12 passed, 1 failed | 13 passed, 0 failed |
| useDeviceHistory.test.ts | 5 passed, 2 failed | 7 passed, 0 failed |
| **Combined** | **17 passed, 3 failed** | **20 passed, 0 failed** |

## Files Modified

- `app/components/devices/network/hooks/useNetworkData.ts` — 8 insertions, 2 deletions (source fix)
- `app/network/hooks/__tests__/useDeviceHistory.test.ts` — 5 insertions, 5 deletions (test fix)

## Commits

- `6c8cdc0` — fix(94-02): add bandwidthRef/wanRef to fix stale closure in FRITZBOX_TIMEOUT guard (TFIX-10)
- `72d6d14` — fix(94-02): correct test mocks to flat API shape in useDeviceHistory.test.ts (TFIX-11)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- useNetworkData.ts: FOUND
- useDeviceHistory.test.ts: FOUND
- Commit 6c8cdc0: FOUND
- Commit 72d6d14: FOUND
