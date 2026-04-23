---
status: investigating
trigger: "Fix all TypeScript build errors in integration/feature test files (__tests__/ top-level directory) and app-level test files."
created: 2026-02-08T10:00:00Z
updated: 2026-02-08T10:00:00Z
---

## Current Focus

hypothesis: Use pragmatic `as any` pattern for jest mock functions in test files to bypass TypeScript's strict checking
test: Create automated script to add `: any` type annotations to mock imports
expecting: Clean build with 0 tsc errors
next_action: Create script to fix all mock imports systematically

## Symptoms

expected: npx tsc --noEmit should pass with 0 errors for these files
actual: ~380 TypeScript errors in integration/feature test files
errors: TS2339 (mock typing), TS2345 (argument mismatches), TS2554 (wrong arg count)
reproduction: Run `npx tsc --noEmit 2>&1 | grep "error TS" | grep "^__tests__/\|app.*\.test\.\|app.*__tests__"`
started: After TypeScript migration (Phase 42)

## Eliminated

## Evidence

- timestamp: 2026-02-08T10:05:00Z
  checked: Top 5 error files (netatmoStoveSync, coordinationOrchestrator, netatmoApi, setthermmode, stoveApi.sandbox)
  found: Common patterns confirmed - (fn as jest.Mock) missing on mocked functions, adminDbGet/adminDbUpdate/etc need mock assertions
  implication: Fix pattern is consistent: add mock type assertions throughout test files

## Resolution

root_cause: Mocked imports don't have Jest mock types - TypeScript doesn't know they have `.mockResolvedValue` etc. Need to use `jest.mocked()` helper or cast as `jest.Mock<T>`
fix: Wrap mocked imports with jest.mocked() helper or add explicit jest.Mock types
verification: npx tsc --noEmit should show 0 errors in test files
files_changed: []
