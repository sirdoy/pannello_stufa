---
phase: 64-bandwidth-visualization
plan: 01
subsystem: network-monitoring
tags: [recharts, lttb, decimation, hooks, tdd, time-series]

# Dependency graph
requires:
  - phase: 63-wan-status-device-list
    provides: NetworkCard infrastructure and useNetworkData hook
provides:
  - LTTB decimation algorithm for time-series data (10080 → 500 points)
  - useBandwidthHistory hook with time range filtering (1h/24h/7d)
  - BandwidthHistoryPoint types and interfaces
affects: [64-02-bandwidth-chart, 64-03-network-page-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "LTTB (Largest Triangle Three Buckets) decimation for visual fidelity"
    - "Passive data accumulation (no polling in hook)"
    - "TDD with comprehensive edge case coverage"

key-files:
  created:
    - lib/utils/decimateLTTB.ts
    - lib/utils/__tests__/decimateLTTB.test.ts
    - app/network/hooks/useBandwidthHistory.ts
    - app/network/hooks/__tests__/useBandwidthHistory.test.ts
  modified:
    - app/components/devices/network/types.ts

key-decisions:
  - "Default to 24h time range per research recommendation (balance detail vs context)"
  - "Decimate using download Mbps as selection criterion (primary user metric)"
  - "Hook is passive accumulator — page orchestrator feeds data to avoid duplicate polling"
  - "Buffer caps at 10080 points (7-day max, 1-minute intervals)"

patterns-established:
  - "TDD protocol: RED (failing tests) → GREEN (implementation) → commit"
  - "Decimation applied only when filtered data exceeds 500 points"
  - "Time range filtering before decimation to minimize work"
  - "Derived status flags: isEmpty, isCollecting (<10 points)"

# Metrics
duration: 4min
completed: 2026-02-16
---

# Phase 64 Plan 01: Data Layer Summary

**LTTB decimation algorithm and useBandwidthHistory hook with 7-day buffering, time range filtering (1h/24h/7d), and automatic decimation to 500 points**

## Performance

- **Duration:** 4 min 12 sec
- **Started:** 2026-02-16T08:22:58Z
- **Completed:** 2026-02-16T08:27:10Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- LTTB decimation algorithm reduces 10080 points to 500 while preserving visual peaks and valleys
- useBandwidthHistory hook buffers up to 7 days of data with automatic time range filtering
- Automatic decimation only when filtered data exceeds 500 points (performance optimization)
- 27 passing tests with comprehensive edge case coverage (empty, single point, threshold=2, 10080→500)
- Hook is passive accumulator — no duplicate polling (data fed via addDataPoint from page orchestrator)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create LTTB decimation algorithm with TDD** - `deb6aca` (test)
   - RED phase: 13 failing tests
   - GREEN phase: LTTB implementation, all tests pass
   - Types extension: BandwidthHistoryPoint, BandwidthTimeRange, UseBandwidthHistoryReturn

2. **Task 2: Create useBandwidthHistory hook with TDD** - `a2c8dcf` (feat)
   - RED phase: 14 failing tests
   - GREEN phase: Hook implementation, all tests pass
   - Decimation integration via mocked decimateLTTB

## Files Created/Modified

- `lib/utils/decimateLTTB.ts` - LTTB decimation algorithm for time-series data
- `lib/utils/__tests__/decimateLTTB.test.ts` - 13 tests (pass-through, decimation, boundary/peak/valley preservation, edge cases)
- `app/network/hooks/useBandwidthHistory.ts` - Bandwidth history hook with buffering, filtering, decimation
- `app/network/hooks/__tests__/useBandwidthHistory.test.ts` - 14 tests (initialization, accumulation, time range, decimation, interface)
- `app/components/devices/network/types.ts` - Extended with BandwidthHistoryPoint, BandwidthTimeRange, UseBandwidthHistoryReturn

## Decisions Made

1. **Default 24h time range**: Research showed 24h provides best balance of detail vs context for typical monitoring use cases
2. **Download-based decimation**: LTTB uses download Mbps as selection criterion since it's the primary user-relevant metric. Upload values are preserved at the selected time indices
3. **Passive hook pattern**: Hook exposes `addDataPoint` callback instead of polling internally. Page orchestrator feeds bandwidth data from `useNetworkData()` to avoid duplicate API calls (Pitfall 4 from research)
4. **10080 point buffer**: 7 days × 24 hours × 60 minutes = 10080 one-minute intervals. Oldest points automatically dropped when buffer exceeds limit
5. **500 point decimation threshold**: Research recommended 500 points for optimal chart rendering performance on mobile devices

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - TDD protocol worked smoothly, all tests passed on first GREEN implementation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Data layer complete and ready for BandwidthChart component (Plan 02):
- LTTB decimation tested with 10080 → 500 reduction
- Hook interface matches UseBandwidthHistoryReturn type
- Time range filtering verified for 1h/24h/7d
- Decimation only applied when needed (>500 points)
- No duplicate polling (passive accumulator pattern)

**Blockers:** None

**Notes for Plan 02:**
- BandwidthChart should render `chartData` from `useBandwidthHistory()`
- Time range selector should call `setTimeRange()`
- Page orchestrator should call `addDataPoint()` with bandwidth from `useNetworkData()`
- Recharts AreaChart recommended for dual download/upload visualization
- isCollecting flag can show "Collecting data..." message when <10 points

---
*Phase: 64-bandwidth-visualization*
*Completed: 2026-02-16*

## Self-Check: PASSED

All files created and commits verified:
- ✓ lib/utils/decimateLTTB.ts
- ✓ lib/utils/__tests__/decimateLTTB.test.ts
- ✓ app/network/hooks/useBandwidthHistory.ts
- ✓ app/network/hooks/__tests__/useBandwidthHistory.test.ts
- ✓ Commit deb6aca (Task 1)
- ✓ Commit a2c8dcf (Task 2)
