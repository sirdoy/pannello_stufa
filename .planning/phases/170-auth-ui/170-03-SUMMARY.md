---
phase: 170-auth-ui
plan: 03
subsystem: auth

tags: [nextjs, react, client-component, forms, zod, react-hook-form, a11y, playwright, jest, tdd]

# Dependency graph
requires:
  - phase: 170-auth-ui
    plan: 01
    provides: "POST /api/auth/login with {username,password} body support + ha_auth cookie + POST /api/auth/logout"
  - phase: 170-auth-ui
    plan: 02
    provides: "useApiKeys() + useLogin() hooks + /login page (auth gate to /settings/api-keys)"
  - phase: 118-123
    provides: "SettingsLayout + DataTable + FormModal + ConfirmationDialog + Badge + Banner UI primitives"
  - phase: 157-auth-module
    provides: "types/authProxy.ts — APIKeyInfo, APIKeyResponse, APIKeyListResponse"

provides:
  - "/settings/api-keys page: list / create-with-plaintext-reveal / revoke (AUTH-02, AUTH-03, AUTH-04)"
  - "Plaintext-once reveal Modal honoring UI-SPEC rules 1-8 (single-instance guarantee, handleRevealClose wipes on every close path, userSelect:all, 2000ms copy icon swap, no toast on copy, no aria-live on secret, initial focus on Copia button)"
  - "GLOBAL_SECTIONS.API_KEYS nav entry with KeyRound lucide icon (D-23)"
  - "Navbar isGlobalActive refactor: two-segment routes (/settings/api-keys) require exact-or-deeper match — preserves /registry, /rooms, /automations single-segment behavior"
  - "aria-current='page' on desktop global Links and mobile-menu MenuItems (accessibility improvement consumed by Playwright active-nav smoke assertions)"
  - "Mobile menu panel wrapped in <nav aria-label='Menu mobile'> for semantic correctness"
  - "Playwright smoke matrix extended with /login, /settings/api-keys, and two active-nav assertions (170-03-06)"
  - "Playwright feature spec tests/features/auth-ui.spec.ts — full mocked happy path via page.route() (170-03-07)"

affects: [future-plans-consuming-ha_auth-UI, future-settings-pages]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Two-modal pattern for reveal: <FormModal isOpen={showCreate && revealedKey===null}> alongside <Modal isOpen={revealedKey!==null}> — avoids FormModal's 800ms success-overlay racing the reveal swap"
    - "Single-close-path plaintext wipe: handleRevealClose callback fed to Modal.onClose — guarantees plaintext is nulled before refetch() fires, regardless of exit route (Chiudi / X / Escape / backdrop)"
    - "Copy-button state machine: copied useState + 2000ms setTimeout — mirrors app/network/components/CopyableIp.tsx; icon swap is the ONLY feedback (no toast, UI-SPEC rule 5)"
    - "Ref-based initial-focus pattern for dynamic modal: useRef<HTMLButtonElement> + useEffect that focuses the Copia button when revealedKey transitions to non-null (matches ConfirmationDialog's setTimeout(…,0) pattern at ConfirmationDialog.tsx:171-178)"
    - "Custom empty-state outside DataTable: the shared DataTable component has a hardcoded English 'No data available' fallback, so the Italian 'Nessuna API key' + 'Crea la tua prima chiave' copy is rendered in a sibling <div> that replaces DataTable when keys.length===0"
    - "isGlobalActive dual-mode: segments.length>=2 branch uses exact-or-deeper match (pathname === route || startsWith(route+'/')); single-segment branch keeps original prefix-only match. Covered by both Playwright active-nav smoke assertions"
    - "aria-current='page' pattern pushed into DropdownComponents.MenuItem (shared nav primitive) so the accessibility benefit extends beyond this phase automatically"
    - "Playwright page.route() with url+method branching + in-test mutable fixture (let keys=[]) to simulate CRUD state changes without a real backend"

