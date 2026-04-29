# Phase 180: Automations Tab Full Editor - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning
**Mode:** `--auto --chain` — gray areas auto-resolved with recommended defaults grounded in ROADMAP.md SC-#1..#5, REQUIREMENTS.md AUTO-01..08, the design bundle (`automations.jsx`, 934 LOC), the live API surface (`docs/api/automations.md`, `docs/api/automations.types.ts`), and Phases 174/175/177/178/179 locked CONTEXT/UI-SPEC.

<domain>
## Phase Boundary

Ship the new **Automations tab** for the Ember Glass app shell — a fully data-driven view that:

1. Lists every automation rule from `GET /api/v1/automations` as a glass row (icon + name + description + InlineToggle + status pills: trigger summary + N condizioni + N azioni + last-run relative).
2. Mounts a full-screen editor inside the Phase 175 `<Sheet>` primitive — Name + Description fields + 4 inner tabs (Trigger / Condizioni / Azioni / Avanzate) with badge counts on the latter three.
3. Trigger tab: tile-grid picker with type-specific config form (cron expression + 5-segment cron hint, manual_api_call info copy).
4. Condizioni tab: nested AND/OR group editor — depth-2 max — with per-group operator toggle, colored side-bars, "+ Condizione" / "+ Gruppo" affordances; 4 leaf condition forms (`time_window`, `device_state`, `temperature_range`, `always_true`).
5. Azioni tab: ordered action list — type picker grid → per-row inline form, ↑/↓ reorder, remove; supports the **9 bundle action labels** mapped to **11 actual API action types**.
6. Avanzate tab: `min_interval_seconds` + `max_triggers_per_hour` numeric inputs.
7. Save semantics: real `POST` (create) / `PATCH` (edit) / `DELETE` against `/api/v1/automations/*`; optimistic refetch on success.
8. Save button disabled until `name` non-empty AND `actions.length ≥ 1`. Unsaved-changes guard on close. Delete (with confirm) in edit mode.

In scope (file layout under `app/components/EmberGlass/automations/`):

- `AutomationsTab.tsx` — orchestrator: paginated fetch, owns `editingRule: AutomationRule | NewDraft | null` state, mounts list + Sheet wrapper.
- `AutomationRow.tsx` — list row (verbatim bundle layout, real data wired).
- `AutomationEditor.tsx` — Sheet body: Name/Description + 4-tab segmented control + section bodies + footer (Annulla / Salva / Elimina).
- `sections/TriggerSection.tsx` — 2-col tile picker + per-type config wrapper.
- `sections/ConditionsSection.tsx` — wraps the recursive `<ConditionGroup>` at depth=0.
- `sections/ActionsSection.tsx` — list + type picker overlay + add CTA.
- `sections/AdvancedSection.tsx` — cooldown numeric inputs.
- `ConditionGroup.tsx` — recursive AND/OR group; toggleOp, addCondition, addGroup, removeItem, depth-aware bar color.
- `ConditionItem.tsx` — leaf with type select + per-type form + remove.
- `ActionRow.tsx` — numbered row with type select + per-type form + ↑/↓/remove icon buttons.
- `forms/TriggerForms.tsx` — `<ScheduleCronForm>` (cron + `<CronHint>`), `<ManualApiCallForm>` (info copy). **(2 forms, see D-08 below.)**
- `forms/ConditionForms.tsx` — `<TimeWindowForm>`, `<DeviceStateForm>`, `<TemperatureRangeForm>`, `<AlwaysTrueForm>`.
- `forms/ActionForms.tsx` — 11 forms (one per API action type, see D-09 below).
- `primitives/{FieldLabel,TextInput,NumInput,SegmentedControl,TwoCol,TypeTile,AddChip,Pill,CronHint,IconBtn}.tsx` — bundle primitives (verbatim styling); independent from Phase 178 sheets-namespace primitives because the visual scale is different (segment heights, tile padding) — see D-04.
- `lib/automations-config.ts` — `TRIGGER_TYPES`, `CONDITION_TYPES`, `ACTION_TYPES` catalogs (label + Italian description + lucide icon + tone) **plus** `defaultTrigger(type)`, `defaultCondition(type)`, `defaultAction(type)` factories that return API-shaped objects (not bundle-shaped).
- `lib/automations-mappers.ts` — `apiToDraft(rule: AutomationRule): UIDraft` and `draftToApi(draft: UIDraft): AutomationRuleCreate | AutomationUpdate` — handles the root-condition normalization (bare leaf ↔ wrapped AND group with single child).
- `lib/countConditions.ts` — pure, recursive count of leaf nodes (used for tab badge + status pill).
- `lib/describeTrigger.ts` — pure formatter returning the trigger status pill string ("⏰ 0 22 * * *", "Manuale", etc.).
- `types.ts` — `UIDraft` (UI-internal shape with always-AND root group), `UIConditionGroup`, `UIConditionItem` discriminated unions; re-exports `AutomationRule`, `TriggerType`, `ConditionNode`, `ActionItem` from `@/types/automations` (see D-05).
- `index.ts` — barrel re-exporting `AutomationsTab` + sub-components for downstream consumers (Phase 181 mounts AutomationsTab in the glass tab bar; Phase 182 references primitives in DSREF page).
- `app/automazioni/page.tsx` — new Next.js route. `'use client'` + `<AutomationsTab />` (with the same auth wrapping pattern Phase 179 confirmed in `app/stanze/page.tsx`). Italian route name matches Phase 181 NAV-02 label and explicitly avoids collision with the existing `/automations` settings-CRUD page (which stays untouched for v20.0).
- `app/hooks/useAutomationsList.ts` — paginated fetch + create + update + delete + toggle helpers; uses the existing `automationsProxy` (`lib/automations/automationsProxy.ts`).
- `types/automations.ts` — **rewrite** to re-export everything from `docs/api/automations.types.ts` and add a thin `AutomationCreate = AutomationRuleCreate` / `AutomationUpdate = AutomationRulePatch` alias used by `automationsProxy` (see D-05).
- Jest unit tests — one spec per non-trivial component (`AutomationEditor`, `AutomationRow`, `ConditionGroup`, `ActionRow`, each section, each form, `countConditions` fixtures, mapper round-trip fixtures, `describeTrigger` cases).
- Playwright spec — new `tests/playwright/automations-tab.spec.ts`: open `/automazioni`, assert N rows render, click Nuova, fill name + add `log_event` action, save, verify list updated, edit existing, toggle enabled, delete with confirm, verify no console errors (reuse `collectConsoleErrors` from Phase 51/97).

