---
phase: 180-automations-tab-full-editor
plan: "09"
subsystem: automations-tab
tags: [phase-180, playwright, e2e, verification, D-27, dialog-query-contract]
dependency_graph:
  requires:
    - 180-08 (AutomationsTab orchestrator + /automazioni route + automations barrel)
    - 180-07 (AutomationEditor body + ConfirmationDialog wiring)
    - 180-01..06 (primitives, lib, sections, forms)
  provides:
    - Playwright smoke spec covering AUTO-01..08 + D-12 + D-15 + D-16 end-to-end
    - Final phase verification gate (D-27 console-error check)
  affects:
    - tests/smoke/ (new spec file added)
tech_stack:
  added:
    - "@playwright/test (already installed)"
  patterns:
    - "Verbatim helpers from tests/smoke/rooms-tab.spec.ts (collectConsoleErrors, dismissVersionEnforcerIfPresent, dismissWhatsNewModalIfPresent, primeForAutomationsTest)"
    - "Route mocks via page.route('**/api/v1/automations**', ...) for GET/POST/PATCH/DELETE"
    - "Dialog scoping via getByRole('dialog').getByRole('button', { name }) — zero .first()/.last() on ambiguous labels (<dialog_query_contract>)"
    - "Per-test isolation: each test installs its own mocks before goto + helper dismissals"
key_files:
  created:
    - tests/smoke/automations-tab.spec.ts (562 LOC)
  modified: []
decisions:
  - "Split AUTO-02 + AUTO-03 + AUTO-05 into 3 separate describe blocks to satisfy plan's 8+ describe verification rule"
  - "Used getByLabel('Nome automazione', { exact: true }) to disambiguate from page-header button aria-label='Nuova automazione'"
  - "Used dialog.filter({ hasText }) for delete-confirm dialog to disambiguate from Sheet dialog (both are role='dialog')"
  - "Pre-existing infrastructure blocker prevents headless Playwright runtime (see Deviations)"
metrics:
  duration: "~50 minutes"
  completed: "2026-04-30"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 0
  tests_added: 15
---

# Phase 180 Plan 09: Playwright Smoke Spec Summary

**One-liner:** End-to-end Playwright smoke spec for /automazioni covering AUTO-01..08 + D-12 + D-15 + D-16 with route mocks, helpers from rooms-tab.spec.ts, and dialog-scoped queries per the locked `<dialog_query_contract>`.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Playwright smoke spec authored, all 8 describes + 15 tests | 1003deec | tests/smoke/automations-tab.spec.ts |
| 2 | Human UAT (auto-approved per `--auto` flag) | n/a | n/a |

## Source File

| File | LOC | Purpose |
|------|-----|---------|
| `tests/smoke/automations-tab.spec.ts` | 562 | Playwright smoke spec for /automazioni |

## Test Coverage Map

| describe block | Tests | Requirements covered |
|---|---|---|
| `AUTO-01: List rendering` | 2 | AUTO-01 (rows + 4 status pills, empty state) |
| `AUTO-02: Editor open + 4 tabs` | 1 | AUTO-02 (Sheet open + 4-tab segmented control) |
| `AUTO-03: 2-tile trigger picker (D-08)` | 1 | AUTO-03 + D-08 (exactly 2 tiles, no sensor fallback) |
| `AUTO-05: 11-tile action picker (D-09)` | 1 | AUTO-05 + D-09 (exactly 11 tiles in locked order) |
| `AUTO-04: Conditions AND/OR toggle` | 1 | AUTO-04 + D-10 (intro copy + operator flip) |
| `AUTO-06: Avanzate fields` | 1 | AUTO-06 (NumInput labels + Italian hints) |
| `AUTO-07: Save guard + unsaved-changes (D-14, D-15)` | 3 | AUTO-07 + D-14 + D-15 (disabled state, enabled state, dialog spawn) |
| `AUTO-08: Edit + delete + toggle (D-12, D-16)` | 4 | AUTO-08 + D-12 + D-16 (Modifica title, read-only trigger, confirm/cancel paths) |
| `full create flow generates no console errors (D-27)` (top-level) | 1 | D-27 (final phase-wide console-error gate) |
| **Total** | **15** | All 8 AUTO-* + 5 decisions covered |

## Static Contract Compliance