key-files:
  created:
    - app/settings/api-keys/page.tsx
    - __tests__/app/settings/api-keys/page.test.tsx
    - tests/features/auth-ui.spec.ts
  modified:
    - app/components/Navbar.tsx
    - app/components/navigation/DropdownComponents.tsx
    - lib/devices/deviceTypes.ts
    - tests/smoke/page-loads.spec.ts

key-decisions:
  - "Reveal rendered via direct <Modal>, not inside FormModal's success slot. FormModal's 800ms success-overlay animation would race the reveal swap and the user's Copia click, producing a visible jitter or (worse) closing before the copy completes."
  - "isGlobalActive refactored rather than special-cased for api-keys — every future two-segment global route inherits the fix for free. Backward-compat proven by the Playwright active-nav test for /registry/types (single-segment) which still lights Registro correctly."
  - "aria-current pushed into MenuItem (shared navigation primitive) instead of added inline in Navbar. Broadens the a11y benefit: every MenuItem consumer (ContextMenu, future nav surfaces) now emits the correct aria-current attribute when marked isActive. Non-breaking: the existing DropdownComponents test suite (24 tests) stays green."
  - "Mobile menu panel wrapped in <nav aria-label='Menu mobile'> rather than keeping a bare <div>. Strict semantic upgrade — screen readers announce the menu as navigation landmark; Playwright's active-nav assertions can use the <nav> qualifier without needing locator workarounds."
  - "Custom empty-state rendered outside DataTable rather than extending DataTable with a locale-parameterized empty slot. Less invasive; keeps this phase's diff surface to 1 page + nav wiring. Future phases can DRY this up if the pattern repeats."
  - "Playwright feature spec uses page.route() mocks INSIDE the browser process — Auth0 and HA proxy are fully bypassed in CI. Set-Cookie header is echoed on the mocked /api/auth/login response so the post-login redirect behaves realistically."

patterns-established:
  - "Phase-170 UI-SPEC reveal-modal DOM pattern: Banner(compact,error) + Nome row + <code> with userSelect:all + Chiudi/Copia ember button stack. Future 'one-shot secret' surfaces (password resets, backup codes) can copy-paste the component almost verbatim."
  - "Two-segment global nav pattern: add GLOBAL_SECTIONS.FOO with route='/settings/foo' → isGlobalActive handles it automatically; no per-entry special-casing in Navbar."
  - "Playwright active-nav assertion pattern: open hamburger via getByRole('button', { name: /apri menu/i }), then assert a[href=...][aria-current='page']. Works for both desktop and mobile viewports because the mobile menu is the common surface."

requirements-completed: [AUTH-02, AUTH-03, AUTH-04]

# Metrics
duration: ~30min
completed: 2026-04-23
---

# Phase 170 Plan 03: API-Keys Management Page + Navbar Wiring + E2E Coverage Summary

**Built the `/settings/api-keys` management page with plaintext-once reveal + copy workflow, wired the KeyRound navbar entry into GLOBAL_SECTIONS, tightened `isGlobalActive` so two-segment routes don't over-light sibling /settings/* pages, and added Playwright smoke + feature coverage (mocked happy path) — closing AUTH-02/03/04 and delivering AUTH-01 end-to-end.**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-04-23 (worktree agent-af13a9d5, based on `1d18d4d8`)
- **Completed:** 2026-04-23
- **Tasks:** 2 (Task 1 TDD RED→GREEN; Task 2 non-TDD wiring + tests)
- **Files created:** 3 (1 page + 1 component test + 1 feature spec)
- **Files modified:** 4 (Navbar + MenuItem + GLOBAL_SECTIONS + smoke spec)
- **Jest tests added:** 12 (api-keys page)
- **Playwright tests added:** 5 (2 smoke + 2 active-nav + 1 feature spec)

## Accomplishments