Out of scope (future phases or explicitly deferred):

- **Replacing or deleting the existing `/automations` settings-CRUD page** (`app/automations/page.tsx`, `app/automations/[rule_id]/page.tsx`) — same pattern as Phase 179 D-04 (kept the v15.0 `/rooms` admin page untouched). Phase 180 ships at the new `/automazioni` route. A cleanup phase post-181 decides the old route's fate. **Plans MUST NOT touch `app/automations/**`.**
- **Wiring the new `/automazioni` route into a global navigation bar.** Phase 181 (Glass Bottom Tab Bar) handles `Home / Stanze / Automazioni / Altro` chrome wiring. For Phase 180 the route exists and is reachable via direct URL or one-line link only.
- **Bundle's 3 "extra" trigger types** (`sensor_state_change`, `sensor_threshold`, `netatmo_temperature_threshold`) — **NOT supported by the live API as triggers** (they are condition leaves only). REQUIREMENTS.md AUTO-03 lists 5 trigger types but `docs/api/automations.types.ts:26` proves `TriggerType` only covers `schedule_cron` + `manual_api_call`. v20.0 is UI-only (REQUIREMENTS.md "Out of Scope: Backend / API route changes"), so we cannot extend the trigger union. **Decision below in D-08 ships the 2 actual trigger types and surfaces this deviation explicitly. The 3 sensor-trigger concepts remain available as condition leaves under Condizioni tab, which preserves the user intent ("fire on cron poll, only if sensor X crosses threshold Y").**
- **Capabilities API integration** (`/api/v1/capabilities/*`) — could auto-populate device-id dropdowns / metric enums. Out of scope for Phase 180; catalog is hardcoded per bundle. Tracked in `<deferred>` for v20.x.
- **`POST /trigger` (manual run) and `POST /evaluate` (dry-run)** — useful editor affordances ("Test Run", "Trace Conditions"). Out of scope for Phase 180; the editor only ships CRUD. Tracked in `<deferred>`.
- **Execution history view inside the editor** — bundle has no execution log panel. The existing `/automations/[rule_id]` page covers that. Out of scope.
- **Drag-and-drop action reorder** — bundle uses ↑/↓ icon buttons. Phase 180 ships exactly that; no @dnd-kit, no drag library.
- **Real-time execution events via WebSocket** — `docs/api/automations.md:925-985` (skim) documents a WS subscription. Phase 180 does NOT subscribe; the list refreshes on save/delete only. Out of scope.
- **Visual cron builder** (`AUTO-FUT-01` in REQUIREMENTS.md) — the CronHint 5-segment breakdown stays read-only; user types a raw cron string. Future phase.
- **Per-action retry/timeout configuration** (`AUTO-FUT-02`) — backend accepts no such field today. Future phase.
- **Action templates / library** (`AUTO-FUT-03`) — future phase.
- **`active_hours_start` / `active_hours_end` API fields** (`docs/api/automations.types.ts:225,230`) — backend supports a separate "active hours" gate; the bundle does not surface it. Phase 180 omits these inputs; the rule fields default to null on create and pass through on PATCH. If a rule loaded from the API has them set, they are preserved verbatim on save (mapper round-trip). Tracked in `<deferred>`.
- **Hue scene picker by-id** — the `hue_scene` action requires both `group_id` and `scene_id` strings; without a scenes-list dropdown the user must type IDs. Phase 180 ships free-text inputs. Capabilities API integration (deferred above) would replace this.
- **Action `move-to-group` / batch reordering** — out of scope.
- **PATCH `trigger` field** — API explicitly excludes `trigger` from PATCH (`docs/api/automations.types.ts:283-294`: "no `trigger` field — by design"). See D-12 for the UX consequence (trigger picker is read-only in edit mode with explanatory copy).
- **Phase 181 (Glass Bottom Tab Bar) and Phase 182 (Design System Reference Page v2).**

</domain>

<decisions>
## Implementation Decisions

### Namespace, file layout, conventions

- **D-01:** [informational] All new automations-tab files live under `app/components/EmberGlass/automations/` — sibling to `app/components/EmberGlass/cards/` (Phase 177), `app/components/EmberGlass/sheets/` (Phase 178), `app/components/EmberGlass/rooms/` (Phase 179). Re-exported from `app/components/EmberGlass/index.ts` so Phase 181 can import via `@/app/components/EmberGlass`.
- **D-02:** [informational] Inline-style + `var(--token)` convention from Phase 174 D-12 / Phase 175 D-08 / Phase 176 D-23 / Phase 177 D-02 / Phase 178 D-02 / Phase 179 D-02 is mandatory. **No Tailwind classes for visual values inside any `automations/` file** — bundle is the source of truth and bundle is inline-style. Layout flex/grid + spacing tokens stay inline too. Buttons / Sheet / Inline toggle reuse the EmberGlass primitives (`<Pressable>`, `<Sheet>`, `<InlineToggle>`).
- **D-03:** [informational] `AutomationsTab` itself uses `'use client'` (state-bearing — owns `editingRule` + paginated fetch). All sub-components are client components. No server-component refactor in this phase.
- **D-04:** **Primitives are NOT shared with Phase 178 sheets/primitives.** Bundle's `<TextInput>` is 38px tall with `0.5px solid rgba(255,255,255,0.08)` border + 9px radius; Phase 178's `<Slider>` / `<Stepper>` are different visual primitives entirely. Phase 180 ships its own primitives under `automations/primitives/` to keep the editor layout decoupled. Renaming/colocating later is a cleanup-phase decision (same pattern as Phase 179 D-01 footnote).
- **D-05:** **Replace the stub `types/automations.ts`** (currently incomplete: `id: string`, missing trigger/condition/actions) with a re-export of the full discriminated unions from `docs/api/automations.types.ts`. Concretely:
  ```ts
  // types/automations.ts
  export * from '@/docs/api/automations.types';
  import type { AutomationRule, AutomationRuleCreate, AutomationRulePatch } from '@/docs/api/automations.types';
  export type { AutomationRule, AutomationRuleCreate, AutomationRulePatch };
  /** @deprecated alias kept for legacy imports — use AutomationRuleCreate */
  export type AutomationCreate = AutomationRuleCreate;
  /** @deprecated alias kept for legacy imports — use AutomationRulePatch */
  export type AutomationUpdate = AutomationRulePatch;
  /** @deprecated alias kept for legacy imports — use AutomationExecution from authoritative types */
  export type { AutomationExecution } from '@/docs/api/automations.types';
  ```
  This carries one breaking-shape change: `AutomationRule.id` flips from `string` to `number` (the API actually returns `number` per `docs/api/automations.types.ts:219`). Plan agent **MUST audit** every consumer of `types/automations.ts` and patch type holes before the editor lands. Known consumers from grep:
  - `app/automations/page.tsx` (legacy CRUD page — stays in place per scope; needs `String(rule.id)` casts where it stuffs ids into a router URL).
  - `app/automations/[rule_id]/page.tsx` (same).
  - `lib/automations/automationsProxy.ts` — `getAutomation(ruleId: string)` and `updateAutomation(ruleId: string, ...)` and `deleteAutomation(ruleId: string)` and `getExecutions(ruleId: string, ...)` — keep `ruleId` typed as `string` (URL param) and let callers stringify. No proxy-API change required.
  - `__tests__/lib/automationsProxy.test.ts` — adjust id fixtures from string to number.
  Plan agent emits a fix plan for these as part of the foundation wave.
