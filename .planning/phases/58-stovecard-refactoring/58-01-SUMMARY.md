---
phase: 58-stovecard-refactoring
plan: 01
subsystem: stove-control
tags: [refactoring, hooks, testing, orchestrator-pattern]
dependency_graph:
  requires: []
  provides:
    - stoveStatusUtils (pure status mapping functions)
    - useStoveData (state + polling + Firebase)
    - useStoveCommands (command handlers with retry)
  affects: []
tech_stack:
  added: []
  patterns:
    - "Custom polling loop (NOT useAdaptivePolling)"
    - "useRetryableCommand integration (4 command types)"
    - "Pure utility functions for status mapping"
key_files:
  created:
    - app/components/devices/stove/stoveStatusUtils.ts
    - app/components/devices/stove/hooks/useStoveData.ts
    - app/components/devices/stove/hooks/useStoveCommands.ts
    - __tests__/components/devices/stove/stoveStatusUtils.test.ts
    - __tests__/components/devices/stove/hooks/useStoveData.test.ts
    - __tests__/components/devices/stove/hooks/useStoveCommands.test.ts
  modified: []
decisions: []
metrics:
  duration_minutes: 7
  tasks_completed: 2
  files_created: 6
  tests_added: 55
  commits: 2
completed_date: 2026-02-12
---

# Phase 58 Plan 01: Extract Stove Hooks and Utilities Summary

Custom hooks and pure utility functions extracted from StoveCard.tsx, ready for orchestrator pattern integration.

## Objective

Extract useStoveData, useStoveCommands, and status utility functions from the monolithic StoveCard.tsx into separate modules to enable the orchestrator pattern. These hooks separate state management and command logic from rendering.

## Execution Summary

**Duration:** 7 minutes
**Status:** Complete
**Result:** Three modules created with comprehensive test coverage

### Tasks Completed

| Task | Description | Commit | Files | Tests |
|------|-------------|--------|-------|-------|
| 1 | Extract hooks and utilities | b4385a9 | 3 created | 0 |
| 2 | Add unit tests | efa9538 | 3 created | 55 |

### Files Created

**Production Code:**
1. **stoveStatusUtils.ts** (305 lines)
   - Pure functions for status mapping
   - Exports: `getStatusInfo`, `getStatusDisplay`, `getStatusGlow`, `isStoveActive`, `isStoveOff`
   - All functions stateless (no React hooks)

2. **useStoveData.ts** (534 lines)
   - Encapsulates ALL stove state management
   - Custom polling loop (NOT useAdaptivePolling)
   - Firebase real-time listeners (production + sandbox)
   - Background sync integration
   - Staleness tracking
   - Error monitoring
   - Returns 30+ state values and setters

3. **useStoveCommands.ts** (343 lines)
   - Encapsulates ALL command handlers
   - Integrates useRetryableCommand for 4 command types (ignite, shutdown, setFan, setPower)
   - Returns 9 command handlers + 4 retryable command objects
   - All commands use Phase 55 retry infrastructure

**Test Files:**
1. **stoveStatusUtils.test.ts** (24 tests)
   - Pure function tests (no mocking needed)
   - Covers all status variants: WORK, OFF, START, STANDBY, WAIT, ERROR, ALARM, CLEAN, MODULATION
   - Tests getStatusInfo, getStatusDisplay, getStatusGlow, isStoveActive, isStoveOff

2. **useStoveData.test.ts** (9 tests)
   - Hook behavior tests with renderHook
   - Covers: initialization, status fetch, derived state, error logging, Firebase listeners

3. **useStoveCommands.test.ts** (22 tests)
   - Command handler tests with mocked dependencies
   - Covers: ignite, shutdown, fan/power changes, scheduler mode changes, maintenance

### Key Patterns Preserved

1. **Custom Polling Loop**
   - StoveCard uses its own adaptive polling (lines 241-294 in original)
   - NOT useAdaptivePolling (explicitly documented in useStoveData)
   - Intervals: 10s (Firebase down), 15s (stove ON), 60s (stove OFF)

