---
phase: 180-automations-tab-full-editor
plan: "07"
subsystem: automations-editor
tags: [phase-180, editor, advanced, save-guard, dirty-tracking, D-12, D-13, D-14, D-15, D-16, BLOCKER-1]
dependency-graph:
  requires: [180-02, 180-04, 180-05, 180-06]
  provides: [AutomationEditor, AdvancedSection]
  affects: [180-08-AutomationsTab]
tech-stack:
  added: []
  patterns:
    - "actionValidation Map keyed by stable __key (NOT row index) for BLOCKER 1 fix"
    - "useEffect([draft.actions]) prunes stale __key entries on row removal/reorder/type-swap"
    - "canonicalize() recurses + sorts object keys + skips __key for dirty comparison"
    - "countDraftConditions(UIConditionGroup) local helper avoids double-conversion"
    - "ConfirmationDialog default import (NOT named) per verified contract"
    - "Three-layer save guard: disabled attr + aria-disabled + handleSave first-line guard"
key-files:
  created:
    - app/components/EmberGlass/automations/sections/AdvancedSection.tsx
    - app/components/EmberGlass/automations/AutomationEditor.tsx
    - app/components/EmberGlass/automations/__tests__/sections/AdvancedSection.test.tsx
    - app/components/EmberGlass/automations/__tests__/AutomationEditor.test.tsx
  modified: []
decisions:
  - "AdvancedSection uses separate onMinIntervalChange/onMaxPerHourChange callbacks (not a single onChange(min, max)) for clarity and testability"
  - "AutomationEditor.initial is memoized with empty deps ([]) — intentional stable snapshot on mount, not re-derived from prop changes"
  - "Tab aria-label matches tab text verbatim; badge uses aria-label for screen readers"
  - "Delete confirm and unsaved-changes guard both use ConfirmationDialog default import per verified <confirmation_dialog_contract>"
  - "conditionals {activeTab === N && <Section/>} used instead of CSS display:none — React Compiler 1.0 handles memoization (Phase 71 lock)"
metrics:
  duration: "~25 minutes"
  completed: "2026-04-30"
  tasks-completed: 2
  files-created: 4
  tests-added: 38
---

# Phase 180 Plan 07: AutomationEditor + AdvancedSection Summary

**One-liner:** Full editor body (4-tab nav + dirty tracking + save guard + ConfirmationDialog wiring) with BLOCKER 1 actionValidation Map fix.

## What Was Built

### Task 1: AdvancedSection.tsx + test spec

**File:** `app/components/EmberGlass/automations/sections/AdvancedSection.tsx` (~69 LOC)

- 2 NumInput fields: `min_interval_seconds` + `max_triggers_per_hour`
- Italian copy verbatim: labels, hints "0 = nessun limite" / "0 = illimitato"
- Both fields: `min={0}`, `allowNull=false` (empty input → 0)
- `unit="sec"` on first field only
- Separate `onMinIntervalChange`/`onMaxPerHourChange` callbacks

**Test spec:** `__tests__/sections/AdvancedSection.test.tsx` — 9 test cases:
- Intro copy, labels, hints rendered verbatim
- onChange callbacks fire with correct numbers
- Empty input emits 0 (not null) since allowNull=false
- Both inputs display current values

### Task 2: AutomationEditor.tsx + comprehensive jest spec

**File:** `app/components/EmberGlass/automations/AutomationEditor.tsx` (~443 LOC)

**Architecture:**
- Props: `rule: AutomationRule | null`, `isNew: boolean`, `onSaveCreate`, `onSavePatch`, `onDelete`, `onClose`
- State: `original` (immutable mount snapshot), `draft`, `activeTab (0..3)`, `showUnsavedDialog`, `showDeleteDialog`, `actionValidation: Map<string, boolean>`
- Local helpers: `countDraftConditions(UIConditionGroup)`, `canonicalize(unknown)`

**D-12 (Trigger read-only):** `isNew` prop forwarded to TriggerSection; tiles disable themselves via TypeTile `disabled` prop.

**D-13 (PATCH delta):** Create → `onSaveCreate(draftToApi(draftForApi))`; Edit → `computePatchDelta(rule, apiBody as AutomationRule)` → `onSavePatch(rule.id, patch)`. TypeScript type system prevents `trigger` from appearing in patch.

**D-14 (Save guard):** `saveAllowed = name.trim().length >= 1 && actions.length >= 1 && !hasJsonError`. Three enforcement layers:
1. `disabled={!saveAllowed}` — native HTML attribute
2. `aria-disabled={!saveAllowed}` — semantic accessibility
3. `if (!saveAllowed) return;` — first-line handleSave guard (T-180-07-01)

