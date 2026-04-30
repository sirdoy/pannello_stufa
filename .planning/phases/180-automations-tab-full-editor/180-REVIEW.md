---
phase: 180-automations-tab-full-editor
reviewed: 2026-04-30T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - tests/smoke/automations-tab.spec.ts
findings:
  critical: 0
  warning: 4
  info: 5
  total: 9
status: issues_found
---

# Phase 180: Code Review Report

**Reviewed:** 2026-04-30
**Depth:** standard
**Files Reviewed:** 1 (tests/smoke/automations-tab.spec.ts — 562 LOC)
**Status:** issues_found

## Summary

Wave 6 (180-09) added a single Playwright smoke spec exercising the /automazioni create → edit → toggle → delete flow against mocked /api/v1/automations responses. The spec contains 12 tests across 8 describe blocks and a final phase-wide console-error gate.

**What works**
- Helper functions on lines 43-134 are verbatim copies of the canonical helpers in tests/smoke/rooms-tab.spec.ts (lines 33-127): identical body, only `primeDashboardForSheetTest` was renamed to `primeForAutomationsTest`. No behavioral drift detected.
- All visible-string assertions match the actual UI source-of-truth verified by direct read:
  - Row aria-label `Apri automazione {name}` (AutomationRow.tsx:66).
  - Footer labels `Crea automazione` / `Salva modifiche` (AutomationEditor.tsx:411).
  - Sheet titles `Nuova automazione` / `Modifica automazione` (AutomationsTab.tsx:158).
  - Tab labels `Trigger` / `Condizioni` / `Azioni` / `Avanzate` (AutomationEditor.tsx:248 — `aria-label={tab}`).
  - 11 action tile labels match `ACTION_TYPES` in lib/automations-config.ts:74-84 in correct order.
  - 2 trigger tile labels (`Pianificazione`, `Manuale`) match `TRIGGER_TYPES` in lib/automations-config.ts:34-44.
  - Operator-toggle aria-label `Operatore gruppo: TUTTE (E)` / `ALMENO UNA (O)` matches ConditionGroup.tsx:100.
  - Advanced field labels and hints (`Intervallo minimo fra attivazioni`, `Massimo attivazioni per ora`, `0 = nessun limite`, `0 = illimitato`) match AdvancedSection.tsx:43-65.
  - ConfirmationDialog title/labels match AutomationEditor.tsx:423-437 (`Hai modifiche non salvate. Chiudere lo stesso?`, `Continua a modificare`, `Eliminare l'automazione "..."?`, `Elimina`/`Annulla`).
  - LogEvent form `aria-label="Messaggio"` matches ActionForms.tsx:244.
  - Last-run pill `ultima esecuzione: mai` matches AutomationRow.tsx:166 (`lastRun ?? 'mai'`).
- Dialog query contract is honored: every confirm/cancel button click on the delete confirmation dialog is scoped via `page.getByRole('dialog').filter({ hasText: ... })` (lines 495, 506, 524, 528). Zero `.first()` or `.last()` calls on ambiguous `Elimina` / `Annulla` labels. The only `.first()` calls in the file (lines 67, 72, 94, 97) are inside the verbatim-copied dismissal helpers, where they target unambiguous overlay heuristics.
- Route mock `mockAutomationsApi` covers GET (list), POST (201), PATCH (200), DELETE (204) with a `route.continue()` fallback for unmatched (line 195). Unmatched item-path GET (`/api/v1/automations/{id}`) and `/executions` GET would fall through to `route.continue()` — fine for the flows exercised, since the editor never fetches a single rule by id (it receives the row object directly via `setEditingRule`).
- Console-error gate is asserted in 3 specs (lines 224, 239, 561), exceeding the ≥2 requirement.
- VersionEnforcer + WhatsNewModal dismissals are invoked in every test before any interaction (Phase 175 known-blocker handling).

**What's broken or risky**
Four warnings concern flakiness vectors and assertion brittleness; five info items concern duplication and minor hygiene. No critical defects. None of the findings would prevent the spec from running today, but each represents a future regression hazard.

## Warnings

### WR-01: Hard-coded 800ms `waitForTimeout` in console-error gate is flake-prone

