---
phase: 140-stove-migration
plan: "01"
subsystem: stove-data-hook
tags: [websocket, migration, polling, tdd]
requirements_completed: [MIG-01, MIG-02, MIG-03]
dependency_graph:
  requires:
    - "139-01: WebSocketContext + useWebSocketManager infrastructure"
    - "139-02: WebSocketProvider wired into ClientProviders"
  provides:
    - "useStoveData WS-primary with polling fallback"
  affects:
    - "app/components/devices/stove/StoveCard.tsx (consumer — no changes needed)"
tech_stack:
  added: []
  patterns:
    - "WS-primary / polling-fallback dual-channel hook pattern"
    - "Ref pattern for stale closure avoidance in WS useEffect"
    - "interval: isWsConnected ? null : 60000 for conditional polling"
key_files:
  created: []
  modified:
    - "app/components/devices/stove/hooks/useStoveData.ts"
    - "__tests__/components/devices/stove/hooks/useStoveData.test.ts"
decisions:
  - "alwaysActive:true preserved on polling fallback (safety-critical stove monitoring)"
  - "Ref pattern (fetchSchedulerModeRef etc.) used to avoid stale closures in WS useEffect"
  - "WS handleMessage mirrors HTTP path error handling exactly for behavioral parity"
metrics:
  duration: "~3 minutes"
  completed: "2026-03-27"
  tasks_completed: 2
  files_modified: 2
---

# Phase 140 Plan 01: Stove Data Hook WS Migration Summary

useStoveData migrated from pure HTTP polling to WS-primary (subscribe to 'thermorossi' topic) with HTTP polling fallback (60s, alwaysActive:true) when WS is unavailable.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (RED) | Add WS test cases to useStoveData.test.ts | 4c6b12e2 | `__tests__/components/devices/stove/hooks/useStoveData.test.ts` |
| 2 (GREEN) | Migrate useStoveData to WS-primary with polling fallback | ddfbd7ad | `app/components/devices/stove/hooks/useStoveData.ts` |

## What Was Built

**useStoveData.ts changes:**
- Added imports: `useWebSocketContext`, `ReadyState` from `@/lib/hooks/useWebSocketManager`, `ThermorossiData` from `@/types/websocket`
- Added `isWsConnected = readyState === ReadyState.OPEN` derived flag
- Added `useEffect` that subscribes to `'thermorossi'` topic — maps `stove_state/power_level/fan_level/error_code/error_description` to hook state, sets `isStale=false`, clears `initialLoading`, triggers side-fetches via refs
- Added `fetchSchedulerModeRef`, `fetchMaintenanceStatusRef`, `checkVersionRef` to avoid stale closures
- Changed `interval: 60000` to `interval: isWsConnected ? null : 60000` (polling suppressed when WS live)
- `alwaysActive: true` preserved (safety-critical)
- `UseStoveDataReturn` and `UseStoveDataParams` interfaces unchanged

**Test file changes:**
- Added `jest.mock('@/app/context/WebSocketContext')` with CLOSED default in `beforeEach`
- Updated `useAdaptivePolling` mock to capture `lastPollingOpts` for assertions
- Added `describe('WebSocket integration')` with 8 test cases covering all must_haves

## Test Results

29/29 tests passing:
- 21 existing HTTP polling tests: all green (unaffected by WS default CLOSED mock)
- 8 new WS integration tests: all green after GREEN phase implementation

## Deviations from Plan

None — plan executed exactly as written. The merge of main into the worktree branch was required to obtain Phase 139 WebSocket infrastructure (WebSocketContext, useWebSocketManager, types/websocket.ts) that the worktree lacked.

## Known Stubs

None.

## Self-Check: PASSED

- `app/components/devices/stove/hooks/useStoveData.ts` contains `subscribe('thermorossi', handleMessage)` ✓
- `app/components/devices/stove/hooks/useStoveData.ts` contains `interval: isWsConnected ? null : 60000` ✓
- `app/components/devices/stove/hooks/useStoveData.ts` contains `alwaysActive: true` ✓
- `__tests__/components/devices/stove/hooks/useStoveData.test.ts` contains `describe('WebSocket integration'` ✓
- Commit 4c6b12e2 (RED) and ddfbd7ad (GREEN) both present ✓
- All 29 tests pass ✓
