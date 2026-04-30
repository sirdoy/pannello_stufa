---
phase: 180-automations-tab-full-editor
plan: "04"
subsystem: automations-trigger-section
tags: [phase-180, sections, trigger, D-08, D-12, TDD]
dependency_graph:
  requires: [180-02, 180-03]
  provides: [TriggerSection, TriggerForms]
  affects: [180-07-AutomationEditor]
tech_stack:
  added: []
  patterns: [inline-style-var-token, TDD-RED-GREEN, discriminated-union-switch]
key_files:
  created:
    - app/components/EmberGlass/automations/forms/TriggerForms.tsx
    - app/components/EmberGlass/automations/sections/TriggerSection.tsx
    - app/components/EmberGlass/automations/__tests__/forms/TriggerForms.test.tsx
    - app/components/EmberGlass/automations/__tests__/sections/TriggerSection.test.tsx
  modified: []
decisions:
  - "D-08 API truth enforced: exactly 2 TRIGGER_TYPES tiles, 0 sensor triggers"
  - "D-12 edit-mode read-only via 3 layers: onClick absent, pointerEvents:none, aria-disabled"
  - "ManualApiCallForm renders static info copy only (no inputs), matching D-08b"
  - "TriggerForm dispatcher uses switch with no assertNever (2-branch union, runtime null fallback)"
metrics:
  duration: "~12 minutes"
  completed: "2026-04-30"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 0
requirements: [AUTO-03]
---

# Phase 180 Plan 04: TriggerSection + TriggerForms Summary

TriggerSection (2-tile grid + tone-colored config panel + D-12 edit-mode disable) and TriggerForms (ScheduleCronForm + ManualApiCallForm + TriggerForm dispatcher) implemented with full TDD (RED/GREEN) and 18 tests passing.

## What Was Built

### Source files

| File | LOC | Description |
|------|-----|-------------|
| `forms/TriggerForms.tsx` | 114 | ScheduleCronForm + ManualApiCallForm + TriggerForm dispatcher |
| `sections/TriggerSection.tsx` | 100 | 2-tile picker + config panel + D-12 read-only |

### Test files

| File | LOC | Test count |
|------|-----|-----------|
| `__tests__/forms/TriggerForms.test.tsx` | 123 | 10 assertions |
| `__tests__/sections/TriggerSection.test.tsx` | 124 | 8 assertions |

**Total: 18 tests, 18 passing.**

## Key Behaviors

### ScheduleCronForm
- `FieldLabel` "Espressione cron" + `TextInput` (mono variant) + Italian hint copy + `CronHint` 5-segment breakdown
- `onChange` fires `{ type: 'schedule_cron', cron_expression: newValue }`
- `readOnly={!isNew}` propagates to `TextInput` (D-12)

### ManualApiCallForm
- Renders only: "Questa automazione si avvia solo quando viene invocata manualmente dall'app o via API."
- No inputs, no interactive elements (D-08b)

### TriggerForm dispatcher
- `switch (trigger.type)` over the 2-member union
- TS narrows to never in default branch; runtime returns null (fail-open)

### TriggerSection
- Renders exactly 2 TypeTiles from `TRIGGER_TYPES` catalog (D-08 lock)
- Create mode (`isNew=true`): tiles interactive, onClick fires `defaultTrigger(t.id)`, same-tile click is no-op
- Edit mode (`isNew=false`): 3-layer disable — `onClick={undefined}`, `disabled={true}` → `pointerEvents:none`, `aria-disabled="true"`
- Inline note "Per cambiare il trigger, elimina e ricrea l'automazione." renders ABOVE tile grid in edit mode only (D-12)
- Config panel: tone-colored `background` + `border` via `color-mix(in oklab, ...)` from selected trigger's tone
- null trigger: no config panel rendered (defensive)

## D-12 Read-only Behavior — 3 Layers Confirmed

| Layer | Component | Implementation |
|-------|-----------|----------------|
| 1. Handler absent | TypeTile | `onClick={isNew ? handler : undefined}` — no function in DOM |
| 2. CSS pointer block | TypeTile | `disabled` prop → `pointerEvents: 'none'` |
| 3. ARIA semantic | TypeTile | `aria-disabled="true"` on `<button>` |
| 4. Input readOnly | ScheduleCronForm | `readOnly={!isNew}` on TextInput/input element |

## Italian Copy Strings — Verbatim Match

| String | Source | File |
|--------|--------|------|
| "Espressione cron" | plan `<copy_strings>` | TriggerForms.tsx |
| "0 8 * * *" | plan `<copy_strings>` | TriggerForms.tsx |
| "Formato: min ora giorno mese giorno_sett." | plan `<copy_strings>` | TriggerForms.tsx |
| "Questa automazione si avvia solo quando viene invocata manualmente dall'app o via API." | plan `<copy_strings>` + D-08b | TriggerForms.tsx |
| "Per cambiare il trigger, elimina e ricrea l'automazione." | plan `<copy_strings>` + D-12 | TriggerSection.tsx |

**No deviations from `<copy_strings>` contract.**

## D-08 Lock Verified

```
grep -c 'sensor_state_change|sensor_threshold|netatmo_temperature_threshold'
  TriggerSection.tsx: 0
  TriggerForms.tsx:   0
```

No sensor trigger types appear in either source file.

## Deviations from Plan

None — plan executed exactly as written. The TDD RED/GREEN cycle was followed for both tasks. No architectural changes required.

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED (TriggerForms) | 67bd5c81 | test(180-04): add failing tests for TriggerForms (RED) |
| GREEN (TriggerForms) | ebb01be6 | feat(180-04): implement TriggerForms |
| RED (TriggerSection) | 6a3f5914 | test(180-04): add failing tests for TriggerSection (RED) |
| GREEN (TriggerSection) | 237ff767 | feat(180-04): implement TriggerSection |

All TDD gates completed in sequence.

## Commits

| Hash | Message |
|------|---------|
| 67bd5c81 | test(180-04): add failing tests for TriggerForms (RED) |
| ebb01be6 | feat(180-04): implement TriggerForms (ScheduleCronForm + ManualApiCallForm + TriggerForm) |
| 6a3f5914 | test(180-04): add failing tests for TriggerSection (RED) |
| 237ff767 | feat(180-04): implement TriggerSection (2-tile picker + edit-mode disable + config panel) |

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. TriggerForms and TriggerSection are pure UI components with no side effects beyond `onChange` callbacks. T-180-04-01 (cron string rendering verbatim), T-180-04-02 (edit-mode tile bypass), and T-180-04-03 (2-type catalog lock) were all addressed per the plan's threat model.

## Known Stubs

None — all fields are wired to `onChange` props. No hardcoded mock data flows to UI rendering.

## Self-Check: PASSED
