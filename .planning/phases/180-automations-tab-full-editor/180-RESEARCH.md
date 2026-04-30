# Phase 180: Automations Tab Full Editor — Research

**Researched:** 2026-04-30
**Domain:** Next.js 15.5 PWA — UI rebuild of the automations admin surface using authoritative discriminated-union API types, the Phase 175 `<Sheet>` primitive, and inline-style + `var(--token)` discipline. No backend changes.
**Confidence:** HIGH

---

## Summary

Phase 180 ships a glass list + full-editor UX for the Automation Engine v3.0 REST surface, mounted at the new `/automazioni` route, leaving legacy `/automations` admin CRUD pages untouched. The CONTEXT file is exhaustive (~50KB) — most "what to build" decisions are already locked. This research focuses on **execution risk** and **planning gates**: confirming the authoritative type surface, mapping every bundle component to its target file, enumerating mapper round-trip edge cases, auditing the 3 existing consumers of `types/automations.ts`, verifying the Phase 175 `<Sheet>` API matches editor needs, and producing a Validation Architecture block the orchestrator can consume.

Key findings:
- **API truth is exact and frozen** [VERIFIED: docs/api/automations.types.ts]. Two trigger types, four condition leaves + AND/OR composites, eleven action types, AutomationRule.id is `number`, AutomationRulePatch has no `trigger` field by design.
- **Bundle is 934 LOC**, all inline-style, all in one file. Maps cleanly to the planned 17-file `automations/` namespace plus `lib/`, `forms/`, `sections/`, `primitives/` sub-folders.
- **Three** existing consumers of `@/types/automations` — all in legacy `/automations` and the proxy. D-05 type rewrite breaks `id: string → number` for all of them; mechanical fixes documented per file.
- **Phase 175 `<Sheet>`** verified at `app/components/EmberGlass/Sheet.tsx`; props match (`open`, `onClose`, `title?`); `forceMount` is already set; `aria-describedby={undefined}` already suppresses the warning. Z-index 200/201 is reserved.
- **Phase 179 `tests/smoke/rooms-tab.spec.ts`** is the canonical Playwright pattern — 412 LOC with `collectConsoleErrors`, `dismissVersionEnforcerIfPresent`, `dismissWhatsNewModalIfPresent`, `primeDashboardForSheetTest`. Phase 180 spec lives at `tests/smoke/automations-tab.spec.ts` (NOT `tests/playwright/`).
- **Mapper round-trip surface** has 11 condition shapes × 11 action types = the largest correctness risk; this research enumerates a fixture catalog the planner can mirror in `__tests__/lib/automations-mappers.test.ts`.

**Primary recommendation:** Wave 1 is the foundation gate — types rewrite (D-05) must compile clean across all three legacy consumers AND `__tests__/lib/automationsProxy.test.ts` BEFORE any editor code is scaffolded. The mapper round-trip fixture set must be the second deliverable in Wave 1 because every form component depends on its API-shaped defaults.

---

## User Constraints (from CONTEXT.md)

### Locked Decisions

> Verbatim from `<decisions>` section of `180-CONTEXT.md`. The full text is in CONTEXT.md; the abbreviated map below highlights the planning-critical ones.

- **D-01..D-04** [namespace + layout, informational]: All new automations files under `app/components/EmberGlass/automations/`. Inline-style + `var(--token)` mandatory; no Tailwind for visual values inside the namespace. Primitives **NOT shared** with Phase 178 sheets/primitives — visual scale is different (38px TextInput, 0.5px border, 9px radius).
- **D-05** [TYPE REWRITE]: Rewrite `types/automations.ts` to re-export the full discriminated unions from `@/docs/api/automations.types`. **Breaking shape change:** `AutomationRule.id` flips from `string` to `number`. Three known consumers (audit + patch in foundation wave). See "Existing-Consumer Audit" section below for file:line evidence.
- **D-06** [ROUTE]: New `/automazioni` (Italian); legacy `/automations` and `/automations/[rule_id]` stay UNTOUCHED. Mirrors Phase 179's `/stanze` pattern.
- **D-07** [SHEET INTEGRATION]: `<Sheet open onClose title>` from `@/app/components/EmberGlass/Sheet`. Title prop REQUIRED (not optional in editor — VisuallyHidden fallback only when prop unset).
- **D-08, D-08a..c** [TRIGGERS]: Ship 2 trigger types only (`schedule_cron`, `manual_api_call`); the 3 bundle "extras" (`sensor_state_change`, `sensor_threshold`, `netatmo_temperature_threshold`) become condition leaves. **Plan agent surfaces SC-#3 deviation in PLAN.md UAT.**
- **D-09, D-09a..b** [ACTIONS]: 11 API action types (not 9 bundle labels). `light_set` → `hue_light` + `hue_group` + `hue_scene`; `plug_toggle` → `tuya`. Per-action form fields match `automations.types.ts` field-for-field.
- **D-10** [CONDITION ROOT NORMALIZATION]: `apiToDraft` always wraps to AND-root group. `draftToApi` unwraps single-leaf-AND back to bare leaf; serializes empty AND as `{ type: 'always_true' }`. Recursive.
- **D-11** [DEPTH]: 2 levels max. depth-2 group hides "+ Gruppo" button.
- **D-12** [TRIGGER READ-ONLY ON EDIT]: API PATCH excludes `trigger` field. UX: tile picker visually disabled in edit mode + inline note "Per cambiare il trigger, elimina e ricrea l'automazione."
- **D-13** [SAVE DISPATCH]: POST full body on create; PATCH **only changed fields** on edit (delta vs `original` snapshot, never `trigger`); DELETE on remove; PATCH `{ enabled: !current }` on toggle (optimistic, rollback on error).
- **D-14** [SAVE GUARD]: Disabled until `name.trim().length >= 1 && actions.length >= 1`. http_webhook JSON parse failure ALSO blocks save.
- **D-15** [UNSAVED-CHANGES GUARD]: `JSON.stringify(original) !== JSON.stringify(draft)` → ConfirmationDialog on Annulla / Sheet onClose / Escape / backdrop. Reuses `app/components/ui/ConfirmationDialog`.
- **D-16** [DELETE]: Edit-mode footer `[Elimina]` (red, leftmost) + `[Annulla]` + `[Salva modifiche]`. Confirm dialog before DELETE.
- **D-17** [PAGINATION]: `pageSize: 20`, parity with legacy `/automations`.
- **D-18..D-22** [CATALOGS / FORMATTING]: Lucide icons, Italian copy, `useRelativeTime` for last-run pill, `describeTrigger` formatter, `countConditions` recursive.
- **D-23..D-25** [HOOKS]: New `useAutomationsList` hook; `automationsProxy` UNCHANGED. **No WebSocket subscription** in this phase. **No polling.**
- **D-26..D-28** [TESTS]: Jest specs per non-trivial component/lib + new Playwright spec; legacy `/automations` test suite must still pass post-rewrite.
- **D-29..D-30** [AUTH/MOBILE]: Auth wrap mirrors `app/stanze/page.tsx`. Mobile-first; Sheet handles desktop centering.
- **D-31..D-32** [PLANNER HINTS, INFORMATIONAL]: 4-wave breakdown suggested (foundation → sections parallel → orchestration → gap-closure). No Brahma multi-agent spawn.

### Claude's Discretion

> All gray areas were auto-resolved with recommended defaults in CONTEXT.md (mode=`--auto --chain`). The following minor tactical choices remain open to the planner:

- File-internal organization within `forms/ActionForms.tsx` (single 600+ LOC file vs. one file per action type). **Recommendation:** single file, named exports per form component — keeps imports terse and discriminated-union exhaustive switching in `<ActionRow>` colocated with the dispatcher.
- Whether `<ConditionGroup>` mounts its own `<AddChip>` instances inline or extracts a `<GroupFooter>` helper. **Recommendation:** inline; recursion already adds visual complexity.
- Whether to preemptively add `@media (prefers-reduced-motion: reduce)` overrides. **Recommendation:** skip — Sheet inherits Phase 175's deferred-motion default; the editor has no animation surface beyond Sheet itself.
- Whether `useAutomationsList` performs eager refetch after each mutation or returns the new entity from the response and merges in-place. **Recommendation:** eager refetch (matches D-13 phrasing "refetch list on success" and is simpler to test).

### Deferred Ideas (OUT OF SCOPE)

- Replacing/deleting legacy `/automations` and `/automations/[rule_id]` pages.
- Wiring `/automazioni` into a global navigation bar (Phase 181).
- Bundle's 3 "extra" trigger types as actual triggers (backend extension).
- Capabilities API integration (auto-populated dropdowns).
- `POST /trigger` (manual run) and `POST /evaluate` (dry-run trace) editor affordances.
- Execution history view inside the editor (covered by legacy `/automations/[rule_id]`).
- Drag-and-drop reorder (↑/↓ icon buttons only).
- WebSocket execution events.
- Visual cron builder (raw cron string only).
- Per-action retry/timeout configuration.
- Action templates / library.
- `active_hours_start` / `active_hours_end` UI fields (preserved on round-trip if loaded from API).
- Hue scene picker by-id (free-text inputs).
- Action `move-to-group` / batch reordering.
- PATCH `trigger` field (API-locked).
- "Re-create with new trigger" CTA in edit mode.
- Cleanup of legacy `/automations` routes.

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTO-01 | List shows icon + name + description + toggle + status pill (trigger / N condizioni / N azioni / lastRun). | Bundle line 172-212 (`<AutomationRow>`); `describeTrigger`/`countConditions`/`useRelativeTime` specs in this research; `automationsProxy.getAutomations` returns `PaginatedResponse<AutomationRule>` field-for-field. |
| AUTO-02 | "Nuova automazione" opens editor sheet with Name + Description + 4 inner tabs with badge counts. | Bundle line 247-322 (`<AutomationEditor>`); Phase 175 `<Sheet>` API verified at `app/components/EmberGlass/Sheet.tsx:42`; `countConditions` + `actions.length` drive badges. |
| AUTO-03 | Trigger picker supports the 5 documented types (CONTEXT-adjusted to **2 actual API trigger types**, see D-08c). | `automations.types.ts:26` defines `TriggerType = ScheduleCronTrigger \| ManualApiCallTrigger`; bundle's 3 extras are condition leaves under `ConditionNode` union (lines 32-100). |
| AUTO-04 | Conditions support nested AND/OR groups up to 2 levels deep, per-group operator toggle, colored side-bars; 4 leaf types. | Bundle line 409-559 (`<ConditionGroup>`, `<ConditionItem>`); `automations.types.ts:87-106` defines AND/OR composites + 4 phase-180 leaves (`time_window`, `device_state`, `temperature_range`, `always_true`). |
| AUTO-05 | Actions support 9 action types (CONTEXT-adjusted to **11 API action types**, see D-09). | `automations.types.ts:203-213` defines `ActionItem` union of 11; bundle's 9 labels split into 11 (light_set → hue_light/hue_group/hue_scene; plug_toggle → tuya). |
| AUTO-06 | Avanzate exposes `min_interval_seconds` + `max_triggers_per_hour`. | `automations.types.ts:227-228` defines both as required `number` on `AutomationRule`; bundle line 800-815 (`<AdvancedSection>`). |
| AUTO-07 | Save disabled until name + ≥1 action; unsaved-changes guard. | Bundle line 312-318 (save guard); D-15 (unsaved-changes guard) reuses `app/components/ui/ConfirmationDialog.tsx:1-40`. |
| AUTO-08 | Edit mode opens existing automation; Delete (with confirm) available. | D-12 (trigger read-only) + D-16 (delete confirm); `automationsProxy.deleteAutomation(ruleId: string)` exists at `lib/automations/automationsProxy.ts:45`. |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| List + paginate automations | Browser/Client | API/Backend (proxy) | `useAutomationsList` hook owns local state + pagination; `automationsProxy.getAutomations` already proxies to HA. |
| Sheet open/close orchestration | Browser/Client | — | `<AutomationsTab>` owns `editingRule` state; Phase 175 `<Sheet>` handles portal/scroll-lock/focus-trap. |
| Form state (draft + original snapshot) | Browser/Client | — | `<AutomationEditor>` owns `draft` + `original`; no server validation echo before save. |
| API → UI mapper (`apiToDraft`) | Browser/Client | — | Pure function in `lib/automations-mappers.ts`; no I/O. |
| UI → API mapper (`draftToApi`) | Browser/Client | — | Pure function; computes PATCH delta vs original. |
| Save / delete dispatch | Browser/Client | API/Backend (proxy) | Hook calls `automationsProxy` which calls `haClient` (X-API-Key transport, already shipped). |
| Toast feedback | Browser/Client | — | `useToast` hook (`app/hooks/useToast.ts`, verified). |
| Unsaved-changes confirm | Browser/Client | — | `ConfirmationDialog` (`app/components/ui/ConfirmationDialog.tsx`, verified) — separate Radix Dialog, no z-index conflict (Sheet=200/201, ConfirmationDialog uses Tailwind z-50). |
| Auth gating | Frontend Server (SSR) | — | Inherited from `app/layout.tsx` ClientProviders (Phase 179 D-04 pattern). New page is `'use client'` with `export const dynamic = 'force-dynamic'`. |
| Pagination | Browser/Client | API/Backend (proxy) | Client owns `page` state; proxy receives `?limit=20&offset=N`. |
| Last-triggered relative time | Browser/Client | — | `useRelativeTime(tsMs)` (`lib/hooks/useRelativeTime.ts`, verified). |

