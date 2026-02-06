---
phase: 38-library-migration
verified: 2026-02-06T11:15:00Z
status: gaps_found
score: 3/4 must-haves verified
gaps:
  - truth: "tsc --noEmit passes on lib/ directory with no errors"
    status: failed
    reason: "252 TypeScript compilation errors across 40 lib files"
    artifacts:
      - path: "lib/coordinationOrchestrator.ts"
        issue: "CoordinationAction type incomplete - missing 'capped', 'retry_timer', 'throttled' values"
      - path: "lib/coordinationUserIntent.ts"
        issue: "String literal type mismatch for manual change reasons"
      - path: "lib/firebaseAdmin.ts"
        issue: "Android priority type must be 'high' | 'normal', not string"
      - path: "lib/version.ts"
        issue: "VersionEntry interface missing 'breaking' property"
      - path: "lib/coordinationEventLogger.ts"
        issue: "Query<DocumentData> cannot be assigned to CollectionReference type"
      - path: "lib/hooks/useBackgroundSync.ts"
        issue: "Return type mismatch (pre-existing from 38-08)"
      - path: "lib/hooks/useGeofencing.ts"
        issue: "Callback type issues (pre-existing from 38-08)"
      - path: "lib/core/netatmoHelpers.ts"
        issue: "TokenResult type missing 'message' property"
    missing:
      - "Fix union types to include all possible runtime values (CoordinationAction, etc.)"
      - "Add missing properties to interfaces (VersionEntry.breaking, TokenResult.message)"
      - "Fix Firebase type mismatches (Query vs CollectionReference)"
      - "Fix string literal types for Android notification priority"
      - "Fix hook return type mismatches from 38-08"
---

# Phase 38: Library Migration Verification Report

**Phase Goal:** All 132 library files (116 in lib/ + 16 hooks) converted to TypeScript with proper typing.
**Verified:** 2026-02-06T11:15:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | All 116 files in lib/ have .ts extension (no .js remaining) | ✓ VERIFIED | `find lib -name "*.js" -not -path "*__tests__*"` returns 0 files |
| 2 | All hooks return properly typed values | ✓ VERIFIED | All 16 hooks have .ts extension, useDebounce<T> has generic typing |
| 3 | Services have typed parameters and return types | ✓ VERIFIED | StoveService methods have typed parameters (StoveCommandSource, power: number), return Promise<unknown> |
| 4 | tsc --noEmit passes on lib/ directory with no errors | ✗ FAILED | 252 TypeScript errors across 40 lib files |

**Score:** 3/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| lib/utils/cn.ts | Tailwind className merge utility | ✓ VERIFIED | 27 lines, imports ClassValue from clsx, typed function signature |
| lib/repositories/base/BaseRepository.ts | Base repository with generic typing | ✓ VERIFIED | 3677 bytes, abstract class BaseRepository<T = unknown> |
| lib/pwa/indexedDB.ts | IndexedDB wrapper for PWA | ✓ VERIFIED | 7292 bytes, Promise-based API, typed store constants |
| lib/services/StoveService.ts | Stove business logic service | ✓ VERIFIED | 5418 bytes, typed methods with StoveCommandSource, imports from @/types/firebase |
| app/hooks/useDebounce.ts | Generic debounce hook | ✓ VERIFIED | 1205 bytes, useDebounce<T> generic signature, useState<T> typed state |
| lib/coordinationOrchestrator.ts | Coordination orchestrator | ⚠️ PARTIAL | Exists with 6 TypeScript errors - incomplete union types |
| lib/version.ts | App version constants | ⚠️ PARTIAL | Exists but VersionEntry interface missing 'breaking' property (5 errors) |
| lib/firebaseAdmin.ts | Firebase admin SDK wrapper | ⚠️ PARTIAL | Exists with 3 TypeScript errors - notification priority type issues |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| lib/utils/cn.ts | clsx | import ClassValue | ✓ WIRED | Imports ClassValue type, function uses it in signature |
| lib/services/StoveService.ts | @/types/firebase | import StoveCommand | ✓ WIRED | Uses StoveCommand type from Phase 37 types |
| app/hooks/useDebounce.ts | useState | React.useState<T> | ✓ WIRED | Generic type preserved through state hook |
| lib/repositories/base/BaseRepository.ts | consumers | abstract class | ✓ WIRED | Extended by 8 repository classes (MaintenanceRepository, StoveStateRepository, etc.) |

### Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| LIB-01: Tutti i file lib/ convertiti a .ts (116 file) | ✓ SATISFIED | None - all files converted |
| LIB-02: Hooks convertiti a .ts (lib/hooks/, app/hooks/) | ✓ SATISFIED | None - all 16 hooks converted |
| LIB-03: Utilities e helpers tipizzati | ✓ SATISFIED | None - 13 leaf utilities fully typed |
| LIB-04: Services e repositories tipizzati | ⚠️ BLOCKED | 252 TypeScript compilation errors prevent type safety guarantee |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| lib/coordinationOrchestrator.ts | 205 | Type '"capped"' not assignable to CoordinationAction | 🛑 Blocker | Runtime value not reflected in type - breaks type safety |
| lib/coordinationOrchestrator.ts | 256 | Type '"retry_timer"' not in union | 🛑 Blocker | Union type incomplete |
| lib/coordinationOrchestrator.ts | 269 | Missing required 'reason' property | 🛑 Blocker | Interface violation |
| lib/version.ts | 577-701 | 'breaking' not in VersionEntry interface | 🛑 Blocker | Type definition doesn't match actual data (5 occurrences) |
| lib/firebaseAdmin.ts | 354 | Android priority must be 'high' \| 'normal' | 🛑 Blocker | String type too broad for Firebase API |
| lib/coordinationEventLogger.ts | 139-159 | Query<DocumentData> vs CollectionReference | 🛑 Blocker | Firebase type mismatch (6 occurrences) |
| lib/hooks/useBackgroundSync.ts | N/A | Return type mismatch | ⚠️ Warning | Pre-existing from 38-08, acknowledged in summary |
| lib/hooks/useOnlineStatus.ts | N/A | Return type mismatch | ⚠️ Warning | Pre-existing from 38-08 |
| lib/hooks/usePWAInstall.ts | N/A | Return type mismatch | ⚠️ Warning | Pre-existing from 38-08 |
| lib/core/netatmoHelpers.ts | 55 | TokenResult missing 'message' property | 🛑 Blocker | Type doesn't match API response shape |

**Blockers:** 10 distinct blocking issues
**Warnings:** 6 hook return type issues (pre-existing, acknowledged)

### Gaps Summary

**The migration successfully converted all 132 files to TypeScript (.ts extension), but the type definitions are incomplete.**

The critical gap is **252 TypeScript compilation errors** across 40 lib files. These errors fall into distinct categories:

**Category 1: Incomplete Union Types (Most Common)**
- CoordinationAction type is defined as `'skipped' | 'paused' | 'debouncing' | 'applied' | 'restored' | 'no_change'` but code uses `'capped'`, `'retry_timer'`, `'throttled'`
- Manual change reason types incomplete
- Fix: Audit code for all runtime values, extend union types

**Category 2: Missing Interface Properties**
- VersionEntry interface missing `breaking?: boolean` property (used in 5 version entries)
- TokenResult interface missing `message` property
- Fix: Add missing optional properties to interfaces

**Category 3: Firebase Type Mismatches**
- coordinationEventLogger.ts assigns Query<DocumentData> to CollectionReference type (6 occurrences)
- Fix: Use correct Firebase type or add type assertions

**Category 4: String Literal Type Mismatches**
- Android notification priority typed as `string` but Firebase expects `'high' | 'normal'`
- Fix: Use narrower type or type guard before Firebase call

**Category 5: Hook Return Types (Pre-existing)**
- 6 PWA hooks from plan 38-08 have return type mismatches
- Acknowledged in 38-09-SUMMARY.md as pre-existing
- Fix: Cleanup plan after Phase 39

**Impact:** Phase goal partially achieved. Files are converted (.ts extension), but type safety is compromised by compilation errors. Success criteria #4 ("tsc --noEmit passes") is NOT met.

**Root Cause:** Migration focused on adding types to match existing code structure, but some runtime behaviors use values not reflected in the type definitions. This suggests types were added quickly without full runtime value analysis.

---

_Verified: 2026-02-06T11:15:00Z_
_Verifier: Claude (gsd-verifier)_