- **D-06:** **Route mount.** New `app/automazioni/page.tsx` renders `<AutomationsTab />` only. The page is `'use client'` and reuses the existing auth-guard pattern from `app/stanze/page.tsx` (Phase 179 D-04). The existing `/automations` and `/automations/[rule_id]` routes are **untouched** — same scope discipline as Phase 179 left `/rooms` alone. The route name is `/automazioni` (Italian, matches NAV-02 from Phase 181).
- **D-07:** [informational] Sheet integration: the editor mounts via `<Sheet open={!!editingRule} onClose={handleClose} title={isNew ? 'Nuova automazione' : 'Modifica automazione'}>...</Sheet>` from `@/app/components/EmberGlass/Sheet` (Phase 175). Title prop is REQUIRED (Phase 175 D-12 — VisuallyHidden Title fallback only when `title` unset). Phase 175's Pressable + scroll-lock + Escape handling apply automatically.

### Trigger model — API truth wins over REQUIREMENTS.md

- **D-08:** **Ship 2 trigger types in the picker — `schedule_cron` + `manual_api_call`.** This deviates from REQUIREMENTS.md AUTO-03 ("supports all 5 documented types from `docs/automations.md`") because the live API only exposes 2 trigger types. The "5 types" wording in AUTO-03 conflated bundle aspirations with API reality — `docs/api/automations.types.ts:16-26` is authoritative:
  ```ts
  export type TriggerType = ScheduleCronTrigger | ManualApiCallTrigger;
  ```
  The bundle's 3 extras (`sensor_state_change`, `sensor_threshold`, `netatmo_temperature_threshold`) are **condition leaves** in the API (`ConditionNode` union, lines 32-100), and remain available under the Condizioni tab. The user intent ("trigger when sensor X crosses Y") translates to: `trigger: schedule_cron(*/1 * * * *)` poll OR `trigger: manual_api_call`, plus a sensor leaf in the Conditions root. Phase 180 ships exactly that mapping.
  The trigger picker UI renders only 2 tiles (no UI for the 3 unsupported triggers — would 422 on save). The plan agent MAY surface this in the planning UAT for the user to confirm wording on AUTO-03 before execution.
  Bundle copy verbatim:
  - `schedule_cron` — label "Pianificazione", icon `Clock`, tone `#5eafff`, desc "Ora o cron schedule".
  - `manual_api_call` — label "Manuale", icon `Power`, tone `var(--text-2)`, desc "Attivata solo via app o API".
- **D-08a:** **`schedule_cron` form** uses bundle's `<CronHint>` 5-segment breakdown (min, ora, giorno, mese, giorno sett.) — read-only labels under the cron `<TextInput mono>`. Default cron: `"0 8 * * *"`. No raw cron validation client-side; backend 422 surfaces via toast on save (existing toast hook from `app/hooks/useToast`).
- **D-08b:** **`manual_api_call` form** renders only static info copy ("Questa automazione si avvia solo quando viene invocata manualmente dall'app o via API.") matching bundle line 391-394.
- **D-08c:** **Required acceptance-criteria adjustment.** SC-#3 from ROADMAP.md says "Trigger picker supports all 5 documented types" — this CANNOT be met as written. Plan agent MUST surface this and emit an adjusted SC-#3 in PLAN.md: "Trigger picker supports the 2 actual API trigger types (`schedule_cron`, `manual_api_call`) with type-specific forms; the 3 bundle 'extras' are surfaced as condition leaves under the Condizioni tab." User confirms in plan-checker phase.

### Action catalog — 9 bundle labels → 11 API types

- **D-09:** **Action picker UI ships 11 tiles (one per API action type)**, not 9 bundle labels. REQUIREMENTS.md AUTO-05 lists 9 generic names that conflict with the live API surface; `docs/api/automations.types.ts:209-220` is authoritative:
  ```ts
  export type ActionItem = NetatmoSetRoomTempAction | NetatmoSetHomeModeAction
    | NetatmoSwitchScheduleAction | HttpWebhookAction | LogEventAction
    | HueLightAction | HueGroupAction | HueSceneAction | ThermorossiAction
    | SonosAction | TuyaAction;
  ```
  Bundle's 9 "labels" map to API types per below. The picker grid renders each in this order (UX-optimized, matches bundle ordering for the first 9, with hue_group + hue_scene appended after hue_light, and tuya replacing plug_toggle):
  | Picker tile | API `type` | Bundle label | Italian label | Tone | Icon |
  |---|---|---|---|---|---|
  | Imposta temp. stanza | `netatmo_set_room_temp` | netatmo_set_room_temp | Imposta temp. stanza | `#5eafff` | Thermometer |
  | Modalità casa | `netatmo_set_home_mode` | netatmo_set_home_mode | Modalità casa | `#ffb84a` | Home |
  | Cambia programma | `netatmo_switch_schedule` | netatmo_switch_schedule | Cambia programma | `#b080ff` | Calendar |
  | Comando stufa | `thermorossi` | stove_set_power | Comando stufa | `var(--accent)` | Flame |
  | Luce | `hue_light` | (subset of light_set) | Luce singola | `#f5c84a` | Lightbulb |
  | Gruppo luci | `hue_group` | (subset of light_set) | Gruppo luci | `#f5c84a` | Lightbulb |
  | Scena Hue | `hue_scene` | (subset of light_set) | Scena Hue | `#f5c84a` | Sparkles |
  | Presa | `tuya` | plug_toggle | Presa | `#ffb84a` | Plug |
  | Comando Sonos | `sonos` | sonos_control | Comando Sonos | `#b080ff` | Music |
  | Webhook HTTP | `http_webhook` | http_webhook | Webhook HTTP | `#5eafff` | Zap |
  | Scrivi log | `log_event` | log_event | Scrivi log | `var(--text-2)` | AlertCircle |
