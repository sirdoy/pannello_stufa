# Phase 180: Automations Tab Full Editor - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-29
**Phase:** 180-automations-tab-full-editor
**Areas discussed:** namespace+layout, trigger model alignment, action catalog mapping, condition root normalization, edit-mode PATCH limitation, save semantics, unsaved-changes guard, delete affordance, types/automations.ts rewrite, route mount, last-run formatting, test coverage
**Mode:** `--auto --chain` (Claude picked recommended defaults; no interactive prompts)

---

## Trigger Model Alignment

| Option | Description | Selected |
|--------|-------------|----------|
| Ship 5 trigger types per REQUIREMENTS.md AUTO-03 | Frontend invents `sensor_state_change` / `sensor_threshold` / `netatmo_temperature_threshold` triggers; saving them produces 422 from backend | |
| Ship 2 trigger types per live API (`schedule_cron`, `manual_api_call`); 3 sensor concepts surface as condition leaves | API-truth wins; v20.0 backend is locked; bundle's "extras" map to `manual_api_call` + sensor leaf in Conditions root | ✓ |
| Block phase until backend extends trigger union | Out of milestone scope | |

**Selected:** Option 2 — D-08.
**Notes:** Plan agent emits explicit SC-#3 wording adjustment in PLAN.md for user confirmation per D-08c.

---

## Action Catalog Mapping

| Option | Description | Selected |
|--------|-------------|----------|
| Ship 9 generic action types per REQUIREMENTS.md AUTO-05 (`stove_command`, `lights_command`, `plug_command`, `sonos_command`) | Frontend would 422 on save; bundle naming doesn't match API surface | |
| Ship 11 API action types (3 hue + thermorossi + tuya + sonos + 3 netatmo + webhook + log_event); bundle's 9 labels translate via mapping table | API-truth wins; lossless mapping; user picks `hue_light` vs `hue_group` vs `hue_scene` explicitly | ✓ |
| Ship a single generic "JSON action" textarea | Loses UX; bundle has type-specific forms | |

**Selected:** Option 2 — D-09 + D-09a.
**Notes:** SC-#5 wording adjusted in PLAN.md per `<spec_lock>`.

---

## Route Mount

| Option | Description | Selected |
|--------|-------------|----------|
| Replace `/automations` route with new editor; delete legacy CRUD page | Scope creep into legacy admin page; risks regression | |
| Mount new editor at `/automazioni` (Italian); leave `/automations` untouched | Symmetric with Phase 179 D-04 (`/stanze` vs `/rooms`); zero regression risk; Phase 181 NAV-02 wires `/automazioni` | ✓ |
| Mount at `/automations/v2` | Awkward URL; clashes with NAV-02 italian convention | |

**Selected:** Option 2 — D-06.

---

## Condition Root Normalization

| Option | Description | Selected |
|--------|-------------|----------|
| Force root to always be AND group (wrap leaves on save) | Simpler editor, but emits redundant `{type:'and', conditions:[leaf]}` for single-leaf rules | |
| Mapper round-trip: bare leaf ↔ wrapped AND group with single child; empty → `always_true` | Editor stays simple (always-AND UI); API stays clean (no redundant wrappers); deterministic round-trip | ✓ |
| Expose AND/OR/leaf at root in UI | Triples UI complexity; bundle doesn't support this | |

**Selected:** Option 2 — D-10.
**Notes:** Highest correctness gate in the phase; D-26 mandates round-trip Jest fixtures for every condition shape.

---

## PATCH Trigger Limitation

| Option | Description | Selected |
|--------|-------------|----------|
| Hidden trigger field in edit mode (no UI) | Confusing — user can't see what trigger fires the rule | |
| Read-only trigger field in edit mode + inline note "Per cambiare il trigger, elimina e ricrea l'automazione" | API truth surfaced explicitly; user understands the constraint; reuses bundle's tile picker (just disabled) | ✓ |
| Auto-flow delete+recreate when trigger changes | Loses execution history; surprising side effect | |

**Selected:** Option 2 — D-12.

---

## Save Semantics

| Option | Description | Selected |
|--------|-------------|----------|
| POST full body on every save (create + edit) | Server fights with PATCH-only `trigger` rule | |
| Create → POST full body; Edit → PATCH delta only (`trigger` excluded); Delete → DELETE; Toggle → PATCH `enabled` only | Matches API contract; minimal payload; optimistic toggle for snappy UX | ✓ |
| All-or-nothing PUT semantics | API doesn't expose PUT | |

