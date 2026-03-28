---
phase: 143
plan: 01
subsystem: thermostat
tags: [netatmo, hook-extraction, data-hook, polling]
requires: []
provides: [useThermostatData]
affects: [ThermostatCard, thermostat/page]
tech_stack:
  added: []
  patterns: [centralized-data-hook, useAdaptivePolling-gated-on-topology, commandError-local-state]
key_files:
  created:
    - app/components/devices/thermostat/hooks/useThermostatData.ts
  modified:
    - app/components/devices/thermostat/ThermostatCard.tsx
    - app/thermostat/page.tsx
decisions:
  - "useThermostatData exposes StalenessInfo | null (not stale/update/lastUpdate) — matches actual useDeviceStaleness API"
  - "ThermostatCard adds local commandError state for mutation errors (dataError from hook is read-only)"
  - "page.tsx derives mode from status?.mode (was setMode in inline fetchStatus)"
  - "refetch() in hook calls fetchStatus only (not checkConnection) — topology already loaded when polling runs"
metrics:
  duration: 5m
  completed_at: "2026-03-28T08:24:47Z"
  tasks_completed: 2
  files_changed: 3
---

# Phase 143 Plan 01: Extract useThermostatData Hook Summary

**One-liner:** Centralized Netatmo data hook (HTTP polling) extracted from ThermostatCard and page.tsx, removing 332 lines of duplicated inline fetching logic.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create useThermostatData hook with HTTP polling | 29533d95 | app/components/devices/thermostat/hooks/useThermostatData.ts |
| 2 | Rewire ThermostatCard and page.tsx to consume useThermostatData | 5f288971 | ThermostatCard.tsx, thermostat/page.tsx |

## What Was Built

### useThermostatData Hook

New hook at `app/components/devices/thermostat/hooks/useThermostatData.ts` that centralizes:
- **checkConnection**: Fetches `homesData`, handles `reconnect` flag, 1-retry with 1500ms delay
- **fetchStatus**: Fetches `homeStatus`, handles reconnect, rate-limit skip, 1-retry
- **useAdaptivePolling**: Gated on topology (`interval: topology ? 60000 : null`), `alwaysActive: false`
- **Staleness tracking**: `useDeviceStaleness('thermostat')` exposed as `StalenessInfo | null`
- **Strict-mode guard**: `connectionCheckedRef` prevents double-mount in React 18

Exports: `useThermostatData`, `UseThermostatDataReturn`, and type re-exports for `NetatmoTopology`, `NetatmoRoom`, `NetatmoModule`, `NetatmoStatus`, `RoomStatus`, `ModuleStatus`.

### ThermostatCard.tsx Rewire

- Removed: `connectionCheckedRef`, `checkConnection`, `fetchStatus`, `useAdaptivePolling`, `useDeviceStaleness`
- Added: `useThermostatData()` destructuring
- Local `commandError` state for mutation handler errors (data errors are read-only from hook)
- `handleRefresh` delegates to `refetch()`

### thermostat/page.tsx Rewire

- Removed: 6 duplicate interface definitions (now imported from hook)
- Removed: `connectionCheckedRef`, `pollingStartedRef` and their useEffects
- Removed: `checkConnection`, `fetchTopology`, `fetchStatus` functions
- Removed: raw `setInterval` polling (30s interval replaced by hook's 60s adaptive polling)
- `mode` derived from `status?.mode ?? 'schedule'` (was set via `setMode` in inline fetchStatus)
- Redirect to `/netatmo` when disconnected preserved
- `RoomCard onRefresh` updated to use `refetch`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected UseThermostatDataReturn interface for staleness field**
- **Found during:** Task 1
- **Issue:** Plan specified `staleness: ReturnType<typeof useDeviceStaleness>` with `stale`, `update`, `lastUpdate` properties. Actual `useDeviceStaleness` returns `StalenessInfo | null` with `isStale`, `cachedAt`, `ageSeconds`.
- **Fix:** Used correct `StalenessInfo | null` type. Added `stale: boolean` computed field (`staleness?.isStale ?? false`) for convenience. The hook exposes both `stale` (boolean shortcut) and `staleness` (full StalenessInfo for `cachedAt` display in UI).
- **Files modified:** `useThermostatData.ts`
- **Commit:** 29533d95

**2. [Rule 2 - Missing functionality] Added commandError local state in ThermostatCard**
- **Found during:** Task 2
- **Issue:** `error` from hook is read-only; `setError` calls in mutation handlers (handleModeChange, handleTemperatureChange, etc.) needed a writable target.
- **Fix:** Added `const [commandError, setCommandError] = useState<string | null>(null)` and exposed via `const error = dataError ?? commandError; const setError = setCommandError`. Data errors take precedence. Dismiss clears commandError only.
- **Files modified:** `ThermostatCard.tsx`
- **Commit:** 5f288971

**3. [Rule 1 - Bug] Removed setMode from page.tsx handleModeChange**
- **Found during:** Task 2
- **Issue:** `setMode` no longer exists (mode is derived). `handleModeChange` had `setMode(newMode)` after successful POST.
- **Fix:** Mode is now derived from `status?.mode` which is refreshed by `await refetch()` in handleModeChange.
- **Files modified:** `app/thermostat/page.tsx`
- **Commit:** 5f288971

## Known Stubs

None — all data paths are wired through `useThermostatData`. No hardcoded placeholders.

## Verification

- `grep -r "useThermostatData" app/` shows exactly 3 files (hook + 2 consumers)
- `grep -c "setInterval" app/thermostat/page.tsx` = 0
- `grep -c "connectionCheckedRef" app/thermostat/page.tsx` = 0
- All 24 ThermostatCard tests pass

## Self-Check: PASSED
