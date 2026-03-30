---
phase: 148-tuya-frontend
plan: 03
subsystem: ui
tags: [tuya, recharts, next-dynamic, react-hooks, smart-plug, energy-chart, timer]

# Dependency graph
requires:
  - phase: 148-01
    provides: useTuyaData, useTuyaCommands, TuyaPlug + TuyaHistoryResponse types
  - phase: 147-02
    provides: /api/tuya/plugs/{device_id}/history route
provides:
  - /tuya page with responsive plug grid (1/2/3 cols)
  - TuyaPlugCard component with toggle, power, freshness badge, timer controls, expandable chart
  - TuyaEnergyChart lazy-loaded via next/dynamic
  - TuyaEnergyChartInner Recharts AreaChart with granularity branching
  - useTuyaHistory hook fetching history with period param
affects: [148-04, navigation, masonry-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Lazy-loaded Recharts via next/dynamic (ssr: false) to avoid SSR hydration issues
    - Client-side countdown tick with setInterval + useEffect cleanup
    - Granularity branching in chart: power_w for raw, avg_power_w + energy_kwh_delta for hourly/daily
    - Cancelled fetch with boolean flag to avoid setState on unmounted components

key-files:
  created:
    - app/components/devices/tuya/hooks/useTuyaHistory.ts
    - app/components/devices/tuya/components/TuyaEnergyChart.tsx
    - app/components/devices/tuya/components/TuyaEnergyChartInner.tsx
    - app/components/devices/tuya/components/__tests__/TuyaEnergyChart.test.tsx
    - app/components/devices/tuya/components/TuyaPlugCard.tsx
    - app/tuya/page.tsx
    - app/tuya/__tests__/page.test.tsx
  modified: []

key-decisions:
  - "TuyaEnergyChart uses next/dynamic with ssr:false matching existing Recharts pattern (SonosVolumeChart)"
  - "useTuyaHistory uses cancellation boolean flag (not AbortController) — simpler, consistent with project style"
  - "TuyaPlugCard countdown syncs remaining from plug.countdown_s via useEffect dep array — handles WS push updates correctly"

patterns-established:
  - "Lazy Recharts wrapper: dynamic(() => import('./Inner'), { ssr: false, loading: () => <div className='animate-pulse' /> })"
  - "Countdown with sync: useEffect([plug.countdown_s]) sets remaining, separate useEffect([remaining]) runs interval"

requirements-completed: [TUYA-12, TUYA-14]

# Metrics
duration: 15min
completed: 2026-03-30
---

# Phase 148 Plan 03: Tuya Frontend Summary

**Tuya /tuya page with responsive plug grid, per-plug toggle/timer/power controls, and lazy-loaded energy history charts with granularity-aware dataKeys**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-30T12:28:00Z
- **Completed:** 2026-03-30T12:43:40Z
- **Tasks:** 2
- **Files modified:** 7 created, 0 modified

## Accomplishments
- useTuyaHistory hook fetches /api/tuya/plugs/{device_id}/history with period param (24h/7d/30d), cancels stale requests
- TuyaEnergyChartInner branches on granularity: AreaChart with power_w (raw) or avg_power_w + energy_kwh_delta on dual Y-axes (hourly/daily)
- TuyaEnergyChart lazy-loads inner via next/dynamic (ssr:false), manages period state, Italian period labels (24h/7g/30g)
- TuyaPlugCard shows name, freshness badge, power W, toggle, timer (Imposta/Annulla), countdown tick, expandable chart section
- /tuya page orchestrates useTuyaData + useTuyaCommands, renders 1/2/3-col responsive grid per D-03

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useTuyaHistory hook and TuyaEnergyChart components** - `d7659c56` (feat)
2. **Task 2: Create TuyaPlugCard and /tuya page with tests** - `239bc3b5` (feat)

## Files Created/Modified
- `app/components/devices/tuya/hooks/useTuyaHistory.ts` - Fetches energy history with period param, cancellation guard
- `app/components/devices/tuya/components/TuyaEnergyChart.tsx` - Lazy wrapper with period selector (Italian labels)
- `app/components/devices/tuya/components/TuyaEnergyChartInner.tsx` - Recharts AreaChart, granularity branching, dual Y-axes
- `app/components/devices/tuya/components/__tests__/TuyaEnergyChart.test.tsx` - 4 tests: period buttons, loading, raw/hourly granularity
- `app/components/devices/tuya/components/TuyaPlugCard.tsx` - Per-plug card with toggle/timer/countdown/expandable chart
- `app/tuya/page.tsx` - /tuya page orchestrator, responsive grid, loading/error states
- `app/tuya/__tests__/page.test.tsx` - 4 smoke tests: heading, cards, error state, grid classes

## Decisions Made
- next/dynamic with ssr:false for TuyaEnergyChartInner — consistent with SonosVolumeChart pattern, avoids Recharts SSR issues
- Cancellation boolean flag in useTuyaHistory (not AbortController) — simpler, matches project style
- Countdown implementation uses two separate useEffects: one to sync `remaining` from `plug.countdown_s` (WS updates), one to run the interval — prevents stale closure issues

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- /tuya page fully functional with all controls wired
- Energy chart renders with correct granularity per D-05/D-06
- Ready for Phase 148-04 (nav integration or any remaining gap closure)
- All 165 Tuya-related tests passing across 29 test suites

## Self-Check: PASSED

Files verified:
- app/components/devices/tuya/hooks/useTuyaHistory.ts: FOUND
- app/components/devices/tuya/components/TuyaEnergyChart.tsx: FOUND
- app/components/devices/tuya/components/TuyaEnergyChartInner.tsx: FOUND
- app/components/devices/tuya/components/TuyaPlugCard.tsx: FOUND
- app/tuya/page.tsx: FOUND
- app/tuya/__tests__/page.test.tsx: FOUND

Commits verified:
- d7659c56: FOUND (Task 1)
- 239bc3b5: FOUND (Task 2)

---
*Phase: 148-tuya-frontend*
*Completed: 2026-03-30*
