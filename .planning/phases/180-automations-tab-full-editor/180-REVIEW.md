---
phase: 180-automations-tab-full-editor
reviewed: 2026-05-02T00:00:00Z
depth: standard
files_reviewed: 67
files_reviewed_list:
  - __tests__/lib/automationsProxy.test.ts
  - app/api/v1/automations/[rule_id]/__tests__/route.test.ts
  - app/api/v1/automations/[rule_id]/executions/__tests__/route.test.ts
  - app/api/v1/automations/__tests__/route.test.ts
  - app/api/v1/automations/route.ts
  - app/automations/[rule_id]/page.tsx
  - app/automations/page.tsx
  - app/automazioni/page.tsx
  - app/components/EmberGlass/automations/ActionRow.tsx
  - app/components/EmberGlass/automations/AutomationEditor.tsx
  - app/components/EmberGlass/automations/AutomationRow.tsx
  - app/components/EmberGlass/automations/AutomationsTab.tsx
  - app/components/EmberGlass/automations/ConditionGroup.tsx
  - app/components/EmberGlass/automations/ConditionItem.tsx
  - app/components/EmberGlass/automations/__tests__/ActionRow.test.tsx
  - app/components/EmberGlass/automations/__tests__/AutomationEditor.test.tsx
  - app/components/EmberGlass/automations/__tests__/AutomationRow.test.tsx
  - app/components/EmberGlass/automations/__tests__/AutomationsTab.test.tsx
  - app/components/EmberGlass/automations/__tests__/ConditionGroup.test.tsx
  - app/components/EmberGlass/automations/__tests__/ConditionItem.test.tsx
  - app/components/EmberGlass/automations/__tests__/forms/ActionForms.test.tsx
  - app/components/EmberGlass/automations/__tests__/forms/ConditionForms.test.tsx
  - app/components/EmberGlass/automations/__tests__/forms/TriggerForms.test.tsx
  - app/components/EmberGlass/automations/__tests__/lib/automations-config.test.ts
  - app/components/EmberGlass/automations/__tests__/lib/automations-mappers.test.ts
  - app/components/EmberGlass/automations/__tests__/lib/countConditions.test.ts
  - app/components/EmberGlass/automations/__tests__/lib/describeTrigger.test.ts
  - app/components/EmberGlass/automations/__tests__/lib/with-key.test.ts
  - app/components/EmberGlass/automations/__tests__/primitives/CronHint.test.tsx
  - app/components/EmberGlass/automations/__tests__/primitives/FieldLabel.test.tsx
  - app/components/EmberGlass/automations/__tests__/primitives/NumInput.test.tsx
  - app/components/EmberGlass/automations/__tests__/primitives/Pill.test.tsx
  - app/components/EmberGlass/automations/__tests__/primitives/SegmentedControl.test.tsx
  - app/components/EmberGlass/automations/__tests__/primitives/TextInput.test.tsx
  - app/components/EmberGlass/automations/__tests__/primitives/TypeTile.test.tsx
  - app/components/EmberGlass/automations/__tests__/sections/ActionsSection.test.tsx
  - app/components/EmberGlass/automations/__tests__/sections/AdvancedSection.test.tsx
  - app/components/EmberGlass/automations/__tests__/sections/ConditionsSection.test.tsx
  - app/components/EmberGlass/automations/__tests__/sections/TriggerSection.test.tsx
  - app/components/EmberGlass/automations/forms/ActionForms.tsx
  - app/components/EmberGlass/automations/forms/ConditionForms.tsx
  - app/components/EmberGlass/automations/forms/TriggerForms.tsx
  - app/components/EmberGlass/automations/index.ts
  - app/components/EmberGlass/automations/lib/automations-config.ts
  - app/components/EmberGlass/automations/lib/automations-mappers.ts
  - app/components/EmberGlass/automations/lib/countConditions.ts
  - app/components/EmberGlass/automations/lib/describeTrigger.ts
  - app/components/EmberGlass/automations/lib/with-key.ts
  - app/components/EmberGlass/automations/primitives/AddChip.tsx
  - app/components/EmberGlass/automations/primitives/CronHint.tsx
  - app/components/EmberGlass/automations/primitives/FieldLabel.tsx
  - app/components/EmberGlass/automations/primitives/IconBtn.tsx
  - app/components/EmberGlass/automations/primitives/NumInput.tsx
  - app/components/EmberGlass/automations/primitives/Pill.tsx
  - app/components/EmberGlass/automations/primitives/SegmentedControl.tsx
  - app/components/EmberGlass/automations/primitives/TextInput.tsx
  - app/components/EmberGlass/automations/primitives/TwoCol.tsx
  - app/components/EmberGlass/automations/primitives/TypeTile.tsx
  - app/components/EmberGlass/automations/sections/ActionsSection.tsx
  - app/components/EmberGlass/automations/sections/AdvancedSection.tsx
  - app/components/EmberGlass/automations/sections/ConditionsSection.tsx
  - app/components/EmberGlass/automations/sections/TriggerSection.tsx
  - app/components/EmberGlass/automations/types.ts
  - app/components/EmberGlass/index.ts
  - app/hooks/__tests__/useAutomationsList.test.ts
  - app/hooks/useAutomationsList.ts
  - lib/utils/__tests__/assertNever.test.ts
  - lib/utils/assertNever.ts
  - tests/smoke/automations-tab.spec.ts
  - types/automations.ts
