---
phase: quick-28
plan: 01
subsystem: network/fritzbox
tags: [fritzbox, bandwidth, firebase, cleanup, api-proxy]
dependency_graph:
  requires: []
  provides: [fritzboxClient.getBandwidthHistory, /api/fritzbox/bandwidth-history proxy]
  affects: [lib/fritzbox/fritzboxClient.ts, app/api/fritzbox/bandwidth-history/route.ts]
tech_stack:
  added: []
  patterns: [external-api-proxy, paginated-fetch, unit-conversion]
key_files:
  created: []
  modified:
    - lib/fritzbox/fritzboxClient.ts
    - lib/fritzbox/index.ts
    - app/api/fritzbox/bandwidth/route.ts
    - app/api/fritzbox/bandwidth/__tests__/route.test.ts
    - app/api/fritzbox/bandwidth-history/route.ts
  deleted:
    - lib/fritzbox/bandwidthHistoryLogger.ts
    - lib/fritzbox/__tests__/bandwidthHistoryLogger.test.ts
decisions:
  - Proxy external /api/v1/history/bandwidth instead of reading from Firebase RTDB
  - Pagination with limit=1000 and parallel page fetches for large datasets
  - Unit conversion in client: timestamp * 1000 (seconds to ms), rates / 1_000_000 (bps to Mbps)
metrics:
  duration: 2m 19s
  completed: 2026-02-17
  tasks_completed: 2
  files_changed: 7
---

# Quick Task 28: Replace Firebase Bandwidth Persistence Summary

**One-liner:** Replaced Firebase RTDB bandwidth persistence with direct proxy to external /api/v1/history/bandwidth API via FritzBoxClient.getBandwidthHistory().

## What Was Done

Removed all Firebase persistence code for bandwidth readings and replaced it with a clean external API proxy pattern. The external Fritz!Box history API already provides historical data — no need to persist readings ourselves.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Remove Firebase persistence, add getBandwidthHistory to FritzBoxClient | 99ae187 | 6 files (2 deleted, 4 modified) |
| 2 | Rewrite bandwidth-history proxy route + update hook | d371f3b | 1 file modified |

## Changes Made

### Task 1: Firebase Persistence Removed

**Deleted:**
- `lib/fritzbox/bandwidthHistoryLogger.ts` — Firebase RTDB persistence layer no longer needed
- `lib/fritzbox/__tests__/bandwidthHistoryLogger.test.ts` — tests for deleted module

**Modified:**
- `lib/fritzbox/index.ts` — Removed barrel exports of `appendBandwidthReading`, `getBandwidthHistory`, `cleanupOldBandwidthHistory`
- `lib/fritzbox/fritzboxClient.ts` — Added `getBandwidthHistory(hours)` method:
  - Fetches `/api/v1/history/bandwidth?hours={n}&limit=1000&offset={n}`
  - Paginates: first page gets `total_count`, remaining pages fetched in parallel
  - Transforms: `timestamp * 1000` (Unix seconds to ms), `downstream_rate / 1_000_000` (bps to Mbps)
  - Returns array sorted ascending by time
- `app/api/fritzbox/bandwidth/route.ts` — Removed fire-and-forget `appendBandwidthReading` and `cleanupOldBandwidthHistory` calls; import simplified
- `app/api/fritzbox/bandwidth/__tests__/route.test.ts` — Removed obsolete mock setup for deleted functions

### Task 2: Bandwidth-History Route Rewritten

**Modified:**
- `app/api/fritzbox/bandwidth-history/route.ts` — Replaced Firebase RTDB query with `fritzboxClient.getBandwidthHistory(hours)` call; removed `getTimeRangeMs` helper in favor of `rangeToHours` for external API; response shape unchanged

**Unchanged:**
- `app/network/hooks/useBandwidthHistory.ts` — No changes needed; hook fetches from `/api/fritzbox/bandwidth-history?range=7d` and expects `{ data: { points: [{ time, download, upload }] } }` — same shape as before

## Test Results

- Bandwidth route tests: 5/5 passing
- useBandwidthHistory hook tests: 14/14 passing

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

### Files Verified

- `lib/fritzbox/bandwidthHistoryLogger.ts` deleted: FOUND (confirmed gone)
- `lib/fritzbox/fritzboxClient.ts` has `getBandwidthHistory`: FOUND
- `app/api/fritzbox/bandwidth-history/route.ts` proxies fritzboxClient: FOUND
- `app/api/fritzbox/bandwidth/route.ts` no longer imports firebase functions: FOUND

### Commits Verified

- 99ae187: Task 1 commit
- d371f3b: Task 2 commit

## Self-Check: PASSED
