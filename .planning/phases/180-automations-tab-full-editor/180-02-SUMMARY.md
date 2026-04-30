---
phase: 180-automations-tab-full-editor
plan: "02"
subsystem: automations-lib
tags: [phase-180, foundation, lib, mappers, pure-functions, tdd]
dependency_graph:
  requires: [180-01]
  provides:
    - app/components/EmberGlass/automations/types.ts
    - app/components/EmberGlass/automations/lib/automations-config.ts
    - app/components/EmberGlass/automations/lib/automations-mappers.ts
    - app/components/EmberGlass/automations/lib/countConditions.ts
    - app/components/EmberGlass/automations/lib/describeTrigger.ts
    - app/components/EmberGlass/automations/lib/with-key.ts
  affects:
    - Plans 03-09 (all editor components import from these lib files)
    - Plan 06 (ActionsSection imports KeyedAction + withKey + stripKeys from with-key.ts)
    - Plan 07 (AutomationEditor imports apiToDraft, draftToApi, computePatchDelta, stripKeys)
tech_stack:
  added: []
  patterns:
    - TDD (RED/GREEN/REFACTOR) per task
    - as const satisfies ReadonlyArray<...> for catalog type safety
    - assertNever exhaustive switch guards in all 3 factories
    - canonicalize(obj) recursive key-sort for stable JSON.stringify diff
    - UIConditionGroup always-AND root normalization (D-10)
key_files:
  created:
    - app/components/EmberGlass/automations/types.ts
    - app/components/EmberGlass/automations/lib/automations-config.ts
    - app/components/EmberGlass/automations/lib/automations-mappers.ts
    - app/components/EmberGlass/automations/lib/countConditions.ts
    - app/components/EmberGlass/automations/lib/describeTrigger.ts
    - app/components/EmberGlass/automations/lib/with-key.ts
    - app/components/EmberGlass/automations/__tests__/lib/automations-config.test.ts
    - app/components/EmberGlass/automations/__tests__/lib/automations-mappers.test.ts
    - app/components/EmberGlass/automations/__tests__/lib/countConditions.test.ts
    - app/components/EmberGlass/automations/__tests__/lib/describeTrigger.test.ts
    - app/components/EmberGlass/automations/__tests__/lib/with-key.test.ts
  modified: []
decisions:
  - "D-10 condition root normalization implemented verbatim: bare leaf → wrapped AND group, empty items → always_true, single-leaf-AND → bare leaf on draftToApi"
  - "assertNever in default branch of defaultTrigger, defaultCondition, defaultAction — 6 total calls"
  - "canonicalize() uses recursive key-sort before JSON.stringify for spurious-diff prevention (Pitfall 3)"
  - "computePatchDelta field whitelist excludes trigger — TypeScript type system prevents inclusion (Pitfall 4)"
  - "with-key.ts module counter is module-level (not per-call reset) to guarantee unique keys across module lifetime"
  - "describeTrigger has runtime fallback (returns 'Manuale') rather than assertNever for forward-compat with future trigger types"
metrics:
  duration: "~18 minutes"
  completed: "2026-04-30"
  tasks_completed: 3
  files_created: 11
  test_count: 81
---

# Phase 180 Plan 02: Pure Lib Foundation (Catalogs + Mappers + with-key) Summary

All pure-function lib files and UI-internal types for the automations tab editor are now locked. This is the highest-risk correctness surface in the phase — every downstream editor component (Plans 03-09) imports from these files.

## What Was Built

**types.ts** — UI-internal draft shapes (`UIDraft`, `UIConditionGroup`, `UIConditionLeaf`, `UIConditionNode`) + `emptyDraft()` factory. Re-exports `AutomationRule`, `TriggerType`, `ConditionNode`, `ActionItem` from `@/types/automations`.

**automations-config.ts** — Three catalogs:
- `TRIGGER_TYPES` (2 entries: schedule_cron + manual_api_call, D-08)
- `CONDITION_TYPES` (4 picker entries: time_window, device_state, temperature_range, always_true, D-18)
- `ACTION_TYPES` (11 entries in locked order per D-09 table, with correct tones including `var(--accent)` for thermorossi and `var(--text-2)` for log_event/manual_api_call)

Three factories with `assertNever` default branches: `defaultTrigger()`, `defaultCondition()`, `defaultAction()` returning API-shaped objects.

