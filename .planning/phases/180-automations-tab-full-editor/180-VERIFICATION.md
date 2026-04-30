---
phase: 180-automations-tab-full-editor
verified: 2026-04-30T00:00:00Z
status: human_needed
score: 8/8 must-haves verified (override-aligned)
overrides_applied: 0
overrides:
  - must_have: "Trigger picker supports all 5 documented trigger types (AUTO-03 / ROADMAP SC-#3)"
    reason: "API truth wins — docs/api/automations.types.ts:26 exposes only 2 TriggerType discriminators (schedule_cron, manual_api_call). The 3 sensor-based concepts surface as condition leaves (CONTEXT.md D-08 / D-08c). v20.0 is UI-only — backend cannot be extended."
    accepted_by: "phase-180 CONTEXT D-08 (auto-mode lock) + verifier override note from prompt"
    accepted_at: "2026-04-29T00:00:00Z"
  - must_have: "Actions list supports 9 action types (AUTO-05 / ROADMAP SC-#5)"
    reason: "API truth wins — docs/api/automations.types.ts ActionItem union has 11 discriminators. Bundle's 9 generic labels map to 11 API types (light_set explodes into hue_light/hue_group/hue_scene). CONTEXT.md D-09 locked the spec at 11."
    accepted_by: "phase-180 CONTEXT D-09 (auto-mode lock) + verifier override note from prompt"
    accepted_at: "2026-04-29T00:00:00Z"
human_verification:
  - test: "Smoke /automazioni live data flow"
    expected: "List populates from real /api/v1/automations response (not empty); Sheet open + Save POST round-trips; row toggle PATCH succeeds; delete confirm DELETE succeeds; no console errors via Playwright collectConsoleErrors gate."
    why_human: "Plan 180-09 documented a pre-existing data-layer blocker: useAutomationsList calls automationsProxy.getAutomations → haGet which reads server-only HA_API_URL/HA_API_KEY env vars. These are undefined in the browser, so the hook silently fails (caught into setError without a console log). Static spec is correct (562 LOC, 8 describes, 15 tests, 0 forbidden patterns); runtime is deferred similar to Phase 175-03 VersionEnforcer blocker. Verifier classifies as human_needed for runtime smoke once the data-layer fix lands."
  - test: "Italian copy + visual parity sweep"
    expected: "Bundle automations.jsx primitives match: 38px input height, 9px radius, 0.5px border, ember accent on Crea automazione, depth-aware sidebar colors on nested groups, 65+ Italian copy strings."
    why_human: "Visual fidelity + Italian localization correctness cannot be programmatically verified."
---

# Phase 180: Automations Tab Full Editor — Verification Report

**Phase Goal:** Replace the current automations UI with a full editor — list view with status pills, "Nuova automazione" sheet with 4 inner tabs, type-specific forms for triggers/conditions/actions, AND/OR nested condition groups, advanced cooldown controls, save guards, and edit/delete flows.

