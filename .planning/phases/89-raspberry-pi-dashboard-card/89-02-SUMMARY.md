---
phase: 89-raspberry-pi-dashboard-card
plan: "02"
subsystem: device-card, dashboard
tags: [raspi, dashboard-card, orchestrator, tdd, integration-tests]
dependency_graph:
  requires: [89-01]
  provides: [RaspiCard dashboard component, RaspiStats presentational, DashboardCards raspi registration]
  affects: [app/components/devices/raspi/RaspiCard.tsx, app/components/devices/raspi/components/RaspiStats.tsx, app/components/DashboardCards.tsx]
tech_stack:
  added: []
  patterns: [orchestrator card, presentational sub-component, TDD integration tests]
key_files:
  created:
    - app/components/devices/raspi/RaspiCard.tsx
    - app/components/devices/raspi/components/RaspiStats.tsx
    - app/components/devices/raspi/__tests__/RaspiCard.test.tsx
  modified:
    - app/components/DashboardCards.tsx
decisions:
  - "colorTheme=sage for RaspiCard — consistent with NetworkCard infrastructure theme"
  - "Error state shows only when error && !data — cached data preserved through stale banner"
  - "RaspiStats is purely presentational — no useState/useEffect, receives data prop only"
metrics:
  duration: "17 minutes"
  completed: 2026-03-17
  tasks_completed: 2
  files_modified: 4
---

# Phase 89 Plan 02: RaspiCard Dashboard Component Summary

**One-liner:** RaspiCard orchestrator renders 4-metric grid (CPU%, RAM%, disk%, temp) with HealthIndicator, skeleton loading, stale banner, and error isolation via DeviceCardErrorBoundary from DashboardCards.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create RaspiStats and RaspiCard | a6f2258 | app/components/devices/raspi/RaspiCard.tsx, app/components/devices/raspi/components/RaspiStats.tsx |
| 2 (GREEN) | Wire DashboardCards + integration tests | dadd941 | app/components/DashboardCards.tsx, app/components/devices/raspi/__tests__/RaspiCard.test.tsx |

## What Was Built

### RaspiStats Presentational Component (Task 1)

`app/components/devices/raspi/components/RaspiStats.tsx`:
- Purely presentational — no useState, no useEffect
- 2x2 grid: CPU%, RAM%, Disco%, Temp
- Null-safe temperature: displays `—` when `cpuTemperature === null`
- Dark/light mode aware via `[html:not(.dark)_&]:` utility classes

### RaspiCard Orchestrator (Task 1)

`app/components/devices/raspi/RaspiCard.tsx`:
- Consumes `useRaspiData()` hook from Plan 01
- Loading → `<Skeleton.RaspiCard />`
- Error (no cached data) → SmartHomeCard with warning Banner showing `{error}` message
- Stale (data + error) → compact warning Banner + RaspiStats (cached data preserved)
- Success → SmartHomeCard with `colorTheme="sage"`, HealthIndicator in headerActions, RaspiStats grid

### DashboardCards Registration (Task 2)

`app/components/DashboardCards.tsx` now includes raspi in all 3 registries:
- `CARD_COMPONENTS`: `raspi: RaspiCard`
- `CARD_SKELETONS`: `raspi: Skeleton.RaspiCard`
- `DEVICE_META`: `raspi: { name: 'Raspberry Pi', icon: '🖥️' }`

RaspiCard automatically gains `DeviceCardErrorBoundary` wrapping and per-card `Suspense` from `renderCard()`.

### Integration Tests (Task 2 — TDD GREEN)

`app/components/devices/raspi/__tests__/RaspiCard.test.tsx` — 6 tests:
1. Renders 4 metric values when data available (CPU%, RAM%, disk%, temp)
2. Renders skeleton when loading
3. Renders error banner when error and no data
4. Renders stale banner when stale with data (cached metrics still visible)
5. Renders HealthIndicator in header
6. Renders dash when cpuTemperature is null

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `tsc --noEmit`: 0 errors in raspi files (pre-existing .next/types cache errors are out of scope)
- `npx jest --testPathPatterns=raspi`: 34/34 tests pass (7 hook tests + 6 RaspiCard tests + 21 others)
- `npx jest --testPathPatterns=RaspiCard`: 6/6 tests pass
- DashboardCards.tsx has raspi in all 3 registries (CARD_COMPONENTS, CARD_SKELETONS, DEVICE_META)
- Full test suite: 17 pre-existing failures unchanged, 3840 tests pass (no regressions introduced)

## Self-Check: PASSED
