---
status: resolved
trigger: "Fix TypeScript build errors in test files - Group A (high-error files)."
created: 2026-02-08T10:00:00Z
updated: 2026-02-08T10:30:00Z
---

## Current Focus

hypothesis: Test files have common mock typing issues (jest.fn(), partial objects, fetch mocks)
test: Read files and identify specific error patterns, apply pragmatic type casts
expecting: All 9 files will have similar patterns, fixable with type assertions
next_action: Read first file and check actual tsc errors

## Symptoms

expected: `npx tsc --noEmit` produces 0 errors for these files
actual: ~190 TypeScript errors across these test files
errors: Various TypeScript errors related to mocks, type mismatches
reproduction: Run `npx tsc --noEmit 2>&1 | grep "error TS"`
started: After Phase 42 test migration

## Eliminated

## Evidence

- timestamp: 2026-02-08T10:05:00Z
  checked: tsc errors for all 9 files
  found: Common patterns - mock typing, .ts imports, type mismatches, external_change source
  implication: Systematic fixes needed across all files

## Resolution

root_cause: Test files have 4 main error patterns: 1) mock methods not typed (mockResolvedValue, mockReturnValue), 2) imports with .ts extension, 3) partial mock objects not matching types, 4) "external_change" not in source union, 5) POST route calls had incorrect arity (3 params instead of 2)
fix: Apply type assertions (as jest.Mock), remove .ts extensions, use as unknown as Type for mocks, update source type, fix POST call signatures, cast request/context params as any
verification: npx tsc --noEmit filtered to these files shows 0 errors
files_changed:
  - app/api/netatmo/setthermmode/__tests__/route.test.ts
  - app/api/netatmo/setroomthermpoint/__tests__/route.test.ts
  - __tests__/stoveApi.sandbox.test.ts
  - __tests__/lib/healthMonitoring.test.ts
  - __tests__/semiAutoMode.test.ts
  - __tests__/maintenanceService.concurrency.test.ts
  - __tests__/lib/coordinationPreferences.test.ts
  - __tests__/components/StoveCard.externalSync.test.tsx
  - __tests__/api/netatmo/schedules.test.ts
  - lib/stoveStateService.ts (added 'external_change' to source union)
