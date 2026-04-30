---
phase: 180-automations-tab-full-editor
plan: "05"
subsystem: automations-conditions-editor
tags: [phase-180, conditions, recursive, D-10, D-11, D-09b, tdd]
dependency_graph:
  requires: [180-02, 180-03]
  provides: [ConditionsSection, ConditionGroup, ConditionItem, ConditionForms]
  affects: [AutomationEditor-conditionsTab]
tech_stack:
  added: []
  patterns:
    - recursive-component-with-depth-guard
    - D-09b-fail-open-legacy-types
    - API-field-name-correction (start_time/end_time/sensor_id/min_temp/max_temp)
    - TDD-red-green per task
key_files:
  created:
    - app/components/EmberGlass/automations/forms/ConditionForms.tsx
    - app/components/EmberGlass/automations/ConditionItem.tsx
    - app/components/EmberGlass/automations/ConditionGroup.tsx
    - app/components/EmberGlass/automations/sections/ConditionsSection.tsx
    - app/components/EmberGlass/automations/__tests__/forms/ConditionForms.test.tsx
    - app/components/EmberGlass/automations/__tests__/ConditionItem.test.tsx
    - app/components/EmberGlass/automations/__tests__/ConditionGroup.test.tsx
    - app/components/EmberGlass/automations/__tests__/sections/ConditionsSection.test.tsx
  modified: []
decisions:
  - "API field names used verbatim: start_time/end_time (not start/end), sensor_id (not sensor), min_temp/max_temp (not min/max)"
  - "ConditionForm dispatcher uses switch with inline default fallback (no assertNever — ConditionNode has extensible default branch for legacy types)"
  - "D-11 depth cap: + Gruppo button is structurally ABSENT (not just disabled) at depth >= 2"
  - "D-09b conditions parallel: legacy sensor types (sensor_state_change, sensor_threshold, netatmo_temperature_threshold) render Tipo non supportato fallback in ConditionForm"
  - "ConditionItem type-switch calls defaultCondition(newType) — complete wipe of old fields (T-180-05-02 mitigation)"
  - "ConditionGroup uses flex gap:8 sidebar pattern (not border-left padding) to match UI-SPEC component-level table"
metrics:
  duration: "~25 minutes"
  completed: "2026-04-30"
  tasks_completed: 3
  tasks_total: 3
  files_created: 8
  files_modified: 0
  tests_total: 60
---

# Phase 180 Plan 05: ConditionsSection + Recursive AND/OR Groups + 4 Leaf Forms Summary

**One-liner:** Recursive AND/OR condition group editor (depth-2 cap) with 4 API-field-correct leaf forms and D-09b legacy fallback, landed via TDD.

## Source Files

| File | LOC | Purpose |
|------|-----|---------|
| `forms/ConditionForms.tsx` | 169 | TimeWindowForm + DeviceStateForm + TemperatureRangeForm + AlwaysTrueForm + ConditionForm dispatcher |
| `ConditionItem.tsx` | 92 | Leaf row: type-select + ConditionForm body + remove button |
| `ConditionGroup.tsx` | 183 | Recursive AND/OR group with depth-aware sidebar + depth-2 cap |
| `sections/ConditionsSection.tsx` | 37 | Intro copy wrapper + ConditionGroup at depth 0 |

## Test Files

| File | Tests | Coverage |
|------|-------|---------|
| `__tests__/forms/ConditionForms.test.tsx` | 23 | All 4 forms + dispatcher + 3 legacy fallback cases |
| `__tests__/ConditionItem.test.tsx` | 12 | Picker types + type-switch wipe + legacy D-09b |
| `__tests__/ConditionGroup.test.tsx` | 25 | Toggle, addCondition, addGroup, D-11 cap, counter, remove, recursion |
| `__tests__/sections/ConditionsSection.test.tsx` | 6 | Intro copy + ConditionGroup integration |
| **Total** | **60** | |

## D-11 Depth-2 Cap Confirmation

Enforced structurally in `ConditionGroup.tsx`:
```tsx
const MAX_DEPTH = 2;
// ...
{depth < MAX_DEPTH && (
  <AddChip onClick={addGroup}>+ Gruppo {opShort(oppositeOp(group.op))}</AddChip>
)}
```
The `+ Gruppo` button is completely absent (not just visually disabled) at depth >= 2. Jest asserts `queryByText(/\+ Gruppo/)` is null at depth 2.

## D-09b Conditions Parallel — Legacy Fallback

`ConditionForm` dispatcher default branch renders:
```tsx
<div>
  Tipo non supportato — <code>{cond.type}</code>
</div>
```
for `sensor_state_change`, `sensor_threshold`, `netatmo_temperature_threshold`, and any future unknown types loaded from the API. No crash, no data loss. `ConditionItem` preserves legacy type as a 5th read-only dropdown option. Switching FROM a legacy type via the dropdown to any picker type calls `defaultCondition(newType)` — wipes the legacy fields (T-180-05-02 mitigation).

## API Field Name Corrections

All 4 forms use API-correct field names (not bundle's wrong names):

| Form | Bundle (wrong) | API (correct) |
|------|----------------|---------------|
| TimeWindowForm | `start`, `end` | `start_time`, `end_time` |
| DeviceStateForm | `sensor` | `sensor_id` |
| TemperatureRangeForm | `min`, `max` | `min_temp`, `max_temp` |

## Italian Copy Strings

All verbatim per UI-SPEC §Copywriting Contract:
- AND toggle: "TUTTE (E)"
- OR toggle: "ALMENO UNA (O)"
- Empty group: "vuoto"
- Item counter: "1 elemento" / "N elementi"
- Add condition: "+ Condizione"
- Add group (AND context): "+ Gruppo O"
- Add group (OR context): "+ Gruppo E"
- AlwaysTrue body: "Nessun parametro — sempre vero."
- Intro copy: "Le condizioni devono essere soddisfatte affinché le azioni vengano eseguite. Puoi combinarle con E/O e annidare gruppi."

## Deviations from Plan

None — plan executed exactly as written.

The one TDD fix applied during GREEN phase: test for `getAllByRole('textbox')` on `type="time"` inputs fails in jsdom (time inputs are not role=textbox). Fixed the test assertion to use `getByLabelText` instead (the aria-label assertions that follow were already correct). This is a test correctness fix, not a source deviation.

## Known Stubs

None — all 4 forms write to real API field names and are wired to `onChange` callbacks. The dispatcher covers all ConditionNode types. No placeholder values flow to rendering.

## Threat Surface Scan

No new network endpoints, auth paths, or trust-boundary surfaces introduced. All components are pure render functions receiving typed props. No `dangerouslySetInnerHTML`. React text-node escaping handles sensor_id content (T-180-05-04: accepted).

## Self-Check: PASSED
