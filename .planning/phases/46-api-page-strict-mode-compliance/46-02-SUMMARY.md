---
phase: 46-api-page-strict-mode-compliance
plan: 02
subsystem: app-pages
tags: [typescript, strict-mode, type-safety, error-handling]
dependency_graph:
  requires: [lib-types, ui-components]
  provides: [strict-lights-page, strict-stove-page]
  affects: [hue-integration, stove-control]
tech_stack:
  patterns: [error-instanceof-check, null-guards, type-assertion, keyof-typeof]
key_files:
  created: []
  modified:
    - app/lights/page.tsx
    - app/stove/page.tsx
decisions:
  - slug: error-instanceof-pattern
    summary: Use 'err instanceof Error' checks in all catch blocks for type-safe error handling
    context: Phase 46 strict-mode compliance
  - slug: null-guards-for-state
    summary: Use 'value !== null' guards before comparisons with nullable state (fanLevel, powerLevel, groupedLightId)
    context: TypeScript strict null checks require explicit guards
  - slug: keyof-typeof-for-dynamic-access
    summary: Use 'as keyof typeof' pattern for safe dynamic object property access
    context: actionLabels and themeColors object index access
  - slug: pragmatic-any-for-interface-mismatch
    summary: Cast light to any for supportsColor due to HueLight interface differences between page and colorUtils
    context: Acceptable for external API compatibility
metrics:
  duration: 445s
  tasks_completed: 2
  files_modified: 2
  errors_fixed: 41
completed_date: 2026-02-09
---

# Phase 46 Plan 02: Lights and Stove Page Strict-Mode Compliance Summary

**One-liner:** Fixed 41 strict-mode TypeScript errors across lights page (24 errors) and stove page (17 errors) using error instanceof checks, null guards, and keyof typeof patterns.

## Overview

This plan addressed all strict-mode TypeScript errors in the two largest device-control pages (lights and stove), implementing consistent error handling patterns and null safety checks.

## Tasks Completed

### Task 1: Fix 24 strict-mode errors in lights page

**File:** `app/lights/page.tsx`

**Changes:**
- **TS18046 (12 errors):** Added `err instanceof Error ? err.message : String(err)` pattern to all catch blocks (lines 163, 188, 208, 230, 252, 279, 301, 333, 386, 437, 492, 554)
- **TS7006 (7 errors):** Added type annotations to callback parameters:
  - Sort callback: `(a: HueRoom, b: HueRoom)` (line 153)
  - Helper functions: `getGroupedLightId(room: HueRoom)`, `getRoomLights(room: HueRoom)`, `getRoomScenes(room: HueRoom)` (lines 340, 349, 360)
  - Added optional chaining in `getRoomLights` for `room.children?.some()`
- **TS2345 (5 errors):** Fixed argument type mismatches:
  - Slider onChange: Cast value as `value as number` (lines 1041, 1132)
  - Null guards: Added `groupedLightId &&` before handler calls (lines 980, 989, 1003, 1018, 1041)
  - HueLight mismatch: Cast to any for `supportsColor(light as any)` (line 1072)
  - Scene name: Added fallback `scene.metadata?.name || ''` (line 1179)
- **TS2769 (1 error):** Added null check before `clearInterval(pairingTimerRef.current)` (line 452)

**Commit:** `1e75dd3`

### Task 2: Fix 17 strict-mode errors in stove page

**File:** `app/stove/page.tsx`

**Changes:**
- **TS7034/TS7005 (6 errors):** Typed Firebase unsubscribe variables:
  ```typescript
  let unsubscribeState: (() => void) | null = null;
  let unsubscribeMaintenance: (() => void) | null = null;
  let unsubscribeError: (() => void) | null = null;
  ```
  (lines 310-312, 349-351)
- **TS7053 (2 errors):** Added keyof typeof for safe index access:
  - `actionLabels[key as keyof typeof actionLabels]` (line 221)
  - `themeColors[key as keyof typeof themeColors]` (line 533)
- **TS18047 (8 errors):** Fixed null safety:
  - maintenanceStatus: Added optional chaining `maintenanceStatus?.currentHours` (line 600)
  - fanLevel: Changed guards from `fanLevel > 1` to `fanLevel !== null && fanLevel > 1` (lines 857, 870)
  - powerLevel: Changed guards from `powerLevel > 1` to `powerLevel !== null && powerLevel > 1` (lines 889, 902)

**Commit:** `7cd6a60`

## Deviations from Plan

None - plan executed exactly as written.

## Verification

```bash
# Zero errors in both pages
npx tsc --noEmit 2>&1 | grep -E "app/(lights|stove)/page.tsx" | wc -l
# Result: 0
```

Both pages now compile with zero strict-mode errors.

## Patterns Established

### 1. Error Instanceof Pattern
```typescript
catch (err) {
  setError(err instanceof Error ? err.message : String(err));
}
```

### 2. Null Guards for State
```typescript
// Before
onClick={() => fanLevel > 1 && handleFanChange(fanLevel - 1)}

// After
onClick={() => fanLevel !== null && fanLevel > 1 && handleFanChange(fanLevel - 1)}
```

### 3. Keyof Typeof for Dynamic Access
```typescript
// Before
const theme = themeColors[statusConfig.theme] || themeColors.slate;

// After
const theme = themeColors[statusConfig.theme as keyof typeof themeColors] || themeColors.slate;
```

### 4. Pragmatic Any for Interface Mismatch
```typescript
// When HueLight interfaces differ between modules
const hasColor = supportsColor(light as any);
```

## Impact

- **Type Safety:** Both pages now enforce strict null checks and error handling
- **Error Handling:** Consistent error instanceof pattern across 12 catch blocks
- **Null Safety:** All nullable state properly guarded before usage
- **Code Quality:** Zero remaining tsc errors in device control pages

## Next Steps

Phase 46 will continue with remaining app/ directory pages and API routes.

## Self-Check: PASSED

**Created files exist:**
- ✓ `.planning/phases/46-api-page-strict-mode-compliance/46-02-SUMMARY.md`

**Commits exist:**
- ✓ `1e75dd3`: fix(46-02): fix 24 strict-mode errors in lights page
- ✓ `7cd6a60`: fix(46-02): fix 17 strict-mode errors in stove page

**Modified files exist:**
- ✓ `app/lights/page.tsx`
- ✓ `app/stove/page.tsx`