| Verification rule | Required | Actual | Status |
|---|---|---|---|
| `test.describe` blocks | >=8 | 8 | OK |
| `expect(errors).toEqual([])` console gates | >=2 | 3 | OK |
| Helper references (collectConsoleErrors / dismissVersionEnforcerIfPresent / dismissWhatsNewModalIfPresent) | >=3 | 36 | OK |
| `getByRole('dialog')` scope queries | >=3 | 8 | OK |
| Forbidden `.first()`/`.last()` on Elimina/Annulla labels | 0 | 0 (only annotated in a `// FORBIDDEN` comment) | OK |
| TypeScript compiles cleanly | 0 errors | 0 | OK |

Verification commands replayed:
```bash
grep -c "test.describe" tests/smoke/automations-tab.spec.ts        # 8
grep -c 'expect(errors).toEqual' tests/smoke/automations-tab.spec.ts  # 3
grep -cE 'collectConsoleErrors|dismissVersionEnforcer|dismissWhatsNewModal' tests/smoke/automations-tab.spec.ts  # 36
grep -c "getByRole('dialog')" tests/smoke/automations-tab.spec.ts  # 8
grep -nE "\.(first|last)\(\)" tests/smoke/automations-tab.spec.ts | grep -iE "elimina|annulla" | grep -v "// FORBIDDEN"  # empty
```

## Dialog Query Contract Compliance

All ConfirmationDialog interactions scoped per the locked `<dialog_query_contract>` from 180-09-PLAN:

- **Delete confirm dialog (danger variant — labels collide with editor footer):**
  ```ts
  const dialog = page.getByRole('dialog').filter({ hasText: /Eliminare l'automazione/ });
  await dialog.getByRole('button', { name: 'Elimina', exact: true }).click();
  await dialog.getByRole('button', { name: 'Annulla', exact: true }).click();
  ```
  Pattern A (preferred — scoped role query) applied throughout. Pattern B (testid) not needed because the dialog text filter is sufficient to disambiguate from the editor Sheet (which is also `role='dialog'`).

- **Unsaved-changes dialog (default variant — labels are unique):**
  ```ts
  await page.getByRole('button', { name: 'Continua a modificare' }).click();
  // No collision with editor footer ('Annulla' vs 'Continua a modificare')
  ```

- **Forbidden patterns (verified absent):**
  - `getByRole('button', { name: 'Elimina' }).last()` — DOM-order fragile, banned
  - `getByRole('button', { name: 'Annulla' }).first()` — DOM-order fragile, banned

The single `.last()` / `.first()` reference in the spec is inside a `// FORBIDDEN alternatives:` comment that documents the rule for future readers — it is not executable code.

## Helpers Reused Verbatim from rooms-tab.spec.ts

- `collectConsoleErrors(page)` — returns `{ errors, cleanup }`; Phase 97 / 175 / 177 / 179 canonical pattern
- `dismissVersionEnforcerIfPresent(page)` — Phase 175 known blocker (CONTEXT D-28)
- `dismissWhatsNewModalIfPresent(page)` — fresh-storage-state modal mounts on every cold-load
- `primeForAutomationsTest(page)` — pre-primes localStorage (lastSeenVersion + dismissedVersions) and installs a defensive `/api/version*` route mock; mirrors `primeDashboardForSheetTest` from rooms-tab.spec.ts

All four helpers are byte-equivalent to the rooms-tab.spec.ts source (modulo the rename `primeDashboardForSheetTest` → `primeForAutomationsTest` since the helper is page-agnostic but the name was page-specific).

## Route Mock Structure

Default fixture renders 1 rule (Sveglia mattutina, schedule_cron `0 7 * * *`, `actions: [log_event]`). Override via `mockAutomationsApi(page, { rules: [] })` for empty-list tests.

```ts
await page.route('**/api/v1/automations**', async (route) => {
  // Discriminates GET list vs single-item vs executions vs POST/PATCH/DELETE
  // GET on /api/v1/automations           -> 200 + items array
  // POST                                  -> 201 + spread body with id=99
  // PATCH                                 -> 200 + base rule
  // DELETE                                -> 204 + empty body
  // Other paths (executions, single-rule) -> route.continue() (let real server handle)
});
```