**Tier sanity check:** All capabilities live in the Browser/Client tier. The proxy layer (`automationsProxy`) is unchanged. No SSR data fetching. No middleware changes. No new API routes.

---

## Authoritative API Surface Verification

> Every union member with file:line evidence. Source: `docs/api/automations.types.ts` (commit-current; CONTEXT D-09 notes the markdown is one entry behind, but `tuya` IS mentioned in markdown line 678 — drift is minimal and the .ts file remains the truth).

### TriggerType union — 2 members [VERIFIED: docs/api/automations.types.ts]

| # | Type literal | Required fields | Optional fields | File:line |
|---|--------------|----------------|------------------|-----------|
| 1 | `schedule_cron` | `cron_expression: string` | — | types.ts:16-19 |
| 2 | `manual_api_call` | (no fields besides `type`) | — | types.ts:22-24 |

**Discriminator:** `type`. Union exported as `TriggerType` at line 26.

### ConditionNode union — 8 members (4 leaves + 3 sensor leaves + 2 composites) [VERIFIED]

| # | Type literal | Required fields | Optional fields | File:line | Phase 180 picker? |
|---|--------------|----------------|------------------|-----------|-------------------|
| 1 | `sensor_state_change` | `sensor_id: string` | `from_state`, `to_state` | types.ts:32-37 | NO (bundle "extra") |
| 2 | `sensor_threshold` | `sensor_id`, `metric`, `operator` (`gt\|lt\|gte\|lte`), `threshold: number` | — | types.ts:40-46 | NO (bundle "extra") |
| 3 | `netatmo_temperature_threshold` | `home_id`, `room_id`, `operator`, `threshold: number` | — | types.ts:49-55 | NO (bundle "extra") |
| 4 | `time_window` | `start_time: string` (HH:MM), `end_time: string` (HH:MM) | — | types.ts:58-62 | YES |
| 5 | `device_state` | `sensor_id`, `expected_state: string` | — | types.ts:65-69 | YES |
| 6 | `temperature_range` | (none — both temps optional) | `min_temp`, `max_temp` (number, nullable) | types.ts:72-76 | YES |
| 7 | `always_true` | (no fields besides `type`) | — | types.ts:79-81 | YES |
| 8 | `and` | `conditions: ConditionNode[]` (min 1) | — | types.ts:87-90 | composite |
| 9 | `or` | `conditions: ConditionNode[]` (min 1) | — | types.ts:93-96 | composite |

**Phase 180 implication:** the 4 phase-180 picker leaves are 4-7 above. The 3 bundle "extras" (1-3) are still part of `ConditionNode` so existing rules that contain them MUST round-trip without data loss. Mapper preserves them; the type-select dropdown in `<ConditionItem>` exposes only types 4-7 (cannot CREATE a sensor leaf, but can EDIT one if loaded from API). **CONTEXT.md does not explicitly call this out — flag for planner: should `<ConditionItem>` show types 1-3 in the dropdown when loaded with that type, then forbid switching back? Recommendation: render the 3 extras as read-only "Tipo non supportato" rows similar to D-09b's action fallback, fail-open.**

### ActionItem union — 11 members [VERIFIED: docs/api/automations.types.ts:203-213]

| # | Type literal | Required fields | Optional fields | File:line | Phase 180 form fields per D-09a |
|---|--------------|----------------|------------------|-----------|----------------------------------|
| 1 | `netatmo_set_room_temp` | `home_id`, `room_id`, `mode` (`manual\|home`) | `temp` (5..30, nullable) | types.ts:112-118 | text/text/segmented/numinput |
| 2 | `netatmo_set_home_mode` | `home_id`, `mode` (`schedule\|away\|hg`) | — | types.ts:121-125 | text/segmented |
| 3 | `netatmo_switch_schedule` | `home_id`, `schedule_id` | — | types.ts:128-132 | text/text |
| 4 | `http_webhook` | `url`, `method` (`GET\|POST`) | `payload` (Record, nullable) | types.ts:136-141 | mono-text/segmented/JSON-textarea |
| 5 | `log_event` | `message: string` | — | types.ts:144-147 | text |
| 6 | `hue_light` | `light_id` | `on`, `brightness` (1..254), `color_temp` (153..500), `hue` (0..65535), `sat` (0..254) — all nullable | types.ts:150-158 | text + 5 nullable inputs |
| 7 | `hue_group` | `group_id` | `on`, `brightness` (1..254), `color_temp` (153..500) — all nullable | types.ts:161-167 | text + 3 nullable inputs (NO hue/sat) |
| 8 | `hue_scene` | `group_id`, `scene_id` | — | types.ts:170-174 | text/text |
| 9 | `thermorossi` | `command` (`ignite\|shutdown\|set_power\|set_fan\|set_water_temp`) | `power_level` (1..5), `fan_level` (1..6), `water_temp` (40..80) — all nullable | types.ts:177-183 | segmented + conditional numinputs per command |
| 10 | `sonos` | `speaker_uid`, `command` (`play\|pause\|set_volume\|switch_source`) | `volume` (0..100), `source` (`tv\|line_in`) — all nullable | types.ts:186-192 | text/segmented + conditional inputs per command |
| 11 | `tuya` | `device_id`, `command` (`set_status\|set_timer`) | `on` (boolean), `timer_seconds` (0..86400) — all nullable | types.ts:195-201 | text/segmented + conditional inputs per command |

**Discriminator:** `type`. Union exported as `ActionItem` at line 203.

**Conditional rendering rules** [CITED: CONTEXT D-09a]:
- `thermorossi`: `power_level` shown only when `command === 'set_power'`; `fan_level` only when `set_fan`; `water_temp` only when `set_water_temp`.
- `sonos`: `volume` shown only when `command === 'set_volume'`; `source` only when `switch_source`.
- `tuya`: `on` shown only when `command === 'set_status'`; `timer_seconds` only when `set_timer`.
- `http_webhook`: `payload` is a JSON-string textarea. On save: `JSON.parse(payload)` if non-empty; if parse fails, block save with inline error "JSON non valido".
- `hue_light`/`hue_group`: render all nullable fields; user fills only what they want; empty → null.

### Rule shape — `AutomationRule` [VERIFIED: types.ts:219-234]

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `number` | yes | **D-05 breaking change vs current stub.** |
| `name` | `string` | yes | — |
| `description` | `string \| null` | optional | — |
| `enabled` | `boolean` | yes | — |
| `trigger` | `TriggerType \| null` | optional | null = "manual only" per markdown line 156. |
| `condition` | `ConditionNode` | yes | Single node (leaf or composite). |
| `actions` | `ActionItem[]` | yes | Min length 1 (server-enforced). |
| `min_interval_seconds` | `number` | yes | Default 0. |
| `max_triggers_per_hour` | `number` | yes | Default 0. |
| `last_triggered_at` | `number \| null` | optional | Unix seconds. |
| `active_hours_start` | `string \| null` | optional | HH:MM. **D-31 deferred — preserved on round-trip.** |
| `active_hours_end` | `string \| null` | optional | HH:MM. **Same.** |
| `created_at` | `number` | yes | Unix seconds. |
| `updated_at` | `number` | yes | Unix seconds. |

### Create body — `AutomationRuleCreate` [VERIFIED: types.ts:238-249]

| Field | Type | Notes |
|-------|------|-------|
| `name` | `string` (required) | — |
| `description` | `string \| null` (optional) | — |
| `enabled` | `boolean` (optional) | server defaults true. |
| `trigger` | `TriggerType \| null` (optional) | omit OR null = manual-only. |
| `condition` | `ConditionNode` (required) | — |
| `actions` | `ActionItem[]` (required) | min length 1. |
| `min_interval_seconds`, `max_triggers_per_hour` | `number` (optional) | server defaults. |
| `active_hours_start`, `active_hours_end` | `string \| null` (optional) | preserved on round-trip. |

### Patch body — `AutomationRulePatch` [VERIFIED: types.ts:253-263]

**ALL fields optional. NO `trigger` field — by design.** Anchors D-12 (trigger read-only on edit).

| Field | Type | Notes |
|-------|------|-------|
| `name` | `string?` | — |
| `description` | `string \| null` (optional) | — |
| `enabled` | `boolean?` | drives the row toggle. |
| `condition` | `ConditionNode?` | — |
| `actions` | `ActionItem[]?` | — |
| `min_interval_seconds`, `max_triggers_per_hour` | `number?` | — |
| `active_hours_start`, `active_hours_end` | `string \| null` (optional) | preserved on round-trip. |

**D-13 PATCH-delta semantic:** the editor MUST send only fields whose JSON.stringify differs from `original`. Trigger MUST NEVER appear. Validation Architecture below covers a Jest test that asserts this.

---

## Bundle Visual Inventory — 934 LOC mapped to target files

> Every component in `automations.jsx` mapped to its target file under `app/components/EmberGlass/automations/`. Line ranges [CITED: bundle].

