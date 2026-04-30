---
phase: 180-automations-tab-full-editor
plan: "08"
subsystem: automations-tab
tags: [phase-180, hook, row-component, orchestrator, route, barrel, D-13, D-17, D-20, D-23, D-25]
dependency_graph:
  requires:
    - 180-07 (AutomationEditor body + AdvancedSection)
    - 180-01..06 (primitives, lib, sections, forms)
  provides:
    - useAutomationsList hook (paginated CRUD + optimistic toggle)
    - AutomationRow (glass row with 4 status pills + InlineToggle stop-propagation)
    - AutomationsTab (orchestrator: list + Sheet + editor integration)
    - /automazioni Next.js route
    - automations namespace barrel (50+ public symbols)
    - EmberGlass top-level barrel updated with automations
  affects:
    - app/components/EmberGlass/index.ts (appended export * from ./automations)
    - Phase 181 (nav bar will reference /automazioni route)
tech_stack:
  patterns:
    - fetch-on-mount: useEffect + useCallback refetch (D-25 no polling)
    - optimistic-toggle: setRules optimistic flip + rollback on catch
    - TDD: RED (test fails) → GREEN (implementation) per all 3 tasks
    - double-stop-propagation: Pattern A (wrapper div + onChange) per D-17 contract
key_files:
  created:
    - app/hooks/useAutomationsList.ts (163 LOC)
    - app/components/EmberGlass/automations/AutomationRow.tsx (170 LOC)
    - app/components/EmberGlass/automations/AutomationsTab.tsx (173 LOC)
    - app/automazioni/page.tsx (24 LOC)
    - app/components/EmberGlass/automations/index.ts (107 LOC)
    - app/hooks/__tests__/useAutomationsList.test.ts (350 LOC)
    - app/components/EmberGlass/automations/__tests__/AutomationRow.test.tsx (305 LOC)
    - app/components/EmberGlass/automations/__tests__/AutomationsTab.test.tsx (319 LOC)
  modified:
    - app/components/EmberGlass/index.ts (appended export * from './automations')
decisions:
  - "Used mockResolvedValue (not Once) in hook tests to handle React StrictMode double-invocation"
  - "D-25 compliance verified by timer-advance test: getAutomations not called by setInterval"
  - "AutomationRow barrel collision check confirmed: no shared names with rooms/ or sheets/"
  - "Pattern A (double stop-propagation) chosen for InlineToggle in AutomationRow per inline_toggle_contract"
metrics:
  duration: "~40 minutes"
  completed: "2026-04-30"
  tasks_completed: 3
  tasks_total: 3
  files_created: 8
  files_modified: 1
  tests_added: 46
---

# Phase 180 Plan 08: Data Hook + Row + Tab Orchestrator + Route + Barrels Summary

**One-liner:** Paginated CRUD hook with optimistic toggle rollback, glass AutomationRow with 4 status pills + InlineToggle stop-propagation (D-17), AutomationsTab orchestrator wired to Sheet+editor, /automazioni route, and full automations namespace barrel.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | useAutomationsList hook + 16-test spec | f6af92e3 | useAutomationsList.ts, useAutomationsList.test.ts |
| 2 | AutomationRow + 18-test spec | bf7b5311 | AutomationRow.tsx, AutomationRow.test.tsx |
| 3 | AutomationsTab + barrel + route + 12-test spec | 15c88945 | AutomationsTab.tsx, index.ts, page.tsx, EmberGlass/index.ts, AutomationsTab.test.tsx |

## Source Files

| File | LOC | Purpose |
|------|-----|---------|
| `app/hooks/useAutomationsList.ts` | 163 | Paginated CRUD hook + optimistic toggle |
| `app/components/EmberGlass/automations/AutomationRow.tsx` | 170 | Glass row: icon + name + InlineToggle + 4 status pills |
| `app/components/EmberGlass/automations/AutomationsTab.tsx` | 173 | Orchestrator: page chrome + list + Sheet + editor wiring |
| `app/automazioni/page.tsx` | 24 | Next.js /automazioni route |
| `app/components/EmberGlass/automations/index.ts` | 107 | Namespace barrel (50+ public symbols) |

## Test Files

| File | Tests | Key Coverage |
|------|-------|-------------|
| `useAutomationsList.test.ts` | 16 | Initial fetch, pagination, CRUD ops, optimistic toggle, rollback, D-25 no-polling |
| `AutomationRow.test.tsx` | 18 | Name/desc, 4 pills, Italian pluralization, "mai" fallback, stop-propagation invariant |
| `AutomationsTab.test.tsx` | 12 | List render, Nuova button, sheet open/close, CRUD callbacks, empty state, counter |
| **Total** | **46** | All critical paths covered |

