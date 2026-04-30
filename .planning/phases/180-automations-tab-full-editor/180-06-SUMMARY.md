---
phase: 180-automations-tab-full-editor
plan: "06"
subsystem: automations-actions
tags: [phase-180, actions-section, action-forms, action-row, D-09, BLOCKER-1]
dependency_graph:
  requires: [180-02, 180-03]
  provides: [ActionsSection, ActionRow, ActionForms]
  affects: [180-07]
tech_stack:
  added: []
  patterns:
    - Discriminated-union form dispatcher with exhaustive switch + assertNever
    - Conditional field rendering via command discriminator (ThermorossiForm, SonosForm, TuyaForm)
    - JSON validation with local error state + onValidationChange sentinel (HttpWebhookForm)
    - BLOCKER 1 fix: KeyedAction[] contract with stable __key across remove/reorder/in-place-edit and fresh __key on type-swap
    - Validation forwarder bridges ActionRow (isValid: boolean) to ActionsSection (actionKey, isValid)
key_files:
  created:
    - app/components/EmberGlass/automations/forms/ActionForms.tsx
    - app/components/EmberGlass/automations/ActionRow.tsx
    - app/components/EmberGlass/automations/sections/ActionsSection.tsx
    - app/components/EmberGlass/automations/__tests__/forms/ActionForms.test.tsx
    - app/components/EmberGlass/automations/__tests__/ActionRow.test.tsx
    - app/components/EmberGlass/automations/__tests__/sections/ActionsSection.test.tsx
  modified: []
decisions:
  - "D-09: 11 action type tiles in picker (NOT 9 bundle labels) — API truth wins"
  - "D-09a: All API field names verbatim (home_id, light_id, power_level, etc.)"
  - "D-09b: Unknown action types fail-open — read-only dropdown option + 'Tipo non supportato' body"
  - "BLOCKER 1: KeyedAction[] contract locked per <actions_section_contract>; updateAt mints fresh __key on type-swap only, preserves on field edits"
  - "Validation forwarder emits (a.__key, isValid) upstream — string key, not row index"
  - "TDD approach: RED test → implementation → GREEN for all 3 tasks"
metrics:
  duration: "~30 minutes"
  completed: "2026-04-30"
  tasks_completed: 3
  tasks_total: 3
  files_created: 6
  files_modified: 0
---

# Phase 180 Plan 06: ActionsSection + ActionRow + 11 ActionForms Summary

Land of the Actions tab section, 11 action form components, and the ActionRow numbered card implementing the full KeyedAction[] BLOCKER 1 contract for stable per-row validation tracking.

## What Was Built

### Source Files

| File | LOC | Purpose |
|------|-----|---------|
| `forms/ActionForms.tsx` | 675 | 11 named form components + ActionForm dispatcher |
| `ActionRow.tsx` | 180 | Numbered row card with type-select + ↑/↓/remove + form body |
| `sections/ActionsSection.tsx` | 227 | List + 11-tile picker overlay + add CTA + KeyedAction[] contract |
| **Total** | **1,082** | — |

### Test Files

| File | LOC | Tests |
|------|-----|-------|
| `__tests__/forms/ActionForms.test.tsx` | 335 | 42 cases |
| `__tests__/ActionRow.test.tsx` | 125 | 12 cases |
| `__tests__/sections/ActionsSection.test.tsx` | 292 | 13 cases |
| **Total** | **752** | **67 cases** |

## Key Features

### ActionForms.tsx — 11 form components

All 11 API action types implemented with API-verbatim field names:

| Component | API type | Conditional fields |
|-----------|----------|-------------------|
| `NetatmoSetRoomTempForm` | `netatmo_set_room_temp` | none (all 4 always shown) |
| `NetatmoSetHomeModeForm` | `netatmo_set_home_mode` | none |
| `NetatmoSwitchScheduleForm` | `netatmo_switch_schedule` | none |
| `HttpWebhookForm` | `http_webhook` | JSON validation on payload |
| `LogEventForm` | `log_event` | none |
| `HueLightForm` | `hue_light` | none (all 6 always shown) |
| `HueGroupForm` | `hue_group` | no hue/sat (4 only per D-09a) |
| `HueSceneForm` | `hue_scene` | none |
| `ThermorossiForm` | `thermorossi` | power_level only when set_power; fan_level only when set_fan; water_temp only when set_water_temp |
| `SonosForm` | `sonos` | volume only when set_volume; source only when switch_source |
| `TuyaForm` | `tuya` | on only when set_status; timer_seconds only when set_timer |

The `ActionForm` dispatcher uses an exhaustive 11-case switch with `assertNever(action)` in the `default` branch for TypeScript exhaustiveness.

### HTTP Webhook JSON Validation

`HttpWebhookForm` implements D-09a + T-180-06-02:
- Payload textarea with `useState<string>` for display value
- Valid JSON → `onChange({ payload: parsed })` + `onValidationChange(true)`
- Invalid JSON → sets local `'JSON non valido'` error + `onValidationChange(false)` (blocks save via Plan 07)
- Empty textarea → `onChange({ payload: null })` + `onValidationChange(true)`

### ActionRow — D-09b Fallback

Unknown action types (not in ACTION_TYPES) render:
- A 12th read-only select option showing `{type} (legacy)`
- Fallback body: `"Tipo non supportato — {type}"` instead of ActionForm
- No crash, no data loss (fail-open)

### ActionsSection — KeyedAction[] BLOCKER 1 Contract

The LOCKED contract per `<actions_section_contract>` in the plan:

1. **`addAction`**: calls `mintActionKey(defaultAction(id))` → appends → closes picker
2. **`updateAt`**: preserves `__key` for in-place field edits; calls `mintActionKey(next)` for type-swaps → Plan 07's pruning useEffect drops the stale validation entry
3. **`removeAt`**: `actions.filter((_, i) => i !== idx)` — every sibling's `__key` preserved verbatim
4. **`moveUp`/`moveDown`**: only positions swap, all `__key`s untouched
5. **`key={a.__key}`** in `.map` — stable across reorder (NOT `key={i}`)
6. **Validation forwarder**: `(isValid) => onValidationChange?.(a.__key, isValid)` — emits string key, not row index
7. **Never strips `__key`** — parent (Plan 07) owns `stripKeys` before API call

### Picker

- 11-tile 2-col grid using `TypeTile` primitive
- Header: "Scegli tipo azione"
- Cancel: "Annulla"
- CTA: "+ Aggiungi azione" (full-width dashed button)

## Test Coverage

### BLOCKER 1 Contract Cases (4 mandatory cases from plan)

| Case | Test | Result |
|------|------|--------|
| Remove preserves siblings' `__key`s | Removing http_webhook row 0 — log_event row 1 retains `k_log` | PASS |
| Type-swap mints fresh `__key` | Changing type from http_webhook to log_event — new key !== `k_http` | PASS |
| In-place field edit preserves `__key` | Editing log_event message — `k_log` preserved | PASS |
| Validation forwarder uses stable key | HttpWebhookForm invalid JSON → `onValidationChange('k_http', false)` | PASS |

### D-09 Lock

Picker shows EXACTLY 11 tiles — verified by test counting buttons excluding "Annulla".

## Verification Checks

| Check | Expected | Actual |
|-------|----------|--------|
| `ACTION_TYPES` in ActionsSection | ≥ 1 | 3 |
| case statements in ActionForms dispatcher | ≥ 11 | 11 |
| `assertNever(action)` in ActionForms | 1 | 1 |
| `JSON non valido` in ActionForms | 1 | 1 |
| `KeyedAction` in ActionsSection | ≥ 3 | 8 |
| `mintActionKey` in ActionsSection | ≥ 3 | 5 |
| `key={a.__key}` in ActionsSection | 1 | 3 (TypeTile + ActionRow loops) |
| `key={i}` in JSX (must be 0) | 0 | 0 (appears only in comment) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Empty textarea onValidationChange test order**
- **Found during:** Task 1 GREEN phase
- **Issue:** The test "empty textarea" fired `fireEvent.change` with `value: ''` on a component that already had `payloadStr = ''` — the React synthetic event wasn't triggered because no actual DOM state changed from jsdom's perspective.
- **Fix:** Changed test to first type valid JSON `{"a":1}`, then clear to `''` — ensures the change handler fires on a genuine value transition.
- **Files modified:** `__tests__/forms/ActionForms.test.tsx`
- **Commit:** b35cb85a

**2. [Rule 1 - Bug] Multiple elements for legacy_unknown_type in ActionRow test**
- **Found during:** Task 2 GREEN phase
- **Issue:** `getByText(/legacy_unknown_type/i)` found TWO elements — one in the select option and one in the fallback body's `<code>` tag.
- **Fix:** Changed assertion to use `screen.getByText(/Tipo non supportato/i).closest('div')` which is unambiguous.
- **Files modified:** `__tests__/ActionRow.test.tsx`
- **Commit:** f8bdc71a

## Commits

| Commit | Message |
|--------|---------|
| `b35cb85a` | feat(180-06): add ActionForms.tsx — 11 form components + ActionForm dispatcher |
| `f8bdc71a` | feat(180-06): add ActionRow.tsx — numbered card with type-select + reorder + D-09b fallback |
| `e80d737c` | feat(180-06): add ActionsSection.tsx — KeyedAction[] contract + 11-tile picker + BLOCKER 1 invariants |

## Known Stubs

None. All 11 action form components render real fields with `onChange` wired. No placeholder text or hardcoded empty data flows to UI rendering.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. All security-relevant surfaces were in the plan's threat model:

| Threat | File | Status |
|--------|------|--------|
| T-180-06-02: JSON.parse on user input | `forms/ActionForms.tsx` HttpWebhookForm | Mitigated via try/catch |
| T-180-06-04: Stale conditional fields on command switch | `forms/ActionForms.tsx` | Mitigated via command reset in setCommand |
| T-180-06-05: Boolean `on` field via SegmentedControl | `forms/ActionForms.tsx` | Mitigated via strict `value === 'true'` |
| T-180-06-07: Stale __key collision | `sections/ActionsSection.tsx` | Mitigated via mintActionKey on type-swap |

## Self-Check: PASSED

Files exist:
- `app/components/EmberGlass/automations/forms/ActionForms.tsx` — FOUND
- `app/components/EmberGlass/automations/ActionRow.tsx` — FOUND
- `app/components/EmberGlass/automations/sections/ActionsSection.tsx` — FOUND
- `app/components/EmberGlass/automations/__tests__/forms/ActionForms.test.tsx` — FOUND
- `app/components/EmberGlass/automations/__tests__/ActionRow.test.tsx` — FOUND
- `app/components/EmberGlass/automations/__tests__/sections/ActionsSection.test.tsx` — FOUND

Commits exist:
- b35cb85a — FOUND
- f8bdc71a — FOUND
- e80d737c — FOUND

Tests: 67 passing, 0 failing.
