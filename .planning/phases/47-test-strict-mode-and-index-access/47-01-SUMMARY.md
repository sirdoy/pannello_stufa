---
phase: 47
plan: 01
subsystem: testing
tags: [strict-mode, test-quality, type-safety]
dependency_graph:
  requires: [phase-46-complete]
  provides: [strict-mode-test-patterns]
  affects: [test-infrastructure]
tech_stack:
  added: []
  patterns: [jest-mock-typing, test-specific-any, callback-parameter-typing]
key_files:
  created: []
  modified:
    - __tests__/lib/coordinationEventLogger.test.ts
    - __tests__/lib/healthLogger.test.ts
    - __tests__/lib/notificationHistoryService.test.ts
decisions:
  - Mock variables with dynamic properties use `any` type (not jest.Mock)
  - Callback parameters in mockImplementation receive explicit `any` type
  - Test arrays with intentional empty values receive explicit type annotation
metrics:
  duration: 262s
  completed: 2026-02-09
---

# Phase 47 Plan 01: High-Error Test File Strict Mode Fixes Summary

**One-liner:** Fixed 108 strict mode tsc errors across 3 high-error test files by adding explicit types to mock variables and callback parameters

## Objective

Fix 108 strict-mode tsc errors across 3 high-error test files: coordinationEventLogger (46 errors), healthLogger (33 errors), notificationHistoryService (29 errors). These three files account for ~38% of all remaining tsc errors. Fixing them establishes the pattern for all subsequent test file fixes.

## Execution

### Task 1: Fix coordinationEventLogger.test.ts (46 errors) and healthLogger.test.ts (33 errors)

**Execution time:** ~3 minutes

**What was done:**
- Added explicit types to all mock variables in both test files
- coordinationEventLogger: `jest.Mock` for function mocks, `any` for mock db
- healthLogger: `any` for all mocks with dynamic properties (collection, doc, batch, query, snapshot)
- Added explicit `any` type to callback parameters in mockImplementation
- Added explicit type annotation to empty results array

**Files modified:**
- `__tests__/lib/coordinationEventLogger.test.ts`
- `__tests__/lib/healthLogger.test.ts`

**Commit:** f0c9f4a

### Task 2: Fix notificationHistoryService.test.ts (29 errors)

**Execution time:** ~1 minute

**What was done:**
- Added `any` types to all mock variables (mockDb, mockCollection, mockQuery, mockSnapshot)
- Added explicit `any` type to callback parameters in find/filter functions
- Followed same pattern as Task 1

**Files modified:**
- `__tests__/lib/notificationHistoryService.test.ts`

**Commit:** 217eb67

## Verification

**tsc strict mode:**
```bash
npx tsc --noEmit 2>&1 | grep "coordinationEventLogger.test\|healthLogger.test\|notificationHistoryService.test" | wc -l
# Result: 0 (was 108)
```

**Tests:**
```bash
npx jest coordinationEventLogger healthLogger notificationHistoryService
# Result: 3 suites passed, 50 tests passed
```

All success criteria met:
- ✅ 0 tsc errors in coordinationEventLogger.test.ts (was 46)
- ✅ 0 tsc errors in healthLogger.test.ts (was 33)
- ✅ 0 tsc errors in notificationHistoryService.test.ts (was 29)
- ✅ All 50 tests in these files still pass

## Deviations from Plan

None - plan executed exactly as written.

## Patterns Established

### Mock Variable Typing Pattern

**When mock has only function calls:**
```typescript
let mockFunction: jest.Mock;
```

**When mock has dynamic properties (add, where, doc, etc):**
```typescript
let mockObject: any;
```

**Rationale:** jest.Mock type doesn't allow dynamic properties, causing TS2339 errors. Using `any` is pragmatic for test mocks with complex object structures.

### Callback Parameter Typing Pattern

**For mockImplementation callbacks:**
```typescript
mockSnapshot.forEach.mockImplementation((callback: any) => {
  callback(mockDoc);
});
```

**For filter/find callbacks:**
```typescript
const call = mockQuery.where.mock.calls.find(
  (call: any) => call[0] === 'timestamp'
);
```

**Rationale:** These are test-specific callbacks with dynamic structures. Explicit `any` annotation eliminates TS7006 implicit any errors.

### Empty Array Typing Pattern

**For intentional empty test arrays:**
```typescript
const results: any[] = [];
```

**Rationale:** Empty array literals get inferred as `never[]`, causing TS7034 errors. Explicit type annotation fixes this.

## Impact

**Before:** 108 tsc strict mode errors across 3 files (38% of remaining test errors)
**After:** 0 tsc strict mode errors, all tests passing
**Time:** 4 minutes execution

This plan establishes the patterns for fixing remaining test files in Phase 47, enabling consistent approach across ~100+ test files.

## Self-Check: PASSED

**Created files exist:**
```bash
[ -f ".planning/phases/47-test-strict-mode-and-index-access/47-01-SUMMARY.md" ] && echo "FOUND"
# FOUND
```

**Commits exist:**
```bash
git log --oneline --all | grep -q "f0c9f4a" && echo "FOUND: f0c9f4a"
# FOUND: f0c9f4a

git log --oneline --all | grep -q "217eb67" && echo "FOUND: 217eb67"
# FOUND: 217eb67
```

**Modified files exist and have zero tsc errors:**
```bash
[ -f "__tests__/lib/coordinationEventLogger.test.ts" ] && echo "FOUND"
# FOUND

[ -f "__tests__/lib/healthLogger.test.ts" ] && echo "FOUND"
# FOUND

[ -f "__tests__/lib/notificationHistoryService.test.ts" ] && echo "FOUND"
# FOUND

npx tsc --noEmit 2>&1 | grep -c "coordinationEventLogger.test\|healthLogger.test\|notificationHistoryService.test"
# 0
```

All claims verified successfully.