**Selected:** Option 2 — D-13.

---

## Unsaved-Changes Guard

| Option | Description | Selected |
|--------|-------------|----------|
| No guard — closing discards changes silently | Violates AUTO-07; data loss risk | |
| ConfirmationDialog on close-when-dirty ("Hai modifiche non salvate. Chiudere lo stesso?") | Reuses existing primitive; AUTO-07 explicit lock | ✓ |
| Auto-save draft to localStorage on close | Scope creep; bundle has no localStorage | |

**Selected:** Option 2 — D-15.

---

## Delete Affordance

| Option | Description | Selected |
|--------|-------------|----------|
| Trash icon on row + ConfirmationDialog | No edit context; user must remember which rule they're deleting | |
| Delete button in edit-mode footer + ConfirmationDialog ("Eliminare l'automazione '${name}'?") | AUTO-08 explicit; user is in edit context; symmetric with bundle | ✓ |
| Long-press swipe-to-delete on row | Phase 175 D-14 deferred swipe gestures across v20.0 | |

**Selected:** Option 2 — D-16.

---

## types/automations.ts Rewrite

| Option | Description | Selected |
|--------|-------------|----------|
| Keep stub types (`id: string`, missing trigger/condition/actions) and use `as any` casts in editor | Phase 114-116 zero-`as any` discipline; defeats discriminated narrowing | |
| Re-export full discriminated unions from `docs/api/automations.types.ts`; alias deprecated names | API-truth wins; full type-safety; one breaking change (`id` flips string→number) audited up-front | ✓ |
| Generate types from OpenAPI schema | Out of scope; no schema generator wired | |

**Selected:** Option 2 — D-05.
**Notes:** Plan agent audits all consumers in foundation wave (Plan 01).

---

## Last-Run Pill Formatting

| Option | Description | Selected |
|--------|-------------|----------|
| Use existing `useRelativeTime` hook on `last_triggered_at`; "mai" when null | Reuses Phase 144 hook; Italian locale already handled | ✓ |
| Use `Intl.RelativeTimeFormat` directly | Re-implements existing primitive | |
| Show absolute timestamp | Bundle uses relative; less scannable | |

**Selected:** Option 1 — D-20.

---

## Test Coverage

| Option | Description | Selected |
|--------|-------------|----------|
| Jest only (no Playwright) | AUTO-08 needs E2E confirmation of edit/delete flow | |
| Jest unit specs (one per non-trivial component / lib) + 1 Playwright spec covering create→edit→delete flow | Full coverage; reuses Phase 51/97 `collectConsoleErrors` pattern | ✓ |
| E2E only | Misses lib-level mapper round-trip correctness | |

**Selected:** Option 2 — D-26 + D-27.

---

## Capabilities API Integration (deferred)

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-populate dropdowns from `/api/v1/capabilities/*` | Better UX; significant scope; new fetch layer | |
| Hardcode catalog per bundle; capabilities API integration deferred | Matches bundle; ships in scope; tracked as v20.x phase | ✓ |

**Selected:** Option 2.
**Notes:** Surfaced in `<deferred>` for v20.x.

---

## Claude's Discretion

All gray areas resolved by `--auto` recommended-default heuristics. No areas explicitly punted to Claude (auto mode owned every choice).

## Deferred Ideas

- Backend extension to support sensor-based triggers (closes AUTO-03 wording gap properly).
- Capabilities API integration (auto-populated dropdowns).
- `POST /trigger` (manual run) + `POST /evaluate` (dry-run trace) editor affordances.
- WebSocket execution events for live "last triggered" updates.
- Visual cron builder (REQUIREMENTS.md `AUTO-FUT-01`).
- Per-action retry/timeout configuration (REQUIREMENTS.md `AUTO-FUT-02`).
- Action templates / library (REQUIREMENTS.md `AUTO-FUT-03`).
- `active_hours_start` / `active_hours_end` UI fields.
- "Re-create with new trigger" CTA in edit mode.
- Cleanup of legacy `/automations` and `/automations/[rule_id]` routes (post-Phase 181 cleanup).
