---
phase: 103-cleanup-debug-panel
plan: "01"
subsystem: stove-api
tags: [cleanup, winet, sandbox, dead-code]
dependency_graph:
  requires: []
  provides: [clean-codebase-no-winet]
  affects: [lib/healthMonitoring.ts, lib/maintenanceService.ts, app/components/devices/stove/hooks/useStoveData.ts, app/page.tsx, app/settings/page.tsx, app/sw.ts]
tech_stack:
  added: []
  patterns: [proxy-only, thermorossiProxy-import]
key_files:
  created: []
  modified:
    - lib/healthMonitoring.ts
    - lib/maintenanceService.ts
    - app/components/devices/stove/hooks/useStoveData.ts
    - app/settings/page.tsx
    - app/page.tsx
    - app/sw.ts
  deleted:
    - lib/stoveApi.ts
    - lib/sandboxService.ts
    - lib/services/StoveService.ts
    - app/components/sandbox/SandboxPanel.tsx
    - app/components/sandbox/SandboxToggle.tsx
    - app/debug/stove/page.tsx
    - app/api/stove/getRoomTemperature/route.ts
    - app/api/stove/getActualWaterTemperature/route.ts
    - app/api/stove/getWaterSetTemperature/route.ts
    - app/api/stove/settings/route.ts
    - app/api/stove/setSettings/route.ts
    - lib/__tests__/stoveApi.test.ts
    - lib/services/__tests__/StoveService.test.ts
    - __tests__/stoveApi.sandbox.test.ts
    - __tests__/sandboxService.test.ts
    - __tests__/semiAutoMode.test.ts
decisions:
  - "healthMonitoring.ts: migrated to getStatus() from thermorossiProxy with lowercase exact state constants (working/modulating/igniting/standby/off/cleaning)"
  - "sw.ts: removed dead WiNet service worker cache rule targeting wsthermorossi.cloudwinet.it (app no longer makes direct requests)"
  - "Pre-existing test failures (useDeviceStaleness, StoveStatus, StoveCard.orchestrator) confirmed unrelated to this plan"
metrics:
  duration_seconds: 454
  tasks_completed: 2
  files_changed: 17
  completed_date: "2026-03-19"
requirements:
  - CLEAN-01
  - CLEAN-02
  - CLEAN-03
  - CLEAN-04
---

# Phase 103 Plan 01: Delete WiNet Infrastructure and Sandbox Code Summary

**One-liner:** Deleted 16 WiNet/sandbox files (3,453 LOC) and cleaned all remaining references — healthMonitoring migrated to thermorossiProxy with lowercase proxy state values.

## What Was Done

Complete removal of the legacy WiNet cloud client, sandbox simulation infrastructure, and dead code that was replaced by thermorossiProxy in Phases 99-102.

### Task 1: Delete WiNet Files and Dead Code

Deleted 16 files totaling 3,453 lines of code:

**WiNet direct client (376 lines):**
- `lib/stoveApi.ts` — WiNet cloud API client with API_KEY, fetchWithTimeout, fetchWithRetry
- `lib/__tests__/stoveApi.test.ts`
- `__tests__/stoveApi.sandbox.test.ts`

**Sandbox simulation (515 lines):**
- `lib/sandboxService.ts` — full sandbox simulation service
- `__tests__/sandboxService.test.ts`
- `app/components/sandbox/SandboxPanel.tsx` (23920 bytes)
- `app/components/sandbox/SandboxToggle.tsx` (3003 bytes)

**Dead service layer:**
- `lib/services/StoveService.ts` (165 lines, no app/ imports after proxy migration)
- `lib/services/__tests__/StoveService.test.ts`

**Dead test file:**
- `__tests__/semiAutoMode.test.ts` (228 lines, imported getStoveStatus from stoveApi)

**Dead API routes:**
- `app/api/stove/getRoomTemperature/route.ts`
- `app/api/stove/getActualWaterTemperature/route.ts`
- `app/api/stove/getWaterSetTemperature/route.ts`
- `app/api/stove/settings/route.ts`
- `app/api/stove/setSettings/route.ts`

**Dead debug page:**
- `app/debug/stove/page.tsx` (24131 bytes)

**Commit:** `28b8b3a`

### Task 2: Clean Up All Remaining References

Updated 8 files to remove sandbox/WiNet references:

