---
phase: 180-automations-tab-full-editor
plan: 01
subsystem: api
tags: [typescript, automations, types, discriminated-unions, phase-180]

requires:
  - phase: docs/api/automations.types.ts
    provides: "Authoritative discriminated unions for TriggerType, ConditionNode, ActionItem, AutomationRule, AutomationRuleCreate, AutomationRulePatch, AutomationExecution"

provides:
  - "types/automations.ts re-exports all discriminated unions from docs/api/automations.types.ts"
  - "assertNever helper for exhaustive switch narrowing in Phase 180 forms"
  - "Legacy /automations and /automations/[rule_id] pages patched for new type shape"
  - "automationsProxy test fixtures updated to new shape (number ids, triggered_at, trigger_source)"
  - "API route test fixtures updated to new shape"
  - "tsc clean across all automations-related files"

affects: [180-02, 180-03, 180-04, 180-05, 180-06, 180-07, 180-08, 180-09]

tech-stack:
  added: []
  patterns:
    - "Re-export pattern: types/automations.ts = thin re-export shell over docs/api/automations.types.ts"
    - "Deprecated aliases: AutomationCreate/AutomationUpdate preserved for legacy consumers"
    - "assertNever for exhaustive switch default clauses (Phase 114-116 zero-as-any discipline)"

key-files:
  created:
    - lib/utils/assertNever.ts
    - lib/utils/__tests__/assertNever.test.ts
  modified:
    - types/automations.ts
    - app/automations/page.tsx
    - app/automations/[rule_id]/page.tsx
    - __tests__/lib/automationsProxy.test.ts
    - app/api/v1/automations/route.ts
    - app/api/v1/automations/__tests__/route.test.ts
    - app/api/v1/automations/[rule_id]/__tests__/route.test.ts
    - app/api/v1/automations/[rule_id]/executions/__tests__/route.test.ts

key-decisions:
  - "AutomationRule.id is number (was string) — API truth per docs/api/automations.types.ts:219"
  - "last_triggered_at (Unix seconds) replaces last_execution_at (ISO string)"
  - "AutomationExecution gains triggered_at + trigger_source, loses started_at/duration_ms"
  - "AutomationRulePatch has NO trigger field — API design (D-12)"
  - "Legacy /automations POST body cast via as unknown as AutomationRuleCreate (T-180-01-01 accepted)"
  - "Additional consumers (API route tests, route.ts) fixed as deviation Rule 1"

patterns-established:
  - "assertNever: import from @/lib/utils/assertNever; use as default case in discriminated-union switches"
  - "Unix seconds conversion: multiply by 1000 at the React render site, not at the data layer"
  - "types/automations.ts is the single import point for all frontend consumers — never import from @/docs/api/... directly"

requirements-completed: []

duration: 11min
completed: 2026-04-30
---

# Phase 180 Plan 01: Foundation — types/automations.ts Rewrite + assertNever

**Discriminated-union rewrite of types/automations.ts (string id → number, 5-field AutomationExecution, full TriggerType/ConditionNode/ActionItem unions) plus assertNever helper and patches to 7 legacy consumers**

## Performance

- **Duration:** ~11 min
- **Started:** 2026-04-30T11:40:00Z
- **Completed:** 2026-04-30T11:51:35Z
- **Tasks:** 2
- **Files modified:** 9 (3 created, 6 updated)

## Accomplishments

- Rewrote `types/automations.ts` from a 31-LOC stub with `id: string` and `[key: string]: unknown` to a clean 33-LOC re-export file backed by the authoritative `docs/api/automations.types.ts`
- Created `lib/utils/assertNever.ts` — exhaustive switch helper (3 tests green) for Phase 180 forms
- Patched all automations-related consumers for the breaking shape changes: `id: number`, `last_triggered_at: number | null`, `AutomationExecution.triggered_at + trigger_source` (no `started_at`/`duration_ms`)
- tsc clean on all automations-related files (7 pre-existing FritzboxServiceDiscovery/network errors are out of scope)

## Task Commits

1. **Task 1: Rewrite types/automations.ts + add assertNever helper** - `ae5e7c1e` (feat + test — TDD RED/GREEN)
2. **Task 2: Patch legacy consumers + automationsProxy test fixtures** - `05025505` (fix)

## Files Created/Modified