**File:** `tests/smoke/automations-tab.spec.ts:558`
**Issue:** The final phase-wide test (line 538-562) clicks `Crea automazione`, then sleeps 800ms with `await page.waitForTimeout(800);` to "Allow refetch + sheet close animation." Hard timeouts hide real timing bugs and produce CI flakes. If the create POST + refetch + Sheet outro animation exceeds 800ms on a slow CI runner, console errors emitted *after* `cleanup()` are dropped silently. Worse, console errors emitted by `automationsProxy.createAutomation` failures *before* the timeout would still be caught — but only by accident.
**Fix:** Replace with a deterministic wait keyed to the actual completion signal. Two options:

```ts
// Option A — wait for the Sheet to unmount (preferred, asserts intent)
await page.getByRole('button', { name: 'Crea automazione' }).click();
await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 5000 });

// Option B — wait for the refetch GET, scoped via waitForResponse before click
const [refetchResp] = await Promise.all([
  page.waitForResponse((r) =>
    r.url().includes('/api/v1/automations') && r.request().method() === 'GET'
  ),
  page.getByRole('button', { name: 'Crea automazione' }).click(),
]);
expect(refetchResp.ok()).toBe(true);
```

### WR-02: PATCH mock ignores request body — silently masks update bugs

**File:** `tests/smoke/automations-tab.spec.ts:186-191`
**Issue:** The PATCH branch returns `JSON.stringify({ ...MOCK_RULE_BASE })` regardless of the patch body. POST correctly merges the request body (line 184: `{ ...MOCK_RULE_BASE, ...body, id: 99 }`). PATCH does not. If a future test calls "edit existing rule, change name to X, click Salva modifiche, assert UI shows X," the PATCH mock would echo the original `Sveglia mattutina` name back and the assertion would pass even if the orchestrator sent the wrong patch. The asymmetry between POST (merges body) and PATCH (drops body) is a latent bug as soon as anyone copy-pastes this fixture for an update-flow test.
**Fix:**

```ts
} else if (method === 'PATCH') {
  const body = JSON.parse(route.request().postData() ?? '{}') as Record<string, unknown>;
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ ...MOCK_RULE_BASE, ...body }),
  });
}
```

### WR-03: Empty-state text is split across DOM nodes — regex match may misbehave on strict roles

**File:** `tests/smoke/automations-tab.spec.ts:236`
**Issue:** AutomationsTab.tsx:139 renders `Nessuna automazione. Tocca <strong>Nuova</strong> per crearne una.` — the text is split across the parent `<div>` and an inner `<strong>`. `page.getByText(/Nessuna automazione/)` works today because Playwright concatenates text nodes for the regex match, but it returns the parent `<div>`. If anyone later wraps the `<strong>` in another container, or if Playwright's text-locator semantics change, the match could resolve to multiple elements and fail strict mode. Also: the current `/Nessuna automazione/` regex would also match a hypothetical heading "Nessuna automazione attiva" elsewhere.
**Fix:** Anchor the match more precisely or use a role-based query:

```ts
await expect(page.getByText(/Nessuna automazione\. Tocca/)).toBeVisible({ timeout: 10000 });
```

### WR-04: `dismissVersionEnforcerIfPresent` race with WhatsNewModal — 200ms polls may miss late-mount overlays

**File:** `tests/smoke/automations-tab.spec.ts:62-79` (verbatim from rooms-tab; not introduced here but reviewed in scope)
**Issue:** This is a pre-existing helper bug inherited verbatim from rooms-tab.spec.ts but worth surfacing because /automazioni is a fresh route with no prior smoke history. The helper opens with `overlay.isVisible({ timeout: 500 })` then `dismiss.isVisible({ timeout: 200 })`. If the VersionEnforcer overlay mounts *after* the 500ms window (Auth0 callback redirect can introduce 600-1200ms hydration latency), the dismissal is a no-op and the overlay intercepts the very next click. WhatsNewModal has a 4-attempt poll (line 93) but VersionEnforcer does not. Symptom: intermittent `getByRole('button', { name: 'Nuova automazione' }).click()` failures with "intercepted by overlay" in CI logs.
**Fix:** Mirror the WhatsNewModal poll structure for VersionEnforcer (3-4 attempts × 750ms each), or — better — extend `primeForAutomationsTest` to mock `**/api/version*` with a "no-update" response *and* set `localStorage.lastSeenVersion` to a sentinel value that VersionEnforcer treats as up-to-date, removing the race entirely. Since this helper is shared with rooms-tab, fix at the source if pursued.

## Info

### IN-01: Helper duplication — copy-paste drift risk across 4+ smoke specs