**lib/healthMonitoring.ts:**
- Replaced `import { getStoveStatus } from './stoveApi'` → `import { getStatus } from './thermorossiProxy'`
- Updated state constants to proxy values: `ON_STATES = ['working', 'modulating']`, `STARTING_STATES = ['igniting']`, `OFF_STATES = ['standby', 'off', 'cleaning']`
- Updated `stoveStatus?.StatusDescription` → `stoveStatus?.stove_state`
- Updated error detection from `stoveStatus.Error !== 0` → `stoveStatus.stove_state === 'alarm' && error_code !== 0`
- Updated `categorizeStoveStatus()` to use exact `includes()` → `Array.includes()` since proxy values are lowercase exact strings

**__tests__/lib/healthMonitoring.test.ts:**
- Mock target changed from `stoveApi` to `thermorossiProxy`
- All test data updated from WiNet format `{ StatusDescription: 'WORK', Error: 0 }` to proxy format `{ stove_state: 'working', power_level: 3, fan_level: 4, data_freshness: 'LIVE', error_code: null, error_description: null }`
- Test descriptions updated (e.g., "ON states match (WORK)" → "ON states match (working)")

**lib/maintenanceService.ts:**
- Removed `import { isLocalEnvironment, isSandboxEnabled, getSandboxMaintenance, SandboxMaintenance } from './sandboxService'`
- Removed sandbox check block from `getMaintenanceData()` — function now reads directly from Firebase

**__tests__/maintenanceService.concurrency.test.ts:**
- Removed `jest.mock('../lib/sandboxService', ...)` block

**app/components/devices/stove/hooks/useStoveData.ts:**
- Removed `import { isSandboxEnabled, isLocalEnvironment } from '@/lib/sandboxService'`
- Removed sandbox check block in `fetchStatusAndUpdate()` — function now fetches directly

**__tests__/components/devices/stove/hooks/useStoveData.test.ts:**
- Removed `import * as sandboxService from '@/lib/sandboxService'`
- Removed `jest.mock('@/lib/sandboxService')`
- Removed `jest.mocked(sandboxService.isLocalEnvironment).mockReturnValue(false)`

**app/settings/page.tsx:**
- Removed `import SandboxToggle from '@/app/components/sandbox/SandboxToggle'`
- Removed `FlaskConical` from lucide-react import
- Removed `SandboxContent` component function
- Removed Sandbox tab trigger and tab content panel

**app/page.tsx:**
- Removed `import SandboxPanel from './components/sandbox/SandboxPanel'`
- Removed `<SandboxPanel />` render and accompanying comment

**Commit:** `4d55c7f`

### Deviation: Dead Service Worker Cache Rule (Rule 2 - Auto-fix)

**Found during:** Task 2 final verification
**Issue:** `app/sw.ts` contained a dead RuntimeCaching rule targeting `wsthermorossi.cloudwinet.it` — the app no longer makes direct requests to WiNet cloud since the proxy migration.
**Fix:** Removed the stove-api-cache RuntimeCaching block from sw.ts
**Commit:** `1f34843`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Dead Code] Removed dead WiNet service worker cache rule**
- **Found during:** Task 2 final verification (cloudwinet grep)
- **Issue:** `app/sw.ts` line 42 had a RuntimeCaching rule matching `wsthermorossi.cloudwinet.it` — dead since all stove traffic now goes through the HA proxy
- **Fix:** Removed the 14-line stove-api-cache block from sw.ts
- **Files modified:** `app/sw.ts`
- **Commit:** `1f34843`

## Verification Results

All acceptance criteria met:
- `lib/stoveApi.ts` — does not exist
- `lib/sandboxService.ts` — does not exist
- `lib/services/StoveService.ts` — does not exist
- `app/components/sandbox/` — directory does not exist
- `app/api/stove/getRoomTemperature/` through `setSettings/` — do not exist
- `app/debug/stove/` — does not exist
- Zero grep matches for `stoveApi`, `sandboxService`, `SandboxPanel`, `SandboxToggle`, `isSandboxEnabled`, `isLocalEnvironment`, `cloudwinet` in `lib/`, `app/`, `__tests__/`
- `lib/healthMonitoring.ts` contains `from './thermorossiProxy'` and `const ON_STATES = ['working', 'modulating']`
- `lib/maintenanceService.ts` has no sandbox references
- `app/page.tsx` does not render SandboxPanel
- `app/settings/page.tsx` does not render SandboxToggle
- 77 affected tests pass (healthMonitoring: 19, maintenanceService: 40, useStoveData: 18)
- 3 pre-existing test failures (useDeviceStaleness, StoveStatus, StoveCard.orchestrator) confirmed unrelated

## Self-Check: PASSED