**Verified:** 2026-04-30
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                                          | Status                | Evidence                                                                                                                                                                                                                                                            |
| --- | -------------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | List view renders one row per rule with icon + name + description + InlineToggle + 4 status pills (AUTO-01)    | ✓ VERIFIED            | `AutomationRow.tsx:55-167` renders the row with header (icon, name, description, InlineToggle@138) and pills row (trigger pill@153, condizioni pill@157, azioni pill@162, lastRun pill@166); driven by `describeTrigger`, `countConditions`, `useRelativeTime`.    |
| 2   | "Nuova automazione" opens an editor Sheet with Name + Description + 4 inner tabs with badge counts (AUTO-02)  | ✓ VERIFIED            | `AutomationsTab.tsx:100-122` renders Nuova button → setEditingRule('new'); `AutomationEditor.tsx:204-222` Name + Description; `225-284` 4-tab segmented control (TABS = ['Trigger','Condizioni','Azioni','Avanzate']); badges@266-280 (condCount + actionCount).    |
| 3   | Trigger picker exposes API-truth set (2 tiles: schedule_cron, manual_api_call) + type-specific forms (AUTO-03 — override-adjusted per CONTEXT D-08) | ✓ VERIFIED (override) | `automations-config.ts:34-55` TRIGGER_TYPES has exactly 2 entries; `TriggerSection.tsx:58-83` renders `TRIGGER_TYPES.map`; `TriggerForms.tsx` exports `ScheduleCronForm` (cron input + CronHint), `ManualApiCallForm` (info copy), and `TriggerForm` dispatcher.   |
| 4   | Conditions support nested AND/OR groups up to depth 2 with operator toggle, colored side-bars, 4 leaf forms (AUTO-04) | ✓ VERIFIED            | `ConditionGroup.tsx:22` MAX_DEPTH=2; opColor 26, opLabel 27, addCondition/addGroup 44-60; `ConditionForms.tsx` exports TimeWindowForm, DeviceStateForm, TemperatureRangeForm, AlwaysTrueForm + ConditionForm dispatcher (5 exports); `automations-config.ts:60-70` 4 picker entries. |
| 5   | Actions list supports 11 API action types with type-specific forms + ↑/↓ reorder + remove (AUTO-05 — override-adjusted per CONTEXT D-09) | ✓ VERIFIED (override) | `automations-config.ts:73-90` ACTION_TYPES has exactly 11 entries; `ActionsSection.tsx:163-178` 11-tile picker; `ActionForms.tsx` exports 11 named forms + ActionForm dispatcher (12 exports total); `ActionsSection.tsx:72-83` moveUp/moveDown; `:69` removeAt.    |
| 6   | Avanzate tab exposes min_interval_seconds + max_triggers_per_hour with "0 = nessun limite" copy (AUTO-06)     | ✓ VERIFIED            | `AdvancedSection.tsx:43-66` two NumInputs labeled "Intervallo minimo fra attivazioni" + "Massimo attivazioni/ora", with "0 = nessun limite"@52 and "0 = illimitato"@65 hint copy.                                                                                  |
| 7   | Save disabled until name + ≥1 action; unsaved-changes guard on close (AUTO-07)                                | ✓ VERIFIED            | `AutomationEditor.tsx:157-160` saveAllowed = name.trim().length>=1 && actions.length>=1 && !hasJsonError; `:391-412` Save button `disabled={!saveAllowed}` + aria-disabled; `:167-173` requestClose checks isDirty → spawns `ConfirmationDialog`@416-427 (D-15).   |
| 8   | Edit mode opens existing automation, exposes Delete with confirm; trigger read-only in edit (AUTO-08 + D-12)  | ✓ VERIFIED            | `AutomationsTab.tsx:144-150` AutomationRow.onOpen=setEditingRule(rule); `AutomationEditor.tsx:350-369` Elimina button rendered when `!isNew && rule`; `:430-440` ConfirmationDialog variant=danger; `TriggerSection.tsx:37-47` D-12 inline note; tiles `disabled={!isNew}`@68. |

**Score:** 8/8 truths verified (overrides applied to AUTO-03 + AUTO-05 per CONTEXT D-08/D-09 — API truth supersedes ROADMAP SC text).

### Required Artifacts