findings:
  blocker: 4
  warning: 7
  total: 11
status: issues_found
---

# Phase 180 Re-Review: Code Review Report

**Reviewed:** 2026-05-02
**Depth:** standard
**Files Reviewed:** 67
**Status:** issues_found

## Summary

Re-review of the full Phase 180 surface (not just the Playwright spec from the prior review). The earlier WR-01..WR-03 fixes (deterministic sheet-unmount wait, PATCH body merge, anchored empty-state regex) were verified correct against current code: `tests/smoke/automations-tab.spec.ts:566` uses `expect(dialog).toHaveCount(0)`, the PATCH branch at line 186-195 merges the request body, and line 242 uses `/Nessuna automazione\. Tocca/`. Those landed cleanly.

Re-reviewing the production code surface (which the prior review did not touch — it was scoped to one Playwright spec) surfaces several real defects, including one that almost certainly breaks the new editor at runtime in the browser and three more that are integration-correctness or security gaps. Findings reclassified per the new BLOCKER/WARNING taxonomy.

**What works**
- `lib/automations/with-key.ts`: stable `__key` minting + `stripKeys` correctly strip the UI-internal field before serialization. Validation Map keyed by `__key` (AutomationEditor.tsx:127) is sound.
- `automations-mappers.ts`: D-10 normalization (always_true ↔ empty AND group, single-leaf unwrap) is correct, and `canonicalize` correctly skips array sorting.
- `assertNever` discipline is consistent across `defaultTrigger`, `defaultCondition`, `defaultAction`, and `ActionForm`.
- `TypeTile` 3-layer disabled protection (handler-removal + `pointerEvents:none` + `aria-disabled`) is proper defense-in-depth.
- `ActionsSection` correctly mints a fresh `__key` on type-swap so the parent's pruning useEffect drops stale validation entries.
- HttpWebhookForm withholds `onChange` while JSON is invalid (preserves last-good payload).

## Blocker Issues

### BL-01: Client hook calls server-only HA proxy — runtime crash in browser

**File:** `app/hooks/useAutomationsList.ts:22, 61, 81, 97, 113, 133`
**Issue:** `useAutomationsList` is a `'use client'` hook (line 1) that imports and invokes `automationsProxy` directly:

```ts
import { automationsProxy } from '@/lib/automations/automationsProxy';
// ...
const data = await automationsProxy.getAutomations({ ... });
await automationsProxy.createAutomation(body);
await automationsProxy.updateAutomation(String(id), patch);
await automationsProxy.deleteAutomation(String(id));
```

`automationsProxy` (lib/automations/automationsProxy.ts) is a thin wrapper over `haGet/haPost/haPatch/haDelete` from `@/lib/haClient`. Every haClient method begins with `getEnvConfig()` which reads `process.env.HA_API_URL` and `process.env.HA_API_KEY` (lib/haClient.ts:33-54). Neither variable is prefixed `NEXT_PUBLIC_`, so both are `undefined` in the browser bundle. The first call (`refetch` on mount) throws `ApiError(EXTERNAL_API_ERROR, 'HA proxy not configured: missing HA_API_URL', 500)` before fetch is invoked.