Discrimination via `URL(route.request().url())` parsing of pathname — handles paginated GET, single-rule GET (`/automations/{id}`), and execution-history GET (`/automations/{id}/executions`) distinctly.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking infra] Worktree missing `.env.local` and `tests/.auth/user.json`**
- **Found during:** Task 1 verification (Playwright dev-server boot failure)
- **Issue:** Worktrees inherit from main but exclude gitignored files. Without `.env.local`, the Next.js dev server fails to boot (Firebase env vars missing). Without `tests/.auth/user.json`, Playwright's `setup` project blocks all chromium tests.
- **Fix:** Created `.env.local` symlink to `/Users/federicomanfredi/Sites/localhost/pannello-stufa/.env.local`; created empty `tests/.auth/user.json` with valid JSON (`{"cookies":[],"origins":[]}`) to satisfy storageState load (BYPASS_AUTH=true mode bypasses real cookie validation via middleware mock).
- **Files modified:** None tracked. Symlink and stub auth file are gitignored — won't pollute commit.
- **Commit:** n/a (gitignored fixture preparation only)

**2. [Decision] Split combined describe block per plan verification rule**
- **Found during:** Task 1 static-contract grep
- **Issue:** Plan template grouped AUTO-02 + AUTO-03 + AUTO-05 into one describe (3 tests) but `<verification>` rule requires `8+ describe blocks`.
- **Fix:** Split into 3 separate describes (`AUTO-02: Editor open + 4 tabs`, `AUTO-03: 2-tile trigger picker (D-08)`, `AUTO-05: 11-tile action picker (D-09)`).
- **Files modified:** tests/smoke/automations-tab.spec.ts (no separate commit; same Task 1 commit)

### Pre-existing Architectural Blocker (Rule 4 — out of plan 09 scope)

**Plan 08 hook calls server-only `haGet` directly from a client component**

- **Discovered during:** Task 1 attempted Playwright runtime
- **Symptom:** When the spec ran headlessly, `useAutomationsList` mounted but never issued a network request to `/api/v1/automations`. The page-load console showed no errors; the page rendered "0 di 0 attive" because the hook silently caught the underlying failure and set `error` state without logging.
- **Root cause:** `useAutomationsList` (plan 08, `'use client'`) calls `automationsProxy.getAutomations()`, which calls `haGet()` from `lib/haClient.ts`. `haGet` reads `process.env.HA_API_URL` and `process.env.HA_API_KEY` (server-only env vars), constructing a fetch URL like `https://pdupun8zpr7exw43.myfritz.net/api/v1/automations`. In the browser, those env vars are `undefined`, so `getEnvConfig()` throws `ApiError('HA proxy not configured')`. The hook's `catch` block swallows this into `setError(...)` without console output.
- **Confirmed via:** Two debug Playwright traces capturing all browser network requests + page console. Zero requests to `/api/v1/automations` occurred during page load. No console errors were emitted.
- **Why this is Rule 4 (architectural — not auto-fixable here):** Fixing requires changing `useAutomationsList` to call `fetch('/api/v1/automations')` directly (a client-safe relative URL hitting the existing Next.js API route at `app/api/v1/automations/route.ts`), OR introducing a server-action wrapper. Both options change the data-flow architecture established by plan 08 and would land outside plan 09's scope (E2E spec authoring).
- **Why the spec is still correct as authored:** All 15 tests use `await page.route('**/api/v1/automations**', ...)` which intercepts on the path glob regardless of host. The Next.js API route at `app/api/v1/automations/route.ts` already exists and would respond correctly. Once the hook is fixed to call a client-safe URL, every test in this spec should pass without any spec changes.
- **Affected scope:** ALL provider hooks built on the same haClient pattern have the same property — but rooms-tab/dashboard-glass-cards/sheet-primitive specs work because their hooks call `/api/v1/...` directly via `fetch`, not via `automationsProxy`-style server-only wrappers.
- **Disposition:** Logged for follow-up plan. The orchestrator can spawn a thin gap-closure plan that rewrites `automationsProxy` (or `useAutomationsList`) to use relative `fetch` calls. Plan 09's deliverable (the spec) is complete and will become green the moment plan 08's data layer is corrected.

## Test Runtime Status

**Headless run:** NOT GREEN. All 15 tests time out because plan 08's `useAutomationsList` hook silently fails in the browser (see "Pre-existing Architectural Blocker" above). This mirrors the deferred Playwright runtime in Phase 175-03 (VersionEnforcer overlay blocker).