**automations-mappers.ts** — `apiToDraft()`, `draftToApi()`, `computePatchDelta()` with internal helpers: `conditionNodeToUIGroup`, `asUINode`, `asUILeaf`, `uiGroupToConditionNode`, `asApiNode`, `canonicalize`.

**countConditions.ts** — Pure recursive leaf counter (always_true=0, leaf=1, AND/OR=sum).

**describeTrigger.ts** — Returns Italian pill string for trigger (schedule_cron→"⏰ {cron}", manual_api_call→"Manuale", null→"Manuale").

**with-key.ts** — Canonical lib-foundation module: `KeyedAction` type + `withKey()` + `stripKeys()`. Plan 06 (ActionsSection) and Plan 07 (AutomationEditor) consume these exports from this path.

## Test Results

81 tests passing across 5 test suites:
- `automations-config.test.ts` — 35 tests (catalogs, tones, all factory shapes)
- `automations-mappers.test.ts` — 29 tests (C1..C11 round-trip fixtures, computePatchDelta, apiToDraft correctness)
- `countConditions.test.ts` — 6 tests (null, always_true, leaf, AND/OR, depth-2 nested)
- `describeTrigger.test.ts` — 5 tests (null, undefined, manual_api_call, 2 schedule_cron variants)
- `with-key.test.ts` — 9 tests (withKey invariants, stripKeys, round-trip)

**Key invariants locked:**
- All 11 C1..C11 condition round-trip fixtures: `draftToApi(apiToDraft(rule)).condition` deep-equals `rule.condition`
- `computePatchDelta` on identical input returns `{}`
- Object key order does not cause spurious diffs (canonicalize test passes)
- `AutomationRulePatch` has no `trigger` field (TypeScript type system + `@ts-expect-error` test)
- `withKey(action).__key` matches `^act_\d+_\d+$`, two consecutive calls produce different keys
- `stripKeys(actions.map(withKey))` deep-equals original actions (round-trip identity)

## Commits

- `802688e5` — feat(180-02): scaffold automations types.ts + automations-config catalogs + factories
- `22b0f916` — feat(180-02): land mappers + countConditions + describeTrigger + tests
- `65172814` — feat(180-02): land with-key.ts (KeyedAction + withKey + stripKeys) + jest spec
- `e446e27a` — fix(180-02): fix TS error in with-key.test.ts (use toMatchObject for union field access)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `readonly Array<...>` → `ReadonlyArray<...>` in satisfies constraint**
- **Found during:** Task 1, TypeScript check after implementation
- **Issue:** `as const satisfies readonly Array<{...}>` produced TS1354 error — TypeScript only allows `readonly` modifier on array/tuple literal types, not generic `Array<>`
- **Fix:** Changed to `ReadonlyArray<{...}>` (equivalent; supported in all TS versions)
- **Files modified:** `automations-config.ts` (3 occurrences)
- **Commit:** `802688e5`

**2. [Rule 1 - Bug] `node as Record<string, unknown>` → `node as unknown as Record<string, unknown>`**
- **Found during:** Task 2, TypeScript check after implementation
- **Issue:** TS2352 — `ConditionNode` and `Record<string, unknown>` don't overlap sufficiently for direct assertion
- **Fix:** Two-step assertion via `unknown` intermediate
- **Files modified:** `automations-mappers.ts` (1 occurrence in `asUILeaf`)
- **Commit:** `22b0f916`

**3. [Rule 1 - Bug] `keyed.message` → `toMatchObject({ message: 'hello' })` in test**
- **Found during:** Task 3, final TypeScript check
- **Issue:** TS2339 — accessing `.message` on `KeyedAction` without discriminant narrowing is invalid in strict mode
- **Fix:** Used `toMatchObject()` which doesn't require type narrowing
- **Files modified:** `with-key.test.ts` (1 occurrence)
- **Commit:** `e446e27a`

## Known Stubs

None. All lib files are fully functional pure functions with no placeholders.

## Threat Flags

None. Plan 02 is pure-function lib only (no network endpoints, no auth paths, no file access). The STRIDE mitigations in the threat model are fully implemented:
- T-180-02-01: `computePatchDelta` type-locked (no `trigger` in `AutomationRulePatch`) ✓
- T-180-02-02: C10 + C11 round-trip fixtures lock legacy sensor leaf preservation ✓
- T-180-02-05: `stripKeys` is the single chokepoint; `__key` absent from round-trip output ✓

## Self-Check: PASSED

All 11 files found. All 4 commits found. 81 tests passing. 0 TypeScript errors in new files.
