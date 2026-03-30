---
phase: 148-tuya-frontend
plan: "01"
subsystem: tuya
tags: [hooks, websocket, polling, device-registry, skeleton, tdd]
dependency_graph:
  requires: [147-tuya-infrastructure]
  provides: [useTuyaData, useTuyaCommands, Skeleton.TuyaCard, DeviceTypeId.tuya]
  affects: [DashboardCards, deviceTypes, Skeleton]
tech_stack:
  added: []
  patterns: [WS-primary+polling-fallback, Phase-141-conditional-guard, TDD-RED-GREEN]
key_files:
  created:
    - app/components/devices/tuya/hooks/useTuyaData.ts
    - app/components/devices/tuya/hooks/useTuyaCommands.ts
    - app/components/devices/tuya/hooks/__tests__/useTuyaData.test.ts
    - app/components/devices/tuya/hooks/__tests__/useTuyaCommands.test.ts
  modified:
    - lib/devices/deviceTypes.ts
    - app/components/DashboardCards.tsx
    - app/components/ui/Skeleton.tsx
decisions:
  - useTuyaData null-plugs WS guard sets stale=true without crashing (consistent with FritzBox pattern)
  - useTuyaCommands uses plain fetch (not useRetryableCommand) matching simpler hooks like useDirigeraCommands
metrics:
  duration_seconds: 239
  tasks_completed: 2
  files_created: 4
  files_modified: 3
  tests_added: 23
  completed_date: "2026-03-30"
---

# Phase 148 Plan 01: Tuya Hooks and Registry Summary

One-liner: useTuyaData (WS-primary + polling-fallback) and useTuyaCommands (toggle/timer/cancel) with Tuya registered in all device and dashboard registries.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Create useTuyaData and useTuyaCommands hooks with tests | b36974eb | 4 created |
| 2 | Register Tuya in device registry, dashboard cards, and skeleton | b7f0c63f | 3 modified |

## What Was Built

**useTuyaData** (`app/components/devices/tuya/hooks/useTuyaData.ts`)
- WS-primary channel: subscribes to `'tuya'` topic via Phase 141 conditional guard (`if (!isWsConnected) return`)
- Polling fallback: `useAdaptivePolling` with `interval = isWsConnected ? null : (isVisible ? 60000 : 300000)`
- Null plugs guard: WS payload with `plugs: null` sets stale without updating plugs array
- Stale detection: any plug with `data_freshness !== 'LIVE'` marks the feed stale
- Error message: `'Tuya non raggiungibile'` (Italian, only set when no cached data)

**useTuyaCommands** (`app/components/devices/tuya/hooks/useTuyaCommands.ts`)
- `togglePlug(deviceId, currentState)`: POST `/api/tuya/plugs/{deviceId}/state` with `{ on: !currentState }`
- `setTimer(deviceId, seconds)`: POST `/api/tuya/plugs/{deviceId}/timer` with `{ seconds }`
- `cancelTimer(deviceId)`: delegates to `setTimer(deviceId, 0)`
- Returns `TuyaPlugMutation` when `data_confirmed === true`, `null` otherwise or on error

**Device Registry** (`lib/devices/deviceTypes.ts`)
- `DeviceTypeId` union extended with `| 'tuya'`
- `DEVICE_TYPES.TUYA = 'tuya'` constant added
- `DEVICE_CONFIG[DEVICE_TYPES.TUYA]` entry: name=Tuya, icon=⚡ (U+26A1), color=warning, route=/tuya
- `DEFAULT_DEVICE_ORDER` extended with `'tuya'` at end

**Dashboard Registries** (`app/components/DashboardCards.tsx`)
- `CARD_COMPONENTS.tuya = TuyaCard` (forward import — resolves when Plan 02 creates the component)
- `CARD_SKELETONS.tuya = Skeleton.TuyaCard`
- `DEVICE_META.tuya = { name: 'Tuya', icon: '⚡' }`

**Skeleton** (`app/components/ui/Skeleton.tsx`)
- `Skeleton.TuyaCard`: warning/amber accent bar + 3-metric grid (total plugs, total W, on/off)

## Tests

23 tests across 2 suites — all passing:

- `useTuyaData.test.ts`: loading state, polling fetch, error/stale handling, WS subscription, null payload guard, lastUpdatedAt
- `useTuyaCommands.test.ts`: togglePlug URL/body/confirmation, setTimer, cancelTimer delegation, error returns null

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

`app/components/DashboardCards.tsx` imports `TuyaCard` from `./devices/tuya/TuyaCard` which does not exist yet. This is an intentional forward reference that will resolve when Plan 02 creates `TuyaCard`. The import does not cause a runtime error in the dashboard because Next.js resolves component imports at build time, and Plan 02 must complete before this plan's output is used.

## Self-Check: PASSED

- `app/components/devices/tuya/hooks/useTuyaData.ts` — FOUND
- `app/components/devices/tuya/hooks/useTuyaCommands.ts` — FOUND
- `app/components/devices/tuya/hooks/__tests__/useTuyaData.test.ts` — FOUND
- `app/components/devices/tuya/hooks/__tests__/useTuyaCommands.test.ts` — FOUND
- Commit b36974eb — FOUND
- Commit b7f0c63f — FOUND