- **D-09a:** **Per-action form fields** match `docs/api/automations.types.ts` field-for-field. Concretely (see authoritative types for full constraints):
  - `netatmo_set_room_temp` — `home_id` (text), `room_id` (text), `mode` (segmented: manual / home), `temp` (NumInput, 5–30, nullable). Bundle hardcoded `room` text; we expose both ids.
  - `netatmo_set_home_mode` — `home_id` (text), `mode` (segmented: schedule / away / hg).
  - `netatmo_switch_schedule` — `home_id` (text), `schedule_id` (text).
  - `thermorossi` — `command` (segmented: ignite / shutdown / set_power / set_fan / set_water_temp), `power_level` (NumInput 1–5, only when command=`set_power`), `fan_level` (1–6, only when `set_fan`), `water_temp` (40–80, only when `set_water_temp`). Other fields hidden conditionally.
  - `hue_light` — `light_id` (text), `on` (segmented on/off, nullable), `brightness` (NumInput 1–254, nullable), `color_temp` (153–500, nullable), `hue` (0–65535, nullable), `sat` (0–254, nullable). Phase 180 renders all 6 fields; user fills only what they want, others stay null on save.
  - `hue_group` — `group_id`, `on`, `brightness`, `color_temp`. (no hue/sat per types.ts:161-166.)
  - `hue_scene` — `group_id` (text), `scene_id` (text).
  - `sonos` — `speaker_uid` (text), `command` (segmented: play / pause / set_volume / switch_source), `volume` (NumInput 0–100, only when `set_volume`), `source` (segmented tv / line_in, only when `switch_source`).
  - `tuya` — `device_id` (text), `command` (segmented: set_status / set_timer), `on` (segmented on/off, only when `set_status`), `timer_seconds` (0–86400, only when `set_timer`).
  - `http_webhook` — `url` (mono text), `method` (segmented GET / POST), `payload` (textarea — JSON-as-string, optional, nullable). On save: `JSON.parse(payload)` if non-empty; if parse fails, block save with inline error "JSON non valido".
  - `log_event` — `message` (text).
- **D-09b:** **Mapping / round-trip rule for `apiToDraft`** — when an existing rule is loaded that uses an action type the picker DOES expose (all 11), preserve verbatim. There are no orphan API action types because the catalog is exhaustive. If the backend ever introduces a new action type (not in the 11), the editor renders a generic "Tipo non supportato" row with read-only JSON dump — fail-open rather than data loss. Plan agent specs that fallback in `<ActionRow>`.

### Condition model

- **D-10:** **Root-condition normalization.** API `condition: ConditionNode` is a single node (leaf or composite). Bundle treats root as always an AND group. Mapper rules:
  - `apiToDraft(rule)`:
    - if `rule.condition.type === 'always_true'` → `draft.conditions = { op: 'AND', items: [] }`.
    - if `rule.condition.type === 'and' || 'or'` → `draft.conditions = { op: rule.condition.type.toUpperCase(), items: rule.condition.conditions.map(asUIItem) }`.
    - else (leaf) → `draft.conditions = { op: 'AND', items: [{ kind: 'cond', ...leaf }] }` — wrap single leaf for editing.
  - `draftToApi(draft)`:
    - if `draft.conditions.items.length === 0` → emit `{ type: 'always_true' }`.
    - if `length === 1 && items[0].kind === 'cond'` → emit the leaf directly (avoid wrapping a single leaf in AND).
    - else → emit `{ type: draft.conditions.op.toLowerCase() as 'and'|'or', conditions: items.map(asApiNode) }`.
  - Recursive: nested groups follow the same rules. Empty nested groups serialize as `{ type: 'always_true' }`. Plan agent unit-tests every branch.
- **D-11:** **Nesting depth limit = 2.** Matches REQUIREMENTS.md AUTO-04 ("up to 2 levels deep") and bundle line 487 (`{depth < 2 && <AddChip onClick={addGroup}>`). Concretely: root = depth 0; one nested group = depth 1; that group's nested group = depth 2; depth-2 group hides the "+ Gruppo" button. Plan agent enforces in `<ConditionGroup>` and asserts in Jest.

### Editing semantics — PATCH limitation

- **D-12:** **Trigger is read-only in edit mode.** API PATCH does not accept `trigger` (`docs/api/automations.types.ts:283-294`: "no `trigger` field — by design"). UX:
  - In **create mode** (`isNew`), Trigger tab is fully editable (tile picker + form).
  - In **edit mode**, Trigger tab tiles render as visually disabled (cursor: not-allowed, no hover state, no `onClick`); the type-specific form fields are read-only (`<input readOnly>` / `<select disabled>`). An inline note appears at the top of the Trigger section: "Per cambiare il trigger, elimina e ricrea l'automazione."
  - This is a UX shortcut — not an arbitrary limitation. A delete+recreate flow would lose execution history on the rule, which the user may not want as a side effect. Surfacing the constraint in copy is the safer default. Tracked in `<deferred>` for a future "Re-create with new trigger" CTA if the user requests it.
- **D-13:** **Save call dispatch.**
  - Create: `POST /api/v1/automations` with full `AutomationRuleCreate` body. Refetch list on 201, close sheet, toast "Automazione creata".
  - Edit: `PATCH /api/v1/automations/{id}` with **only changed fields** (delta computed from `original` snapshot). Trigger never included. Refetch on 200, close sheet, toast "Automazione aggiornata".
  - Delete: `DELETE /api/v1/automations/{id}` after confirm. Refetch list on 204, close sheet, toast "Automazione eliminata".
  - Toggle row enable/disable: `PATCH /api/v1/automations/{id}` with `{ enabled: !current }` only. Optimistic update on `useAutomationsList` state; rollback on error. No sheet open. Toast on error only (success is silent — InlineToggle is its own feedback).
  - All errors surface as `useToast.error(...)` with the API-returned message when present, else "Errore durante il salvataggio".