**D-15 (Unsaved-changes guard):** `isDirty` via `JSON.stringify(canonicalize(baseline)) !== JSON.stringify(canonicalize(draft))`. `canonicalize()` recursively sorts object keys AND skips `__key` fields so adding+removing a row doesn't permanently mark dirty. ConfirmationDialog wired with Italian copy verbatim.

**D-16 (Delete confirm):** Edit-mode only. `[Elimina]` footer button → `showDeleteDialog=true` → ConfirmationDialog `variant="danger"` with `title=\`Eliminare l'automazione "${rule.name}"?\``.

**BLOCKER 1 fix:** `actionValidation: Map<string, boolean>` keyed by stable `__key` (NOT row index).
```ts
useEffect(() => {
  const liveKeys = new Set((draft.actions as KeyedAction[]).map((a) => a.__key));
  setActionValidation((prev) => {
    let changed = false;
    const next = new Map(prev);
    for (const k of next.keys()) {
      if (!liveKeys.has(k)) { next.delete(k); changed = true; }
    }
    return changed ? next : prev;
  });
}, [draft.actions]);
```

**ConfirmationDialog import:** `import ConfirmationDialog from '@/app/components/ui/ConfirmationDialog'` (default import — verified contract per `<confirmation_dialog_contract>` block in plan).

**withKey + stripKeys + KeyedAction:** Imported from `./lib/with-key` (canonical module created by Plan 02 lib foundation, wave 2). NOT re-created here.

**Test spec:** `__tests__/AutomationEditor.test.tsx` — 29 test cases covering:

| Test group | Cases | Requirements |
|------------|-------|--------------|
| Tab navigation | 5 | AUTO-02 |
| Tab badges | 3 | AUTO-02 |
| Save guard | 4 | AUTO-07, D-14 |
| BLOCKER 1 recovery | 2 | BLOCKER 1 |
| Footer modes | 2 | AUTO-07, AUTO-08 |
| Unsaved-changes guard | 4 | D-15 |
| Delete confirm | 3 | D-16 |
| Save dispatch | 2 | D-13 |
| Trigger read-only | 2 | D-12 |
| JSON error row | 2 | D-14 |

Section mocks expose test hooks (`hook-set-last-validation-false`, `hook-remove-last-action`, `hook-swap-last-to-log-event`) for BLOCKER 1 cases. ConfirmationDialog is NOT mocked — renders via Radix into JSDOM.

## Deviations from Plan

None — plan executed exactly as written.

The plan's `<action_validation_contract>` and `<editor_layout>` blocks were followed verbatim. All copy strings match `<copy_strings>` verbatim. ConfirmationDialog imported as default per verified contract.

One test assertion used `getAllByRole` instead of `getByRole` to handle Radix ConfirmationDialog rendering two `<h2>` elements (VisuallyHidden + visible) — this is expected behavior of the existing ConfirmationDialog component, not a deviation.

## Known Stubs

None. Both components are fully wired:
- AdvancedSection: receives live numeric values from AutomationEditor draft state
- AutomationEditor: wires all 4 section tabs, dispatches real create/patch callbacks, prunes actionValidation Map

## Threat Flags

No new security surface introduced. T-180-07-01 through T-180-07-06 from plan threat model all mitigated:
- T-180-07-01 (disabled Save bypass): three-layer guard implemented and tested
- T-180-07-02 (PATCH key-order instability): `canonicalize()` sorts keys; tested via "edit description only" dispatch test
- T-180-07-05 (delete title injection): React text-node escaping; no `dangerouslySetInnerHTML`
- T-180-07-06 (stale actionValidation BLOCKER 1): Map + pruning useEffect + 2 jest cases

## Commits

| Task | Commit | Files |
|------|--------|-------|
| Task 1: AdvancedSection | `609a5062` | AdvancedSection.tsx, AdvancedSection.test.tsx |
| Task 2: AutomationEditor | `7bd4ea08` | AutomationEditor.tsx, AutomationEditor.test.tsx |

## Self-Check: PASSED

| Item | Status |
|------|--------|
| `app/components/EmberGlass/automations/sections/AdvancedSection.tsx` | FOUND |
| `app/components/EmberGlass/automations/AutomationEditor.tsx` | FOUND |
| `app/components/EmberGlass/automations/__tests__/sections/AdvancedSection.test.tsx` | FOUND |
| `app/components/EmberGlass/automations/__tests__/AutomationEditor.test.tsx` | FOUND |
| Commit `609a5062` (AdvancedSection) | FOUND |
| Commit `7bd4ea08` (AutomationEditor) | FOUND |
| 38 tests passing | VERIFIED |
| No modifications to STATE.md or ROADMAP.md | VERIFIED |