| Artifact                                                                  | Expected                                              | Status     | Details                                                                                                                                                          |
| ------------------------------------------------------------------------- | ----------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types/automations.ts`                                                    | Re-export of `docs/api/automations.types`             | ✓ VERIFIED | 35 LOC; line 19 `export * from '@/docs/api/automations.types'`; 4 type re-exports + 2 deprecated aliases.                                                       |
| `lib/utils/assertNever.ts`                                                | Exhaustive-switch helper                              | ✓ VERIFIED | File exists; imported by automations-config.ts and ActionForms.tsx.                                                                                              |
| `app/components/EmberGlass/automations/lib/automations-config.ts`         | TRIGGER_TYPES (2), CONDITION_TYPES (4), ACTION_TYPES (11) + factories | ✓ VERIFIED | 175 LOC; counts exact: 2/4/11; defaults match API discriminators with assertNever guards.                                                                        |
| `app/components/EmberGlass/automations/lib/automations-mappers.ts`        | apiToDraft + draftToApi + computePatchDelta            | ✓ VERIFIED | 201 LOC; round-trip tests pass (`__tests__/lib/automations-mappers.test.ts` PASS).                                                                                |
| `app/components/EmberGlass/automations/lib/countConditions.ts`            | Pure recursive leaf counter                           | ✓ VERIFIED | 19 LOC; leaf=1, always_true=0, AND/OR=sum (line 12-19).                                                                                                          |
| `app/components/EmberGlass/automations/lib/describeTrigger.ts`            | Italian formatter                                      | ✓ VERIFIED | 18 LOC; cron → `⏰ {cron}`, manual_api_call → `Manuale`, null → `Manuale`.                                                                                       |
| `app/components/EmberGlass/automations/AutomationsTab.tsx`                | Orchestrator                                           | ✓ VERIFIED | 173 LOC; useAutomationsList + Sheet + AutomationRow + AutomationEditor wired.                                                                                    |
| `app/components/EmberGlass/automations/AutomationEditor.tsx`              | Sheet body + 4-tab nav + footer                        | ✓ VERIFIED | 443 LOC; Name+Desc, 4 tabs, conditional section render, dirty-tracking, save guard, delete dialog.                                                              |
| `app/components/EmberGlass/automations/AutomationRow.tsx`                 | List row + 4 pills + InlineToggle                      | ✓ VERIFIED | 170 LOC; renders pills + InlineToggle with double-stop-propagation per D-17.                                                                                     |
| `app/components/EmberGlass/automations/sections/TriggerSection.tsx`       | 2-tile picker + form                                  | ✓ VERIFIED | 100 LOC; D-08 lock; D-12 read-only in edit mode.                                                                                                                 |
| `app/components/EmberGlass/automations/sections/ConditionsSection.tsx`    | Wraps ConditionGroup at depth=0                        | ✓ VERIFIED | 37 LOC.                                                                                                                                                          |
| `app/components/EmberGlass/automations/sections/ActionsSection.tsx`       | List + 11-tile picker + add CTA                        | ✓ VERIFIED | 227 LOC; ACTION_TYPES.map renders 11 tiles@163-178; KeyedAction contract enforced.                                                                              |
| `app/components/EmberGlass/automations/sections/AdvancedSection.tsx`      | min_interval_seconds + max_triggers_per_hour          | ✓ VERIFIED | 69 LOC; both NumInputs + "0=nessun limite" copy.                                                                                                                 |
| `app/components/EmberGlass/automations/forms/TriggerForms.tsx`            | ScheduleCronForm + ManualApiCallForm + dispatcher      | ✓ VERIFIED | 114 LOC; 3 named exports.                                                                                                                                        |
| `app/components/EmberGlass/automations/forms/ConditionForms.tsx`          | 4 leaf forms + dispatcher                              | ✓ VERIFIED | 169 LOC; 5 exports (4 forms + ConditionForm).                                                                                                                    |
| `app/components/EmberGlass/automations/forms/ActionForms.tsx`             | 11 forms + dispatcher                                  | ✓ VERIFIED | 675 LOC; 12 exports (11 forms + ActionForm).                                                                                                                    |
| `app/components/EmberGlass/automations/ConditionGroup.tsx`                | Recursive AND/OR group                                 | ✓ VERIFIED | MAX_DEPTH=2 lock at line 22.                                                                                                                                     |
| `app/components/EmberGlass/automations/ConditionItem.tsx`                 | Leaf with type select                                  | ✓ VERIFIED | File present.                                                                                                                                                    |
| `app/components/EmberGlass/automations/ActionRow.tsx`                     | Numbered row + ↑/↓/remove                              | ✓ VERIFIED | File present; tested in __tests__/ActionRow.test.tsx PASS.                                                                                                       |
| `app/hooks/useAutomationsList.ts`                                         | CRUD + toggle hook                                     | ✓ VERIFIED | 163 LOC; rules, totalCount, loading, error, refetch, page, setPage, create, update, remove, toggle returned (lines 150-162).                                    |
| `app/components/EmberGlass/automations/index.ts`                          | Barrel re-export                                       | ✓ VERIFIED | 108 LOC; AutomationsTab + sub-components + sections + forms + primitives + lib all re-exported.                                                                  |
| `app/components/EmberGlass/index.ts`                                      | Top-level barrel includes automations                  | ✓ VERIFIED | Line 44: `export * from './automations'`.                                                                                                                         |
| `app/automazioni/page.tsx`                                                | Next.js route mounting `<AutomationsTab/>`             | ✓ VERIFIED | 24 LOC; `'use client'`, dynamic='force-dynamic', renders `<AutomationsTab/>`.                                                                                    |
| `tests/smoke/automations-tab.spec.ts`                                     | Playwright smoke spec                                  | ✓ VERIFIED (static) | 562 LOC; 8 describe blocks; 15 tests; 3 console-error gates; 8 dialog-scope queries; 36 helper refs. Runtime deferred — see human_verification.                  |

### Key Link Verification

| From                                              | To                                                | Via                                                | Status     | Details                                                                          |
| ------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| `app/automazioni/page.tsx`                        | `app/components/EmberGlass/automations/index.ts`  | `import { AutomationsTab } from '@/app/components/EmberGlass/automations'` | ✓ WIRED    | Verified at line 13.                                                             |
| `app/components/EmberGlass/index.ts`              | `app/components/EmberGlass/automations/index.ts`  | `export * from './automations'`                    | ✓ WIRED    | Verified at line 44.                                                             |
| `app/hooks/useAutomationsList.ts`                 | `lib/automations/automationsProxy.ts`             | `automationsProxy.{getAutomations,createAutomation,updateAutomation,deleteAutomation}` | ⚠️ WIRED at code level / DISCONNECTED at runtime | Imported + called (lines 22, 61, 81, 97, 113, 133). However automationsProxy → haGet reads server-only env vars; the call silently fails in the browser. Documented as known data-layer blocker (override). |
| `app/components/EmberGlass/automations/AutomationsTab.tsx` | `app/hooks/useAutomationsList.ts`        | `useAutomationsList({pageSize: 20})`               | ✓ WIRED    | Imported and consumed (line 20, 28-36).                                          |
| `app/components/EmberGlass/automations/AutomationEditor.tsx` | `lib/automations-mappers.ts`            | `apiToDraft + draftToApi + computePatchDelta`      | ✓ WIRED    | Verified at line 28; called at 109, 183, 188.                                     |
| `types/automations.ts`                            | `docs/api/automations.types.ts`                   | `export * from '@/docs/api/automations.types'`     | ✓ WIRED    | Verified at line 19.                                                             |

### Data-Flow Trace (Level 4)

| Artifact                                              | Data Variable             | Source                                                 | Produces Real Data                       | Status              |
| ----------------------------------------------------- | ------------------------- | ------------------------------------------------------ | ---------------------------------------- | ------------------- |
| `AutomationsTab.tsx` → list of rules                  | `rules` (state)           | `useAutomationsList` → `automationsProxy.getAutomations` → `haGet('/api/v1/automations')` | DB-backed (HA proxy) on server; UNDEFINED in browser | ⚠️ HOLLOW at runtime |
| `AutomationRow.tsx` → pills/icon/toggle               | props from `rules.map`    | `AutomationsTab` (above)                               | Inherited from above                     | ⚠️ HOLLOW at runtime |
| `AutomationEditor.tsx` → draft                        | `draft` (state)           | `apiToDraft(rule)` from props OR `emptyDraft()` for new | Pure function — works regardless         | ✓ FLOWING           |
| Save flow → POST/PATCH/DELETE                         | called via hook           | `useAutomationsList.create/update/remove` → proxy       | Same root cause as list fetch             | ⚠️ HOLLOW at runtime |

**Root cause (pre-existing, documented):** `lib/haClient.ts:34-48` reads `process.env.HA_API_URL` + `process.env.HA_API_KEY`. These are NOT prefixed `NEXT_PUBLIC_` and therefore not exposed to the browser. Calling `haGet` from a `'use client'` component throws `ApiError('HA proxy not configured')` which the hook swallows into `setError`. A Next.js server-side wrapper exists at `app/api/v1/automations/route.ts` — the fix is to point the hook at the relative `/api/v1/automations` path via `fetch()` rather than directly at `automationsProxy`.

**Disposition:** Per the override note in this verification request, this is treated as a deferred runtime-only blocker (parallel to Phase 175-03 VersionEnforcer). Static structure is fully correct.

### Behavioral Spot-Checks

| Behavior                                              | Command                                                                                  | Result                                | Status |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------- | ------ |
| TypeScript compiles cleanly across phase 180 surface  | `npx tsc --noEmit 2>&1 \| grep -E "automations\|automazioni\|EmberGlass/automations\|hooks/useAutomationsList"` | Empty output (no errors)              | ✓ PASS |
| Phase 180 unit test suite passes                      | `npm test -- app/components/EmberGlass/automations app/hooks/__tests__/useAutomationsList.test.ts` | 26 suites passed, 390 tests passed    | ✓ PASS |
| Catalog sizes lock                                    | `grep -c "as const" automations-config.ts` (manual count)                                | 2 triggers / 4 conditions / 11 actions | ✓ PASS |
| Action form export count                              | `grep -c "^export function" forms/ActionForms.tsx`                                       | 12 (11 forms + dispatcher)            | ✓ PASS |
| Condition form export count                           | `grep -c "^export function" forms/ConditionForms.tsx`                                    | 5 (4 forms + dispatcher)              | ✓ PASS |
| Trigger form export count                             | `grep -c "^export function" forms/TriggerForms.tsx`                                      | 3 (2 forms + dispatcher)              | ✓ PASS |
| Playwright spec exists with required structure        | `wc -l + grep "test.describe"`                                                           | 562 LOC, 8 describes (>=8 required)    | ✓ PASS |
| Live runtime fetch round-trip on /automazioni         | (requires headless browser + auth)                                                       | DEFERRED                              | ? SKIP |

### Requirements Coverage

| Requirement | Source Plan      | Description                                                                                                    | Status                | Evidence                                                                                                                              |
| ----------- | ---------------- | -------------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| AUTO-01     | 180-08           | List shows icon + name + description + toggle + status pill (trigger / N condizioni / N azioni / lastRun)     | ✓ SATISFIED           | `AutomationRow.tsx:55-167` renders all four pills + InlineToggle.                                                                     |
| AUTO-02     | 180-07, 180-08   | Nuova opens editor sheet with Name + Description + 4 inner tabs with badge counts                              | ✓ SATISFIED           | `AutomationsTab.tsx:155-170` Sheet wraps `AutomationEditor`; `AutomationEditor.tsx:225-284` 4 tabs + badges.                          |
| AUTO-03     | 180-02, 180-04   | Trigger picker supports the 5 documented types — **adjusted to 2 API types per CONTEXT D-08**                  | ✓ SATISFIED (override) | TRIGGER_TYPES.length === 2 lock; TriggerSection renders 2 tiles; CONTEXT D-08 + D-08c override accepted; sensor concepts surface as condition leaves. |
| AUTO-04     | 180-02, 180-05   | Conditions support nested AND/OR groups up to 2 levels deep with operator toggle; 4 leaf types                 | ✓ SATISFIED           | `ConditionGroup.tsx:22` MAX_DEPTH=2; CONDITION_TYPES has 4; ConditionForms exports 4 leaf forms.                                      |
| AUTO-05     | 180-02, 180-06   | Actions list supports 9 action types — **adjusted to 11 API types per CONTEXT D-09**                           | ✓ SATISFIED (override) | ACTION_TYPES.length === 11 lock; ActionsSection renders 11 tiles; ActionForms exports 11 named forms; ↑/↓/remove handlers wired.     |
| AUTO-06     | 180-07           | Avanzate exposes `min_interval_seconds` + `max_triggers_per_hour`                                              | ✓ SATISFIED           | `AdvancedSection.tsx:42-66` two NumInputs.                                                                                            |
| AUTO-07     | 180-07           | Save disabled until name + ≥1 action; unsaved-changes guard on close                                           | ✓ SATISFIED           | `AutomationEditor.tsx:157-160` saveAllowed; `:167-173` requestClose dirty-check; ConfirmationDialog variant=default.                  |
| AUTO-08     | 180-07, 180-08   | Existing automations open in same editor; Delete with confirm in edit mode                                     | ✓ SATISFIED           | `AutomationsTab.tsx:144-150` row click → setEditingRule(rule); `AutomationEditor.tsx:350-369` Elimina button + dialog (D-16).         |

All 8 requirement IDs accounted for; no orphans (REQUIREMENTS.md lists exactly AUTO-01..08 for this phase).

### Anti-Patterns Found

| File                              | Line | Pattern                                                                                  | Severity | Impact                                                                                          |
| --------------------------------- | ---- | ---------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `lib/automations/automationsProxy.ts` (pre-existing, NOT a phase 180 file) | 31, 41 | `body as unknown as Record<string, unknown>` cast — pre-existing pattern from prior phases | ℹ️ Info  | Out-of-scope per CONTEXT D-24 (proxy unchanged). No regression.                                  |
| `useAutomationsList.ts` (Plan 08) | 67-68, 84-89, 100-105, 116-121 | Hook silently catches haGet failure into setError without console output | ⚠️ Warning | Documented in 180-09 SUMMARY as the runtime blocker — operator visibility into the failure mode is poor. Recommended follow-up: log error to console.error so future verifiers can detect it without DevTools network inspection. |

No phase-180-introduced blocker anti-patterns detected. No TODO/FIXME/PLACEHOLDER comments found in the new automations namespace.

### Human Verification Required

#### 1. Live runtime smoke on /automazioni

**Test:** After landing the data-layer fix, visit `http://localhost:3000/automazioni` (BYPASS_AUTH=true) and verify:
- List populates from real `/api/v1/automations` response (or empty-state copy renders if no rules).
- Click "Nuova automazione" → Sheet opens, title = "Nuova automazione".
- Fill name "Test", switch to Azioni → click "+ Aggiungi azione" → click "Scrivi log" tile → fill message → click "Crea automazione".
- Sheet closes, new row appears in list.
- Toggle the row → InlineToggle flips, no full-page refresh.
- Click row → Sheet reopens with title "Modifica automazione", Trigger tiles disabled, inline note visible.
- Click "Elimina" → ConfirmationDialog appears → confirm → row removed.
- DevTools shows no console errors throughout.