- **D-14:** **Save guard.** Save button is `disabled` (and styled muted per bundle line 312-318) until `draft.name.trim().length >= 1 && draft.actions.length >= 1`. SC-#5 lock. Action JSON-payload parse failure (D-09a `http_webhook`) ALSO blocks save with inline error row above the footer.
- **D-15:** **Unsaved-changes guard.** Editor tracks `original` (immutable snapshot of the rule on open, or `null` for new) and `draft` (current). On close attempt (Annulla button, Sheet onClose, Escape, backdrop click), if `JSON.stringify(original) !== JSON.stringify(draft)` → spawn `<ConfirmationDialog>` ("Hai modifiche non salvate. Chiudere lo stesso?", primary="Chiudi senza salvare" / secondary="Continua a modificare"). Confirmation closes; secondary keeps the editor open. Reuses the existing `app/components/ui/ConfirmationDialog` component (verified by Phase 119 / 121 / 122).
- **D-16:** **Delete in edit mode.** Footer in edit mode shows three buttons: `[Elimina]` (red, leftmost) / `[Annulla]` / `[Salva modifiche]`. Clicking Elimina spawns `<ConfirmationDialog>` ("Eliminare l'automazione '${name}'?", danger primary="Elimina" / secondary="Annulla"). On confirm → `DELETE`, close sheet on success.
- **D-17:** **Pagination.** List uses `useAutomationsList({ pageSize: 20 })` — same page size as the legacy `/automations` page. Pagination controls match the existing /stanze page pattern (Phase 179) — likely unnecessary for typical user counts, but kept for parity with legacy. Plan agent verifies no regressions.

### Catalog & data formatting

- **D-18:** **Bundle catalogs (`TRIGGER_TYPES`, `CONDITION_TYPES`, `ACTION_TYPES`) are the source of truth for icons + tones + Italian copy + descriptions.** Mapped to the **11 API action types** per D-09. Concrete file: `lib/automations-config.ts` exports:
  - `TRIGGER_TYPES: ReadonlyArray<{ id: TriggerType['type']; label: string; Icon: LucideIcon; tone: string; desc: string }>` — 2 entries.
  - `CONDITION_TYPES: ReadonlyArray<{ id: 'time_window' | 'device_state' | 'temperature_range' | 'always_true'; label: string; Icon: LucideIcon; tone: string }>` — 4 entries.
  - `ACTION_TYPES: ReadonlyArray<{ id: ActionItem['type']; label: string; Icon: LucideIcon; tone: string }>` — 11 entries (D-09 table).
  - `defaultTrigger(type)`, `defaultCondition(type)`, `defaultAction(type)` factories returning API-shaped defaults.
- **D-19:** **Lucide icons replace bundle's ad-hoc SVG icons** (`IconClock`, `IconZap`, `IconThermo`, `IconPower`, `IconHome`, `IconCalendar`, `IconFlame`, `IconBulb`, `IconPlug`, `IconMusic`, `IconAlert`). Same convention as Phase 178/179 (lucide-react is already a dep). Use `Clock`, `Zap`, `Thermometer`, `Power`, `Home`, `Calendar`, `Flame`, `Lightbulb`, `Plug`, `Music`, `AlertCircle`, `Sparkles`, `Check`, `X`, `Plus`, `ChevronUp`, `ChevronDown`. **No `IconHome` SVG sub-component**.
- **D-20:** **Last-run pill formatting.** Use `useRelativeTime` (existing hook at `lib/hooks/useRelativeTime.ts`, verified by grep) on `rule.last_triggered_at` (Unix seconds × 1000 = ms). Fallback when null: literal "mai". Same locale (Italian) as Phase 144.
- **D-21:** **Trigger summary pill formatter** (`describeTrigger.ts`):
  - `schedule_cron` → `"⏰ ${cron_expression}"`
  - `manual_api_call` → `"Manuale"`
  - `null` (omitted trigger) → `"Manuale"` (matches API semantic per `docs/api/automations.md:156`).
- **D-22:** **Condition / action count pills.** Bundle line 200-209 logic verbatim, but powered by `countConditions(rule.condition)` (recursive, treats leaf as count=1, AND/OR as sum of children, always_true as count=0) and `rule.actions.length`. Italian pluralization preserved ("1 condizione" vs "2 condizioni"; "1 azione" vs "2 azioni").

### Hooks & data layer

- **D-23:** **`useAutomationsList()` hook** (new file `app/hooks/useAutomationsList.ts`) — returns `{ rules, totalCount, loading, error, refetch, page, setPage, create, update, remove, toggle }`. Internally calls `automationsProxy.getAutomations / createAutomation / updateAutomation / deleteAutomation`. Handles toast firing for create/update/delete (success + error). Called from `<AutomationsTab>` only.
- **D-24:** **`automationsProxy` is unchanged.** No new endpoints, no new transports. The proxy already covers POST / PATCH / DELETE / GET-list / GET-single. Phase 180 only adds the typed body shapes via D-05.
- **D-25:** **No WebSocket subscription.** Bundle does not subscribe; the API doc has a `/ws` automation-execution stream but it's an enhancement (`<deferred>`). 60-second polling fallback inherits from `useAutomationsList` — actually we do NOT poll here either; the list refreshes on save / delete and on initial mount. Background staleness is acceptable for an editor surface (user controls when to refresh).

### Tests

- **D-26:** **Jest spec coverage** (one spec per non-trivial component / lib):
  - `__tests__/AutomationsTab.test.tsx` — list renders, Nuova opens editor with empty draft, click row opens editor with rule data.
  - `__tests__/AutomationRow.test.tsx` — pills (trigger / N condizioni / N azioni / lastRun), enabled vs disabled styling, toggle handler.
  - `__tests__/AutomationEditor.test.tsx` — Sheet open/close, tab badges update on add/remove, save guard (button disabled until name + ≥1 action), unsaved-changes confirm fires on close-when-dirty, delete confirm fires.
  - `__tests__/sections/TriggerSection.test.tsx` — 2 tiles render, tile click swaps form, form readOnly in edit mode (D-12).
  - `__tests__/sections/ConditionsSection.test.tsx` — empty + populated states; nested group renders with depth-aware bar color.
  - `__tests__/sections/ActionsSection.test.tsx` — picker overlay opens, 11 tiles render, add inserts at end with default values; ↑/↓ disabled at boundaries.
  - `__tests__/sections/AdvancedSection.test.tsx` — both fields persist values; "0 = nessun limite" copy renders.
  - `__tests__/ConditionGroup.test.tsx` — operator toggle (AND ↔ OR) flips state, addCondition/addGroup append, depth-2 hides "+ Gruppo".
  - `__tests__/ActionRow.test.tsx` — type select swaps form, ↑/↓/remove fire correct handlers, action #1 ↑ disabled.
  - `__tests__/forms/TriggerForms.test.tsx` — both forms (cron + manual_api_call); CronHint renders 5 segments parsed from input; missing tokens render "—".
  - `__tests__/forms/ConditionForms.test.tsx` — 4 forms (time_window, device_state, temperature_range, always_true); nullable min/max for temperature_range emits null on empty.
  - `__tests__/forms/ActionForms.test.tsx` — 11 forms; conditional fields per command (`thermorossi.set_power` shows power_level, hides fan_level); JSON parse error blocks save (http_webhook).
  - `__tests__/lib/automations-config.test.ts` — defaults match API-shaped invariants (`defaultAction('thermorossi').type === 'thermorossi'`).
  - `__tests__/lib/automations-mappers.test.ts` — round-trip fixtures for every condition shape (always_true / leaf / and / or / nested) and every action type; assert `draftToApi(apiToDraft(rule)) === rule` (deep-equal modulo always_true ↔ empty-AND).
  - `__tests__/lib/countConditions.test.ts` — leaf=1, always_true=0, and/or=sum, nested.
  - `__tests__/lib/describeTrigger.test.ts` — both types + null.
  - `__tests__/hooks/useAutomationsList.test.ts` — mock proxy; create/update/delete/toggle each refetch and toast.
