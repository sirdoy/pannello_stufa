---
phase: 183-v20-hygiene-cleanup
plan: 04
subsystem: testing
tags: [observability, logging, jest, console-error, automations, hooks]

# Dependency graph
requires:
  - phase: 180
    provides: useAutomationsList paginated CRUD hook (Phase 180 Plan 08 Task 1)
provides:
  - Operator-visible console.error logging on all 5 useAutomationsList catch paths (refetch, create, update, remove, toggle rollback)
  - Reusable console.error spy pattern in the test file (absorbs error-path noise)
affects: [audit follow-ups for other catch-block-silencing hooks]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Catch-block logging: console.error('[<HookName>] <op> failed:', err) as the FIRST line of each catch, before existing UX (toast/state/throw)"
    - "Test-side noise absorption: module-scope `let consoleErrorSpy: jest.SpyInstance` + jest.spyOn install in beforeEach + mockRestore in afterEach"

key-files:
  created: []
  modified:
    - app/hooks/useAutomationsList.ts
    - app/hooks/__tests__/useAutomationsList.test.ts

key-decisions:
  - "Log via console.error before existing logic (UX side-effects) so failures are operator-visible without altering toast text, error-state, throw behavior, or optimistic rollback"
  - "Single shared consoleErrorSpy in beforeEach/afterEach (vs per-test) — every test path benefits, including non-error paths that incidentally would log"
  - "Prefix '[useAutomationsList]' chosen for grep-ability and DevTools filtering"

patterns-established:
  - "Console.error spy in beforeEach + mockRestore in afterEach is the canonical Jest pattern for hooks that log on errors (cf. Phase 183 RESEARCH §Common Pitfalls Pitfall §1)"
  - "5-catch enumeration: hooks with create/update/remove/toggle CRUD typically have 4 + 1 (toggle rollback) catch paths — all must log"

requirements-completed: []

# Metrics
duration: 2min
completed: 2026-05-03
---

# Phase 183 Plan 04: useAutomationsList Catch-Block Logging Summary

**5 console.error calls added to useAutomationsList catch blocks (refetch/create/update/remove/toggle) with matching Jest spy to absorb test-path noise.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-03T16:31:02Z
- **Completed:** 2026-05-03T16:33:07Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Operator-visible logging on all 5 fetch failure paths in useAutomationsList — silent swallowing eliminated
- Test file equipped with a single shared `console.error` spy (install in beforeEach, mockRestore in afterEach), absorbing noise from existing 5 error-path tests
- All 17 useAutomationsList tests still green; UX (toast text, error state, throw behavior, optimistic rollback) entirely unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Add console.error spy to test file** — `99fe8fb9` (test)
2. **Task 2: Add console.error to all 5 catch blocks** — `8f9af358` (feat)

## Files Created/Modified
- `app/hooks/useAutomationsList.ts` — +5 lines, one `console.error('[useAutomationsList] <op> failed:', err)` as first line of each of the 5 catch blocks (refetch line 86, create line 111, update line 135, remove line 157, toggle rollback line 184)
- `app/hooks/__tests__/useAutomationsList.test.ts` — +7 lines: module-scope `let consoleErrorSpy: jest.SpyInstance`, `jest.spyOn(console, 'error').mockImplementation(() => {})` in beforeEach, `consoleErrorSpy.mockRestore()` in afterEach

## Decisions Made
- TDD ordering honoured: spy landed in Task 1 (test commit) BEFORE the impl change in Task 2 (feat commit), per CLAUDE.md Rule 5 and the plan's explicit "Wave 0 prep" note
- Spy installed at module scope (not inside the inner `describe`) because the existing `beforeEach`/`afterEach` are themselves at module scope — keeping the spy aligned with that structure was simpler and lower-risk than restructuring scope
- Verification used scoped `npm test -- app/hooks/__tests__/useAutomationsList.test.ts` per CLAUDE.md Rule 8 (no bare `npm test`)

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
None.

## Verification Evidence
- `grep -nE "console\.error.*\[useAutomationsList\]" app/hooks/useAutomationsList.ts` returns 5 matches at lines 86, 111, 135, 157, 184 — one each for refetch/create/update/remove/toggle prefixes
- `grep -n "spyOn\|mockRestore\|consoleErrorSpy" app/hooks/__tests__/useAutomationsList.test.ts` returns 3 lines (declaration, install, restore)
- `npm test -- app/hooks/__tests__/useAutomationsList.test.ts` → 17/17 tests pass, no console.error output flooding Jest stdout
- `git diff --stat` for the impl file: `1 file changed, 5 insertions(+)` — purely additive, no existing line touched

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness
- Phase 183 success criterion #4 (operator-visible logging on useAutomationsList fetch failures) satisfied
- Pattern (catch-block console.error + Jest spy) is reusable for any future hook that audit may flag with the same anti-pattern
- Plan 183-05 unblocked

## Self-Check: PASSED

**Files verified:**
- FOUND: app/hooks/useAutomationsList.ts (+5 console.error lines)
- FOUND: app/hooks/__tests__/useAutomationsList.test.ts (spy declaration + install + mockRestore)
- FOUND: .planning/phases/183-v20-hygiene-cleanup/183-04-SUMMARY.md (this file)

**Commits verified:**
- FOUND: 99fe8fb9 (Task 1 — test: add console.error spy)
- FOUND: 8f9af358 (Task 2 — feat: log catch-block errors)

---
*Phase: 183-v20-hygiene-cleanup*
*Completed: 2026-05-03*