2. **useRetryableCommand Integration**
   - 4 hook instances at top level (React hooks rules)
   - Each command type has dedicated hook: igniteCmd, shutdownCmd, setFanCmd, setPowerCmd
   - Retryable command objects exposed for UI integration (isExecuting, lastError, retry)

3. **Single Polling Loop Guarantee**
   - Only useStoveData contains polling/Firebase effects
   - useStoveCommands is pure command handlers (no polling)
   - StoveCard will NOT have redundant polling after integration

### TypeScript Compliance

- `npx tsc --noEmit` passes (0 new errors)
- No useAdaptivePolling found in useStoveData (verified with grep)
- 11 references to useRetryableCommand in useStoveCommands (4 hooks + imports + comments)

### Test Coverage

**Total: 55 tests passing**
- stoveStatusUtils: 24 tests (pure function coverage)
- useStoveData: 9 tests (hook initialization, fetching, derived state)
- useStoveCommands: 22 tests (command execution, loading state, scheduler)

All tests pass: `npx jest __tests__/components/devices/stove/ --no-coverage`

## Deviations from Plan

None - plan executed exactly as written.

## Integration Points for Plan 02/03

**useStoveData exports (ready for orchestrator):**
- Core state: status, fanLevel, powerLevel, loading, refreshing, initialLoading
- Scheduler state: schedulerEnabled, semiManualMode, returnToAutoAt, nextScheduledAction
- Error state: errorCode, errorDescription
- Maintenance state: maintenanceStatus, cleaningInProgress
- Sandbox state: sandboxMode, loadingMessage
- Connection state: isFirebaseConnected, usePollingFallback
- PWA state: isOnline, hasPendingCommands, pendingCommands, staleness, isVisible
- Derived state: isAccesa, isSpenta, needsMaintenance
- Actions: fetchStatusAndUpdate, setters (15 functions)

**useStoveCommands exports (ready for orchestrator):**
- 9 command handlers: handleIgnite, handleShutdown, handleFanChange, handlePowerChange, handleClearSemiManual, handleSetManualMode, handleSetAutomaticMode, handleConfirmCleaning, handleManualRefresh
- 4 retryable command objects: igniteCmd, shutdownCmd, setFanCmd, setPowerCmd

**stoveStatusUtils exports (ready for sub-components):**
- getStatusInfo(status) → StoveStatusInfo (full Ember Noir styling)
- getStatusDisplay(status) → StoveStatusDisplay (CVA-aligned variants)
- getStatusGlow(variant) → shadow class string
- isStoveActive(status) → boolean
- isStoveOff(status) → boolean

## Commits

```
b4385a9 feat(58-01): extract stove hooks and status utilities
efa9538 test(58-01): add unit tests for stove hooks and utilities
```

## Self-Check

**Created files:**
```bash
✓ FOUND: app/components/devices/stove/stoveStatusUtils.ts
✓ FOUND: app/components/devices/stove/hooks/useStoveData.ts
✓ FOUND: app/components/devices/stove/hooks/useStoveCommands.ts
✓ FOUND: __tests__/components/devices/stove/stoveStatusUtils.test.ts
✓ FOUND: __tests__/components/devices/stove/hooks/useStoveData.test.ts
✓ FOUND: __tests__/components/devices/stove/hooks/useStoveCommands.test.ts
```

**Commits:**
```bash
✓ FOUND: b4385a9 (feat: extract hooks and utilities)
✓ FOUND: efa9538 (test: unit tests)
```

**Patterns verified:**
```bash
✓ VERIFIED: No useAdaptivePolling in useStoveData
✓ VERIFIED: 11 references to useRetryableCommand in useStoveCommands
✓ VERIFIED: TypeScript compilation passes
✓ VERIFIED: 55 tests passing
```

## Self-Check: PASSED

All claimed files exist, commits present, patterns verified, tests green.

## Next Steps

**Plan 02:** Create sub-components (StoveStatusDisplay, StoveControls, StoveModeSelector, MaintenanceBanner)
**Plan 03:** Wire orchestrator pattern in StoveCard.tsx (use hooks, render sub-components)

The foundation is ready. Hooks expose clean interfaces for orchestrator integration.