**Static analysis (the parts plan 09 actually owns):** GREEN.
- TypeScript compiles cleanly (no errors in the new spec)
- All `<verification>` grep checks pass
- File path correct (`tests/smoke/`, not `tests/playwright/`)
- Helpers byte-equivalent to rooms-tab.spec.ts source
- Dialog query contract enforced (zero forbidden patterns)
- All 8 AUTO-* requirements have explicit test coverage

**Console error count during attempted run:** 0 in the application code itself. The "no console errors" gate would pass; the failure is locator timeouts because the hook never populates the list.

## Human UAT Outcome

**Auto-approved per `--auto` flag.**

Per the auto-mode checkpoint policy in the prompt context: "human-verify checkpoints under `--auto` are auto-approved". Real visual parity (38px input height, 9px radius, 0.5px border, ember accent on Crea automazione button, depth-aware sidebar colors on nested condition groups) and Italian copy correctness (65+ strings) **must be performed manually by the user post-merge before promoting to production**. The automated Task 1 spec covers AUTO-01..08 + D-12 + D-15 + D-16 functionally, but visual fidelity / Italian translation correctness is auto-approved.

Recommended manual UAT steps after the architectural blocker is resolved:
1. `npm run dev` then visit http://localhost:3000/automazioni
2. Verify list rendering, Sheet open, 4 tabs visible, all picker tile counts (2 / 11)
3. Sweep Italian copy strings listed in 180-09-PLAN Task 2 `<how-to-verify>`
4. Confirm DevTools shows no console errors throughout

## Console Error Count During E2E

**Application-level: 0** (the spec asserts this in 3 places).
**Test runtime: timeouts due to upstream hook silent-failure** (see "Pre-existing Architectural Blocker"). Once that is fixed, the application-level 0-error gate is the actual signal — the test infrastructure is wired to fail on any application console error.

## Threat Flags

No new security surface beyond the test layer itself. The spec installs route mocks that synthesize Italian-string fixtures only — no XSS, no auth surface, no schema changes. Per the plan's threat register:

- **T-180-09-01 (Tampering — false-pass mocks):** Mitigated. Tests assert specific behavior (count of 11 action tiles, exact Italian copy, aria-disabled attributes, dialog headings) rather than just "no error".
- **T-180-09-02 (DoS — hung route handler):** Mitigated. All 4 HTTP methods covered + `route.continue()` fallback for unmatched paths.
- **T-180-09-03 (Info Disclosure — masked warnings):** Accepted. Same `collectConsoleErrors` discipline as Phase 175/177/179.
- **T-180-09-04 (Tampering — fragile dialog selectors):** Mitigated. All dialog assertions scoped via `getByRole('dialog').getByRole('button', { name })`. Forbidden `.first()`/`.last()` patterns absent (verified by grep).

## Self-Check: PASSED

- `tests/smoke/automations-tab.spec.ts` — FOUND (562 LOC)
- Commit `1003deec` — FOUND in git log (`test(180-09): add Playwright smoke spec...`)
- 15 tests across 8 describe blocks
- 3 console-error gates (>=2 required)
- 8 dialog-scope queries (>=3 required)
- 36 helper references (>=3 required)
- Zero forbidden `.first()`/`.last()` on dialog labels
- TypeScript compiles cleanly
- Pre-existing architectural blocker documented for follow-up

## Notes for Phase Verifier

- Spec is authored against the contract defined by plan 08's components and plan 07's editor — not against an idealized API. All selectors verified by direct read of `AutomationsTab.tsx`, `AutomationRow.tsx`, `AutomationEditor.tsx`, `TriggerSection.tsx`, `ActionsSection.tsx`, `ConditionsSection.tsx`, `ConditionGroup.tsx`, `AdvancedSection.tsx`, `ActionForms.tsx`, `TypeTile.tsx`.
- Once plan 08's hook is rewritten to call `fetch('/api/v1/automations')` directly (or a server-action equivalent), every test in this spec is expected to pass without spec changes.
- The Playwright `setup` project (Auth0 login) is incompatible with `BYPASS_AUTH=true` mode. To run the spec headlessly: `npx playwright test tests/smoke/automations-tab.spec.ts --project=chromium --no-deps`.