- `types/automations.ts` — Rewritten to `export * from '@/docs/api/automations.types'` + deprecated aliases (D-05)
- `lib/utils/assertNever.ts` — Exhaustive switch helper, throws `Unhandled variant: ${JSON.stringify(x)}`
- `lib/utils/__tests__/assertNever.test.ts` — 3 tests: throws with string, throws with object, compile-time never check
- `app/automations/page.tsx` — `last_execution_at` → `last_triggered_at` (Unix * 1000); legacy POST body comment
- `app/automations/[rule_id]/page.tsx` — `started_at` → `triggered_at`, remove `duration_ms` column, add `partial_failure`/`skipped`/`condition_not_met` badge cases, `created_at * 1000`
- `__tests__/lib/automationsProxy.test.ts` — Fixtures rewritten: number ids, `triggered_at`, `trigger_source`, full `AutomationRule`/`AutomationExecution` shapes; `createAutomation` call gains `condition`/`actions`
- `app/api/v1/automations/route.ts` — Cast `result.data as unknown as AutomationRuleCreate` with legacy comment
- `app/api/v1/automations/__tests__/route.test.ts` — `mockRule` fixture updated to new shape
- `app/api/v1/automations/[rule_id]/__tests__/route.test.ts` — `mockRule` fixture updated to new shape
- `app/api/v1/automations/[rule_id]/executions/__tests__/route.test.ts` — `mockExecution` fixture updated to new shape

## Decisions Made

- Used `export *` plus named `export type` re-exports to satisfy both `isolatedModules` and editor consumers
- Deprecated aliases (`AutomationCreate`, `AutomationUpdate`) preserved with `/** @deprecated */` JSDoc — prevents immediate breaking of `automationsProxy.ts` which still types parameters as `AutomationCreate`/`AutomationUpdate`
- Third assertNever test (`return type is never compile-time`) changed from uncaught call to `expect(() => ...).toThrow()` — the plan's EXACT content would have crashed Jest at runtime since assertNever always throws; fixed as deviation Rule 1

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] assertNever test 3 crashed Jest at runtime**
- **Found during:** Task 1 (GREEN phase, assertNever test run)
- **Issue:** Plan's exact test content for `'return type is never (compile-time)'` called `assertNever('hello' as never)` without `expect().toThrow()` — the function throws at runtime regardless of `@ts-expect-error`, causing Jest to report failure
- **Fix:** Wrapped the call in `expect(() => assertNever('hello')).toThrow('Unhandled variant: "hello"')` — semantically equivalent (still verifies the function throws) and still uses `// @ts-expect-error` for the compile-time assertion
- **Files modified:** lib/utils/__tests__/assertNever.test.ts
- **Verification:** 3/3 tests pass
- **Committed in:** ae5e7c1e (Task 1)

**2. [Rule 1 - Bug] Additional consumers broken by types rewrite not listed in plan**
- **Found during:** Task 1 (tsc after rewriting types/automations.ts)
- **Issue:** Plan listed 3 legacy consumers (app/automations/page.tsx, app/automations/[rule_id]/page.tsx, __tests__/lib/automationsProxy.test.ts) but 4 more files were also broken: app/api/v1/automations/route.ts, 3 API route test files
- **Fix:** Updated all 4 additional files with correct fixture shapes and type casts
- **Files modified:** app/api/v1/automations/route.ts, app/api/v1/automations/__tests__/route.test.ts, app/api/v1/automations/[rule_id]/__tests__/route.test.ts, app/api/v1/automations/[rule_id]/executions/__tests__/route.test.ts
- **Verification:** All 29 API route tests + proxy tests green; tsc clean on automations files
- **Committed in:** 05025505 (Task 2)

---

**Total deviations:** 2 auto-fixed (2x Rule 1 - Bug)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep — all changes are automations-related files directly impacted by the types rewrite.

## Issues Encountered

- Pre-existing tsc errors in `app/debug/components/tabs/__tests__/FritzboxServiceDiscoveryTab.test.tsx` and `app/network/` (7 errors total) — out of scope; logged to deferred items. These pre-date Phase 180 and are unrelated to our changes.

## Threat Model

- T-180-01-01 (Tampering - legacy POST body cast): Accepted. Legacy admin POST body cast via `as unknown as AutomationRuleCreate` in both `app/automations/page.tsx` and `app/api/v1/automations/route.ts` — server rejects malformed bodies. Documented with code comments.
- T-180-01-02 (Information Disclosure - Unix seconds in DOM): Accepted. Same data as before, different format.
- T-180-01-03 (Tampering - assertNever error message): Mitigated. assertNever is only used in discriminated-union switches over controlled types; error reaches dev console only.

## Known Stubs

None — this plan only rewrites types and patches consumers. No UI rendering.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes introduced.

## Next Phase Readiness

- `types/automations.ts` is ready for all Phase 180 editor components to import from
- `assertNever` is callable via `import { assertNever } from '@/lib/utils/assertNever'` from any form dispatcher
- Foundation wave is complete — Plan 02 (namespace scaffold) can proceed

## Self-Check: PASSED

- lib/utils/assertNever.ts: FOUND
- lib/utils/__tests__/assertNever.test.ts: FOUND
- types/automations.ts: FOUND
- 180-01-SUMMARY.md: FOUND
- Commit ae5e7c1e: FOUND
- Commit 05025505: FOUND

---
*Phase: 180-automations-tab-full-editor*
*Completed: 2026-04-30*