## Verification Checks

- [x] `grep -c "export \* from './automations'" app/components/EmberGlass/index.ts` = 1
- [x] `ls app/automazioni/page.tsx` — file exists
- [x] `grep -c "AutomationsTab" app/components/EmberGlass/automations/index.ts` = 1
- [x] `grep -c "import { InlineToggle } from '../InlineToggle'"` = 1 (named import per contract)
- [x] `grep -c "e.stopPropagation"` = 3 (wrapper div + onChange + keyboard handler)
- [x] Hook test asserts no timer-based polling (D-25)
- [x] Row test asserts toggle click does NOT fire onOpen (real InlineToggle, not mocked)
- [x] No barrel name collisions between automations/ and rooms/ or sheets/

## InlineToggle Contract Compliance

InlineToggle imported as named export from `'../InlineToggle'` (verified against component source).

Pattern A (double stop-propagation) applied in AutomationRow:
1. Wrapper `<div onClick={(e) => e.stopPropagation()}>` — stops mouse bubbling before onChange
2. `onChange={(e) => { e.stopPropagation(); void onToggle(...); }}` — stops propagation in event handler

Test `'toggle click does NOT fire onOpen'` uses real InlineToggle (not mocked), queries via `data-testid="inline-toggle"`, and asserts `onOpen` called 0 times + `onToggle` called 1 time.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] StrictMode double-invocation caused mock mismatch in hook tests**
- **Found during:** Task 1 GREEN phase
- **Issue:** `mockResolvedValueOnce` consumed by React StrictMode's first effect invocation; second invocation returned default empty response, causing `rules` assertion to fail
- **Fix:** Changed initial fetch test to `mockResolvedValue` (persistent) so both StrictMode invocations return the correct data
- **Files modified:** `useAutomationsList.test.ts`

**2. [Rule 1 - Bug] Multiple elements matched `getByText('Nuova')` in AutomationsTab tests**
- **Found during:** Task 3 GREEN phase
- **Issue:** "Nuova" text appears in both the button and the empty state prose ("Tocca **Nuova** per crearne una")
- **Fix:** Changed button queries to `getByLabelText('Nuova automazione')` (aria-label); empty state test uses `getAllByText(/Nuova/).length >= 1`
- **Files modified:** `AutomationsTab.test.tsx`

**3. [Rule 1 - Bug] D-25 timer test: fake timers + real promise interaction was fragile**
- **Found during:** Task 1, D-25 test refinement
- **Issue:** Original test used `waitFor` to check `toHaveBeenCalledTimes(1)` but StrictMode made call count 2
- **Fix:** Rewrote test to capture call count after mount, advance timers 60s, then assert count unchanged (no timer-based polling added)
- **Files modified:** `useAutomationsList.test.ts`

## Barrel Name Collision Check (T-180-08-06)

Grep against `app/components/EmberGlass/rooms/` and `app/components/EmberGlass/sheets/` for names in the automations barrel:
- `TextInput`, `NumInput`, `SegmentedControl`, `Pill`, `FieldLabel`, `AddChip`, `IconBtn`, `CronHint`, `TypeTile`, `TwoCol`, `ActionRow`, `ConditionGroup` — **0 conflicts found**

Used direct named exports (not `export * as Automations`) — no aliasing needed.

## Known Stubs

None — all data flows through the live `automationsProxy` and real hook state. No hardcoded empty values or placeholder text in production code paths.

## Threat Flags

No new security surface beyond what was documented in the Plan 08 threat model. The `/automazioni` route is protected by Auth0 via `app/layout.tsx ClientProviders` (same pattern as `/stanze`). All mutations flow through `automationsProxy` with X-API-Key transport.

## Self-Check: PASSED

- `app/hooks/useAutomationsList.ts` — FOUND
- `app/components/EmberGlass/automations/AutomationRow.tsx` — FOUND
- `app/components/EmberGlass/automations/AutomationsTab.tsx` — FOUND
- `app/automazioni/page.tsx` — FOUND
- `app/components/EmberGlass/automations/index.ts` — FOUND
- Commits f6af92e3, bf7b5311, 15c88945 — FOUND in git log
- 46 tests passing across 3 test suites