Cross-checked: every other client hook in the codebase (`useStoveData`, `useNetworkData`, `useLightsData`, `useSonosData`, `useDirigeraData`, `useThermostatData`, `useDeviceHistory`, etc.) uses `fetch('/api/v1/...')` to go through the Next.js API route (which then calls the proxy server-side). The legacy `app/automations/page.tsx:46` follows the same pattern (`fetch('/api/v1/automations?...')`). `useAutomationsList` is the ONLY client hook in the project that imports a `*Proxy` module directly — verified via `grep -rn "from '@/lib/automations'\|from '@/lib/haClient'" app/hooks/ app/components/`.

The Playwright smoke spec masks this because `page.route('**/api/v1/automations**')` is a glob that matches any URL containing `/api/v1/automations`, including the malformed `undefined/api/v1/automations` that haClient builds when `baseUrl === undefined` (template literal coerces to the string `"undefined"`). Production users hitting `/automazioni` will see an empty list with the toast `"HA proxy not configured: missing HA_API_URL"`, and Create/Save/Delete will all fail.

**Fix:** Route every call through the existing Next.js API endpoints, matching the legacy hook and the rest of the codebase:

```ts
// refetch
const res = await fetch(`/api/v1/automations?limit=${pageSize}&offset=${page * pageSize}`);
if (!res.ok) throw new Error('Errore nel caricamento');
const data = (await res.json()) as PaginatedResponse<AutomationRule>;

// create
const res = await fetch('/api/v1/automations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

// update
const res = await fetch(`/api/v1/automations/${id}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(patch),
});

// delete
const res = await fetch(`/api/v1/automations/${id}`, { method: 'DELETE' });
```

Then BL-02 also applies (POST schema must be widened to accept the full body).

### BL-02: POST `/api/v1/automations` Zod schema silently strips trigger/condition/actions

**File:** `app/api/v1/automations/route.ts:6-10, 32-39`
**Issue:** The schema only validates `{ name, description, enabled }`:

```ts
const automationCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  enabled: z.boolean().optional(),
});
// ...
const result = automationCreateSchema.safeParse(body);
// ...
const data = await automationsProxy.createAutomation(result.data as unknown as AutomationRuleCreate);
```

By default Zod strips unknown keys. So when (and as soon as) BL-01 is fixed and the new editor's POST body — which contains `trigger`, `condition`, `actions`, `min_interval_seconds`, `max_triggers_per_hour`, `active_hours_start`, `active_hours_end` — flows through this route, **Zod silently drops every editor field except name/description/enabled.** The backend would receive a stripped body and either 422 on validation, or worse, create a rule with default empty arrays/null trigger and the user's intended actions are lost.

The route's own comment acknowledges this: "Legacy API route — schema only validates name/description/enabled; server defaults condition/actions when missing. Full typed body is used by /automazioni Phase 180 editor." That comment confirms the bug — the route is NOT updated to pass through the full body, but the new editor is supposed to use it.

**Fix:** Either (a) widen the schema to validate the full `AutomationRuleCreate` shape, or (b) use Zod's `.passthrough()` to forward unknown keys. Option (a) is preferred for defense-in-depth:

```ts
import type { AutomationRuleCreate } from '@/types/automations';

const automationCreateSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().nullable().optional(),
  enabled: z.boolean().optional(),
  trigger: z.unknown().nullable().optional(),       // or full discriminated union
  condition: z.unknown().optional(),
  actions: z.array(z.unknown()).optional(),
  min_interval_seconds: z.number().int().min(0).optional(),
  max_triggers_per_hour: z.number().int().min(0).optional(),
  active_hours_start: z.string().nullable().optional(),
  active_hours_end: z.string().nullable().optional(),
}).passthrough();
```

Until both BL-01 and BL-02 are addressed, the new editor cannot create rules with triggers, conditions, or actions in production.

### BL-03: PATCH `/api/v1/automations/[rule_id]` accepts unvalidated body

**File:** `app/api/v1/automations/[rule_id]/route.ts:21-27`
**Issue:** The PATCH handler does `const body = await parseJson(request); const data = await automationsProxy.updateAutomation(rule_id, body);` — no Zod validation at all. The body type lands on `automationsProxy.updateAutomation` as `unknown`, then is double-cast in the proxy to `Record<string, unknown>` and forwarded verbatim to the HA backend.

This is a security regression vs the POST route (which at least validates name/description/enabled). An authenticated client can post any JSON and have it forwarded to the backend. Threat T-180-05/T-180-06 documents in the Phase 180 plan family explicitly require client-side input validation; the same threat surface applies on the API route boundary because the API route is the trust boundary between Auth0 sessions and the HA backend (which trusts requests bearing the X-API-Key header).

**Fix:** Add a Zod schema for the PATCH body matching `AutomationRulePatch` (no `trigger` field, per types/automations.ts and D-12):

```ts
const automationPatchSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  description: z.string().nullable().optional(),
  enabled: z.boolean().optional(),
  condition: z.unknown().optional(),
  actions: z.array(z.unknown()).optional(),
  min_interval_seconds: z.number().int().min(0).optional(),
  max_triggers_per_hour: z.number().int().min(0).optional(),
  active_hours_start: z.string().nullable().optional(),
  active_hours_end: z.string().nullable().optional(),
}).strict();  // reject `trigger` and any other unknown key