| Bundle source | Lines | Target file | Notes |
|---------------|-------|-------------|-------|
| `TRIGGER_TYPES` catalog | 6-12 | `lib/automations-config.ts` (TRIGGER_TYPES export) | **API-truth correction:** ship 2 entries only (drop sensor_state_change, sensor_threshold, netatmo_temperature_threshold per D-08). Keep schedule_cron + manual_api_call verbatim. |
| `CONDITION_TYPES` catalog | 14-19 | `lib/automations-config.ts` (CONDITION_TYPES export) | Bundle's 4 entries match Phase 180 picker exactly. Lucide icons replace ad-hoc SVGs (D-19). |
| `ACTION_TYPES` catalog | 21-31 | `lib/automations-config.ts` (ACTION_TYPES export) | **API-truth correction:** ship 11 entries per D-09 table; rename + remap keys; Lucide icons. |
| `INITIAL_AUTOMATIONS` mock data | 34-99 | (deleted — not used) | Real data via `useAutomationsList`. |
| `<AutomationsTab>` orchestrator | 102-169 | `AutomationsTab.tsx` | Real list from hook; same JSX shape. **Header copy:** "{N} di {M} attive" + "Automazioni" headline + "Nuova" pill button verbatim. |
| `<AutomationRow>` | 172-212 | `AutomationRow.tsx` | Verbatim styling; pills powered by `describeTrigger`/`countConditions`/`useRelativeTime`. **Per-row icon:** bundle uses `a.Icon` (per-rule icon); we DON'T have that field on the API. **Recommendation:** derive icon from trigger type via `TRIGGER_TYPES.find(t => t.id === rule.trigger?.type)?.Icon` (fallback `Zap` icon). |
| `<Pill>` | 214-225 | `primitives/Pill.tsx` | Verbatim. Three modes: tone-colored, neutral, muted. |
| `describeTrigger()` | 227-234 | `lib/describeTrigger.ts` | **Reduce to 2 cases per D-21** + null fallback ("Manuale"). Drop sensor_state_change/sensor_threshold/netatmo_temperature_threshold cases. |
| `countConditions()` | 236-244 | `lib/countConditions.ts` | Verbatim recursion. Treats leaf=1, group=sum-of-children, missing/empty=0. **Adjust:** wrap to operate on `ConditionNode` (API shape), not the bundle's wrapped `{op, items}`. Mapper layer handles conversion. |
| `<AutomationEditor>` | 247-322 | `AutomationEditor.tsx` | Tabs (4) + footer + dirty tracking + save guard + ConfirmationDialog wiring (D-15, D-16). |
| `<TriggerSection>` | 325-345 | `sections/TriggerSection.tsx` | 2-col tile picker + per-type config wrapper. **Edit-mode:** disable tiles + readOnly form fields + inline note (D-12). |
| `<TriggerConfigForm>` | 347-397 | `forms/TriggerForms.tsx` | **Drop 3 sensor branches; keep schedule_cron + manual_api_call.** Export `<ScheduleCronForm>` + `<ManualApiCallForm>`. |
| `defaultTrigger()` | 399-406 | `lib/automations-config.ts` (factory) | API-shaped: `schedule_cron` → `{ type: 'schedule_cron', cron_expression: '0 8 * * *' }`; `manual_api_call` → `{ type: 'manual_api_call' }`. **Field name change:** bundle uses `cron`; API uses `cron_expression`. |
| `<ConditionsSection>` | 409-418 | `sections/ConditionsSection.tsx` | Wraps `<ConditionGroup depth=0>`. Empty-state copy ("Le condizioni devono essere soddisfatte..."). |
| `<ConditionGroup>` | 420-491 | `ConditionGroup.tsx` | Recursive; depth-aware bar color; toggleOp/addCondition/addGroup/removeItem; depth<2 hides "+ Gruppo". |
| `<ConditionItem>` | 493-521 | `ConditionItem.tsx` | Type select + per-type form + remove button. |
| `<ConditionConfigForm>` | 523-552 | `forms/ConditionForms.tsx` | 4 forms: `<TimeWindowForm>`, `<DeviceStateForm>`, `<TemperatureRangeForm>`, `<AlwaysTrueForm>`. **Field name change:** bundle uses `start`/`end`/`sensor`/`min`/`max`; API uses `start_time`/`end_time`/`sensor_id`/`min_temp`/`max_temp`. Mapper layer handles. |
| `defaultCondition()` | 554-559 | `lib/automations-config.ts` (factory) | API-shaped per the field-name corrections above. |
| `<ActionsSection>` | 562-639 | `sections/ActionsSection.tsx` | List + picker overlay (11 tiles per D-09) + add CTA. **Picker grid:** keep 2-column layout, ordering per D-09 table. |
| `<ActionItem>` | 641-674 | `ActionRow.tsx` | (renamed to avoid conflict with API type `ActionItem`). Numbered row + type select + per-type form + ↑/↓/remove. |
| `<IconBtn>` | 676-684 | `primitives/IconBtn.tsx` | Verbatim. |
| `<ActionConfigForm>` | 686-784 | `forms/ActionForms.tsx` | **Major rewrite:** 9 bundle branches → 11 API branches per D-09a. Each branch returns the correct fields with API field names. Action #4 (`stove_set_power`) becomes `thermorossi` with `command='set_power'` + `power_level`. |
| `defaultAction()` | 786-797 | `lib/automations-config.ts` (factory) | API-shaped per D-09 table; one factory per action type. |
| `<AdvancedSection>` | 800-815 | `sections/AdvancedSection.tsx` | Verbatim copy. **Field name change:** bundle uses `min_interval`/`max_per_hour`; API uses `min_interval_seconds`/`max_triggers_per_hour`. |
| `<FieldLabel>` | 818-822 | `primitives/FieldLabel.tsx` | Verbatim. |
| `<TextInput>` | 824-834 | `primitives/TextInput.tsx` | Verbatim. 38px height, 0.5px border, 9px radius. **Mono variant** for cron/URL fields. |
| `<NumInput>` | 836-853 | `primitives/NumInput.tsx` | Verbatim. `unit` prop for "sec" suffix; `allowNull` prop for `temperature_range` min/max + nullable hue fields. |
| `<SegmentedControl>` | 855-871 | `primitives/SegmentedControl.tsx` | Verbatim. |
| `<TwoCol>` | 873-875 | `primitives/TwoCol.tsx` | Verbatim. |
| `<TypeTile>` | 877-896 | `primitives/TypeTile.tsx` | Verbatim. **Edit-mode disabled state** (D-12) added: cursor: not-allowed + pointerEvents: none + reduced opacity. |
| `<AddChip>` | 898-905 | `primitives/AddChip.tsx` | Verbatim. |
| `<CronHint>` | 907-924 | `primitives/CronHint.tsx` | Verbatim. 5 segments: min, ora, giorno, mese, giorno sett. |
| `selectStyle` constant | 926-932 | (inlined in `<ConditionItem>` and `<ActionRow>`) | Or extracted as `primitives/selectStyle.ts` if planner prefers. |

**Visual primitive count per CONTEXT D-31:** FieldLabel, TextInput, NumInput, SegmentedControl, TwoCol, TypeTile, AddChip, Pill, CronHint, IconBtn = **10 primitives**, all in `primitives/` sub-folder. Confirmed against bundle. `selectStyle` is the only un-componentized constant; planner decides whether to colocate.

**Items NOT in bundle but required by phase 180:**
- Per-form conditional field rendering (e.g., `thermorossi.set_power` shows `power_level` only) — bundle's `stove_set_power` is monolithic. New logic in `forms/ActionForms.tsx`.
- JSON parse error inline display for `http_webhook` payload — new logic.
- Dirty-state tracking (`JSON.stringify(original) !== JSON.stringify(draft)`) — new logic in `<AutomationEditor>`.
- ConfirmationDialog integration for unsaved-changes guard + delete confirm — uses existing `app/components/ui/ConfirmationDialog.tsx`.
- PATCH delta computation — new logic in `useAutomationsList` or in `lib/automations-mappers.ts` (planner decides).

---

## Mapper Round-Trip Surface — Fixture Catalog

> The highest-risk correctness surface in the phase (CONTEXT D-10). This catalog enumerates every condition shape and every action factory that the planner MUST convert into Jest fixtures in `__tests__/lib/automations-mappers.test.ts`.

### Condition fixtures — 11 shapes (round-trip identity required modulo always_true ↔ empty-AND)

| # | Fixture name | API shape (`condition`) | Expected `apiToDraft` UI shape | Round-trip back to API |
|---|---|---|---|---|
| C1 | `always_true_root` | `{ type: 'always_true' }` | `{ op: 'AND', items: [] }` | `{ type: 'always_true' }` |
| C2 | `single_leaf_root_time_window` | `{ type: 'time_window', start_time: '08:00', end_time: '20:00' }` | `{ op: 'AND', items: [{ kind: 'cond', type: 'time_window', start_time: '08:00', end_time: '20:00' }] }` | bare leaf (D-10 unwrap rule: length===1 && kind==='cond') → `{ type: 'time_window', start_time: '08:00', end_time: '20:00' }` |
| C3 | `single_leaf_root_device_state` | `{ type: 'device_state', sensor_id: 'stove', expected_state: 'on' }` | wrapped AND with single leaf | bare leaf |
| C4 | `single_leaf_root_temperature_range` | `{ type: 'temperature_range', min_temp: null, max_temp: 22 }` | wrapped AND with single leaf | bare leaf |
| C5 | `and_of_two_leaves` | `{ type: 'and', conditions: [{ type: 'time_window', ... }, { type: 'temperature_range', ... }] }` | `{ op: 'AND', items: [{ kind: 'cond', ... }, { kind: 'cond', ... }] }` | `{ type: 'and', conditions: [...] }` |
| C6 | `or_of_two_leaves` | `{ type: 'or', conditions: [{ type: 'device_state', ... }, { type: 'time_window', ... }] }` | `{ op: 'OR', items: [...] }` | `{ type: 'or', conditions: [...] }` |
| C7 | `and_of_or` (depth 1) | `{ type: 'and', conditions: [leaf, { type: 'or', conditions: [leaf, leaf] }] }` | `{ op: 'AND', items: [{ kind: 'cond', ... }, { kind: 'group', op: 'OR', items: [...] }] }` | identity |
| C8 | `or_of_and` (depth 1) | `{ type: 'or', conditions: [leaf, { type: 'and', conditions: [leaf, leaf] }] }` | analogous | identity |
| C9 | `and_of_and_of_or` (depth 2 max) | `{ type: 'and', conditions: [{ type: 'and', conditions: [{ type: 'or', conditions: [leaf, leaf] }] }] }` | nested groups, depth 2 OR group is innermost | identity |
| C10 | `legacy_sensor_leaf` (bundle "extra" — fail-open) | `{ type: 'sensor_state_change', sensor_id: 'p1', from_state: 'home', to_state: 'away' }` | wrapped AND with `{ kind: 'cond', ...leaf }` | bare leaf, preserved verbatim |
| C11 | `mixed_with_legacy_extras` | `{ type: 'and', conditions: [{ type: 'sensor_threshold', ... }, { type: 'time_window', ... }] }` | `{ op: 'AND', items: [{ kind: 'cond', sensor_threshold }, { kind: 'cond', time_window }] }` | identity |

**Test pattern** (Jest):
```ts
describe('automations-mappers round-trip', () => {
  test.each([
    ['C1 always_true_root', { type: 'always_true' }],
    ['C2 single_leaf', { type: 'time_window', start_time: '08:00', end_time: '20:00' }],
    // ... C3..C11
  ])('%s: draftToApi(apiToDraft(rule)) deep-equals rule', (_name, condition) => {
    const rule: AutomationRule = { ...mockRule, condition };
    const draft = apiToDraft(rule);
    const roundtripped = draftToApi(draft);
    expect(roundtripped.condition).toEqual(rule.condition);
  });
});
```

**Edge cases the planner must additionally test:**
- Empty AND group within nested group → serializes as `{ type: 'always_true' }` per D-10.
- depth-2 nested group → "+ Gruppo" button hidden (UI assertion in `__tests__/ConditionGroup.test.tsx`).
- Switching condition leaf type clears irrelevant fields (e.g., switch from `time_window` to `device_state` should not leak `start_time`/`end_time`).

### Action factory fixtures — 11 default shapes

> Each `defaultAction(type)` MUST produce a valid `ActionItem` of that type with all REQUIRED fields filled and all OPTIONAL fields set to either a sensible default or `null`. Source: `automations.types.ts:112-201`.

| # | `type` literal | `defaultAction` returns | Required fields filled | Notes |
|---|---|---|---|---|
| A1 | `netatmo_set_room_temp` | `{ type, home_id: '', room_id: '', mode: 'manual', temp: 21 }` | home_id, room_id, mode | bundle stub used `room` text; new factory uses `home_id` + `room_id`. |
| A2 | `netatmo_set_home_mode` | `{ type, home_id: '', mode: 'schedule' }` | home_id, mode | — |
| A3 | `netatmo_switch_schedule` | `{ type, home_id: '', schedule_id: '' }` | home_id, schedule_id | — |
| A4 | `http_webhook` | `{ type, url: '', method: 'POST', payload: null }` | url, method | payload nullable. |
| A5 | `log_event` | `{ type, message: '' }` | message | — |
| A6 | `hue_light` | `{ type, light_id: '', on: null, brightness: null, color_temp: null, hue: null, sat: null }` | light_id | All other fields null (user fills). |
| A7 | `hue_group` | `{ type, group_id: '', on: null, brightness: null, color_temp: null }` | group_id | NO hue/sat. |
| A8 | `hue_scene` | `{ type, group_id: '', scene_id: '' }` | group_id, scene_id | — |
| A9 | `thermorossi` | `{ type, command: 'ignite', power_level: null, fan_level: null, water_temp: null }` | command | conditional fields all null. |
| A10 | `sonos` | `{ type, speaker_uid: '', command: 'play', volume: null, source: null }` | speaker_uid, command | — |
| A11 | `tuya` | `{ type, device_id: '', command: 'set_status', on: null, timer_seconds: null }` | device_id, command | — |