- **D-27:** **Playwright spec** — new `tests/playwright/automations-tab.spec.ts`:
  1. `goto('/automazioni')`; assert at least one row renders OR empty-state copy.
  2. Click Nuova; assert Sheet opens with title "Nuova automazione".
  3. Fill name "E2E test"; switch to Azioni tab; click + Aggiungi azione → Scrivi log; fill message "hello"; click Salva.
  4. Assert Sheet closes; assert new row "E2E test" present in list with "1 azione" pill.
  5. Click the new row; assert Sheet opens with title "Modifica automazione" and Trigger tab tiles disabled (D-12).
  6. Switch to Avanzate; change `min_interval_seconds` to 60; Salva.
  7. Click row again; click Elimina → ConfirmationDialog → confirm.
  8. Assert row removed from list.
  9. Console errors check via `collectConsoleErrors` (reuse from Phase 51/97); fail spec on any error.
- **D-28:** **No regression of legacy `/automations` page.** Plan agent runs the existing `app/automations/__tests__/*.test.ts` suite as-is. Type changes from D-05 may surface compile errors — fix in foundation wave before editor lands.

### Auth & PWA

- **D-29:** **Auth wrapping** mirrors `app/stanze/page.tsx` (Phase 179 D-04). Plan agent confirms by reading `app/stanze/page.tsx` before scaffolding `app/automazioni/page.tsx`.
- **D-30:** [informational] Mobile-first — bundle is designed for ~375px width inside the iPhone-style frame. Sheet primitive (Phase 175) already supports. Desktop simply gets the same Sheet at the same width centered in the app shell. No responsive variant needed.

### Plan layout (informational hint to gsd-planner)

- **D-31:** [informational] Suggested wave breakdown (planner has final say):
  - **Wave 1 (foundation, sequential):**
    - Plan 01: rewrite `types/automations.ts` (D-05) + audit + patch legacy `/automations` consumers; tests pass tsc.
    - Plan 02: scaffold `app/components/EmberGlass/automations/` namespace — primitives + `lib/automations-config.ts` + `lib/countConditions.ts` + `lib/describeTrigger.ts` + `lib/automations-mappers.ts` + types.
  - **Wave 2 (editor sections, parallel):**
    - Plan 03: `<TriggerSection>` + 2 trigger forms + `<CronHint>`.
    - Plan 04: `<ConditionsSection>` + `<ConditionGroup>` + `<ConditionItem>` + 4 condition forms.
    - Plan 05: `<ActionsSection>` + `<ActionRow>` + 11 action forms.
    - Plan 06: `<AdvancedSection>`.
  - **Wave 3 (orchestration, sequential after wave 2):**
    - Plan 07: `<AutomationEditor>` (tabs + footer + dirty-tracking) + `useAutomationsList` hook + integration with `automationsProxy`.
    - Plan 08: `<AutomationsTab>` + `<AutomationRow>` + `app/automazioni/page.tsx` route.
  - **Wave 4 (gap closure / verification):**
    - Plan 09: Playwright spec + final test pass + barrel exports + `app/components/EmberGlass/index.ts` re-export.
- **D-32:** [informational] **No Brahma orchestration / multi-agent spawn for this phase.** Phase 180 follows the standard wave-based gsd-execute-phase flow. Inline-style discipline (D-02), API-truth wins over wishful spec (D-08, D-09, D-12), and the mapper round-trip discipline (D-10) are the only non-obvious correctness gates.

</decisions>

<canonical_refs>
## Canonical Refs (MANDATORY for downstream agents)

### From ROADMAP.md (phase 180 entry)
- `.planning/ROADMAP.md` — Phase 180 goal + SC-#1..5 + AUTO-01..08 mapping. Plan agent **MUST surface SC-#3 deviation** per D-08c before execution.
- `.planning/REQUIREMENTS.md` — AUTO-01..08 raw text (lines 72-79). Same caveat re: AUTO-03 trigger count + AUTO-05 action label naming. Out-of-scope rules (line 117): backend / API route changes are out of scope — anchors D-08 / D-09 / D-12.

### Live API surface (authoritative)
- `docs/api/automations.md` — full endpoint contract (POST / PATCH / DELETE / GET / executions / trigger / evaluate / capabilities). Line 156: `trigger` is nullable + omittable; default null = "manual only". Lines 50-64: Trigger Types table (only 2 actual triggers). Lines 65-72: Condition Types table (4 leaves + AND/OR composites). Lines 73-99: Action Types table (10 in the markdown — note: the markdown is one entry behind types.ts which adds `tuya`; types.ts is the ground truth).
- `docs/api/automations.types.ts` — **AUTHORITATIVE TypeScript definitions, mirror of `api/automations/models.py`**. Lines 16-26 (TriggerType union, only 2 members), 32-100 (ConditionNode union, including AndNode + OrNode with `conditions` field), 112-220 (ActionItem union, **11 members including HueLight/HueGroup/HueScene/Thermorossi/Sonos/Tuya**). Lines 219-237 (AutomationRule shape, `id` is `number`). Lines 268-280 (AutomationRuleCreate). Lines 283-294 (AutomationRulePatch — **NO `trigger` field, by design** — anchors D-12). **Plans MUST import types from this file (re-exported via `types/automations.ts` per D-05).**

