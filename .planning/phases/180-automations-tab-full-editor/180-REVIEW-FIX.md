---
phase: 180-automations-tab-full-editor
fixed_at: 2026-05-02T00:00:00Z
review_path: .planning/phases/180-automations-tab-full-editor/180-REVIEW.md
iteration: 2
findings_in_scope: 11
fixed: 11
skipped: 0
status: all_fixed
---

# Phase 180 Re-Review: Code Review Fix Report

**Fixed at:** 2026-05-02
**Source review:** .planning/phases/180-automations-tab-full-editor/180-REVIEW.md
**Iteration:** 2

**Summary:**
- Findings in scope: 11 (4 blockers + 7 warnings)
- Fixed: 11
- Skipped: 0

All blockers and warnings from the iteration-2 re-review were fixed. WR-04
(documentation invariant) was bundled into the BL-04 commit because the
two findings address the same root cause (mount-once initializers without
parent keying).

## Fixed Issues

### BL-01: Client hook calls server-only HA proxy — runtime crash in browser

**Files modified:** `app/hooks/useAutomationsList.ts`, `app/hooks/__tests__/useAutomationsList.test.ts`
**Commit:** 595eb299
**Applied fix:** Rewrote every CRUD method to go through `/api/v1/automations*` via
`fetch`, matching the legacy hook and every other client hook in the codebase.
Test suite migrated from `jest.mock(automationsProxy)` to a per-method `fetch`
handler router that records every call into a `fetchCalls` array. Failure-path
tests refactored to capture rejections inside `act()` rather than chaining
`.rejects.toThrow` on the act promise (the matcher resolves before the hook's
catch-block side effects are observable to the assertion). All 17 tests pass.

### BL-02: POST `/api/v1/automations` Zod schema silently strips trigger/condition/actions

**Files modified:** `app/api/v1/automations/route.ts`, `app/api/v1/automations/__tests__/route.test.ts`
**Commit:** 7742f654
**Applied fix:** Widened `automationCreateSchema` to validate the full Phase 180
editor body (trigger, condition, actions, min_interval_seconds, max_triggers_per_hour,
active_hours_start, active_hours_end). Used `.passthrough()` so future API additions
flow without a schema bump. Authoritative discriminated-union validation lives on
the HA backend; the route only enforces shape (object/array/int bounds) plus a
non-empty trimmed name. Test added: full editor body reaches the proxy unchanged.

### BL-03: PATCH `/api/v1/automations/[rule_id]` accepts unvalidated body

**Files modified:** `app/api/v1/automations/[rule_id]/route.ts`, `app/api/v1/automations/[rule_id]/__tests__/route.test.ts`
**Commit:** 8d557445
**Applied fix:** Added `automationPatchSchema` mirroring `AutomationRulePatch` shape
with `.strict()` so the no-trigger invariant (D-12 — triggers are immutable
post-creation) is enforced at the API boundary. A hand-crafted request including
`trigger` or any unknown key now 400s before reaching the proxy. Three tests added:
trigger field rejected, unknown key rejected, full valid patch accepted and
forwarded unchanged.

### BL-04 + WR-04: AutomationEditor `useMemo` with empty deps captures only the FIRST rule prop

**Files modified:** `app/components/EmberGlass/automations/AutomationsTab.tsx`, `app/components/EmberGlass/automations/AutomationEditor.tsx`
**Commit:** e878ded3
**Applied fix:** Parent now sets `key={editingRule === 'new' ? 'new' : editingRule.id}`
on `<AutomationEditor>` so React unmounts and remounts the editor for every new
rule. The mount-once `useMemo` and two `useState` initializers now correctly
re-evaluate on each rule. Documented the invariant in a JSDoc comment block
above the initializers so a future refactor that drops the parent `key=` cannot
silently re-introduce the latch (this addresses WR-04's documentation request
in the same change).

### WR-01: `countDraftConditions` counts `always_true` as 1 — disagrees with API-side `countConditions`

**Files modified:** `app/components/EmberGlass/automations/AutomationEditor.tsx`
**Commit:** 444e10d8
**Applied fix:** Mirrored `countConditions`' `always_true => 0` rule in
`countDraftConditions`. Tab badge and AutomationRow pill now agree on the same
condition tree.