**Test pattern** (`__tests__/lib/automations-config.test.ts`):
```ts
describe('defaultAction factories', () => {
  test.each(ACTION_TYPES.map(t => t.id))('defaultAction(%s) has type matching the literal', (typeId) => {
    expect(defaultAction(typeId).type).toBe(typeId);
  });
  test('defaultAction(http_webhook) sets method to POST', () => {
    expect(defaultAction('http_webhook')).toMatchObject({ type: 'http_webhook', url: '', method: 'POST' });
  });
  // ... other invariants
});
```

### `defaultTrigger` factories — 2 entries

| `type` | `defaultTrigger` returns |
|--------|--------------------------|
| `schedule_cron` | `{ type: 'schedule_cron', cron_expression: '0 8 * * *' }` |
| `manual_api_call` | `{ type: 'manual_api_call' }` |

### `defaultCondition` factories — 4 entries

| `type` | `defaultCondition` returns | Notes |
|--------|----------------------------|-------|
| `time_window` | `{ type: 'time_window', start_time: '08:00', end_time: '20:00' }` | API field names. |
| `device_state` | `{ type: 'device_state', sensor_id: '', expected_state: '' }` | — |
| `temperature_range` | `{ type: 'temperature_range', min_temp: null, max_temp: null }` | nullable. |
| `always_true` | `{ type: 'always_true' }` | — |

---

## Existing-Consumer Audit for D-05 Type Rewrite

> Three existing files import from `@/types/automations`. The current stub uses `id: string`; the new re-export from `automations.types.ts` flips to `id: number`. Each file:line and required fix below [VERIFIED: grep `from '@/types/automations'`].

### Consumer 1: `app/automations/page.tsx`

| Line | Current code | Fix needed | Type |
|------|--------------|-----------|------|
| 8 | `import type { AutomationRule } from '@/types/automations';` | (no change — same import path) | mechanical |
| 153 | `onClick={() => router.push(\`/automations/${row.original.id}\`)}` | (no change — template-literal stringifies number automatically) | works as-is |
| 108 | `await fetch(\`/api/v1/automations/${ruleToEdit.id}\`, ...)` | (no change — same reason) | works as-is |
| 132 | `await fetch(\`/api/v1/automations/${ruleToDelete.id}\`, ...)` | (no change — same reason) | works as-is |
| 86-90 | POST body with `enabled: data.enabled` | **new shape requires `condition` + `actions` + 1 action min** — but this page doesn't expose either. **Risk:** server may 422 on POST without condition/actions. **Mitigation:** the legacy page's CREATE form has been working — server must accept omission OR have defaults. Audit `automations.types.ts:238-249`: `condition` is REQUIRED. **The legacy POST is already broken or relies on a server-side default.** This is NOT Phase 180's problem to fix (D-06 leaves legacy untouched), but plan agent should confirm pre-rewrite that the legacy page's existing tests still pass. |
| 173 | `pulse={row.original.enabled}` (Badge prop) | (no change) | works as-is |
| 183 | `val ? new Date(val).toLocaleString('it-IT') : '—'` reading `last_execution_at` | **stub had `last_execution_at: string \| null`; the truth has `last_triggered_at: number \| null`** (Unix seconds). The current stub field name is WRONG vs the API. **Fix:** change to `row.original.last_triggered_at` and convert seconds × 1000 to milliseconds before `Date(...)`. Or accept this page goes broken — but D-28 mandates "no regression of legacy `/automations` page tests pass". |
| 332-340 | `defaultValues` object using `description: ruleToEdit.description ?? ''` | works as-is. |