export const PATCH = withAuthAndErrorHandler(async (request, context) => {
  const params = await context.params;
  const rule_id = params['rule_id'] ?? '';
  const body = await parseJson(request);
  const result = automationPatchSchema.safeParse(body);
  if (!result.success) {
    return badRequest(result.error.issues.map(i => i.message).join(', '));
  }
  const data = await automationsProxy.updateAutomation(rule_id, result.data);
  return success(data as unknown as Record<string, unknown>);
}, 'Automations/Update');
```

`.strict()` enforces D-12 at the API boundary — clients cannot smuggle a `trigger` field through PATCH even by hand-crafting a request.

### BL-04: AutomationEditor `useMemo` with empty deps captures only the FIRST rule prop

**File:** `app/components/EmberGlass/automations/AutomationEditor.tsx:108-116`
**Issue:**

```ts
const initial: UIDraft = useMemo(
  () => (rule ? apiToDraft(rule) : emptyDraft()),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [] // intentional: stable snapshot on mount only
);
const initialKeyed: UIDraft = useMemo(
  () => ({ ...initial, actions: initial.actions.map(withKey) }),
  [initial]
);
const [original] = useState<UIDraft>(initialKeyed);
const [draft, setDraft] = useState<UIDraft>(initialKeyed);
```

The empty-deps `useMemo` means `initial` is computed once on mount from whatever `rule` was at that moment. If the parent ever swaps `rule` without unmounting the editor, the editor will keep showing the stale rule's data — `original`/`draft` are also `useState` initializers (called once), so they latch the stale value too.

In the current AutomationsTab.tsx wiring this is masked because the editor is wrapped in `{editingRule !== null && <AutomationEditor ...>}` (AutomationsTab.tsx:160-169) and `editingRule` toggles to `null` between every selection — so the editor unmounts and remounts. **However, the safety relies entirely on UI sequencing.** A future change such as:
- a "Next rule" navigation button inside the open sheet,
- a deep link refresh that updates `editingRule` while the sheet is open,
- a parent that batches updates such that the close→open transition reuses the same fiber,

will silently latch stale data. The intent comment ("stable snapshot on mount only") makes this look intentional, but it is the WRONG fix for the underlying problem (`apiToDraft(rule)` on every render would re-clone the draft and clobber user edits). The correct fix is to key the editor on `rule.id` so React unmounts it for each new rule, making the empty-deps `useMemo` redundant and safe.

**Fix:** In AutomationsTab.tsx, key the editor:

```tsx
{editingRule !== null && (
  <AutomationEditor
    key={editingRule === 'new' ? 'new' : editingRule.id}
    rule={isNew ? null : (editingRule as AutomationRule)}
    // ...
  />
)}
```

Then drop the `eslint-disable` comment and use `[rule]` as the dep, OR keep `[]` and add a runtime invariant:

```ts
useEffect(() => {
  if (rule && rule.id !== (original as { id?: number }).id) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('AutomationEditor: rule prop changed without remount');
    }
  }
}, [rule, original]);
```

## Warnings

### WR-01: `countDraftConditions` counts `always_true` as 1 — disagrees with API-side `countConditions`

**File:** `app/components/EmberGlass/automations/AutomationEditor.tsx:52-57`, `app/components/EmberGlass/automations/lib/countConditions.ts:12-19`
**Issue:** `countDraftConditions` (the editor's tab badge) counts every `kind: 'cond'` leaf as 1 — including `always_true`. `countConditions` (the AutomationRow pill) returns 0 for `always_true`. So if a user adds an "Sempre vero" leaf in the picker, the tab badge shows "Condizioni 1" while the saved rule's row pill (after refetch) shows no condition pill at all, because `always_true` round-trips through `uiGroupToConditionNode` to bare `{type:'always_true'}` (mappers.ts:111-113 returns this when items.length===0; for 1-leaf always_true the unwrap path at line 114-117 also produces bare `always_true`). The two counters disagree.

**Fix:** Mirror `countConditions`' logic — skip `always_true`:

```ts
function countDraftConditions(group: UIConditionGroup): number {
  return group.items.reduce((sum, item) => {
    if (item.kind === 'group') return sum + countDraftConditions(item);
    if ((item as { type?: string }).type === 'always_true') return sum;
    return sum + 1;
  }, 0);
}
```

### WR-02: `computePatchDelta` produces spurious `description` patch when API returns `undefined`

**File:** `app/components/EmberGlass/automations/lib/automations-mappers.ts:191-198`
**Issue:** The delta uses `JSON.stringify(canonicalize(origVal)) !== JSON.stringify(canonicalize(draftVal))`. When `origVal === undefined` (API serializer omits null fields) and `draftVal === null` (apiToDraft normalizes to `null`), the comparison is `JSON.stringify(undefined)` (which is the literal `undefined`, not a string) vs `JSON.stringify(null)` (which is `"null"`). Coerced via `!==`, `undefined !== "null"` is `true`, so `description: null` ends up in every PATCH even when the user didn't touch it. Same hazard for `active_hours_start` and `active_hours_end` (both nullable+optional in `AutomationRulePatch`).

**Fix:** Normalize `undefined` → `null` before comparing, OR drop fields whose draft value equals undefined/null when the original was also missing:

```ts
const origNorm = origVal === undefined ? null : origVal;
const draftNorm = draftVal === undefined ? null : draftVal;
if (JSON.stringify(canonicalize(origNorm)) !== JSON.stringify(canonicalize(draftNorm))) {
  (patch as Record<PatchField, unknown>)[field] = draftVal;
}
```

### WR-03: `ConditionGroup` uses array index as React key

**File:** `app/components/EmberGlass/automations/ConditionGroup.tsx:118-167`
**Issue:** `{group.items.map((item, i) => (<div key={i}> ...`. When the user removes the first item or reorders items via add/remove, React reuses the children at indices 0..N-1 and reconciles on identity. ConditionItem and child ConditionGroup don't currently hold local state, so this is latent. The moment anyone adds local state to a leaf form (e.g., DeviceStateForm caches a typed value before debounce), removing item[0] will paint the leftover state onto the new item[0]. This is the same class of bug that BLOCKER 1 in AutomationEditor was specifically fixed for via `__key`.

**Fix:** Mint a stable per-item key (mirror the action `__key` pattern):

```ts
import { useId } from 'react';
// or augment UIConditionNode with a __key minted in apiToDraft / addCondition / addGroup,
// and strip in uiGroupToConditionNode. Same shape as KeyedAction.
```

Minimum viable fix: derive a stable key from the leaf shape's discriminator + a counter at insertion time, similar to `withKey`/`stripKeys`.

### WR-04: `apiToDraft` `useMemo` in editor — `rule` is also baked into `original`/`draft` `useState`, doubling the latch

**File:** `app/components/EmberGlass/automations/AutomationEditor.tsx:119-120`
**Issue:** Even after BL-04 is fixed (keying on rule.id), there's still a subtle issue here: `useState<UIDraft>(initialKeyed)` is called twice, but the second call will receive a NEW reference if `initialKeyed` is recomputed (because `useMemo` deps changed). React's `useState(initialValue)` only uses `initialValue` once on mount, so this is only correct as long as the editor remounts whenever the rule changes. With the BL-04 keying fix in place this is fine, but document the invariant clearly so a future refactor that drops the parent `key=` doesn't silently re-introduce the latch.

**Fix:** Add a JSDoc above the `useState` line:

```ts
// Invariant: parent MUST key={rule.id} this component so it remounts per rule.
// Otherwise `initialKeyed` recomputation will be ignored by useState (mount-once),
// causing the editor to stick on the first rule it ever saw.
const [original] = useState<UIDraft>(initialKeyed);
```

### WR-05: `mockAutomationsApi.opts.rules` typed as `object[]` — same issue prior IN-02 flagged, never fixed

**File:** `tests/smoke/automations-tab.spec.ts:159`
**Issue:** From the prior REVIEW IN-02: `opts: { rules?: object[] } = {}`. `object[]` accepts any non-primitive. A fixture override that drops a required field (e.g., omits `actions`) compiles and runs but explodes at AutomationRow.tsx:41 (`rule.actions.length`). The prior review classified this as Info; under the new BLOCKER/WARNING taxonomy this is a Warning because (a) it's a known type-safety gap and (b) re-classifying everything Info → Warning per the v1 review schema (no `info` tier in current schema).

**Fix:** As the prior review suggested:

```ts
import type { AutomationRule } from '@/types/automations';
async function mockAutomationsApi(
  page: Page,
  opts: { rules?: Partial<AutomationRule>[] } = {}
): Promise<void> {
```

### WR-06: Smoke spec helper `dismissVersionEnforcerIfPresent` race window — pre-existing, still unfixed

**File:** `tests/smoke/automations-tab.spec.ts:62-79` (verbatim copy from rooms-tab.spec.ts)
**Issue:** Carried verbatim from the prior review (WR-04 → re-numbered WR-06 here). Helper polls 500ms for overlay then 200ms for the dismiss button. VersionEnforcer can mount AFTER 500ms on slow CI runners. Subsequent click on `Nuova automazione` may be intercepted by the overlay. The new editor route compounds this risk — `/automazioni` is fresh and has no prior smoke history; CI flake won't be caught until rooms-tab.spec.ts also fails.

**Fix:** Either mirror `dismissWhatsNewModalIfPresent`'s 4-attempt poll structure, or — preferred — extend `primeForAutomationsTest` to mock `**/api/version*` AND set `localStorage.lastSeenVersion` to a sentinel (lines 113-119 already mock `/api/version*` and set `lastSeenVersion='99.99.99'` — extend further to also bypass VersionEnforcer's check). Phase 175 D-28 documents this as a known-blocker; closing it at the helper level removes the race entirely.

### WR-07: `AutomationsPage` (legacy) `handleDelete` does not toggle `submitting` state

**File:** `app/automations/page.tsx:132-146`
**Issue:** `handleCreate` and `handleUpdate` both `setSubmitting(true/false)`. `handleDelete` doesn't. If the user clicks "Elimina" rapidly, multiple DELETE requests may fire in parallel before the first refetch completes. ConfirmationDialog auto-closes on first click via `setRuleToDelete(null)` (line 140), which mitigates the user-facing pathology, but the parallel fetches still race against `refetch()` and may produce a transient state where the deleted row reappears for one render. Minor, but inconsistent with the create/update handlers.

**Fix:**

```ts
const handleDelete = async () => {
  if (!ruleToDelete) return;
  setSubmitting(true);
  try {
    const res = await fetch(`/api/v1/automations/${ruleToDelete.id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Operazione non riuscita. Riprova.');
    toastSuccess('Regola eliminata');
    setRuleToDelete(null);
    await refetch();
  } catch (err) {
    toastError(err instanceof Error ? err.message : 'Operazione non riuscita. Riprova.');
    setRuleToDelete(null);
  } finally {
    setSubmitting(false);
  }
};
```

---

_Reviewed: 2026-05-02_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
