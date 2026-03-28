---
phase: 143
plan: 02
subsystem: thermostat
tags: [netatmo, websocket, adapter, ws-primary, polling-fallback]
requires: [143-01]
provides: [netatmoWsAdapter, useThermostatData-ws]
affects: [useThermostatData, ThermostatCard]
tech_stack:
  added: []
  patterns: [standalone-adapter, ws-primary-polling-fallback, conditional-guard-isWsConnected]
key_files:
  created:
    - lib/netatmo/netatmoWsAdapter.ts
    - app/components/devices/thermostat/hooks/__tests__/useThermostatData.test.ts
  modified:
    - app/components/devices/thermostat/hooks/useThermostatData.ts
    - __tests__/components/devices/thermostat/ThermostatCard.schedule.test.tsx
decisions:
  - "adaptNetatmoWsPayload is a standalone pure function (not inlined) for independent testability (D-19)"
  - "WS handleMessage does not call staleness.update() — StalenessInfo has no update method, staleness tracks via Firebase writes"
  - "Null WS payload silently ignored (adapter returns null) — polling continues as implicit fallback"
  - "ThermostatCard tests required WebSocketContext + ReadyState mocks after hook gained WS dependency"
metrics:
  duration: 8m
  completed_at: "2026-03-28T09:00:00Z"
  tasks_completed: 2
  files_changed: 4
---

# Phase 143 Plan 02: WS Adapter + useThermostatData WS Subscription Summary

**One-liner:** Netatmo WS adapter normalises raw homestatus envelope to NetatmoStatus, wired into useThermostatData as primary channel with automatic HTTP polling fallback.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create netatmoWsAdapter and test suite | 5e3efa6d | lib/netatmo/netatmoWsAdapter.ts, hooks/__tests__/useThermostatData.test.ts |
| 2 | Wire WS subscription into useThermostatData hook | e0b8d35b | useThermostatData.ts, ThermostatCard.schedule.test.tsx |

## What Was Built

### netatmoWsAdapter.ts

Standalone pure function `adaptNetatmoWsPayload(raw: Record<string, unknown>): NetatmoStatus | null` in `lib/netatmo/netatmoWsAdapter.ts`:
- 3-level null safety: `body` → `body.home` → `rooms/modules` arrays
- Field mapping (D-05): `therm_measured_temperature` → `temperature`, `therm_setpoint_temperature` → `setpoint`, `therm_setpoint_mode` → `mode`, `heating_power_request > 0` → `heating` (boolean), room `id` → `room_id`
- Module passthrough: `id`, `battery_state`, `battery_level`, `reachable`, `rf_strength`
- Battery health derivation: `hasLowBattery` (low | very_low), `hasCriticalBattery` (very_low only), `lowBatteryModules` array

### useThermostatData WS Integration

3 new imports + 3 new lines + 1 new useEffect + 1 modified line:
- `subscribe`/`unsubscribe`/`readyState` from `useWebSocketContext()`
- `isWsConnected = readyState === ReadyState.OPEN`
- WS useEffect with conditional guard (`if (!isWsConnected) return`)
- `subscribe('netatmo', handleMessage)` + cleanup `unsubscribe`
- `adaptNetatmoWsPayload` called in handleMessage; null result is a no-op
- Polling interval: `isWsConnected ? null : (topology ? 60000 : null)`

### Test Suite

16 tests across 2 describe blocks:
- **adaptNetatmoWsPayload** (tests 1-10): adapter field mapping, battery flags, null/malformed payload guards
- **useThermostatData WS** (tests 11-16): subscribe lifecycle, message handling, null payload no-op, polling suppression

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ThermostatCard.schedule.test.tsx lacked WebSocketContext mock**
- **Found during:** Task 2 verification
- **Issue:** After useThermostatData gained `useWebSocketContext()` dependency, ThermostatCard rendering in tests threw "useWebSocketContext must be used within a WebSocketProvider"
- **Fix:** Added `jest.mock('@/app/context/WebSocketContext', ...)` and `jest.mock('@/lib/hooks/useWebSocketManager', ...)` to the test file
- **Files modified:** `__tests__/components/devices/thermostat/ThermostatCard.schedule.test.tsx`
- **Commit:** e0b8d35b

### Design Decision Adjustments

**1. `staleness.update()` not called in WS handleMessage**
- **Reason:** `StalenessInfo` returned by `useDeviceStaleness` is a plain data object with no `update()` method (it's derived from Firebase writes, not a hook with callbacks). Plan's action section 4 noted this possibility — confirmed and handled correctly by omitting the call.
- **Impact:** Staleness detection continues to work via the existing Firebase-based mechanism (no behavioral regression).

## Merge Note

This worktree was behind `main` at execution start (Plan 01 commits were on main). Merged `main` fast-forward before execution — no conflicts.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| lib/netatmo/netatmoWsAdapter.ts | FOUND |
| app/components/devices/thermostat/hooks/__tests__/useThermostatData.test.ts | FOUND |
| app/components/devices/thermostat/hooks/useThermostatData.ts | FOUND |
| commit 5e3efa6d | FOUND |
| commit e0b8d35b | FOUND |