**File:** `tests/smoke/automations-tab.spec.ts:43-134`
**Issue:** `collectConsoleErrors`, `dismissVersionEnforcerIfPresent`, `dismissWhatsNewModalIfPresent`, and `primeForAutomationsTest` are now duplicated verbatim across at least: page-loads.spec.ts, splash.spec.ts, dashboard-glass-cards.spec.ts, rooms-tab.spec.ts, and now automations-tab.spec.ts. Any future bug fix (e.g., WR-04) must be applied N times. The phase plan explicitly calls these "verbatim copies" as the desired pattern, but a single shared `tests/smoke/_helpers.ts` would eliminate drift at zero risk.
**Fix:** Out of scope for this phase — flag for a future cleanup pass that extracts to `tests/smoke/_helpers.ts` and re-imports.

### IN-02: `MOCK_RULE_BASE` typed as `object` — loses type safety in fixture overrides

**File:** `tests/smoke/automations-tab.spec.ts:159`
**Issue:** `opts: { rules?: object[] } = {}` — `object[]` accepts any non-primitive, including `{}`, `{ foo: 1 }`, `[]`. A fixture override that drops a required field (e.g., omits `actions`) would compile and run, but the AutomationRow render would throw `Cannot read property 'length' of undefined` at line 41 of AutomationRow.tsx (`rule.actions.length`). The console-error gate would catch this, but the failure mode is opaque.
**Fix:** Type the override as `Partial<AutomationRule>[]` or `AutomationRule[]`:

```ts
import type { AutomationRule } from '@/types/automations';
async function mockAutomationsApi(
  page: Page,
  opts: { rules?: Partial<AutomationRule>[] } = {}
): Promise<void> {
```

### IN-03: AUTO-05 test asserts visibility but not order

**File:** `tests/smoke/automations-tab.spec.ts:286-319`
**Issue:** The test title claims "EXACTLY 11 tiles in locked order" but the assertion loop only checks that each label is visible — it does not verify the DOM order matches `expected[]`. A bug that re-sorts tiles alphabetically would not be caught. Also missing: `await expect(page.getByRole('button', { name: /Imposta|Modalità|Cambia|Comando|Luce|Gruppo|Scena|Presa|Webhook|Scrivi/ })).toHaveCount(11)` to pin the count to exactly 11 (D-09 constraint).
**Fix:** Add ordered assertion using nth-of-type or locator chains:

```ts
const tiles = page.getByRole('dialog').getByRole('button').filter({
  hasText: /Imposta|Modalità|Cambia|Comando|Luce|Gruppo|Scena|Presa|Webhook|Scrivi/,
});
await expect(tiles).toHaveCount(11);
for (let i = 0; i < expected.length; i++) {
  await expect(tiles.nth(i)).toHaveText(new RegExp(expected[i]));
}
```

### IN-04: AUTO-03 negative assertion uses regex `/sensore/i` — fragile if any other UI string contains "sensor"

**File:** `tests/smoke/automations-tab.spec.ts:282`
**Issue:** `await expect(page.getByRole('button', { name: /sensore/i })).toHaveCount(0);` is intended to assert "no sensor-* trigger tiles render in the picker." Currently safe because the dashboard navbar, version banner, and toast manager don't ship a button with "sensor" in its name. But the assertion is page-wide (no dialog scoping), so adding any unrelated `Sensore temperatura` button anywhere in the layout would fail the test for a non-bug reason.
**Fix:** Scope the negative assertion to the editor dialog:

```ts
const dialog = page.getByRole('dialog');
await expect(dialog.getByRole('button', { name: /sensore/i })).toHaveCount(0);
```

### IN-05: Italian apostrophe escaping — verify `l'automazione` matches the source HTML entity

**File:** `tests/smoke/automations-tab.spec.ts:469, 495, 500, 524`
**Issue:** TriggerSection.tsx:45 emits `elimina e ricrea l&apos;automazione.` (HTML-entity-escaped apostrophe). The spec asserts `"Per cambiare il trigger, elimina e ricrea l'automazione."` with a raw U+0027 apostrophe (line 469). Playwright's text accessors compare against rendered text content, where `&apos;` decodes to `'`, so the match works. Similarly, AutomationEditor.tsx:435 builds `Eliminare l'automazione "..."` with a JS string literal — also a raw apostrophe — and lines 495/500/524 use the same. No bug today, but worth a comment block noting that any future migration to `&rsquo;` (curly apostrophe, U+2019) would silently break these regexes.
**Fix:** Add a comment near the helper region warning future maintainers, or normalize via `.toContainText` with a less strict match. Pure documentation hygiene — not a defect.

---

_Reviewed: 2026-04-30_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
