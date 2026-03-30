---
phase: 146-raspi-ws-migration
plan: "01"
subsystem: raspi-hooks
tags: [websocket, polling-fallback, raspi, hooks]
dependency_graph:
  requires: [types/websocket.ts RaspiData, WebSocketContext, useWebSocketManager ReadyState]
  provides: [useRaspiData WS-primary, computeRaspiHealth exported, lastUpdatedAt]
  affects: [RaspiCard, raspi page]
tech_stack:
  added: []
  patterns: [WS-primary + polling-fallback (Phase 141 pattern), conditional subscription guard]
key_files:
  created: []
  modified:
    - app/components/devices/raspi/hooks/useRaspiData.ts
    - app/components/devices/raspi/hooks/__tests__/useRaspiData.test.ts
decisions:
  - "Inline WS payload mapping in handleMessage (no standalone adapter) per plan D-02"
  - "No health side-fetch for Raspi (unlike DIRIGERA) — health computed from data inline per plan D-07"
  - "computeRaspiHealth exported as named export for isolated testing"
metrics:
  duration: "~7 minutes"
  completed_date: "2026-03-30"
  tasks_completed: 2
  files_modified: 2
requirements: [RASPI-01, RASPI-02, RASPI-04, UX-01]
---

# Phase 146 Plan 01: Raspi WS Migration Summary

**One-liner:** useRaspiData migrated to WS-primary pattern with 'raspi' topic subscription, polling fallback, inline payload mapping, and lastUpdatedAt export.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Rewrite useRaspiData with WS-primary + polling fallback | 46a84d0b | app/components/devices/raspi/hooks/useRaspiData.ts |
| 2 | Update useRaspiData tests for WS subscription and fallback | 2ed704a2 | app/components/devices/raspi/hooks/__tests__/useRaspiData.test.ts |

## What Was Built

Rewrote `useRaspiData.ts` following the useDirigeraData pattern (established in Phase 141) with these specific changes for Raspi:

1. **WS imports added:** `useWebSocketContext`, `ReadyState`, `RaspiData as WsRaspiData` from types/websocket
2. **UseRaspiDataReturn extended:** Added `lastUpdatedAt: number | null` field
3. **computeRaspiHealth exported:** Changed from private `function` to `export function`
4. **WS subscription useEffect:** Subscribes to `'raspi'` topic when `readyState === ReadyState.OPEN`, includes cleanup via `unsubscribe`
5. **Inline payload mapping:** `cpu_percent` → `cpuPercent`, `memory.percent` → `memoryPercent`, `disk.percent` → `diskPercent`, `system.temperature` → `cpuTemperature`
6. **Polling suppressed when WS connected:** `interval: isWsConnected ? null : interval`
7. **lastUpdatedAt set in both paths:** WS handler and HTTP fetchData

Test suite extended from 7 to 13 tests (plus 7 from a second discovered test file = 20 total passing). Six new WS tests cover: subscribe when OPEN, no-subscribe when CLOSED, unsubscribe on unmount, interval=null when connected, payload mapping correctness, lastUpdatedAt populated.

## Decisions Made

- Inline WS payload mapping in handleMessage (no standalone adapter function) — Raspi WS shape is simple enough that an adapter adds unnecessary indirection
- No health side-fetch — unlike DIRIGERA which needs a separate `/api/dirigera/health` call, Raspi computes health inline from `computeRaspiHealth(data)`
- `computeRaspiHealth` exported for isolated unit testing without needing to mount the hook

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- app/components/devices/raspi/hooks/useRaspiData.ts: FOUND
- app/components/devices/raspi/hooks/__tests__/useRaspiData.test.ts: FOUND
- Commit 46a84d0b: FOUND
- Commit 2ed704a2: FOUND
- tsc --noEmit: PASS (zero errors)
- npm test useRaspiData: PASS (20 tests passing)
