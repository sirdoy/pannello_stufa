---
phase: 89-raspberry-pi-dashboard-card
plan: "01"
subsystem: device-registry, hooks, ui-components
tags: [raspi, device-registry, adaptive-polling, skeleton, tdd]
dependency_graph:
  requires: [88-01]
  provides: [raspi device type registration, useRaspiData hook, Skeleton.RaspiCard]
  affects: [lib/devices/deviceTypes.ts, app/components/ui/Skeleton.tsx, lib/services/unifiedDeviceConfigService.ts]
tech_stack:
  added: []
  patterns: [adaptive-polling, orchestrator hook, compound component skeleton]
key_files:
  created:
    - app/components/devices/raspi/hooks/useRaspiData.ts
    - app/components/devices/raspi/hooks/__tests__/useRaspiData.test.ts
  modified:
    - lib/devices/deviceTypes.ts
    - lib/services/unifiedDeviceConfigService.ts
    - app/components/ui/Skeleton.tsx
decisions:
  - "initialDelay: 600ms for raspi hook (NetworkCard uses 500ms — slight stagger offset)"
  - "alwaysActive: false — raspi monitor is non-safety-critical unlike stove"
  - "Health thresholds: disk>90/mem>95=error, cpu>80/mem>80/disk>75/temp>70=warning"
metrics:
  duration: "7 minutes"
  completed: 2026-03-17
  tasks_completed: 2
  files_modified: 5
---

# Phase 89 Plan 01: Raspberry Pi Device Registry + Hook Summary

**One-liner:** Raspi registered in all 4 device registry locations, useRaspiData hook polls 4 endpoints with adaptive polling and health thresholds, Skeleton.RaspiCard added with success-green shimmer.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Register raspi in device registry and add skeleton | c015a19 | lib/devices/deviceTypes.ts, lib/services/unifiedDeviceConfigService.ts, app/components/ui/Skeleton.tsx |
| 2 (RED) | Add failing tests for useRaspiData | 1f398ca | app/components/devices/raspi/hooks/__tests__/useRaspiData.test.ts |
| 2 (GREEN) | Implement useRaspiData orchestrator hook | dc33340 | app/components/devices/raspi/hooks/useRaspiData.ts |

## What Was Built

### Device Registry (Task 1)

`lib/devices/deviceTypes.ts` now includes `raspi` in all 4 required locations:
- `DeviceTypeId` union: `| 'raspi'`
- `DEVICE_TYPES`: `RASPI: 'raspi'`
- `DEVICE_CONFIG`: full config with `color: 'success'`, `routes: { main: '/raspi' }`
- `DEFAULT_DEVICE_ORDER`: inserted after `'network'` and before `'sonos'`

`lib/services/unifiedDeviceConfigService.ts` has `raspi: 'Raspberry Pi system monitor'` in `getDeviceDescription`.

`app/components/ui/Skeleton.tsx` has `Skeleton.RaspiCard` with success-green accent bar (`from-success-500/50`) and 2x2 metric grid (h-20 boxes for CPU, RAM, Disk, Temp).

### useRaspiData Hook (Task 2 — TDD)

`app/components/devices/raspi/hooks/useRaspiData.ts`:
- Fetches `/api/raspi/cpu`, `/api/raspi/memory`, `/api/raspi/disk`, `/api/raspi/system` in `Promise.all`
- Adaptive polling: 30s when tab visible, 5min when hidden (via `useVisibility`)
- `initialDelay: 600ms` — stagger offset from NetworkCard's 500ms
- `dataRef` pattern prevents stale closure in "no cached data" guard
- `computeRaspiHealth`: `error` if disk>90 or mem>95; `warning` if cpu>80, mem>80, disk>75, or temp>70
- Returns `{ data, loading, error, stale, health }`

7 tests cover: loading state, 4-endpoint fetch verification, error without cache, stale with cache, health=ok, health=warning (cpu>80), health=error (disk>90).

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `tsc --noEmit`: 0 errors in modified files (pre-existing errors in .next/types cache and unrelated test are out of scope)
- `npx jest --testPathPatterns=useRaspiData`: 7/7 tests pass
- `'raspi'` present in DeviceTypeId, DEVICE_TYPES, DEVICE_CONFIG, DEFAULT_DEVICE_ORDER
- `Skeleton.RaspiCard` callable on Skeleton compound component

## Self-Check: PASSED