**Expected:** All steps complete without console errors. Playwright spec at `tests/smoke/automations-tab.spec.ts` becomes green without any spec changes.

**Why human:** Plan 180-09 SUMMARY documents that `useAutomationsList` calls `automationsProxy.getAutomations()` → `haGet()` which reads `process.env.HA_API_URL` (server-only). In the browser these env vars are undefined, so the hook silently throws `ApiError('HA proxy not configured')` and swallows it into `setError`. The static spec is byte-correct; runtime is blocked until a follow-up plan rewires the hook to use a client-safe relative `fetch('/api/v1/automations')` (the Next.js API route at `app/api/v1/automations/route.ts` already exists and proxies correctly). Per the verifier override note, this matches the deferred-runtime pattern from Phase 175-03 VersionEnforcer and is NOT a phase-180 blocker.

#### 2. Italian copy + visual parity sweep

**Test:** Compare rendered automazioni route side-by-side with `automations.jsx` bundle reference across:
- Input height (38px), border (0.5px), radius (9px).
- "Crea automazione" CTA: ember accent + glow shadow.
- Nested condition group sidebar: depth-aware tone (`#5eafff` AND, `#ffb84a` OR).
- 65+ Italian copy strings (e.g. "TUTTE (E)", "ALMENO UNA (O)", "Nessuna automazione. Tocca **Nuova** per crearne una.", "0 = nessun limite", "Per cambiare il trigger, elimina e ricrea l'automazione.").