### Design source
- `.planning/inbox/ember-glass-design/project/components/automations.jsx` — 934-LOC React reference implementation. Source of truth for: visual layout, copy, color tones, animation, segment heights, padding, primitives. **All inline styles transcribe verbatim.** Lines 6-31 (catalogs — note: bundle's 5+9 lists need API-truth correction per D-08 / D-09), 102-169 (`<AutomationsTab>` orchestrator), 172-244 (`<AutomationRow>`), 247-322 (`<AutomationEditor>` with 4-tab segmented control), 325-406 (`<TriggerSection>` + `<TriggerConfigForm>`), 409-559 (`<ConditionsSection>` + `<ConditionGroup>` + `<ConditionItem>` + forms), 561-797 (`<ActionsSection>` + `<ActionItem>` + forms), 800-815 (`<AdvancedSection>`), 818-924 (primitives — FieldLabel, TextInput, NumInput, SegmentedControl, TwoCol, TypeTile, AddChip, CronHint, IconBtn).

### Locked design system
- `.planning/phases/174-ember-glass-tokens-foundations/174-CONTEXT.md` — token system (var(--accent), var(--text-1), var(--text-2), var(--r-card), var(--font-display)). D-12: inline-style + var(--token).
- `.planning/phases/175-glass-primitives-press-animation-sheet/175-CONTEXT.md` — `<Sheet>` API (open / onClose / title required), `<Pressable>`, scroll-lock. D-08: inline-style. D-12: VisuallyHidden Title fallback.
- `.planning/phases/177-equal-size-dashboard-glass-cards/177-CONTEXT.md` — `<GlassCard>`, `<CardHead>`, `<InlineToggle>`. D-01 namespace pattern.
- `.planning/phases/178-per-device-modal-sheets/178-CONTEXT.md` — `<Sheet>` consumer pattern, primitive scoping (D-04 here mirrors Phase 178's primitive scoping discipline).
- `.planning/phases/179-rooms-tab-redesign/179-CONTEXT.md` — Italian-route convention (`/stanze` not `/rooms`), D-04 left-existing-route-untouched pattern, useRelativeTime usage convention.

### Existing code (consumers / proxies / patterns)
- `app/automations/page.tsx` (398 LOC) — legacy admin CRUD page. **Stays untouched per D-06.** Reference for the existing data layer pattern (FormModal + DataTable + ConfirmationDialog). The new editor does NOT extend this; it ships parallel.
- `app/automations/[rule_id]/page.tsx` (262 LOC) — legacy detail page. Stays untouched.
- `lib/automations/automationsProxy.ts` — function-module proxy (getAutomations / createAutomation / getAutomation / updateAutomation / deleteAutomation / getExecutions). **No changes** per D-24.
- `lib/haClient.ts` — shared `haGet`/`haPost`/`haPatch`/`haDelete` transports. Inherited by automationsProxy. No changes.
- `lib/hooks/useRelativeTime.ts` — existing relative-time hook. Used by D-20.
- `app/components/EmberGlass/Sheet.tsx` — Phase 175 primitive. Used as editor shell.
- `app/components/EmberGlass/Pressable.tsx` — Phase 175 primitive. Optional inside primitives that want press animation.
- `app/components/EmberGlass/InlineToggle.tsx` — used in `<AutomationRow>` for the enable/disable affordance.
- `app/components/ui/ConfirmationDialog.tsx` — reused for unsaved-changes guard (D-15) and delete confirm (D-16).
- `app/hooks/useToast.ts` — reused for save / error toasts (D-13).
- `app/stanze/page.tsx` — Phase 179 route mount. Reference for `app/automazioni/page.tsx` shape (auth wrap + `'use client'`).

### Codebase maps (light scout)
- `.planning/codebase/STRUCTURE.md` — high-level layout (skim only — confirms `app/components/EmberGlass/` namespace is the v20.0 home).
- `.planning/codebase/CONVENTIONS.md` — strict TS + noUncheckedIndexedAccess + zero-any (Phases 47, 114-116). The new code MUST honor.

### Out-of-scope but referenced
- `docs/api/automations.md` lines 925-985 (skim) — WebSocket execution events. Tracked in `<deferred>`.
- `docs/api/automations.md` capabilities section (`/api/v1/capabilities/*`) — tracked in `<deferred>`.

</canonical_refs>

<code_context>
## Reusable assets / patterns confirmed

- **Sheet primitive** (Phase 175) — drop-in editor shell. `<Sheet open onClose title>` with Pressable + scroll-lock + Escape + backdrop-click + outro animation already shipped. Phase 178/179 prove the integration. No new sheet code in Phase 180.
- **Function-module proxy** (`automationsProxy`) — already returns `Promise<AutomationRule[]>` etc. and uses the shared `haClient` X-API-Key transport. New code calls into it directly; no transport-layer additions.
- **lucide-react icon set** — already a dep; bundle's ad-hoc SVG sub-icons swap to lucide imports per D-19.
- **Inline-style + var(--token)** — discipline enforced by all 7 prior v20.0 phases. Bundle code is inline-style verbatim — minimal translation cost.
- **Toast hook** + **ConfirmationDialog** + **useRelativeTime** — all exist and are battle-tested. No re-implementation.
- **Italian-route + leave-legacy-untouched pattern** — Phase 179 D-04 verbatim. Cuts scope-creep risk to zero on the route question.
- **React Compiler 1.0** (Phase 71) — auto-memoization handles aggregator / mapper inefficiencies. No `useMemo` discipline.
- **Strict TS + noUncheckedIndexedAccess** (Phase 47) — discriminated unions in `docs/api/automations.types.ts` give exhaustive narrowing for free; `default` clauses in form dispatchers must be `assertNever(action)` to satisfy TS.

## Anti-patterns to avoid (per Phase 175 D-04 / Phase 178 D-12 / Phase 179 D-22)

- **Tailwind classes for visual values inside `automations/` files** — bundle is the source of truth and bundle is inline-style. Layout flex/grid + spacing tokens stay inline.
- **Hand-rolled SVG icons** — use lucide.
- **`useMemo` / `useCallback` decoration** — Phase 71/95 discipline. Plain functions only; React Compiler handles it.
- **`as any` casts** — Phase 114-116 discipline. Use `assertNever` / discriminated narrowing.
- **Re-rolling Sheet behavior** — D-07. Use Phase 175 primitive verbatim.
- **Touching legacy `/automations` page** — D-06. Out of scope. New parallel route only.
- **Adding new triggers beyond the API's 2 supported types** — D-08. Backend is locked for v20.0.
- **Skipping the mapper round-trip tests** — D-10. The condition normalization is the highest-risk correctness surface in the phase.

</code_context>

<deferred>
## Noted for Later (out of scope for Phase 180)

- **Backend extension to support sensor-based triggers** (`sensor_state_change`, `sensor_threshold`, `netatmo_temperature_threshold` as TRIGGERS, not just condition leaves) — would close the AUTO-03 wording gap. Owns: backend team. Tracker: surface as a backend-roadmap candidate after v20.0 ships.
- **Capabilities API integration** — auto-populate dropdowns for `home_id`, `room_id`, `light_id`, `group_id`, `scene_id`, `device_id`, `speaker_uid`, `schedule_id` from `/api/v1/capabilities/*`. Transforms the editor from "free-text fields with magic strings" to "click-to-pick". Likely a v20.x phase.
- **`POST /trigger` (manual run) + `POST /evaluate` (dry-run trace) editor affordances** — "Test Run" and "Trace Conditions" buttons in edit mode. Powerful debugging UX. Likely a v20.x phase.
- **WebSocket execution events** (`docs/api/automations.md:925-985`) — live "last triggered" pill update, in-flight execution badge. Likely a v20.x phase.
- **Visual cron builder** (REQUIREMENTS.md `AUTO-FUT-01`) — replaces raw cron string field with a day/hour/minute picker. Likely a v20.x phase.
- **Per-action retry / timeout configuration** (REQUIREMENTS.md `AUTO-FUT-02`) — backend doesn't accept it today; needs API extension first.
- **Action templates / library** (REQUIREMENTS.md `AUTO-FUT-03`) — "save as template" + "use template" CTAs.
- **`active_hours_start` / `active_hours_end` UI fields** — backend supports them; Phase 180 omits them per D (out of scope). Future phase adds as a 5th tab "Orari attivi" or as part of Avanzate.
- **"Re-create with new trigger" CTA in edit mode** — would soften D-12's read-only constraint by automating the delete+recreate flow (with execution-history transfer if backend ever supports it).
- **Cleanup of legacy `/automations` and `/automations/[rule_id]` routes** — post-Phase 181 cleanup phase decides their fate. Symmetric with Phase 179 leaving `/rooms` for cleanup.

</deferred>

<spec_lock>
## Locked from REQUIREMENTS.md (no SPEC.md exists for this phase)

- **AUTO-01**: List shows icon + name + description + toggle + status pill (trigger / N condizioni / N azioni / lastRun). **Locked** by D-21 / D-22 / D-20.
- **AUTO-02**: "Nuova automazione" opens editor sheet with Name + Description + 4 inner tabs with badge counts. **Locked** by D-07 / D-22 / Sheet integration.
- **AUTO-03**: Trigger picker supports 5 types per `docs/automations.md`. **Adjusted by D-08:** ships 2 actual API trigger types; 3 bundle "extras" surface as condition leaves. **Plan agent surfaces this for user confirmation before execution per D-08c.**
- **AUTO-04**: Conditions support nested AND/OR groups up to 2 levels deep with per-group operator toggle and colored side-bars; 4 leaf types. **Locked** by D-10 / D-11.
- **AUTO-05**: Actions support **9 action types** per requirements text. **Adjusted by D-09:** ships 11 actual API action types (the 9 bundle labels translate to 11 API types, with `light_set` exploding into `hue_light` + `hue_group` + `hue_scene`).
- **AUTO-06**: Avanzate exposes `min_interval_seconds` + `max_triggers_per_hour`. **Locked** by D (AdvancedSection).
- **AUTO-07**: Save disabled until name + ≥1 action; unsaved-changes guard. **Locked** by D-14 / D-15.
- **AUTO-08**: Edit mode opens existing automation; Delete (with confirm) available. **Locked** by D-12 (trigger read-only) + D-16.

**ROADMAP.md SC adjustments to flag in PLAN.md:**
- SC-#3 → "Trigger picker supports the 2 API trigger types (`schedule_cron`, `manual_api_call`); the 3 sensor-based concepts surface as condition leaves under Condizioni." (Plan agent emits explicit user confirmation.)
- SC-#5 → "Actions list supports the **11 API action types** (`netatmo_set_room_temp`, `netatmo_set_home_mode`, `netatmo_switch_schedule`, `thermorossi`, `hue_light`, `hue_group`, `hue_scene`, `tuya`, `sonos`, `http_webhook`, `log_event`), each row has type-specific form + reorder ↑/↓ + remove; the Avanzate tab exposes `min_interval_seconds` and `max_triggers_per_hour`; Save is disabled until name is non-empty AND ≥1 action exists; an unsaved-changes guard prompts on close; existing automations open in the same editor and surface a Delete (with confirm) button in edit mode."

</spec_lock>

---

**Auto-mode log**:
- `[--auto] Context exists check — none found, proceeding fresh.`
- `[--auto] Selected all gray areas: namespace+layout, trigger model alignment, action catalog mapping, condition root normalization, edit-mode PATCH limitation, save semantics, unsaved-changes guard, delete affordance, types/automations.ts rewrite, route mount, last-run formatting, test coverage, plan layout hint.`
- `[--auto] Q: trigger model alignment → API truth (2 types) over REQUIREMENTS wishful spec (5 types). Reason: v20.0 out-of-scope rule on backend changes; bundle's 3 extras work as condition leaves.`
- `[--auto] Q: action catalog source → 11 API types over 9 bundle labels. Reason: API truth + lossless mapping; bundle's "light_set" splits into hue_light/hue_group/hue_scene which the user gets to choose explicitly.`
- `[--auto] Q: route mount → /automazioni new italian route, leave /automations untouched. Reason: Phase 179 D-04 symmetry, scope discipline.`
- `[--auto] Q: types/automations.ts → rewrite to re-export full discriminated unions from docs/api/automations.types.ts. Reason: existing stub is incomplete; correctness gate for the editor.`
- `[--auto] Q: unsaved-changes guard → ConfirmationDialog on close-when-dirty. Reason: AUTO-07 explicit; existing primitive available.`
- `[--auto] Q: trigger in edit mode → read-only with explanatory copy. Reason: API PATCH excludes trigger by design; delete+recreate UX cost is too high to default to.`
- `[--auto] Q: condition root normalization → bare leaf ↔ wrapped AND group with single child via mapper, empty group → always_true. Reason: round-trip correctness; bundle UX expects always-AND root.`
- `[--auto] Q: catalog source → bundle (icons / tones / Italian copy) corrected for API truth (D-09 mapping table). Reason: visual parity + correctness.`
- `[--auto] Q: WebSocket / capabilities / trigger / evaluate / active_hours → all deferred. Reason: scope creep into v20.x.`

**Next:** auto-advance to `/gsd-plan-phase 180 --auto --chain` (chain banner displays).
