---
phase: 94-component-hook-test-fixes
plan: "01"
subsystem: components-context
tags: [test-fix, stove, version-context, aria, console-log]
dependency_graph:
  requires: []
  provides: [TFIX-09, TFIX-12]
  affects: []
tech_stack:
  added: []
  patterns: [getByRole for disable assertions, operational console.log diagnostics]
key_files:
  created: []
  modified:
    - __tests__/components/devices/stove/components/StovePrimaryActions.test.tsx
    - app/context/VersionContext.tsx
decisions:
  - getByRole('button', { name: /ACCENDI/i }) traverses DOM to the <button> element — getByText resolves to the inner <span> which has no disabled attribute
  - Operational console.log calls added to checkVersion() for local-env skip and update-required diagnostics
metrics:
  duration: 77s
  completed: 2026-03-18
  tasks_completed: 2
  files_modified: 2
---

# Phase 94 Plan 01: StovePrimaryActions + VersionContext Test Fixes Summary

One-liner: Fixed ARIA role queries for button disable assertions and added missing console.log diagnostics to VersionContext.checkVersion().

## What Was Done

### Task 1: StovePrimaryActions disable-state queries (TFIX-09)

Root cause: `screen.getByText('ACCENDI')` resolved to the innermost `<span>{children}</span>` rendered by Button.tsx (structure: `<button><span><span>ACCENDI</span></span></button>`). `toBeDisabled()` on a `<span>` always fails — it is not a form control and does not inherit the `disabled` attribute from the parent button.

Fix: Replaced `screen.getByText('ACCENDI')` with `screen.getByRole('button', { name: /ACCENDI/i })` in the 3 disable-state tests only. The `getByRole` query uses ARIA accessibility tree traversal to find the actual `<button>` element regardless of internal span nesting.

The 6 passing tests that use `getByText()` for click/presence assertions were left unchanged — those assertions work correctly on `<span>` elements.

### Task 2: VersionContext console.log calls (TFIX-12)

Root cause: The `checkVersion()` function was missing two `console.log` calls that tests asserted as operational diagnostics:
1. A skip-log when `isDevelopment()` returns true
2. An update-required log when local version < Firebase version

Fix: Added exactly 2 `console.log` calls inside `checkVersion()`:
- In the `isDevelopment()` branch: `console.log('🔧 Ambiente locale: versioning enforcement disabilitato')`
- In the `comparison < 0` branch: `console.log(\`⚠️ Update richiesto: ${APP_VERSION} → ${latest.version}\`)`

## Test Results

| Suite | Before | After |
|-------|--------|-------|
| StovePrimaryActions.test.tsx | 6/9 (3 failing) | 9/9 |
| VersionContext.test.tsx | 16/20 (4 failing) | 20/20 |
| Combined | 22/29 | 29/29 |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- __tests__/components/devices/stove/components/StovePrimaryActions.test.tsx: FOUND
- app/context/VersionContext.tsx: FOUND
- commit c9a695a (TFIX-09): FOUND
- commit 540e75f (TFIX-12): FOUND