**Expected:** Visual parity within bundle tolerance; no English fallback strings; no missing Italian translations.

**Why human:** Visual fidelity and translation correctness cannot be programmatically verified.

### Gaps Summary

**No phase-180 blockers found in static structure.** All 8 must-haves verified, all 23 artifacts present, all 6 key links wired at the code level, all 8 requirements satisfied (2 via accepted CONTEXT D-08/D-09 overrides), all 26 unit test suites pass (390 tests), TypeScript compiles cleanly across the phase surface.

**One known runtime-only blocker** documented and accepted as deferred:
- `useAutomationsList` (Plan 08) → `automationsProxy.getAutomations` → `haGet()` → server-only env vars → silent failure in browser. Mitigations: (a) Next.js API route at `app/api/v1/automations/route.ts` already exists; (b) Playwright spec mocks all 4 HTTP methods at the path-glob level so it will pass once the hook is rewired; (c) follow-up plan can replace `automationsProxy` calls with relative `fetch('/api/v1/automations')` calls in the hook (or introduce a server-action wrapper). This is symmetric with the Phase 175-03 VersionEnforcer deferred-runtime precedent.

**Recommendation:** Promote to next phase only after a small follow-up plan re-wires the hook to use a client-safe relative `fetch` (or after operator manually verifies the runtime smoke listed above).

---

_Verified: 2026-04-30_
_Verifier: Claude (gsd-verifier)_
