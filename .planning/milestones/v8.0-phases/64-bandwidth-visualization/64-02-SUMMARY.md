---
phase: 64-bandwidth-visualization
plan: 02
subsystem: network-monitoring
tags: [recharts, ui-components, orchestrator, tdd, time-series-viz]

# Dependency graph
requires:
  - phase: 64-bandwidth-visualization
    plan: 01
    provides: LTTB decimation and useBandwidthHistory hook
  - phase: 63-wan-status-device-list
    provides: NetworkCard infrastructure and useNetworkData hook
provides:
  - BandwidthChart component with dual download/upload lines
  - TimeRangeSelector component with Button.Group (1h/24h/7d)
  - Complete bandwidth visualization on /network page
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Recharts LineChart with disabled animations for performance"
    - "Custom tooltip with dark theme and color-coded indicators"
    - "Empty state and collecting state UI patterns"
    - "Page orchestrator feeds single polling loop to chart (no duplicate API calls)"

key-files:
  created:
    - app/network/components/BandwidthChart.tsx
    - app/network/components/TimeRangeSelector.tsx
    - app/network/__tests__/components/BandwidthChart.test.tsx
    - app/network/__tests__/components/TimeRangeSelector.test.tsx
  modified:
    - app/network/page.tsx
    - app/network/__tests__/page.test.tsx

key-decisions:
  - "TimeRangeSelector shows 'Intervallo:' label in Italian for consistency"
  - "BandwidthChart hides TimeRangeSelector in empty state (no data to filter yet)"
  - "Collecting state shows chart with faded overlay to display progress"
  - "Custom tooltip formats time with HH:mm:ss for precise bandwidth inspection"
  - "X-axis formatter switches format based on time range (HH:mm for 1h/24h, dd/MM for 7d)"
  - "Download line uses emerald-400 (#34d399), upload uses teal-400 (#2dd4bf)"

patterns-established:
  - "TDD protocol: RED (failing tests) → GREEN (implementation) → commit per task"
  - "Mock Recharts components in tests to avoid testing external library internals"
  - "Page orchestrator uses useEffect to feed bandwidth data into history buffer"
  - "eslint-disable-line for addDataPoint stable callback in dependencies array"

# Metrics
duration: 5min
completed: 2026-02-16
---

# Phase 64 Plan 02: Bandwidth Chart UI Summary

**Recharts LineChart with dual download/upload lines, TimeRangeSelector (1h/24h/7d), and /network page integration completing Phase 64 bandwidth visualization**

## Performance

- **Duration:** 5 min 12 sec
- **Started:** 2026-02-16T08:30:37Z
- **Completed:** 2026-02-16T08:35:49Z
- **Tasks:** 2
- **Files modified:** 6 (4 created + 2 updated)

## Accomplishments

- BandwidthChart component with Recharts LineChart (download/upload dual lines)
- TimeRangeSelector component with Button.Group for 1h/24h/7d selection
- Custom tooltip with emerald/teal color coding and time formatting
- Empty state: "Raccolta dati banda in corso... Torna tra qualche minuto"
- Collecting state: "Raccolta dati: N/10 punti" progress indicator
- /network page integration via orchestrator pattern (single polling loop feeds chart)
- 17 passing tests (13 component + 4 page integration, 72 total network tests)
- All 4 Phase 64 requirements satisfied (BW-01 through BW-04)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create BandwidthChart and TimeRangeSelector components** - `eac6be5` (feat)
   - BandwidthChart: Recharts LineChart with dual lines, custom tooltip, empty/collecting states
   - TimeRangeSelector: Button.Group with ember/subtle variants for active/inactive
   - 13 passing tests (8 BandwidthChart + 5 TimeRangeSelector)
   - Mocked Recharts components to avoid testing external library

2. **Task 2: Integrate into /network page orchestrator** - `93da702` (feat)
   - Added BandwidthChart below DeviceListTable
   - useEffect wiring: networkData.bandwidth → bandwidthHistory.addDataPoint
   - Loading skeleton includes chart placeholder (4 blocks total)
   - 4 new page tests: render, data flow, useEffect wiring, skeleton
   - All 58 network page tests pass (54 existing + 4 new)

## Files Created/Modified

**Created:**
- `app/network/components/BandwidthChart.tsx` - Recharts LineChart component (191 lines)
- `app/network/components/TimeRangeSelector.tsx` - Button.Group time range selector (44 lines)
- `app/network/__tests__/components/BandwidthChart.test.tsx` - 8 tests (158 lines)
- `app/network/__tests__/components/TimeRangeSelector.test.tsx` - 5 tests (63 lines)

**Modified:**
- `app/network/page.tsx` - Integrated BandwidthChart, added useEffect wiring (+20 lines)
- `app/network/__tests__/page.test.tsx` - Added 4 chart integration tests (+92 lines)

## Decisions Made

1. **Italian UI labels**: "Intervallo:", "Banda", "Raccolta dati banda in corso..." for consistency with existing app (all Italian)

2. **TimeRangeSelector visibility**: Hidden in empty state (no data to filter yet), shown once data starts collecting

3. **Collecting state behavior**: Shows chart with faded overlay message when <10 points, displays progress: "Raccolta dati: N/10 punti". Still renders partial chart if data.length > 0 so user sees accumulation.

4. **Color scheme**: Download line emerald-400 (#34d399), upload line teal-400 (#2dd4bf). Matches Ember Noir design system color palette.

5. **X-axis formatting**: Switches based on time range for optimal readability:
   - 1h and 24h: `HH:mm` (hours:minutes)
   - 7d: `dd/MM` (day/month)

6. **Tooltip precision**: Shows time with `HH:mm:ss` for precise bandwidth inspection, values formatted to 1 decimal place

7. **Performance optimization**: `isAnimationActive={false}` on Line components, `dot={false}` to avoid rendering thousands of dots on 500-point charts

8. **useEffect dependencies**: Added `eslint-disable-line react-hooks/exhaustive-deps` for addDataPoint since it's stable (useCallback with no deps) — follows project pattern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - TDD protocol worked smoothly, all tests passed on first GREEN implementation.

## User Setup Required

None - bandwidth chart appears automatically on /network page once data starts collecting.

## Phase 64 Completion

**All 4 requirements satisfied:**

- **BW-01**: ✅ Recharts LineChart with dual download/upload lines (emerald/teal colors)
- **BW-02**: ✅ TimeRangeSelector toggles 1h/24h/7d with chart updating via filtered decimation
- **BW-03**: ✅ LTTB decimation applied automatically when >500 points (from Plan 01)
- **BW-04**: ✅ Adaptive polling via useNetworkData reuse (30s visible, 5min hidden) — no duplicate API calls

**Blockers:** None

**Phase 64 status:** Complete. Bandwidth visualization fully functional on /network page.

---

*Phase: 64-bandwidth-visualization*
*Completed: 2026-02-16*

## Self-Check: PASSED

All files created and commits verified:
- ✓ app/network/components/BandwidthChart.tsx
- ✓ app/network/components/TimeRangeSelector.tsx
- ✓ app/network/__tests__/components/BandwidthChart.test.tsx
- ✓ app/network/__tests__/components/TimeRangeSelector.test.tsx
- ✓ app/network/page.tsx (modified)
- ✓ app/network/__tests__/page.test.tsx (modified)
- ✓ Commit eac6be5 (Task 1)
- ✓ Commit 93da702 (Task 2)
- ✓ 72 network tests passing
- ✓ No new TypeScript errors