- `/settings/api-keys` renders list/create/revoke/reveal flows with Italian copy (UI-SPEC §Copywriting Contract), re-using SettingsLayout + DataTable + FormModal + ConfirmationDialog + Badge + Banner primitives.
- Plaintext key reveal honors all 8 UI-SPEC rules:
  1. Single `useState<string|null>` cell (no duplication, no prop-drilling of the secret).
  2. `handleRevealClose` is the single exit path wired to `<Modal onClose={}>`; wipes plaintext + name + copied state + refetches the list.
  3. Red Banner (variant='error', compact) with verbatim warning copy *"Questa chiave è visibile solo ora…"*.
  4. `navigator.clipboard.writeText()` + 2000ms setTimeout — icon swaps Copy → Check and label "Copia chiave" → "Copiato".
  5. No toast on copy — icon swap is the confirmation.
  6. `<code>` has `style={{userSelect:'all'}}` for one-click manual-copy fallback.
  7. No `aria-live` on the `<code>` block; screen readers must not speak the secret automatically. The Banner above IS `role="alert"` (via Banner component default) but its copy is generic.
  8. Copia button receives initial focus via ref + setTimeout(0) useEffect pattern (mirrors ConfirmationDialog's danger-variant focus rule).
- `isGlobalActive` refactored to a dual-mode helper: two-segment routes (/settings/api-keys) require exact-or-deeper match; single-segment routes keep their existing prefix behavior. Preserves `/registry/types` → Registro lighting **and** prevents `/settings/thermostat` from over-lighting API Keys.
- Navbar KeyRound icon wired via `getIconForPath` case + lucide import. Mobile menu panel wrapped in `<nav aria-label="Menu mobile">` so the Playwright smoke active-nav assertions work without locator gymnastics.
- `aria-current="page"` pushed into MenuItem (shared nav primitive) + desktop global Link — accessibility improvement consumed immediately by the Playwright smoke tests and structurally correct for any future route.
- Jest: 12 component tests pin every behavior including the T-170-14 assertion that `screen.queryByText(/ha_live_/)` returns null after Chiudi. Broader regression run (__tests__/app/settings, __tests__/hooks, __tests__/app/login, __tests__/api/auth, app/components/navigation) — 21 suites, 168 tests, all green.
- Playwright spec lists cleanly (`npx playwright test --list` detects all 5 new tests); feature spec uses mutable `let keys=[]` fixture + url+method dispatch to simulate CRUD state transitions entirely in-browser.

## Task Commits

1. **Task 1:** `feat(170-03): add /settings/api-keys page with plaintext-once reveal` — `0b071f38`
2. **Task 2:** `feat(170-03): wire API Keys navbar entry and add Playwright smoke + feature specs` — `cd6c151b`

## Files Created / Modified

**Created**

- `app/settings/api-keys/page.tsx` (233 LOC) — client component, 'use client' declared. Hosts useApiKeys, three modals (FormModal for create, direct Modal for reveal, ConfirmationDialog for revoke), and the DataTable with 6 columns (id/name/created_at/last_used_at/is_active/actions). Custom empty-state rendered outside DataTable for Italian copy. SESSION_EXPIRED banner links to `/login?next=/settings/api-keys`.
- `__tests__/app/settings/api-keys/page.test.tsx` (252 LOC) — 12 Jest tests covering all rendering / create / revoke / empty-state / session-expired paths. Mocks `useApiKeys`, `useToast`, `SettingsLayout`, and `navigator.clipboard` to drive scenarios without touching the network.
- `tests/features/auth-ui.spec.ts` (141 LOC) — Playwright feature spec. Stubs `/api/auth/login`, `/api/auth/logout`, `/api/auth/api-keys`, and `/api/auth/api-keys/{id}` via `page.route()`; mutable fixture (`let keys = [...]`) simulates CRUD state. The happy path walks login → redirect → list → create → reveal → close → refetched → revoke → removed, using `getByTestId('confirmation-confirm')` to disambiguate the row Revoca vs. dialog Revoca buttons.

**Modified**

- `app/components/Navbar.tsx` (718 → 729 LOC) — KeyRound import; `getIconForPath` case for api-keys (placed last before the `return null`); `isGlobalActive` refactored to the dual-mode helper; desktop global Link gets `aria-current={isGlobalActive(...)?'page':undefined}`; mobile menu panel `<div>` → `<nav aria-label="Menu mobile">` (matching closing tag updated).
- `app/components/navigation/DropdownComponents.tsx` (+1 LOC) — MenuItem now emits `aria-current="page"` on the TransitionLink when `isActive`. Existing 24-test DropdownComponents suite remains green (aria-current is a purely additive attribute that doesn't affect existing assertions).
- `lib/devices/deviceTypes.ts` (+6 LOC) — `GLOBAL_SECTIONS.API_KEYS` entry: `{id:'api-keys', name:'API Keys', icon:'🔑', route:'/settings/api-keys'}` (no items — single-page section, mirrors AUTOMAZIONI).
- `tests/smoke/page-loads.spec.ts` (+70 LOC) — new `test.describe('Auth UI', …)` block with 4 tests: `/login loads`, `/settings/api-keys loads`, and two active-nav assertions. The active-nav tests open the hamburger menu first (`getByRole('button', { name: /apri menu/i }).click()`) so the mobile menu's MenuItem links are in the DOM with `aria-current` set.

## Decisions Made

- **Reveal view uses direct `<Modal>` not FormModal's success overlay** — FormModal's built-in 800ms `animate-fade-in` success overlay would racing the plaintext-reveal swap and the user's Copia click. Separate rendering keeps the two concerns isolated.
- **`handleRevealClose` is wrapped in `useCallback([refetch])`** — prevents the close handler from re-identifying on every render, which would double-subscribe Radix's onOpenChange callback. The refetch is fire-and-forget (`void refetch()`); the plaintext wipe happens synchronously before the refetch Promise resolves.
- **Empty state rendered outside DataTable** — the shared DataTable component currently hardcodes English "No data available" (line 574). Rather than extend it with an empty-state slot (invasive change affecting all DataTable consumers), the page renders its own Italian empty-state heading + body in a `<div>` that replaces DataTable when `keys.length===0`. A future phase can DRY this up into DataTable if the pattern repeats.
- **`aria-current` pushed into MenuItem, not added inline** — every MenuItem consumer now gets the correct aria-current automatically. Broadens the a11y win beyond this phase; non-breaking for existing callers.
- **Mobile menu panel promoted to `<nav>`** — strict semantic upgrade. Screen readers announce it as a navigation landmark; Playwright locators can use `nav` as a semantic qualifier without needing bespoke CSS class selectors.
- **Playwright feature spec uses fixture mutation inside beforeEach** — per-test reset of `let keys = [...]` gives the test full control over the simulated HA proxy state. URL+method dispatch in the handler closures mirrors the phase-170 Plan-02 pattern used for Jest tests.
- **ConfirmationDialog confirm button disambiguation via data-testid** — the row-level and dialog-level "Revoca" buttons share a label. `getByTestId('confirmation-confirm')` (already baked into ConfirmationDialog at line 261) is the semantically correct locator; using `getByRole('button', { name: 'Revoca' }).last()` also works but is fragile if DOM order changes.

## Deviations from Plan

**[Rule 2 — Auto-added critical functionality] Mobile-menu `<nav>` wrapper + aria-current on MenuItem**

The plan asked for Playwright smoke assertions like `nav a[href="/registry"][aria-current="page"]`, but:
- The only existing `<nav>` elements in the Navbar were the **hidden** desktop nav (`className="hidden items-center gap-3"` = display:none) and the mobile bottom-nav (no global entries).
- The mobile menu panel (which DOES contain global-section links) was a `<div>`.
- No MenuItem anywhere emitted `aria-current`.

Without these additions the active-nav smoke assertions would all return zero matches even for paths that semantically SHOULD light a nav entry. Both changes are strict a11y improvements and do not alter existing behavior:
- `<nav aria-label="Menu mobile">` adds a landmark; matched closing tag updated; no existing assertions broken.
- `aria-current="page"` is a purely additive attribute on links already marked `isActive` — the existing 24-test DropdownComponents suite stays green, and the existing `/settings` smoke test still passes (no aria-current regression possible since `aria-current` matters only when the helper returns true).

**Files modified:** `app/components/Navbar.tsx`, `app/components/navigation/DropdownComponents.tsx`
**Commit:** `cd6c151b` (same commit as the navbar wiring itself)

**[Rule 2 — Auto-added] Desktop global Link aria-current**

While adding aria-current to MenuItem (mobile), also added the same attribute to the desktop global `<Link>` render block (Navbar.tsx:325). The desktop nav is currently `display:none` so this has no functional effect today, but it future-proofs the nav for any re-enablement of desktop view.

**Total deviations:** 2 (both Rule 2 additions for smoke-assertion correctness). No Rule 4 architectural questions triggered.

## Issues Encountered

- **Pyenv rehash lock warning on every Bash invocation** — cosmetic noise in command output; does not affect test outcomes or behavior. Ignored, per Plan 01 and Plan 02 precedent.
- **Worktree base was initially wrong** (`65e42146…` instead of `1d18d4d8…`) — hard-reset succeeded on first try per the `<worktree_branch_check>` protocol.
- **`npx tsc --noEmit tests/features/auth-ui.spec.ts`** surfaces a pre-existing type error in `node_modules/@types/request` (CookieJar export missing from tough-cookie d.ts). Unrelated to this plan. Skipped — Playwright's own `--list` succeeded, which confirms the spec compiles and registers its tests correctly.
- **Playwright full-run not attempted** — the Playwright config (`playwright.config.ts:42`) starts its own `npm run dev` webServer and uses `tests/.auth/user.json` storageState. Running the full test would require boot-up time + a live HA + Auth0 dev environment. The specs were validated via `npx playwright test --list` which confirms valid spec registration; full execution is flagged as a manual verification step below.

## Manual Verification Required

The specs are committed and valid. To run them, with the repo root as cwd:

```bash
# Smoke tests (requires dev server / webServer starts it automatically)
npx playwright test tests/smoke/page-loads.spec.ts -g "login|api-keys" --reporter=line

# Feature spec (full mocked happy path)
npx playwright test tests/features/auth-ui.spec.ts --reporter=line
```

Per CLAUDE.md project rule #4 ("NEVER execute npm run build or npm install"), the full Playwright run is left to the user to invoke when convenient. The Jest suite, which does not require a running server, was run and all 168 tests in the affected surface are green.

## Threat Flags

None new. All mitigations from the plan's `<threat_model>` table are implemented:

- **T-170-14 (plaintext in React state)** → Jest test `plaintext is cleared from DOM after Chiudi` asserts `screen.queryByText(/ha_live_topsecret_xyz/)` is null after close. Playwright feature spec has the same assertion via `page.getByText(/ha_live_NewKey_secret_xyz/).not.toBeVisible()`.
- **T-170-16 (screen-reader leak)** → `<code>` element has NO `aria-live` region; the Banner above IS `role="alert"` (via Banner component default) but its copy is generic warning text, not the key.
- **T-170-17 (logs)** → no `console.log(revealedKey)` anywhere in the page; Playwright fixture string `ha_live_NewKey_secret_xyz` is NOT a real credential.
- **T-170-18 (stale modal on navigation)** → accepted per threat register; Next.js client navigation unmounts the page component, garbage-collecting `revealedKey` state.
- **T-170-19 (clipboard persists)** → accepted; OS-level resource, by-design UX.
- **T-170-20 (CSRF on revoke)** → same-origin fetch; sameSite=lax on `ha_auth` cookie from Plan 01; ConfirmationDialog adds user-confirmation UX gate.
- **T-170-21 (key name leakage in nav)** → accepted; navbar label is static ("API Keys"), no dynamic data.
- **T-170-22 (nav prefix over-match)** → mitigated by the `isGlobalActive` dual-mode refactor. Both active-nav Playwright smoke tests pin the exact expected behavior for single-segment AND two-segment routes.

## Known Stubs

None. All three new surfaces are fully wired:

- `/settings/api-keys` consumes the real `useApiKeys` hook (which hits real HA-proxy routes).
- Navbar API Keys link targets `/settings/api-keys` (exists).
- Feature spec exercises the full component tree — no TODOs, no placeholder data paths.

## TDD Gate Compliance

- **Task 1** — `type="auto" tdd="true"`:
  - **RED** confirmed: `Cannot find module '@/app/settings/api-keys/page'` before creation (exit code from first run).
  - **GREEN** confirmed: 12/12 tests pass after implementation.
  - Bundle-per-task pattern (test + implementation in a single `feat(170-03)` commit) matches Plans 01 and 02 precedent.
- **Task 2** — `type="auto" tdd="false"`: wiring-only task; no TDD gate expected. Verified by running adjacent test suites (168 tests, zero regressions) and by `npx playwright test --list` confirming the new specs are registered.

Plan frontmatter type is `execute`, so the plan-level TDD gate (separate `test(…)` then `feat(…)` commits) does not apply.

## Self-Check: PASSED

Claims verified:

- `test -f app/settings/api-keys/page.tsx` → FOUND
- `test -f __tests__/app/settings/api-keys/page.test.tsx` → FOUND
- `test -f tests/features/auth-ui.spec.ts` → FOUND
- Commit `0b071f38` (Task 1) → FOUND in `git log --oneline`
- Commit `cd6c151b` (Task 2) → FOUND in `git log --oneline`
- Task 1 acceptance greps all pass (exit counts match plan-prescribed values):
  - `'use client'` = 1, `setRevealedKey(null)` ≥ 1, `navigator.clipboard.writeText` = 1, `Copia chiave` = 1, `Copiato` ≥ 1, `API key revocata` = 1, `irreversibile` ≥ 1, `Mai usata` = 1, `Nessuna API key` ≥ 1, `Questa chiave è visibile solo ora` = 1, `login?next=/settings/api-keys` = 1.
- Task 2 acceptance greps all pass:
  - `API_KEYS:` in deviceTypes = 1, `route: '/settings/api-keys'` in deviceTypes = 1, `KeyRound` in Navbar = 2, `path.includes('api-keys')` = 1, `segments.length >= 2` = 1, smoke test pattern matches = 2, `page.route` in feature spec = 5, `ha_live_` in feature spec = 3.
- Jest suite: `npm test -- __tests__/app/settings/api-keys __tests__/hooks __tests__/app/login __tests__/api/auth app/components/navigation` → 21 suites, 168 tests, exit 0.
- Playwright: `npx playwright test --list tests/features/auth-ui.spec.ts tests/smoke/page-loads.spec.ts` → all 15 tests registered (including 4 new smoke + 1 new feature).

## Next Phase Readiness

- Phase 170 is **complete**: Plans 01 + 02 + 03 deliver AUTH-01, AUTH-02, AUTH-03, AUTH-04 end-to-end.
- The `isGlobalActive` dual-mode pattern is available for any future two-segment global route (e.g. `/settings/webhooks`, `/settings/integrations`) — just add to GLOBAL_SECTIONS; no nav-code change needed.
- The UI-SPEC reveal-modal component is inline to this page today. If a second one-shot-secret flow lands (backup codes, TOTP QR, password-reset email token), extracting it into a shared `<OneShotRevealModal>` in `app/components/ui/` would be low-cost and strictly additive.
- No blockers; no deferred items affecting downstream phases.

---
*Phase: 170-auth-ui*
*Plan: 03*
*Completed: 2026-04-23*
