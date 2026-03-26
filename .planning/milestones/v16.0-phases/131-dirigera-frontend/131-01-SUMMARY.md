---
phase: 131-dirigera-frontend
plan: "01"
subsystem: dirigera-frontend
tags: [dirigera, dashboard, card, skeleton, device-registry]
dependency_graph:
  requires: [130-02]
  provides: [DirigeraCard, useDirigeraData, DirigeraStats, Skeleton.DirigeraCard]
  affects: [DashboardCards, deviceTypes, Skeleton]
tech_stack:
  added: []
  patterns: [orchestrator-card, adaptive-polling, health-indicator]
key_files:
  created:
    - app/components/devices/dirigera/DirigeraCard.tsx
    - app/components/devices/dirigera/hooks/useDirigeraData.ts
    - app/components/devices/dirigera/components/DirigeraStats.tsx
    - app/components/devices/dirigera/__tests__/DirigeraCard.test.tsx
  modified:
    - lib/devices/deviceTypes.ts
    - app/components/DashboardCards.tsx
    - app/components/ui/Skeleton.tsx
decisions:
  - DirigeraCard uses ocean colorTheme (not info) matching plan research correction D-02
  - Health logic: error if offline_count > 0, warning if low_battery_count > 0
  - DIRIGERA added to DEFAULT_DEVICE_ORDER last (after sonos)
metrics:
  duration_seconds: 260
  completed_date: "2026-03-24"
  tasks_completed: 2
  files_created: 4
  files_modified: 3
  tests_added: 7
requirements:
  - DIRIG-08
  - DIRIG-10
  - DIRIG-11
---

# Phase 131 Plan 01: DirigeraCard Dashboard Integration Summary

**One-liner:** DirigeraCard with ocean theme polls `/api/dirigera/health` + `/api/dirigera/sensors/summary` showing 4 sensor stats, registered in device registry, DashboardCards, Skeleton, and navigation auto-derives from DEVICE_CONFIG.

## What Was Built

### Task 1: Device registry + DashboardCards + Skeleton
- Added `'dirigera'` to `DeviceTypeId` union, `DEVICE_TYPES` const, `DEVICE_CONFIG` with ocean color and `/dirigera` route, and `DEFAULT_DEVICE_ORDER`
- Added `hasSensors?: boolean` feature flag to `DeviceFeatures` interface
- Added `dirigera: DirigeraCard` to `CARD_COMPONENTS`, `CARD_SKELETONS`, `DEVICE_META` in DashboardCards.tsx
- Added `Skeleton.DirigeraCard` with ocean accent bar (`from-ocean-500/50`) and 2x2 grid of 4 pulse blocks

### Task 2: Hook + Stats + Card + Tests
- `useDirigeraData` hook: Promise.all fetches health + summary at 60s (visible) / 300s (hidden), health derived from summary fields
- `DirigeraStats` 2x2 grid: Sensori totali, Contatti aperti, Offline (red if >0), Batteria bassa (amber if >0)
- `DirigeraCard`: loading skeleton, error banner ("Non raggiungibile"), stale banner, clickable with aria-label, navigates to `/dirigera`
- 7 unit tests: loading, error, data render, click navigation, stale state, health indicator, no link in error state

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 86f1c144 | feat(131-01): add dirigera to device registry, dashboard, and skeleton |
| 2 | 85493c8f | feat(131-01): add DirigeraCard, useDirigeraData hook, DirigeraStats, and unit tests |

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

- `npx tsc --noEmit`: No new errors introduced by this plan (pre-existing errors in registry pages and sonosProxy.ts unrelated)
- `npm test -- --testPathPatterns=DirigeraCard`: 7/7 tests pass
- `npm test -- --testPathPatterns=dirigera`: 12/12 tests pass (includes proxy tests from phase 130)

## Known Stubs

None — DirigeraCard fetches live data from `/api/dirigera/health` and `/api/dirigera/sensors/summary`.

## Self-Check: PASSED

- [x] `app/components/devices/dirigera/DirigeraCard.tsx` — EXISTS
- [x] `app/components/devices/dirigera/hooks/useDirigeraData.ts` — EXISTS
- [x] `app/components/devices/dirigera/components/DirigeraStats.tsx` — EXISTS
- [x] `app/components/devices/dirigera/__tests__/DirigeraCard.test.tsx` — EXISTS
- [x] Commit 86f1c144 — EXISTS
- [x] Commit 85493c8f — EXISTS