**Verdict for app/automations/page.tsx:** ONE real bug surfaces (line 183, `last_execution_at` doesn't exist on the truth). Plan agent must rename to `last_triggered_at` AND convert Unix seconds → ms. Also: the form-modal's create body lacks `condition` + `actions` — verify legacy tests still pass; if the existing test mocks `fetch` and just asserts the body shape, no fix is needed (the test won't actually 422).

### Consumer 2: `app/automations/[rule_id]/page.tsx`

| Line | Current code | Fix needed |
|------|--------------|------------|
| 7 | `import type { AutomationRule, AutomationExecution } from '@/types/automations';` | (no change — both still exported, but `AutomationExecution.id` flips `string` → `number` and adds `triggered_at: number` field, drops `started_at`/`duration_ms`/`error_message` fields). |
| 99 | `const ruleId = params['rule_id'] as string;` | (no change — URL params are strings; ruleId stays string for the proxy contract) |
| 113-115 | `accessorKey: 'started_at'` + `new Date(row.original.started_at).toLocaleString('it-IT')` | **`AutomationExecution` truth shape** (types.ts:269-277): has `triggered_at: number` (Unix seconds), NOT `started_at: string`. Same fix as Consumer 1: rename `started_at` → `triggered_at`, multiply by 1000 before `new Date()`. |
| 119-121 | `accessorKey: 'status'` cell | works as-is. **BUT:** stub had status union `'success' \| 'failure' \| 'running'`; truth is `'success' \| 'failure' \| 'partial_failure' \| 'skipped' \| 'condition_not_met'` (types.ts:273). The `getExecutionBadge()` switch (line 82-92) only handles 3 — adds 2 unhandled cases. **Fix:** add cases for `partial_failure`, `skipped`, `condition_not_met`. |
| 125-129 | `accessorKey: 'duration_ms'` + `${val}ms` | **`duration_ms` does not exist on truth.** Either drop the column or compute duration from another field. **Fix:** drop the column; it has no source data. |
| 133-141 | `accessorKey: 'error_message'` cell | works as-is — `error_message` IS on truth (types.ts:275). |
| 192-195 | `rule.created_at ? new Date(rule.created_at).toLocaleDateString('it-IT') : '—'` | **`created_at` is `number` (Unix sec) not `string`.** Fix: multiply × 1000. |
| 200 | `<Text>...{rule.id}</Text>` (renders id as string) | works as-is — implicit toString on number. |

**Verdict for [rule_id] page:** SIX real bugs surface. Renames + drops + new switch cases. Mechanical, but more churn than page.tsx.

### Consumer 3: `lib/automations/automationsProxy.ts`

| Line | Current code | Fix needed |
|------|--------------|------------|
| 16 | `import type { AutomationRule, AutomationCreate, AutomationUpdate, AutomationExecution } from '@/types/automations';` | works as-is post-rewrite (D-05 keeps these aliases — `AutomationCreate = AutomationRuleCreate`, `AutomationUpdate = AutomationRulePatch`). |
| 19, 35, 40, 45, 50 | `ruleId: string` parameter | **KEEP as `string`** per CONTEXT D-05. Rationale: this is a URL path segment, and JS template-literals stringify numbers automatically — callers can pass either a string or a number, the function param signature stays string. Mechanical: unchanged. |
| 30 | `body as unknown as Record<string, unknown>` cast | works as-is. |
| 41 | same cast | works as-is. |

**Verdict for proxy:** Zero code changes. The rewrite preserves the alias names.

### Consumer 4 (TEST): `__tests__/lib/automationsProxy.test.ts`

| Line | Current fixture | Fix needed |
|------|----------------|------------|
| 22-29 | `mockAutomationRule = { id: 'rule-abc', name: ..., enabled: true, description: null, last_execution_at: null, created_at: '2026-01-01T00:00:00Z' }` | **id type flip**: `'rule-abc'` → `1` (or any number). **Field renames**: `last_execution_at` → `last_triggered_at` (number\|null); `created_at` ISO string → number (Unix seconds). **Add required fields**: `enabled`, `condition`, `actions`, `min_interval_seconds`, `max_triggers_per_hour`, `updated_at`. |
| 32-37 | `mockExecution = { id: 'exec-001', rule_id: 'rule-abc', status: 'success', started_at: '2026-01-01T10:00:00Z', duration_ms: 150, error_message: null }` | **id**: 'exec-001' → 1 (number). **rule_id**: 'rule-abc' → 1. **Drop `started_at` field; add `triggered_at: number` and `trigger_source: 'auto'\|'manual'`. Drop `duration_ms`** (not on truth). |

**Verdict for test fixtures:** Significant fixture rewrite, but mechanical. The proxy test does not assert field-by-field shape — it asserts URL paths and request methods, so the fixtures need to be valid TypeScript but won't drive runtime assertions. Pass.

### Audit summary

| File | Lines touched | Risk |
|------|--------------|------|
| `app/automations/page.tsx` | 1 (line 183 rename + ×1000) | LOW |
| `app/automations/[rule_id]/page.tsx` | 6 (rename + ×1000 + drop column + switch cases) | MEDIUM |
| `lib/automations/automationsProxy.ts` | 0 | NONE |
| `__tests__/lib/automationsProxy.test.ts` | ~12 (fixture rewrite) | LOW |
| **TOTAL** | ~19 lines across 4 files | LOW-MEDIUM |

**Plan agent action:** Wave 1 Plan 01 MUST land all four file edits in a single PR before any editor code is scaffolded. Verification: `npm run test:changed` passes; legacy `/automations` page-load smoke spec (`tests/smoke/page-loads.spec.ts`) passes.

---

## Sheet Primitive Integration Verification

> Phase 175 `<Sheet>` API verified at `app/components/EmberGlass/Sheet.tsx:42` [VERIFIED: file read].

### Sheet API contract

```ts
export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
}
```

### Phase 180 usage (D-07)

```tsx
<Sheet
  open={!!editingRule}
  onClose={handleClose}
  title={isNew ? 'Nuova automazione' : 'Modifica automazione'}
>
  <AutomationEditor rule={editingRule} onSave={handleSave} onDelete={handleDelete} />
</Sheet>
```

### Verified Sheet behavior (Sheet.tsx, file read)

| Behavior | Verified | Notes |
|----------|----------|-------|
| Radix Dialog underneath | YES | `DialogPrimitive.Root` line 64. |
| `forceMount` keeps subtree alive for outro animation | YES | `Portal forceMount` line 70 + `Content forceMount` line 89. |
| `onPointerDownOutside={(e) => e.preventDefault()}` (suppresses Radix double-fire) | YES | Line 92. Backdrop has its own `onClick={onClose}`. |
| `aria-describedby={undefined}` (suppresses Radix warning) | YES | Line 94. |
| Body scroll-lock with restored scrollY (via useRef) | YES | Lines 46-61. |
| Z-index 200 backdrop / 201 container | YES | Lines 80, 100. |
| Backdrop opacity transition + blur | YES | Lines 81-84. |
| 400ms cubic-bezier(.22,1,.36,1) translateY | YES | Line 112. |
| Grabber rendered always | YES | Lines 116-125. |
| Title row + close button when `title` prop set | YES | Lines 128-168. VisuallyHidden fallback when unset (line 169-173). |

### Phase 180 integration concerns

- **Title prop ALWAYS provided.** D-07 mandates "Nuova automazione" or "Modifica automazione" — never the VisuallyHidden fallback path.
- **No nested sheet stacking.** ConfirmationDialog (unsaved-changes guard, delete confirm) is a separate Radix Dialog at z-index 50 (Tailwind `z-50` per ConfirmationDialog.tsx). Sheet is z-index 200/201. **Stacking confirms ConfirmationDialog renders ABOVE Sheet.** [VERIFIED: ConfirmationDialog.tsx is forwardRef of `DialogPrimitive.Content` with cva styles; Tailwind z-50 is ~50 in CSS, well below Sheet's 200.]
- **No imperative focus management.** Radix's default focus-trap-on-first-focusable handles the editor — first input is `<TextInput>` for the Name field. Acceptable.
- **Keyboard: Escape dismissal** fires `onOpenChange(false)` which calls `onClose`. `<AutomationEditor>` MUST intercept this with the dirty-state guard (D-15). **Implementation pattern:** wrap `onClose` with a guard:
  ```tsx
  const handleClose = () => {
    if (isDirty) { setShowUnsavedDialog(true); return; }
    setEditingRule(null);
  };
  <Sheet open={!!editingRule} onClose={handleClose} title={...}>
  ```
- **Backdrop tap dismissal** fires `onClose` via `data-sheet-backdrop="true" onClick={onClose}` (Sheet.tsx line 76). Same handleClose handles all 3 dismissal vectors uniformly.

### Phase 178 sheet consumer pattern (per `app/components/EmberGlass/sheets/`)

[VERIFIED: ls of EmberGlass/sheets/ shows it exists; not read in detail per scope]. Phase 180 mirrors the pattern — but with one difference: Phase 178 sheets render a fixed body (StoveSheet, ClimateSheet, etc.); Phase 180's body is the full editor with internal tab routing. The Sheet itself doesn't care — it forwards children verbatim.

---

## Auth Wrap Pattern (D-29)

> Mirrors `app/stanze/page.tsx` exactly [VERIFIED: file read].

```tsx
'use client';
import { AutomationsTab } from '@/app/components/EmberGlass/automations';

export const dynamic = 'force-dynamic';

export default function AutomazioniPage() {
  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <h1 className="sr-only">Automazioni</h1>
      <AutomationsTab />
    </section>
  );
}
```

**Three load-bearing details:**
1. `'use client'` directive — `<AutomationsTab>` is state-bearing.
2. `export const dynamic = 'force-dynamic'` — disables Next.js static rendering for an authenticated page.
3. Tailwind layout class on `<section>` — explicit carve-out per Phase 177 precedent. Inline-style discipline applies INSIDE the EmberGlass namespace, not on route page chrome.

**Auth0 wrap is automatic** via `app/layout.tsx > ClientProviders`. No explicit `withPageAuthRequired` HOC — the layout handles it for all pages.

---

## Test Infrastructure Patterns

> Phase 179 (rooms) is the canonical reference [VERIFIED: file reads].

### Jest specs — colocation pattern

```
app/components/EmberGlass/automations/
  __tests__/
    AutomationsTab.test.tsx
    AutomationEditor.test.tsx
    AutomationRow.test.tsx
    ConditionGroup.test.tsx
    ConditionItem.test.tsx
    ActionRow.test.tsx
    sections/
      TriggerSection.test.tsx
      ConditionsSection.test.tsx
      ActionsSection.test.tsx
      AdvancedSection.test.tsx
    forms/
      TriggerForms.test.tsx
      ConditionForms.test.tsx
      ActionForms.test.tsx
    lib/
      automations-config.test.ts
      automations-mappers.test.ts
      countConditions.test.ts
      describeTrigger.test.ts
    hooks/
      useAutomationsList.test.ts (or under app/hooks/__tests__/ — see below)
```

**Pattern verified** by `app/components/EmberGlass/rooms/__tests__/` (which has `bodies/`, `lib/`, `primitives/` mirror sub-folders).

### Hook test location

Phase 179 places hooks under `app/components/EmberGlass/rooms/__tests__/lib/getDevicesForRoom.test.ts` (because `getDevicesForRoom` is a lib helper, not a hook). Existing hooks like `useAutomationsList` SHOULD live at `app/hooks/useAutomationsList.ts` per CONTEXT D-23, with tests at `app/hooks/__tests__/useAutomationsList.test.ts` to follow the existing pattern (`app/hooks/__tests__/` exists with `useReducedMotion.test.ts`, `useHaptic.test.ts`, `useVersionCheck.test.ts`).

### Mock proxy pattern (Phase 179 RoomsTab.test.tsx canonical)

```ts
jest.mock('@/lib/automations/automationsProxy', () => ({
  automationsProxy: {
    getAutomations: jest.fn(),
    createAutomation: jest.fn(),
    updateAutomation: jest.fn(),
    deleteAutomation: jest.fn(),
    getAutomation: jest.fn(),
    getExecutions: jest.fn(),
  },
}));

// In test setup
import { automationsProxy } from '@/lib/automations/automationsProxy';
const mockGetAutomations = jest.mocked(automationsProxy.getAutomations);
mockGetAutomations.mockResolvedValue({ items: [...], total_count: 5, limit: 20, offset: 0 });
```

[VERIFIED: pattern matches Phase 179 RoomsTab.test.tsx mocking style with `jest.mock()` + accessing the mock via `jest.mocked()`].

### Toast / ConfirmationDialog mock pattern

```ts
jest.mock('@/app/hooks/useToast', () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
  }),
}));
```

`<ConfirmationDialog>` is real (not mocked) for unit tests of `<AutomationEditor>` — its dialog renders into the same JSDOM and assertions can target its buttons directly.

### Playwright spec — file location and helpers

**File location:** `tests/smoke/automations-tab.spec.ts` — NOT `tests/playwright/`. Phase 179 confirms `tests/playwright/` is the OLD path; current path is `tests/smoke/`. [VERIFIED: `ls tests/smoke/` shows `rooms-tab.spec.ts` and 9 other specs.]

**Required helper imports** (verbatim from `tests/smoke/rooms-tab.spec.ts`):

```ts
import { test, expect, type ConsoleMessage, type Page } from '@playwright/test';

function collectConsoleErrors(page: Page): { errors: string[]; cleanup: () => void } { ... }
async function dismissVersionEnforcerIfPresent(page: Page): Promise<void> { ... }
async function dismissWhatsNewModalIfPresent(page: Page): Promise<void> { ... }
async function primeDashboardForSheetTest(page: Page): Promise<void> { ... }
```

**Why all four are needed for Phase 180:**
- `collectConsoleErrors` — D-27 step 9 mandates console-errors check.
- `dismissVersionEnforcerIfPresent` — Phase 175 known blocker; pre-existing overlay can intercept clicks.
- `dismissWhatsNewModalIfPresent` — fresh storage state means modal mounts on cold-load.
- `primeDashboardForSheetTest` — pre-primes localStorage to suppress WhatsNewModal + version-check route mock.

**Route mocks needed for Phase 180:**

```ts
// Mock /api/v1/automations list endpoint
await page.route('**/api/v1/automations*', async (route) => {
  if (route.request().method() === 'GET' && !route.request().url().includes('/executions')) {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [{ id: 1, name: 'Test rule', /* full AutomationRule shape */ }],
        total_count: 1, limit: 20, offset: 0,
      }),
    });
  } else if (route.request().method() === 'POST') {
    // returns created rule with id
  } else if (route.request().method() === 'PATCH') {
    // returns updated rule
  } else if (route.request().method() === 'DELETE') {
    await route.fulfill({ status: 204, body: '' });
  }
});
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bottom sheet portal + scroll-lock | Custom Portal+useEffect | `<Sheet>` from `@/app/components/EmberGlass/Sheet` | Phase 175 already shipped; matches bundle exactly. |
| Confirmation dialog | New dialog | `<ConfirmationDialog>` from `@/app/components/ui/ConfirmationDialog` | Already exists, Radix-based, danger variant supported. |
| Toast notifications | Custom toast | `useToast()` from `@/app/hooks/useToast` | Already used by all phases. |
| Relative-time formatting | Custom diff calc | `useRelativeTime(tsMs)` from `@/lib/hooks/useRelativeTime` | Italian locale, 10s tick, null-safe. |
| Cron parsing | cron-parser library | Plain `.split(/\s+/)` (CronHint already verbatim from bundle) | Read-only labels; no library install needed. |
| JSON validation for http_webhook payload | zod / ajv | Plain `JSON.parse()` in try/catch | Edge-case-only; one form field; library install is overkill. |
| API transport | New fetch helper | `automationsProxy` (already shipped) | Function-module; X-API-Key transport. |
| Pagination state | URL param sync (Next.js searchParams) | Local React state (Phase 179 + legacy `/automations` precedent) | Editor has no URL-based deep-linking requirement. |
| Form state library | react-hook-form | Plain `useState` (`<AutomationEditor>` owns draft + original snapshot) | Discriminated unions are easier to type as plain state; bundle pattern. |
| Discriminated-union exhaustive switch | Manual `default: throw` | Plain TypeScript narrowing + `assertNever` helper | strict TS + `noUncheckedIndexedAccess` make this free; CONTEXT D-32 explicit. |
| Drag-and-drop reorder | @dnd-kit | ↑/↓ icon buttons (bundle line 666-668) | Out of scope per CONTEXT. |

**Key insight:** every reusable primitive is already in the codebase. Phase 180 ships ZERO library installs. The only "new" code that isn't a translation of the bundle is the mapper layer + dirty-state tracking.

---

## Common Pitfalls

### Pitfall 1: Field-name drift between bundle and API

**What goes wrong:** Bundle uses `cron`, `start`, `end`, `sensor`, `min`, `max`, `room`, `level`, `min_interval`, `max_per_hour`. API uses `cron_expression`, `start_time`, `end_time`, `sensor_id`, `min_temp`, `max_temp`, `room_id`, `power_level`, `min_interval_seconds`, `max_triggers_per_hour`. Lifting bundle code verbatim creates 10+ runtime field-name bugs.
**Why it happens:** Bundle predates the API spec; no compile-time check links them.
**How to avoid:** Mapper layer is the SINGLE place field-name conversions live. Forms work in API field names internally; the only "translation" point is when a form's value flows into the rule. **Avoid:** copy-pasting bundle's `onChange={(v) => onChange({ ...action, room: v })}` (uses bundle field name); rewrite as `onChange={(v) => onChange({ ...action, room_id: v })}`. Plan agent reviews every form per the field table in D-09a.
**Warning signs:** Jest unit test for `defaultAction(...)` returns object with bundle field name; `apiToDraft(rule)` round-trip fails.

### Pitfall 2: Stale `original` snapshot during edit

**What goes wrong:** User opens an existing rule, edits, the list refetches in background, the in-memory `editingRule` reference points to the OLD object. Save dispatch sees a stale `original` — PATCH delta is wrong (sends fields that haven't actually changed since the latest server state).
**Why it happens:** `<AutomationsTab>` owns `editingRule` and `rules[]` separately; refetch updates `rules[]` but NOT `editingRule`.
**How to avoid:** Snapshot `original` ONCE on Sheet open and freeze it (do not re-derive from `rules[]` until close). Refetch on save explicitly resets `editingRule` to null (D-13). Refetch DURING edit is currently NOT triggered (no polling, no WS) — but if Phase 181 adds nav-related re-renders that incidentally refetch the list, this still holds.
**Warning signs:** PATCH body is empty or contains spurious fields after another tab updates the rule between open and save.

### Pitfall 3: `JSON.stringify` ordering instability for dirty check

**What goes wrong:** `JSON.stringify(original) !== JSON.stringify(draft)` returns `true` even when objects are deep-equal but key order differs. Spurious unsaved-changes guards.
**Why it happens:** JSON.stringify preserves insertion order; `apiToDraft` and form mutations may produce keys in different order than the API response.
**How to avoid:** Either (a) use a deep-equal helper (e.g., `dequal` — ALREADY a transitive dep? plan checks; or write a 10-line recursive equal); or (b) ensure `apiToDraft` reproduces a CANONICAL key order (sort keys in factory output). **Recommendation:** option (b) — add a `canonicalize(obj)` helper in mappers that sorts keys recursively before JSON.stringify. Cheap, zero-dep. Plan tests on a fixture where API returns keys in {b, a} order and the editor produces {a, b}.
**Warning signs:** Unsaved-changes guard fires immediately on Sheet open without any user input.

### Pitfall 4: PATCH body sends `trigger` field

**What goes wrong:** D-12 mandates trigger is read-only on edit; D-13 mandates PATCH only changed fields; but if the planner generates the PATCH body from a generic "diff every key" routine, `trigger` will always be included if it's in `draft`.
**Why it happens:** Generic-diff is too permissive — it treats `trigger` like any other field.
**How to avoid:** Hardcode the PATCH body to OMIT `trigger` regardless of whether it differs (per `AutomationRulePatch` spec — types.ts:253 has no `trigger` field, so a TypeScript-typed PATCH builder will refuse to compile if you try). Plan emits a Jest test that explicitly asserts `delete patchBody.trigger` is unnecessary because the type system prevents it.
**Warning signs:** TypeScript error "Property 'trigger' does not exist on type 'AutomationRulePatch'" that the agent silently casts away with `as any`.

### Pitfall 5: Recursive countConditions on bundle-shaped wrapped group

**What goes wrong:** `countConditions` runs on the UI's `{ op, items }` shape but is also tempting to call directly on the API's `ConditionNode` (e.g., from `<AutomationRow>` where the data comes pre-mapped from the proxy).
**Why it happens:** Two shapes for the same concept: API's `{ type, conditions }` vs UI's `{ op, items }`.
**How to avoid:** **Two separate functions:** `countConditionsApi(node: ConditionNode): number` for `<AutomationRow>` (operates on API shape), and `countConditionsUI(group: UIConditionGroup): number` for the editor tab badge. Or: a single function that accepts a discriminated union. Plan agent decides.
**Warning signs:** TypeScript errors about missing `op` on `ConditionNode`; tab badge shows wrong count after switching ops.

### Pitfall 6: Discriminated-union exhaustive switch missing the default

**What goes wrong:** Per CONTEXT, `default` clauses must be `assertNever(action)` to satisfy strict TS. If a new API action type ships and the codebase doesn't update, the compile-time exhaustiveness fails — but if `assertNever` is missing, it ships at runtime as a silent fallthrough.
**Why it happens:** TS `noImplicitReturns` plus discriminated-union exhaustiveness is strong, but explicit `assertNever` is the canonical pattern.
**How to avoid:** Use `assertNever` helper (already exists in codebase per Phase 114-116 conventions; otherwise add a 3-line one to `lib/utils/`). Plan emits a Jest test with a deliberately broken type cast that should produce a compile error if the switch is non-exhaustive.
**Warning signs:** silent rendering of empty `<>` fragment when an unknown action type loads.

### Pitfall 7: Sheet dismissal fires onClose twice

**What goes wrong:** Phase 175 explicitly suppresses Radix's outside-pointer-down to avoid double-dismissal, but a careless `<AutomationEditor>` consumer that adds its own `useEffect` with `onClose` cleanup could re-introduce the problem.
**Why it happens:** Multiple subscribers to the same close event.
**How to avoid:** Single `handleClose` function with the dirty-state guard at the orchestrator level. Sheet's three dismissal vectors (Escape via Radix, backdrop click via own div, close button) all converge on one `onClose` prop. Plan asserts in Jest: invoke each vector, assert `handleClose` called exactly once.
**Warning signs:** Unsaved-changes ConfirmationDialog flickers open-close-open.

### Pitfall 8: `condition_not_met` execution status missing from legacy badge helper

**What goes wrong:** Legacy `getExecutionBadge` switch handles 3 cases; truth has 5. After D-05 rewrite, the truth-typed `AutomationExecution.status` causes TS error at the switch site OR the badge falls through to "neutral" for `partial_failure` / `skipped` / `condition_not_met`.
**Why it happens:** Stub didn't match truth.
**How to avoid:** Add explicit cases for `partial_failure` (warning variant), `skipped` (neutral), `condition_not_met` (neutral). Documented in Existing-Consumer Audit above.
**Warning signs:** TypeScript error at `app/automations/[rule_id]/page.tsx:91`.

---

## Code Examples

> Verified patterns from authoritative sources. URLs are codebase paths.

### `<Sheet>` integration in `<AutomationsTab>`

```tsx
// Source: app/components/EmberGlass/Sheet.tsx + bundle line 261
import { Sheet } from '@/app/components/EmberGlass';
import { useState } from 'react';
import { AutomationEditor } from './AutomationEditor';
import { useAutomationsList } from '@/app/hooks/useAutomationsList';

export function AutomationsTab() {
  const { rules, totalCount, refetch, create, update, remove, toggle } = useAutomationsList({ pageSize: 20 });
  const [editingRule, setEditingRule] = useState<AutomationRule | { _new: true } | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const handleClose = () => {
    if (isDirty) { setShowUnsavedDialog(true); return; }
    setEditingRule(null);
  };

  const isNew = editingRule !== null && '_new' in editingRule;

  return (
    <>
      {/* ... list ... */}
      <Sheet
        open={editingRule !== null}
        onClose={handleClose}
        title={isNew ? 'Nuova automazione' : 'Modifica automazione'}
      >
        {editingRule && (
          <AutomationEditor
            rule={editingRule}
            onDirty={setIsDirty}
            onSave={async (apiBody) => { await create(apiBody); setEditingRule(null); }}
            onDelete={async () => { /* with confirm */ }}
          />
        )}
      </Sheet>
      <ConfirmationDialog
        isOpen={showUnsavedDialog}
        onClose={() => setShowUnsavedDialog(false)}
        onConfirm={() => { setShowUnsavedDialog(false); setEditingRule(null); }}
        title="Modifiche non salvate"
        description="Hai modifiche non salvate. Chiudere lo stesso?"
        confirmLabel="Chiudi senza salvare"
        cancelLabel="Continua a modificare"
        variant="danger"
      />
    </>
  );
}
```

### Mapper round-trip core (`lib/automations-mappers.ts`)

```ts
// Source: CONTEXT D-10 + automations.types.ts
import type { AutomationRule, ConditionNode, AndNode, OrNode } from '@/types/automations';

export interface UIConditionGroup {
  kind?: never; // marker — distinguishes from UIConditionItem in the recursive union
  op: 'AND' | 'OR';
  items: UIConditionItemOrGroup[];
}
export interface UIConditionItem {
  kind: 'cond';
  // ...spread of ConditionNode leaf fields
}
export type UIConditionItemOrGroup =
  | (UIConditionItem & ConditionNodeLeafFields)
  | (UIConditionGroup & { kind: 'group' });

export function apiConditionToUIGroup(node: ConditionNode): UIConditionGroup {
  if (node.type === 'always_true') {
    return { op: 'AND', items: [] };
  }
  if (node.type === 'and' || node.type === 'or') {
    return {
      op: node.type === 'and' ? 'AND' : 'OR',
      items: node.conditions.map((child): UIConditionItemOrGroup => {
        if (child.type === 'and' || child.type === 'or') {
          return { kind: 'group', ...apiConditionToUIGroup(child) };
        }
        return { kind: 'cond', ...child };
      }),
    };
  }
  // Bare leaf — wrap in single-leaf AND group per D-10
  return { op: 'AND', items: [{ kind: 'cond', ...node }] };
}

export function uiGroupToApiCondition(group: UIConditionGroup): ConditionNode {
  if (group.items.length === 0) {
    return { type: 'always_true' };
  }
  if (group.items.length === 1 && group.items[0].kind === 'cond') {
    // Unwrap single-leaf AND back to bare leaf
    const { kind: _kind, ...leaf } = group.items[0];
    return leaf as ConditionNode;
  }
  const conditions: ConditionNode[] = group.items.map((it) =>
    it.kind === 'group' ? uiGroupToApiCondition(it) : (() => { const { kind, ...leaf } = it; return leaf as ConditionNode; })()
  );
  return group.op === 'AND'
    ? ({ type: 'and', conditions } as AndNode)
    : ({ type: 'or', conditions } as OrNode);
}
```

### PATCH delta computation (`lib/automations-mappers.ts`)

```ts
// Source: CONTEXT D-13 + automations.types.ts:253
import type { AutomationRule, AutomationRulePatch } from '@/types/automations';

export function computePatchDelta(
  original: AutomationRule,
  draft: AutomationRule
): AutomationRulePatch {
  const patch: AutomationRulePatch = {};
  const fields: Array<keyof AutomationRulePatch> = [
    'name', 'description', 'enabled', 'condition', 'actions',
    'min_interval_seconds', 'max_triggers_per_hour',
    'active_hours_start', 'active_hours_end',
  ];
  for (const f of fields) {
    if (JSON.stringify(canonicalize(original[f])) !== JSON.stringify(canonicalize(draft[f]))) {
      // TS-safe assignment via key narrowing
      (patch as Record<keyof AutomationRulePatch, unknown>)[f] = draft[f];
    }
  }
  return patch;
}
// Note: AutomationRulePatch has NO `trigger` field — TS prevents accidental inclusion.
```

### Discriminated-union form dispatcher (`forms/ActionForms.tsx`)

```tsx
// Source: bundle line 686-784 + CONTEXT D-09a
import type { ActionItem } from '@/types/automations';
import { assertNever } from '@/lib/utils/assertNever';

interface ActionFormProps<T extends ActionItem> {
  action: T;
  onChange: (next: T) => void;
}

export function ActionForm({ action, onChange }: ActionFormProps<ActionItem>) {
  switch (action.type) {
    case 'netatmo_set_room_temp': return <NetatmoSetRoomTempForm action={action} onChange={onChange} />;
    case 'netatmo_set_home_mode': return <NetatmoSetHomeModeForm action={action} onChange={onChange} />;
    case 'netatmo_switch_schedule': return <NetatmoSwitchScheduleForm action={action} onChange={onChange} />;
    case 'http_webhook': return <HttpWebhookForm action={action} onChange={onChange} />;
    case 'log_event': return <LogEventForm action={action} onChange={onChange} />;
    case 'hue_light': return <HueLightForm action={action} onChange={onChange} />;
    case 'hue_group': return <HueGroupForm action={action} onChange={onChange} />;
    case 'hue_scene': return <HueSceneForm action={action} onChange={onChange} />;
    case 'thermorossi': return <ThermorossiForm action={action} onChange={onChange} />;
    case 'sonos': return <SonosForm action={action} onChange={onChange} />;
    case 'tuya': return <TuyaForm action={action} onChange={onChange} />;
    default: return assertNever(action);
  }
}
```

### `useRelativeTime` usage in `<AutomationRow>` (D-20)

```tsx
// Source: lib/hooks/useRelativeTime.ts:24 + CONTEXT D-20
import { useRelativeTime } from '@/lib/hooks/useRelativeTime';

function AutomationRow({ rule }: { rule: AutomationRule }) {
  const lastRun = useRelativeTime(
    rule.last_triggered_at !== null && rule.last_triggered_at !== undefined
      ? rule.last_triggered_at * 1000
      : null
  );
  return (
    <div>
      {/* ... */}
      <Pill muted>{lastRun ?? 'mai'}</Pill>
    </div>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Stub `types/automations.ts` with `id: string` + open-ended `[key: string]: unknown` | Re-export full discriminated unions from `docs/api/automations.types.ts`; `id: number` | Phase 180 | Type-safe editor; eliminates `as any` casts; 3 consumers need patches. |
| Bundle's 5-trigger picker | 2-trigger picker (API-truth) + 3 sensor types as condition leaves | Phase 180 (CONTEXT D-08) | UX semantically equivalent ("fire when sensor X" → cron poll + sensor leaf condition). |
| Bundle's 9-action `light_set` monolith + `plug_toggle` | 11 explicit action types (hue_light/hue_group/hue_scene + tuya replaces plug_toggle) | Phase 180 (CONTEXT D-09) | Better discoverability; matches API field structure. |
| Bundle's `useState`-only form management | Bundle pattern preserved (no library) + dirty-state ref + canonical-key JSON.stringify | Phase 180 | Minimal complexity; no library dep. |
| Legacy `app/automations/page.tsx` FormModal CRUD (name/description/enabled only) | Full editor at `/automazioni` (trigger + conditions + actions + advanced) | Phase 180 | Legacy stays; new route is parallel. |
| Phase 178 sheet primitives (`<Slider>`, `<Stepper>`, etc.) | Phase 180 ships its own primitives (`<TextInput>`, `<NumInput>`, `<SegmentedControl>`, `<TypeTile>`, etc.) | Phase 180 (D-04) | Visual scale differs; primitives are bundle-verbatim 38px/9px/0.5px. |
| Polling for list updates | NO polling, NO WebSocket — manual refresh on save/delete only | Phase 180 (D-25) | Background staleness acceptable; user controls refresh cadence. |

**Deprecated/outdated:**
- Stub `types/automations.ts` (Phase 180 deletes the inline interfaces and re-exports authoritative unions).
- `last_execution_at` field (stub-only; actual is `last_triggered_at`).
- `started_at`, `duration_ms` fields on AutomationExecution (stub-only; truth has `triggered_at`, no duration).

---

## Assumptions Log

> Per agent guidelines: every claim tagged `[ASSUMED]` lands here. The planner and discuss-phase use this section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Pre-existing test `__tests__/lib/automationsProxy.test.ts` does not perform deep-equality on the `AutomationRule` shape — it asserts URL paths and HTTP methods only. | Existing-Consumer Audit (test fixtures) | LOW — fixtures need rewrite for type validity, but tests would still pass even if fixtures didn't deep-match the API. Plan agent confirms by reading the test in full. |
| A2 | `ConfirmationDialog` from `@/app/components/ui/ConfirmationDialog` renders at z-index 50 (Tailwind), guaranteeing it stacks ABOVE the Sheet (z-index 200/201). | Sheet Primitive Integration | MEDIUM — if ConfirmationDialog uses a higher z-index (or no explicit z-index, defaults to auto), the unsaved-changes confirm could render BEHIND the Sheet backdrop. **Plan agent verifies** by reading `ConfirmationDialog.tsx` styles + cva or by visual smoke in the editor's Jest spec. |
| A3 | Legacy `app/automations/page.tsx` will compile with the D-05 type rewrite (line 86-90 POST body has only `name`/`description`/`enabled`, missing required `condition` + `actions`). The legacy create endpoint either accepts partial bodies via server-side defaults OR the legacy page is already producing 422s in the wild. | Existing-Consumer Audit Consumer 1 | MEDIUM — if TypeScript catches "missing condition" via strict mode, the legacy page tsc fails. **Plan agent confirms** by running `npx tsc --noEmit` after the type rewrite. If it fails, the legacy page needs minimal patches (cast or `as AutomationRuleCreate` with stub condition `{ type: 'always_true' }` and stub actions `[]` — but actions min length 1 means we can't ship empty). Worst case: the legacy create form must be deprecated or patched to require an action. **Surface to user as a planning gate.** |
| A4 | The 3 bundle "extra" condition types (`sensor_state_change`, `sensor_threshold`, `netatmo_temperature_threshold`) in the API ConditionNode union should NOT be exposed in the new `<ConditionItem>` type-select dropdown. Existing rules that contain them round-trip preserved. | API Surface Verification — ConditionNode | LOW — if user wants to author a sensor-leaf condition manually, they cannot through Phase 180 UI. CONTEXT D-08 frames the 3 extras as "still available as condition leaves" — does that include CREATE-time exposure? **Plan agent surfaces this for user confirmation.** Recommended: expose all 7 leaves in the picker (4 + 3 extras) so the editor is API-complete; copy-block defaults to the 4. |
| A5 | `useAutomationsList` hook returns `toggle(id, nextEnabled)` that performs optimistic update + PATCH dispatch. Optimistic state lives in the hook's local `rules[]`; rollback on error. | CONTEXT D-13 + Reusable Assets | LOW — pattern is canonical (Phase 86, 96 hooks). Risk is in the toggle interaction with the editor (if editor is open for the same rule when toggle fires, draft state collides with hook state). Recommendation: disable inline toggle when editor is open for that row. |
| A6 | Phase 175 `<Sheet>` `onClose` is called exactly once per dismissal vector (Escape, backdrop, close-button). Dirty-state guard wraps `onClose` at orchestrator level; does not fire twice. | Pitfall 7 | MEDIUM — Sheet.tsx file content shows `onPointerDownOutside={(e) => e.preventDefault()}` AND own backdrop `onClick={onClose}` — the suppression IS in place. **VERIFIED via file read**, downgrading to LOW. |
| A7 | The `JSON.stringify(canonicalize(...))` deep-equal pattern is sufficient for dirty-state tracking; full `dequal` library not needed. | Pitfall 3 | LOW — JSON-only data shapes (no Date, no Map, no Set, no functions). Edge cases: floating-point precision in `min_temp`/`max_temp` (NumInput parses as `parseFloat`). Plan emits a fixture that round-trips `21.5` and asserts no spurious dirty. |
| A8 | `app/components/ui/ConfirmationDialog` accepts `variant: 'default' \| 'danger'` and is the right primitive for both unsaved-changes (default variant) and delete (danger variant). | CONTEXT D-15, D-16 | LOW — file read shows `variant?: 'default' \| 'danger'` in ConfirmationDialogProps (line 18). VERIFIED, downgrading to LOW. |
| A9 | `next/navigation` `useRouter` / `useParams` are not needed in Phase 180; the editor is sheet-based not URL-based; no deep-linking. Pagination is local state. | Architectural Responsibility Map | LOW — confirmed by CONTEXT D-17 ("Pagination controls match the existing /stanze page pattern... local state"). |
| A10 | Phase 180 does NOT need the existing `Card`, `Button`, `Badge`, `Text`, `Skeleton`, `DataTable`, `FormModal` from `app/components/ui/` — the editor is bundle-verbatim inline-style. | CONTEXT D-02 | LOW — "No Tailwind classes for visual values inside any automations/ file" is explicit. |
| A11 | Last-triggered timestamp is in Unix SECONDS (not milliseconds), so `useRelativeTime` requires `× 1000`. | API Surface Verification | LOW — types.ts:229 explicit "Unix seconds". |

**If user declines A4:** ship the 4-leaf picker, add a fail-open ConditionItem fallback for legacy types similar to the action fallback in D-09b.
**If A3 fires (TS compile breaks):** add a Wave 1 mini-task to patch the legacy page's POST body OR cast the body explicitly with a stub condition. Decision deferred to plan-checker phase.

---

## Open Questions

1. **Should the 3 bundle "extra" condition types (sensor_state_change, sensor_threshold, netatmo_temperature_threshold) appear in the new `<ConditionItem>` type-select dropdown for CREATE flows, or only for EDIT-of-existing-rules?**
   - What we know: the API ConditionNode union has 7 leaf types (4 + 3); CONTEXT D-08 says the 3 "extras" "remain available as condition leaves under Condizioni tab".
   - What's unclear: does "available" mean creatable from the picker, or just preserved on round-trip if loaded from API?
   - Recommendation: expose all 7 in the dropdown (the API supports them; UI has no reason to hide). Plan agent surfaces this for user confirmation in plan-check.

2. **What happens when the legacy `app/automations/page.tsx` POST is called with only `{ name, description, enabled }` after the D-05 type rewrite?**
   - What we know: `AutomationRuleCreate` (types.ts:238) has `condition` REQUIRED and `actions` REQUIRED (min length 1).
   - What's unclear: Does TypeScript strict mode break the legacy page's compile? Does the runtime currently 422 (in which case the legacy create button is broken in production)?
   - Recommendation: plan agent runs `npx tsc --noEmit` after Plan 01 lands. If it errors, Plan 01 patches the legacy POST body (cast OR add stub condition+actions). If runtime tests show legacy create works against the live API, server-side has different defaults than the public types — flag for user but don't block.

3. **Should the existing `condition_not_met` / `partial_failure` / `skipped` execution statuses (now in scope post-D-05) get distinct visual badge variants, or fall through to "neutral"?**
   - What we know: stub had 3 statuses; truth has 5; legacy `getExecutionBadge` switch doesn't cover them.
   - What's unclear: visual hierarchy.
   - Recommendation: `partial_failure` → warning; `skipped` → neutral; `condition_not_met` → neutral. Italian labels: "Parzialmente fallita" / "Saltata" / "Condizione non soddisfatta". Plan agent emits in [rule_id] page patches.

4. **Where does `useAutomationsList` live: `app/hooks/useAutomationsList.ts` or `app/components/EmberGlass/automations/lib/useAutomationsList.ts`?**
   - What we know: CONTEXT D-23 says `app/hooks/useAutomationsList.ts`.
   - What's unclear: namespace coherence — Phase 179 lib helpers live INSIDE `rooms/lib/`, not at `app/hooks/`.
   - Recommendation: follow CONTEXT D-23 verbatim. The hook is a top-level data hook (analogous to `app/hooks/useToast.ts`), not a namespace internal.

5. **Does the inline row toggle (D-13) optimistically update before the PATCH resolves?**
   - What we know: D-13 says "Optimistic update on `useAutomationsList` state; rollback on error."
   - What's unclear: if the editor is OPEN for the same rule when the user toggles inline, both states must reconcile.
   - Recommendation: disable inline toggle when editor is open for that row. Or: only allow toggle when editor closed. Plan emits a Jest test.

---

## Project Constraints (from CLAUDE.md)

> CLAUDE.md is at `/Users/federicomanfredi/Sites/localhost/pannello-stufa/CLAUDE.md`. The directives below are mandatory and override defaults.

| Rule | Application to Phase 180 |
|------|--------------------------|
| **NEVER break existing functionality** | Legacy `/automations` and `/automations/[rule_id]` MUST still load and pass tests after D-05 type rewrite. Plan agent runs `npm run test:changed` after each consumer patch. |
| **WAIT for user confirmation before version updates** | No package.json changes in Phase 180. |
| **PREFER editing existing files over creating new** | Honored where possible: `types/automations.ts` is rewritten, not created; legacy consumers patched in-place; new code is the editor namespace which is intentionally new (no existing `EmberGlass/automations/` to edit). |
| **NEVER execute `npm run build` or `npm install`** | All verification uses `npm run test:changed`, `test:components`, `test:unit`, NOT build. |
| **ALWAYS create/update unit tests** | D-26 catalogs ~15 test files. Plan agent ensures each non-trivial component has a colocated `__tests__/*.test.tsx`. |
| **USE design system → /debug/design-system** | New primitives (TextInput, NumInput, SegmentedControl, etc.) MAY surface in Phase 182 DSREF page; not in scope for Phase 180. |
| **NEVER commit/push without explicit request** | Phase 180 commits are scoped per gsd-execute-phase wave gates (config `commit_docs: true` for docs only); never pushed. |
| **USE scoped test subsets in verification — NEVER `npm test` alone from agents or PLAN.md** | All `<verify><automated>` blocks in PLAN.md must use `npm test -- <paths>` or `test:changed` / `test:components` / `test:pages`. |

**Inline-style + var(--token) (CONTEXT D-02)** is a Phase 180 sub-rule, not a CLAUDE.md rule, but is enforced with the same authority. No Tailwind classes for visual values inside `automations/`.

**Zero `as any` (Phases 114-116)** is also project-wide. Discriminated-union narrowing + `assertNever` everywhere.

**No useMemo/useCallback decoration (Phases 71/95)** — React Compiler 1.0 handles auto-memoization. Plain functions only.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `@radix-ui/react-dialog` | Sheet primitive (transitively, via Phase 175) | YES | 1.1.14 (per package.json) | — |
| `@radix-ui/react-visually-hidden` | Sheet title fallback (Phase 175) | YES | (peer of dialog) | — |
| `lucide-react` | Icons (D-19) | YES | (existing dep, used by Phase 178/179) | — |
| `@auth0/nextjs-auth0` | Auth wrap (inherited from layout) | YES | — | — |
| Jest + React Testing Library | Unit tests | YES | (per existing __tests__) | — |
| Playwright | E2E spec | YES | (per existing tests/smoke/) | — |
| TypeScript strict + noUncheckedIndexedAccess | Type safety | YES | (locked Phase 47) | — |
| `react-hook-form` | NOT used by Phase 180 | YES (other consumers) | 7.x | — |
| `zod` | NOT used by Phase 180 | YES (other consumers) | — | — |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None.
**No package.json changes in Phase 180.**

---

## Validation Architecture

> nyquist_validation enabled per `.planning/config.json` (line 12). This block seeds VALIDATION.md.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29.x + React Testing Library + Playwright 1.x |
| Config file | `jest.config.ts` (project root); `playwright.config.ts` |
| Quick run command | `npm run test:changed` (Jest only — files modified vs HEAD) |
| Full suite command | `npm run test:ci` (release gates only — NEVER from agents per CLAUDE.md rule 8) |
| Component-scoped run | `npm test -- app/components/EmberGlass/automations` |
| Hook-scoped run | `npm test -- app/hooks/__tests__/useAutomationsList.test.ts` |
| Lib-scoped run | `npm test -- app/components/EmberGlass/automations/__tests__/lib` |
| Playwright spec run | `npx playwright test tests/smoke/automations-tab.spec.ts` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTO-01 | List shows N rows with pills (trigger / N condizioni / N azioni / lastRun) | unit + e2e | `npm test -- app/components/EmberGlass/automations/__tests__/AutomationRow.test.tsx` + `npx playwright test tests/smoke/automations-tab.spec.ts -g "AUTO-01"` | ❌ Wave 0 |
| AUTO-02 | "Nuova" button opens Sheet with Name + Description + 4 tabs with badge counts | unit + e2e | `npm test -- app/components/EmberGlass/automations/__tests__/AutomationsTab.test.tsx` + Playwright | ❌ Wave 0 |
| AUTO-03 | Trigger picker shows 2 tiles; cron form + manual_api_call info copy | unit | `npm test -- app/components/EmberGlass/automations/__tests__/sections/TriggerSection.test.tsx` | ❌ Wave 0 |
| AUTO-04 | Conditions support nested AND/OR groups depth ≤ 2; 4 leaf forms | unit + e2e | `npm test -- app/components/EmberGlass/automations/__tests__/ConditionGroup.test.tsx` + Playwright | ❌ Wave 0 |
| AUTO-05 | Actions list shows 11 type tiles in picker; reorder ↑/↓; remove | unit + e2e | `npm test -- app/components/EmberGlass/automations/__tests__/sections/ActionsSection.test.tsx` + `forms/ActionForms.test.tsx` + Playwright | ❌ Wave 0 |
| AUTO-06 | Avanzate exposes `min_interval_seconds` + `max_triggers_per_hour` | unit | `npm test -- app/components/EmberGlass/automations/__tests__/sections/AdvancedSection.test.tsx` | ❌ Wave 0 |
| AUTO-07 | Save disabled until name + ≥1 action; unsaved-changes guard fires | unit + e2e | `npm test -- app/components/EmberGlass/automations/__tests__/AutomationEditor.test.tsx` + Playwright | ❌ Wave 0 |
| AUTO-08 | Edit mode opens existing rule; Delete confirm fires | unit + e2e | Same Editor test + Playwright | ❌ Wave 0 |
| (D-10) | Mapper round-trip identity for 11 condition shapes | unit | `npm test -- app/components/EmberGlass/automations/__tests__/lib/automations-mappers.test.ts` | ❌ Wave 0 |
| (D-13) | PATCH body contains only changed fields; never `trigger`; never empty | unit | `npm test -- app/components/EmberGlass/automations/__tests__/lib/automations-mappers.test.ts -t "computePatchDelta"` | ❌ Wave 0 |
| (D-12) | Trigger is read-only in edit mode; tiles disabled, form fields readOnly | unit + e2e | TriggerSection + Playwright | ❌ Wave 0 |
| (D-25) | List does NOT auto-refetch (no polling, no WS subscription) | unit | useAutomationsList test asserts `setInterval` not called | ❌ Wave 0 |
| (Console errors) | No console errors during full editor flow | e2e | Playwright `collectConsoleErrors` | ❌ Wave 0 |
| (D-05) | Legacy `/automations` page-load still passes after type rewrite | e2e | `npx playwright test tests/smoke/page-loads.spec.ts -g "automations"` | ✅ exists |

### Sampling Rate

- **Per task commit:** `npm run test:changed` (sub-30s on touched files only).
- **Per wave merge:** `npm test -- app/components/EmberGlass/automations app/hooks/__tests__/useAutomationsList.test.ts __tests__/lib/automationsProxy.test.ts` (component + hook + proxy regression scope).
- **Phase gate:** `npm test -- app/components/EmberGlass/automations app/automations app/hooks/__tests__/useAutomationsList.test.ts __tests__/lib/automationsProxy.test.ts && npx playwright test tests/smoke/automations-tab.spec.ts tests/smoke/page-loads.spec.ts` (everything related, including legacy regression). Full `test:ci` reserved for release gate (out of scope for `/gsd-verify-work`).

### Wave 0 Gaps

> Test files that must be created in Wave 0 / Wave 1 (foundation) before implementation.

- [ ] `app/components/EmberGlass/automations/__tests__/AutomationsTab.test.tsx` — covers AUTO-01, AUTO-02 (orchestrator)
- [ ] `app/components/EmberGlass/automations/__tests__/AutomationEditor.test.tsx` — covers AUTO-02, AUTO-07, AUTO-08, D-12, D-15, D-16
- [ ] `app/components/EmberGlass/automations/__tests__/AutomationRow.test.tsx` — covers AUTO-01 (pills + toggle)
- [ ] `app/components/EmberGlass/automations/__tests__/ConditionGroup.test.tsx` — covers AUTO-04, D-11
- [ ] `app/components/EmberGlass/automations/__tests__/ConditionItem.test.tsx` — covers AUTO-04 (per-leaf form)
- [ ] `app/components/EmberGlass/automations/__tests__/ActionRow.test.tsx` — covers AUTO-05 (reorder, type-switch)
- [ ] `app/components/EmberGlass/automations/__tests__/sections/TriggerSection.test.tsx` — covers AUTO-03, D-12
- [ ] `app/components/EmberGlass/automations/__tests__/sections/ConditionsSection.test.tsx` — covers AUTO-04 root
- [ ] `app/components/EmberGlass/automations/__tests__/sections/ActionsSection.test.tsx` — covers AUTO-05 picker
- [ ] `app/components/EmberGlass/automations/__tests__/sections/AdvancedSection.test.tsx` — covers AUTO-06
- [ ] `app/components/EmberGlass/automations/__tests__/forms/TriggerForms.test.tsx` — covers AUTO-03 forms
- [ ] `app/components/EmberGlass/automations/__tests__/forms/ConditionForms.test.tsx` — covers AUTO-04 forms
- [ ] `app/components/EmberGlass/automations/__tests__/forms/ActionForms.test.tsx` — covers AUTO-05 forms (11 forms + JSON parse)
- [ ] `app/components/EmberGlass/automations/__tests__/lib/automations-config.test.ts` — defaults/factories invariants
- [ ] `app/components/EmberGlass/automations/__tests__/lib/automations-mappers.test.ts` — round-trip 11 shapes + PATCH delta
- [ ] `app/components/EmberGlass/automations/__tests__/lib/countConditions.test.ts` — leaf=1, always_true=0, recursive
- [ ] `app/components/EmberGlass/automations/__tests__/lib/describeTrigger.test.ts` — 2 trigger types + null
- [ ] `app/hooks/__tests__/useAutomationsList.test.ts` — mock proxy; create/update/delete/toggle each refetch + toast
- [ ] `tests/smoke/automations-tab.spec.ts` — Playwright e2e (D-27 9 steps + console-errors)
- [ ] Updated fixtures in `__tests__/lib/automationsProxy.test.ts` — id type flip + field rename + new required fields

**Framework install:** None — Jest, RTL, Playwright all present.

---

## Security Domain

> `security_enforcement` not explicitly disabled in config; treat as enabled. Phase 180 is UI-only and consumes an internal proxy; the security surface is small but non-empty.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Auth0 wrap inherited from `app/layout.tsx` ClientProviders. New `/automazioni` page requires authenticated session. |
| V3 Session Management | no | Auth0 owns. |
| V4 Access Control | yes | `automationsProxy` uses X-API-Key on all requests. The HA proxy enforces auth. Phase 180 introduces no new endpoints. |
| V5 Input Validation | yes | Required: client-side validation of `http_webhook` JSON payload (parse-on-save); server validates everything else. |
| V6 Cryptography | no | No new crypto surface. |

### Known Threat Patterns for Phase 180 stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| User pastes malicious JSON in `http_webhook.payload` textarea | Tampering | `JSON.parse()` in try/catch; no `eval`; payload is sent verbatim to backend which is responsible for output sanitization. Frontend block-on-parse-fail prevents accidental server 422. |
| User crafts a cron expression that DOS's the scheduler | DoS | Backend's job — frontend renders the string verbatim. No client-side validation beyond `<TextInput>`. |
| Accidental PATCH body sends sensitive fields (e.g., enabled=false in deletion intent) | Tampering | `computePatchDelta` is deterministic; explicit field whitelist per `AutomationRulePatch`. Trigger field structurally absent (TS-locked). |
| XSS in description / name / cron / message fields rendered in pills | Tampering | React's default text-node escaping handles. No `dangerouslySetInnerHTML` used. Verified. |
| User toggles row → PATCH races with optimistic state → enabled goes wrong | Tampering (logic) | Rollback on error; D-13 explicit. Test asserts. |
| CSRF on PATCH/DELETE | Tampering | `automationsProxy` uses X-API-Key (server-shared secret), not cookie auth at the HA layer; CSRF n/a for that vector. Auth0 session protects the Next.js boundary. |

**No new security surfaces.** The X-API-Key proxy transport is established (Phase 84). All client mutations flow through the same proxy — no direct calls to HA from the browser.

---

## Sources

### Primary (HIGH confidence) — verified by direct file read or codebase grep

- `docs/api/automations.types.ts` — full file read. Authoritative TypeScript unions for trigger / condition / action / rule / patch / execution / WS event.
- `docs/api/automations.md` — grep for `tuya|hue_light|hue_group|hue_scene|thermorossi`; confirms 11 action types and field discriminator pattern.
- `app/components/EmberGlass/Sheet.tsx` — full file read; confirms props, scroll-lock, z-index, forceMount, backdrop tap suppression.
- `app/components/EmberGlass/index.ts` — full read; confirms barrel export pattern.
- `app/components/EmberGlass/rooms/index.ts` — full read; confirms namespace barrel pattern Phase 180 will mirror.
- `app/stanze/page.tsx` — full read; confirms route mount pattern for D-29.
- `app/automations/page.tsx` — full read; identifies Consumer 1 audit issues.
- `app/automations/[rule_id]/page.tsx` — full read; identifies Consumer 2 audit issues (status switch, started_at, duration_ms, created_at).
- `lib/automations/automationsProxy.ts` — full read; confirms zero-change required.
- `lib/hooks/useRelativeTime.ts` — full read; confirms `formatRelativeTime` + `useRelativeTime(tsMs: number | null)` signature.
- `app/components/ui/ConfirmationDialog.tsx` — partial read (first 40 lines); confirms props (`isOpen`, `onClose`, `onConfirm`, `title`, `description`, `confirmLabel`, `cancelLabel`, `variant: 'default' \| 'danger'`).
- `tests/smoke/rooms-tab.spec.ts` — full read; confirms helper functions + route mock pattern + describe/test structure for Phase 180 Playwright spec.
- `app/components/EmberGlass/rooms/__tests__/RoomsTab.test.tsx` (partial) — confirms Jest mock pattern for proxy + useUser + VersionContext.
- `__tests__/lib/automationsProxy.test.ts` (partial) — identifies fixture rewrite scope.
- `.planning/inbox/ember-glass-design/project/components/automations.jsx` — full 934-LOC read; line-by-line target-file mapping.
- `.planning/phases/180-automations-tab-full-editor/180-CONTEXT.md` — full read; locks all decisions D-01..D-32.
- `.planning/phases/175-glass-primitives-press-animation-sheet/175-CONTEXT.md` — full read; confirms Sheet primitive contract.
- `.planning/REQUIREMENTS.md` — full read; AUTO-01..08 verbatim.
- `.planning/config.json` — full read; confirms `nyquist_validation: true`, `use_worktrees: true`, `parallelization: true`, `mode: yolo`.
- `types/automations.ts` (current stub) — full read; confirms 30 LOC inline interface to be replaced.

### Secondary (MEDIUM confidence)

- npm registry version checks — not performed (no new package installs in Phase 180; existing deps inherited from package.json verified by Phases 178-179).
- Phase 178 sheet consumer pattern — `ls EmberGlass/sheets/` confirmed exists; not read in detail (out of scope per research focus).

### Tertiary (LOW confidence)

- None — all claims in this RESEARCH.md tie back to verified file reads or CONTEXT lockdown.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every dep verified by package.json grep + existing-phase precedent.
- Architecture: HIGH — single tier (browser/client) with one mapper layer; everything orchestrates through `<AutomationsTab>` state.
- Pitfalls: HIGH — pitfalls 1-8 derived from concrete API/UI shape mismatches, all anchor to specific file:line evidence.
- Mapper round-trip: HIGH — fixture catalog enumerates all 11 condition shapes against the verified type union.
- Existing-consumer audit: HIGH — every consumer file read; every line:column-level fix documented.
- Sheet integration: HIGH — Sheet.tsx file read confirms every claimed behavior.

**Risk areas (require user confirmation in plan-check):**
1. Open Question #1 (4-leaf vs 7-leaf condition picker).
2. Open Question #2 (legacy /automations POST tsc compatibility post-D-05).
3. Open Question #3 (extended execution status badge variants).
4. CONTEXT D-08c (SC-#3 deviation: 2 trigger types vs 5).
5. CONTEXT D-09 (action catalog 11 types vs 9 bundle labels).

**Research date:** 2026-04-30
**Valid until:** 2026-05-30 (30 days for stable v20.0 design surface; the API truth is locked).

## RESEARCH COMPLETE
