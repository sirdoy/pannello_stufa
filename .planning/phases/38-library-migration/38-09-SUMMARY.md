---
phase: 38-library-migration
plan: 09
subsystem: ui
tags: [typescript, react, hooks, pwa]

# Dependency graph
requires:
  - phase: 38-07
    provides: lib/services TypeScript migration
  - phase: 38-08
    provides: lib/hooks PWA utilities migration
provides:
  - Complete TypeScript migration of all React hooks (lib/hooks + app/hooks)
  - Generic hook types (useDebounce<T>)
  - Type-safe event handlers for hooks
affects: [39-ui-components, 40-api-routes, 41-pages]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Generic hooks with TypeScript generics (useDebounce<T>)
    - Hook return type interfaces exported for external use
    - React event handler typing (React.TouchEvent, MediaQueryListEvent)
    - CSSProperties typing for style constants

key-files:
  created: []
  modified:
    - app/hooks/index.ts
    - app/hooks/useContextMenuLongPress.ts
    - app/hooks/useDebounce.ts
    - app/hooks/useHaptic.ts
    - app/hooks/useLongPress.ts
    - app/hooks/useReducedMotion.ts
    - app/hooks/useToast.ts
    - app/hooks/useVersionCheck.ts

key-decisions:
  - "Generic useDebounce<T> hook preserves type safety across all value types"
  - "Hook return interfaces exported for IDE autocomplete and documentation"
  - "LongPressEventType.Pointer handles both mouse and touch events"

patterns-established:
  - "Hook return type interfaces: export interface UseXxxReturn"
  - "Hook options interfaces: export interface UseXxxOptions"
  - "Generic hooks: export function useXxx<T>(value: T): T"
  - "React event handler types for touch/pointer/media query events"

# Metrics
duration: 7min
completed: 2026-02-06
---

# Phase 38 Plan 09: React Hooks Migration Summary

**Complete TypeScript migration of 16 React hooks with generic type parameters and return type interfaces**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-06T09:53:02Z
- **Completed:** 2026-02-06T10:00:05Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Migrated all 8 app/hooks files from .js to .ts
- Verified lib/hooks (8 PWA hooks) already migrated by plan 38-08
- Added generic type parameter to useDebounce<T> for type preservation
- Created return type interfaces for complex hooks (UseHapticReturn, UseLongPressReturn, UseContextMenuLongPressReturn, UseVersionCheckReturn)
- Added proper event handler types (React.TouchEvent, MediaQueryListEvent)
- Completed LIB-02 requirement (all hooks TypeScript)

## Task Commits

Each task was committed atomically:

1. **Task 1: Verify lib/hooks/** - No commit (already migrated by 38-08)
2. **Task 2: Migrate app/hooks/** - `a0409a5` (feat)
   - Fix: `6ab49f5` (fix: useContextMenuLongPress TypeScript corrections)

**Plan metadata:** Pending (this summary)

## Files Created/Modified
- `app/hooks/index.ts` - Barrel export for all hooks
- `app/hooks/useContextMenuLongPress.ts` - Long-press detection for context menus (mobile)
- `app/hooks/useDebounce.ts` - Generic debounce hook with type preservation
- `app/hooks/useHaptic.ts` - Haptic feedback patterns (short/success/warning/error)
- `app/hooks/useLongPress.ts` - Long-press for continuous value adjustment
- `app/hooks/useReducedMotion.ts` - Accessibility motion preference detection
- `app/hooks/useToast.ts` - Toast notification context hook
- `app/hooks/useVersionCheck.ts` - Version checking and "What's New" modal

## Decisions Made

**1. Generic useDebounce<T>**
- Rationale: Preserves type safety across string, number, object values
- Pattern: `export function useDebounce<T>(value: T, delay: number = 300): T`
- Benefit: IDE autocomplete and type checking for debounced values

**2. Exported return type interfaces**
- Rationale: Enables external type references and IDE autocomplete
- Pattern: `export interface UseXxxReturn { ... }`
- Benefit: Hooks can be typed in component props and contexts

**3. LongPressEventType.Pointer instead of .Both**
- Rationale: use-long-press v3.3.0 doesn't export "Both", only Mouse/Touch/Pointer
- Fix: Pointer handles both mouse and touch events via PointerEvent API
- Benefit: Single event handler for all input types

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed LongPressEventType.Both reference**
- **Found during:** Task 2 (useContextMenuLongPress migration)
- **Issue:** TypeScript error - LongPressEventType.Both doesn't exist in use-long-press@3.3.0
- **Fix:** Changed to LongPressEventType.Pointer which handles both mouse and touch
- **Files modified:** app/hooks/useContextMenuLongPress.ts
- **Verification:** TypeScript compilation succeeds, Pointer API handles both input types
- **Committed in:** 6ab49f5 (fix commit)

**2. [Rule 1 - Bug] Fixed useContextMenuLongPress return type**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** bind return type was `() => ReturnType<typeof useLibLongPress>` but should be direct value
- **Fix:** Changed to `bind: ReturnType<typeof useLibLongPress>`
- **Files modified:** app/hooks/useContextMenuLongPress.ts
- **Verification:** TypeScript compilation succeeds
- **Committed in:** 6ab49f5 (fix commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for TypeScript correctness. No scope creep.

## Issues Encountered

None - migration straightforward with type annotations added to existing JavaScript code.

## Verification

**LIB-02 Complete:** All React hooks migrated to TypeScript
```bash
$ find lib/hooks app/hooks -name "*.js" -not -path "*__tests__*" | wc -l
0
```

**LIB-01 Complete:** All lib/ files migrated to TypeScript
```bash
$ find lib -name "*.js" -not -path "*__tests__*" | wc -l
0
```

**TypeScript Compilation:** Some pre-existing errors remain in other lib/ files (not introduced by this plan):
- lib/hooks/useBackgroundSync.ts - Return type mismatch (pre-existing from 38-08)
- lib/hooks/useGeofencing.ts - Callback type issues (pre-existing from 38-08)
- lib/hooks/useOnlineStatus.ts - Return type mismatch (pre-existing from 38-08)
- lib/hooks/usePWAInstall.ts - Return type mismatch (pre-existing from 38-08)
- lib/hooks/useRoomStatus.ts - Extra property 'refetch' (pre-existing from 38-08)
- lib/hooks/useWakeLock.ts - Return type mismatch (pre-existing from 38-08)

These will be addressed in a future cleanup plan after UI components migration.

## Next Phase Readiness

**Ready for Phase 39 (UI Components Migration):**
- All custom hooks TypeScript-ready for component imports
- Generic types enable type-safe component props
- Return type interfaces exported for context typing

**Blockers:** None

**Concerns:**
- Pre-existing TypeScript errors in lib/hooks from 38-08 should be fixed before final verification
- Consider creating a cleanup plan (38-10) to fix return type mismatches

---
*Phase: 38-library-migration*
*Completed: 2026-02-06*

## Self-Check: PASSED

All commits verified:
- a0409a5 ✓
- 6ab49f5 ✓

All files verified:
- app/hooks/index.ts ✓
- app/hooks/useContextMenuLongPress.ts ✓
- app/hooks/useDebounce.ts ✓
- app/hooks/useHaptic.ts ✓
- app/hooks/useLongPress.ts ✓
- app/hooks/useReducedMotion.ts ✓
- app/hooks/useToast.ts ✓
- app/hooks/useVersionCheck.ts ✓