### WR-02: `computePatchDelta` produces spurious `description` patch when API returns `undefined`

**Files modified:** `app/components/EmberGlass/automations/lib/automations-mappers.ts`, `app/components/EmberGlass/automations/__tests__/lib/automations-mappers.test.ts`
**Commit:** 53d6b431
**Applied fix:** Coerce `undefined` to `null` on both sides before canonicalize-then-stringify
so `JSON.stringify(undefined) !== JSON.stringify(null)` (`undefined !== "null"`)
no longer fires for nullable+optional fields the API serializer omits. Three
tests added covering description, active_hours_start, active_hours_end.

### WR-03: `ConditionGroup` uses array index as React key

**Files modified:** `app/components/EmberGlass/automations/types.ts`, `app/components/EmberGlass/automations/lib/condition-keys.ts` (new), `app/components/EmberGlass/automations/lib/automations-mappers.ts`, `app/components/EmberGlass/automations/ConditionGroup.tsx`, `app/components/EmberGlass/automations/__tests__/lib/automations-mappers.test.ts`, `app/components/EmberGlass/automations/__tests__/ConditionGroup.test.tsx`, `app/api/v1/automations/[rule_id]/route.ts`
**Commit:** c43b8030
**Applied fix:** Mirrored the action-row `__key` pattern for conditions:
- `lib/condition-keys.ts` (new): `mintConditionKey()` + `withConditionKeys()` recursive seeder
- `types.ts`: `__key?: string` added to `UIConditionLeaf` and `UIConditionGroup`
- `apiToDraft`: seeds keys via `withConditionKeys()`
- `ConditionGroup` `addCondition`/`addGroup`: mints fresh `__key` on insert
- `ConditionGroup` `updateItem`: preserves existing `__key` on update
- `uiGroupToConditionNode`/`asApiNode`: new `stripUIFields` helper drops `kind` + `__key` before serialization
- mapper `canonicalize`: skips `__key` so dirty comparison ignores it
- PATCH route cast widened so the new schema's `unknown`-typed `condition` flows through TS

Round-trip tests (29 mapper + 19 ConditionGroup, all passing) verify the strip-on-serialize path. Two new tests cover the mint paths.

### WR-04: `apiToDraft` `useMemo` in editor — bundled into BL-04 fix

**Files modified:** see BL-04
**Commit:** e878ded3
**Applied fix:** Documented the parent-must-key invariant in a JSDoc above
the `useMemo` + `useState` initializers in AutomationEditor. The keying
itself was applied in AutomationsTab as part of BL-04, so this finding's
documentation request landed in the same commit.

### WR-05: `mockAutomationsApi.opts.rules` typed as `object[]`

**Files modified:** `tests/smoke/automations-tab.spec.ts`
**Commit:** e950f9fd
**Applied fix:** Imported `AutomationRule` type and changed `opts.rules?: object[]`
to `opts.rules?: Partial<AutomationRule>[]`. Future fixture overrides that drop
required fields will now be a TypeScript error at edit time.

### WR-06: Smoke spec helper `dismissVersionEnforcerIfPresent` race window

**Files modified:** `tests/smoke/automations-tab.spec.ts`
**Commit:** d3c2be01
**Applied fix:** Widened the helper from a single-shot 500ms `isVisible()` check
to a 4-attempt poll mirroring the `dismissWhatsNewModalIfPresent` structure
(750ms × 4 = ~3s window). Each iteration: detect overlay, click dismiss or press
Escape, wait for hidden, retry if still visible. Closes the race where
VersionEnforcer's Firebase-backed checkVersion mounts the overlay AFTER the
single-shot check on slow CI runners.

### WR-07: `AutomationsPage` (legacy) `handleDelete` does not toggle `submitting` state

**Files modified:** `app/automations/page.tsx`
**Commit:** ad3ee99c
**Applied fix:** Added `setSubmitting(true)` on entry and `setSubmitting(false)`
in a `finally` block, matching the create/update pattern. Prevents parallel
DELETEs racing the refetch when ConfirmationDialog auto-closes too quickly.

---

_Fixed: 2026-05-02_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 2_
