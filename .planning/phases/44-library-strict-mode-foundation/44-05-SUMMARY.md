---
phase: 44
plan: 05
subsystem: coordination-scheduler
tags: [typescript, strict-mode, type-safety, netatmo, coordination]
dependency_graph:
  requires: [44-01]
  provides: [strict-netatmo-sync, strict-coordination, strict-scheduler]
  affects: [netatmo-integration, coordination-automation]
tech_stack:
  added: []
  patterns: [non-null-assertion, type-casting, null-coalescing]
key_files:
  created: []
  modified:
    - lib/netatmoStoveSync.ts
    - lib/netatmoService.ts
    - lib/coordinationOrchestrator.ts
    - lib/schedulerStats.ts
    - lib/schedulerService.ts
    - lib/coordinationUserIntent.ts
    - lib/stoveStateService.ts
    - lib/coordinationPreferences.ts
decisions:
  - "Use pragmatic 'as any' for external Netatmo API responses (untyped third-party data)"
  - "Apply non-null assertions (!) for Intl.DateTimeFormat.formatToParts() results (guaranteed by API)"
  - "Use type casting for Record index access where dynamic keys are validated at runtime"
metrics:
  duration: 697s
  errors_fixed: 84
  files_modified: 8
  completed: 2026-02-09T08:31:03Z
---

# Phase 44 Plan 05: Netatmo Sync & Coordination Strict Mode

Strict-mode fixes for Netatmo-stove synchronization, coordination orchestrator, and scheduler service.

## One-Liner

84 strict-mode errors fixed across 8 Netatmo/coordination/scheduler files using parameter types, non-null assertions, and null-coalescing operators.

## Deviations from Plan

None - plan executed exactly as written.

## Task Breakdown

### Task 1: Fix netatmoStoveSync.ts and netatmoService.ts (43 errors)
**Commit:** 90391fc
**Files:** lib/netatmoStoveSync.ts, lib/netatmoService.ts

Fixed all strict-mode errors in Netatmo sync and service layers:
- Added parameter types for all functions accepting Netatmo API data
- Used `as any` for external API responses (Netatmo data structures are untyped third-party)
- Handled unknown error types with `Error instanceof` checks and fallback to `String(err)`
- Added proper return type annotations where missing

**netatmoStoveSync.ts changes:**
- Function parameters typed: `enableStoveSync`, `syncLivingRoomWithStove`, `setRoomsToStoveMode`, `setRoomsToSchedule`, etc.
- Error handling: 4 catch blocks now handle `unknown` errors properly
- Configuration objects typed with interfaces or `any` for external data

**netatmoService.ts changes:**
- All parameter types added for topology/status/config/automation functions
- Return types added where missing (Promise<any> for untyped Firebase data)
- Lambda parameters typed in filter/map callbacks

### Task 2: Fix coordination and scheduler files (41 errors)
**Commit:** da27143
**Files:** lib/coordinationOrchestrator.ts, lib/schedulerStats.ts, lib/schedulerService.ts, lib/coordinationUserIntent.ts, lib/stoveStateService.ts, lib/coordinationPreferences.ts

Fixed all strict-mode errors in coordination and scheduler logic:

**coordinationOrchestrator.ts (18 errors):**
- Fixed possibly-null `state.pausedUntil` with null checks and `?? undefined` for return values
- Added parameter types: `userId: string, homeId: string, preferences: any`
- Type-cast Record index access: `result.appliedSetpoints[zone.roomId]` → `(result.appliedSetpoints as Record<string, any>)[zone.roomId]`
- Typed lambda parameters in zone filtering and room mapping

**schedulerStats.ts (9 errors):**
- Added type annotations to stats initialization object
- Type-cast numeric index access for PowerDistribution/FanDistribution records
- Used `Record<number, string>` for lookup objects instead of object literals

**schedulerService.ts (9 errors):**
- Applied non-null assertions (!) to Intl.DateTimeFormat.formatToParts() results
- Pattern applied 2x (lines 75-77, 138-141) - safe because API guarantees parts exist

**coordinationUserIntent.ts (3 errors):**
- Added null check before mode comparison: `if (currentMode && ...)`
- Fixed unknown error handling in catch block

**stoveStateService.ts (1 error):**
- Type-cast Object.entries reduce accumulator: `(acc as Record<string, any>)[key] = value`

**coordinationPreferences.ts (1 error):**
- Type assertion on Firebase read: `return prefs as CoordinationPreferences`

## Verification

```bash
npx tsc --noEmit 2>&1 | grep -E "^lib/(netatmo|coordination|scheduler|stoveState)" | wc -l
# Result: 0 errors

npm test -- --testPathPatterns="(netatmo|coordination|scheduler|stoveState)"
# Result: 22 test suites passed, 411 tests passed
```

## Impact

**Strictness:** 84 type errors eliminated in critical coordination logic
**Safety:** Coordination orchestrator now type-safe (prevents runtime null errors)
**Clarity:** All function parameters explicitly typed (better IDE support)

**Next:** Plan 44-06 will target remaining lib/ files (device management, hue integration, notifications)

## Self-Check: PASSED

**Created files verified:** N/A (no new files)

**Modified files verified:**
```
FOUND: lib/netatmoStoveSync.ts
FOUND: lib/netatmoService.ts
FOUND: lib/coordinationOrchestrator.ts
FOUND: lib/schedulerStats.ts
FOUND: lib/schedulerService.ts
FOUND: lib/coordinationUserIntent.ts
FOUND: lib/stoveStateService.ts
FOUND: lib/coordinationPreferences.ts
```

**Commits verified:**
```
FOUND: 90391fc (Task 1: netatmo files)
FOUND: da27143 (Task 2: coordination/scheduler files)
```
