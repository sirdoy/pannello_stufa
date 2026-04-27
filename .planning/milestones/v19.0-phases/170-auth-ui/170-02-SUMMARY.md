---
phase: 170-auth-ui
plan: 02
subsystem: auth

tags: [nextjs, react, hooks, forms, zod, react-hook-form, client-component, jest, tdd]

# Dependency graph
requires:
  - phase: 170-auth-ui
    plan: 01
    provides: "POST /api/auth/login accepting optional {username,password} JSON body with env-var fallback, ha_auth cookie set on 200, 429 rate-limit propagation"
  - phase: 170-auth-ui
    plan: 01
    provides: "POST /api/auth/logout deleting ha_auth cookie and returning {authenticated:false}"
  - phase: 157-auth-module
    provides: "GET/POST/DELETE /api/auth/api-keys routes consumed by useApiKeys hook"
  - phase: 157-auth-module
    provides: "types/authProxy.ts interfaces (APIKeyInfo, APIKeyResponse, APIKeyListResponse)"

provides:
  - "useLogin() imperative hook: {authenticated, loading, error, rateLimitedUntil, login, logout} with sentinel error codes and 30s client-side lockout"
  - "useApiKeys() CRUD hook: {keys, loading, error, refetch, create, revoke} with auto-fetch on mount, 404-on-revoke treated as success"
  - "/login page: SettingsLayout + Card glass max-w-sm, Zod + RHF form, Italian copy, 429-countdown button, ?next= open-redirect guard (local-path-only, rejects protocol-relative //)"
  - "URL-dispatched fetch-mock pattern for hook tests under React StrictMode (robust to double-invoke)"

affects: [170-03-api-keys-page, 170-04-navbar, future-plans-consuming-useLogin-or-useApiKeys]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useCallback with dependency on rateLimitedUntil for client-side lockout short-circuit (short-circuits fetch without reset on success)"
    - "404-as-success branch in DELETE wrapper: `if (!res.ok && res.status !== 404) throw ...` — hook-level idempotency for already-revoked keys (D-11)"
    - "Hook does NOT retain create() plaintext — returns APIKeyResponse and callers own state (T-170-14 mitigation, Wave 3 depends on this)"
    - "Hook does NOT auto-refetch after create (caller owns reveal-modal lifecycle) — deliberate design decision for Wave 3"
    - "Open-redirect guard: `next.startsWith('/') && !next.startsWith('//')` — rejects absolute URLs AND protocol-relative URLs (T-170-10)"
    - "URL-dispatched fetch-mock for StrictMode-double-invoke safety: jest.fn switches on url+method instead of relying on mockResolvedValueOnce ordering"
    - "Rate-limit countdown re-render tick: local useState<number>(now) + setInterval(1s) inside useEffect guarded by `rateLimitedUntil <= Date.now()` short-circuit"
    - "FormModal-less in-page form: useForm<LoginForm>() directly on LoginPage; Controller binds Input components because Input needs field.name/value/onChange contract"

key-files:
  created:
    - app/hooks/useLogin.ts
    - app/hooks/useApiKeys.ts
    - app/login/page.tsx
    - __tests__/hooks/useLogin.test.ts
    - __tests__/hooks/useApiKeys.test.ts
    - __tests__/app/login/page.test.tsx
  modified: []

key-decisions:
  - "URL-dispatched fetch-mock (url+method) instead of sequential mockResolvedValueOnce — jest.setup.ts enables reactStrictMode:true which double-invokes useEffect, consuming 2x the expected mocks for any effect-driven fetch. URL dispatch is replay-safe."
  - "Hook surfaces sentinel string unions (RATE_LIMITED, INVALID_CREDENTIALS, SESSION_EXPIRED, NETWORK_ERROR, SERVER_ERROR) — component owns translation to Italian user-facing copy per UI-SPEC §Copywriting Contract. No localization libraries."
  - "Rate-limit lockout is client-side only; hook also propagates the server 429 to set rateLimitedUntil. Combined with server-side 10 req/min cap (T-170-05), effective rate ~2 req/min per client (T-170-12)."
  - "useApiKeys does NOT auto-refetch after create() — the caller (Wave 3 page) owns the reveal-modal lifecycle and the plaintext key state. This is a deliberate T-170-14 mitigation: the hook has zero memory of the plaintext after the create() promise resolves."
  - "Open-redirect guard tightened beyond the plan's `startsWith('/')` to also reject `startsWith('//')` (protocol-relative). Two explicit tests pin both branches of the check: absolute-URL case and protocol-relative case."
  - "Did NOT add Auth0 useUser guard on /login itself — the page is the login entry point; a useUser guard would create a chicken-and-egg redirect. The phase-157 withAuthAndErrorHandler still gates the /api/auth/login route server-side, and Wave 3 (/settings/api-keys) is where the client-side useUser guard lives per Q1 resolution."
  - "Used `type \"auto\" tdd=\"true\"` per-task TDD: test file committed alongside implementation in a single feat() commit (not split test+feat commits). Matches Plan 01 precedent."

patterns-established:
  - "Imperative-hook + sentinel-error-code pattern for auth commands — LoginError union type is the contract between hook (producer) and page (consumer). Future auth-adjacent hooks (password reset, token refresh) can reuse the shape."
  - "CRUD-hook with inline endpoint paths (not a shared client) — mirrors app/registry/types/page.tsx:41-69 useDeviceTypes style. useApiKeys elevates the pattern from inline to exportable for future multi-page reuse."
  - "StrictMode-safe fetch-mock: makeFetchMock(handlers: Record<url+method, response>) utility pattern. Tests with effect-driven fetches must use this instead of mockResolvedValueOnce."
  - "Open-redirect guard with dual check (absolute URL + protocol-relative): `next && next.startsWith('/') && !next.startsWith('//')`. Test both branches (https://evil.example and //evil.com) to prevent regression."

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04]

# Metrics
duration: 35min
completed: 2026-04-23
---

# Phase 170 Plan 02: Auth-UI Client Foundation (useLogin, useApiKeys, /login) Summary

**Built the client-side foundation for phase 170 — two imperative hooks (useLogin, useApiKeys) and the /login page — enabling future plans to consume HA-proxy auth without re-inventing the sentinel-error-code + rate-limit-lockout contract.**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-04-23 (worktree agent-a58eab31, based on e5c5e5a0)
- **Completed:** 2026-04-23
- **Tasks:** 3 (all TDD RED→GREEN)
- **Files created:** 6 (3 client modules + 3 test files)
- **Files modified:** 0
- **Tests added:** 25 (9 useLogin + 8 useApiKeys + 8 LoginPage)

## Accomplishments

- `app/hooks/useLogin.ts` — 5-field imperative hook (authenticated/loading/error/rateLimitedUntil plus login/logout callbacks). Client-side 30s lockout short-circuits further fetches during the window (T-170-12). Empty-body preservation for env-fallback login: `JSON.stringify(payload ?? {})` sends `'{}'` when called with no args. 9 tests green covering all sentinels (RATE_LIMITED, INVALID_CREDENTIALS, NETWORK_ERROR, SERVER_ERROR) and the lockout path.
- `app/hooks/useApiKeys.ts` — CRUD hook with auto-fetch on mount, create() returning plaintext APIKeyResponse (NOT retained), revoke() treating 404 as success (D-11). 8 tests green covering GET success/401/500, POST success/500, DELETE 204/404/500 branches.
- `app/login/page.tsx` — Complete /login route with SettingsLayout(showBackButton=false) + Card glass max-w-sm, Zod schema (`username: 1-64, password: ≥1` with Italian messages), RHF Controller-bound Inputs, autoFocus + autoComplete attrs (D-17), 30s lockout with live-countdown button label, open-redirect guard at submit. 8 tests green including the T-170-10 protocol-relative case (`?next=//evil.com` → /settings/api-keys).
- T-170-10 mitigation verified twice: `refuses ?next when it does not start with /` (https://evil.example) and `rejects protocol-relative URL in ?next= param` (//evil.com) both assert `mockPush('/settings/api-keys')`.
- No regressions in the broader auth test subset: `__tests__/api/auth __tests__/hooks/useLogin __tests__/hooks/useApiKeys __tests__/app/login` = 7 suites, 42 tests, all green in 11.2s.

## Task Commits

Each task was committed atomically (TDD RED→GREEN bundled per task per the `type="auto" tdd="true"` contract).

1. **Task 1: useLogin hook + 9 tests** — `5a7d95d8` (feat)
2. **Task 2: useApiKeys CRUD hook + 8 tests** — `e9312e7f` (feat)
3. **Task 3: /login page + 8 tests** — `5b3bba89` (feat)

## Files Created

- `app/hooks/useLogin.ts` (111 LOC) — Imperative login/logout hook. Exports `useLogin()` returning `{authenticated, loading, error, rateLimitedUntil, login, logout}`. Sentinel error codes as string union `LoginError`. 30s lockout window via `RATE_LIMIT_WINDOW_MS = 30_000` constant. Handles 200/401/429/500/network-throw branches with distinct sentinels.
- `app/hooks/useApiKeys.ts` (109 LOC) — CRUD hook over `/api/auth/api-keys`. Exports `useApiKeys()` returning `{keys, loading, error, refetch, create, revoke}`. Auto-refetches on mount. create() does NOT mutate state — returns plaintext to caller. revoke() auto-refetches on success (204 or 404); throws on 5xx.
- `app/login/page.tsx` (145 LOC) — 'use client' entry point. SettingsLayout(showBackButton=false) + Card variant="glass" max-w-sm. Zod schema with Italian messages. RHF + Controller for Input binding. Countdown tick via local useState + setInterval guarded by lockout presence. Open-redirect guard at submit-time.
- `__tests__/hooks/useLogin.test.ts` (148 LOC) — 9 tests pinning every branch: initial state, JSON body, empty-body fallback, 401 sentinel, 429 sentinel + rateLimitedUntil window, lockout-without-fetch, network-throw, 500 sentinel, logout empty-body. Uses plain jest.fn() mock since useLogin has no auto-fetch.
- `__tests__/hooks/useApiKeys.test.ts` (238 LOC) — 8 tests. Uses `makeFetchMock(url+method → response)` utility for StrictMode safety. Dynamic mocks for revoke tests (refetch returns different list after DELETE). Covers all CRUD branches including 404-as-success.
- `__tests__/app/login/page.test.tsx` (171 LOC) — 8 tests including the two open-redirect-guard cases. Mocks next/navigation (overrides jest.setup.ts global), @/app/components/SettingsLayout (pass-through), @/app/hooks/useLogin (state controlled per-test), @/app/hooks/useToast (spy object). Uses userEvent.setup() for realistic form interaction.

## Decisions Made

- **URL-dispatched fetch-mock in useApiKeys tests** — The first run with `mockResolvedValueOnce` had 5/8 tests timing out on `waitFor`. Root cause: `jest.setup.ts:32` sets `configure({ reactStrictMode: true })`, so `<StrictMode>` wraps every render, double-invoking `useEffect`. The initial GET fired twice, consuming two `mockResolvedValueOnce` calls instead of one. Switched to a URL+method-keyed handler map where every call returns the same response — replay-safe under StrictMode. This pattern should be the default for any hook test in this codebase going forward.
- **Hook lock-out short-circuits BEFORE `setLoading(true)`** — If the user spam-clicks during the lockout, we must NOT flash a loading state. The early-return inside `login` triggers `setError('RATE_LIMITED')` and returns false before any state mutation beyond error. The component sees `error='RATE_LIMITED'` stably during the window, and the countdown continues.
- **`JSON.stringify(payload ?? {})` for env-fallback** — `undefined` argument must produce the string `'{}'` so the server's tolerant body-parse treats it as "use env vars". `JSON.stringify(undefined)` returns `undefined`, which fetch would serialize as a non-string body — different semantics. `?? {}` pins the correct behavior and the test pins it as a separate assertion (`body: '{}'`).
- **Toast side-effects via useEffect, not inside onSubmit** — The `error` comes from the hook (asynchronous). Reading it inside `onSubmit` after `await login(...)` is racy (the hook state may not have updated yet when the component re-runs). Instead, a dedicated `useEffect(() => { ... }, [error, toastError, toastWarning])` fires the toast whenever `error` transitions — this is stable regardless of hook timing.
- **Banner rendered inline in form, NOT via a toast-only strategy** — UI-SPEC calls out "Credenziali non valide" as a visible inline banner for INVALID_CREDENTIALS. Both banner and toast fire; redundancy is deliberate (banner persists while form is re-attempted; toast pings attention).
- **No Auth0 useUser guard on /login** — Prompt mentioned "useUser() client-side guard" as a success criterion, but that Q1-resolution applies to /settings/api-keys (Wave 3), not /login. Adding a useUser guard to the login page itself would create a chicken-and-egg redirect for unauthenticated users trying to log in. Left unchanged; `withAuthAndErrorHandler` still gates the /api/auth/login route server-side.
- **No auto-refetch after useApiKeys.create()** — The caller (Wave 3 page) will show a reveal modal containing the plaintext `api_key` field. If the hook auto-refetched, the list would re-render under the modal with the new row — but the new row only has metadata, not the plaintext. The caller must drive the refetch AFTER the modal closes (when the user has copied the key and acknowledged). This is pinned by the test: the `create` test verifies the plaintext return value but does NOT check that the keys list has mutated.

## Deviations from Plan

The plan's useApiKeys test file in `<action>` used sequential `mockResolvedValueOnce` calls. This was incompatible with `jest.setup.ts`'s `reactStrictMode: true` configuration (which double-invokes useEffect on mount). Per **Rule 3 (blocking issue)**, refactored to URL-dispatched mock:

**[Rule 3 - Blocking] useApiKeys tests timed out under StrictMode double-invoke**
- **Found during:** Task 2 GREEN phase (first test run)
- **Issue:** `mockResolvedValueOnce(initialGET)` was consumed by the first invocation of the StrictMode-double `useEffect`; the second invocation then consumed the mock intended for the next call (revoke's DELETE), causing `waitFor` timeouts on 5/8 tests after ~1100s total.
- **Fix:** Replaced sequential `mockResolvedValueOnce` chains with `makeFetchMock(handlers)` — a jest.fn() switch on `(url, method)` returning a stable response per key. Dynamic tests (revoke flows) use a `revoked` boolean captured in closure so the second GET after DELETE returns a different list.
- **Files modified:** `__tests__/hooks/useApiKeys.test.ts` (237 LOC, rewritten in-session before commit)
- **Commit:** `e9312e7f` (same commit as the hook itself — TDD bundle)

**Also auto-added (Rule 2):** Explicit `logout()` test with empty-body assertion — plan listed in `<behavior>` but omitted the test body in `<action>`. Added Test 9 asserting `body: '{}'` on the logout POST.

**Total deviations:** 1 (Rule 3 — test infra rewrite for StrictMode safety). Not considered a plan deviation in the strict sense since the behavior under test is unchanged; only the mock style was adapted to the project's StrictMode setup.
**Impact on plan:** None on deliverable surface. All acceptance-criteria greps pass verbatim, all specified behaviors are pinned by tests, and the stricter URL-dispatch pattern is now documented for Wave 3 to reuse.

## Issues Encountered

- **Pyenv rehash lock warning on every Bash invocation** — cosmetic noise; does not affect test outcomes. Ignored (same as Plan 01 precedent).
- **Worktree base was incorrect at startup** — `git merge-base HEAD target` returned `65e42146` instead of `e5c5e5a0`. Hard-reset succeeded on first try per the `<worktree_branch_check>` protocol.
- **StrictMode double-invoke not obvious from test output** — the first failure surfaced as a `waitFor` timeout, not an "unmocked fetch" error. Took one iteration to diagnose (the first GREEN run took 1098s for 3/8 tests before timing out). Now documented in the Decisions section so future test authors jump straight to URL-dispatch mocks.
- **Vibration API console.warn in button click tests** — jsdom does not implement the Vibration API; Button's useHaptic hook logs a warning. Cosmetic, does not affect test outcomes. Left alone (not scoped to this plan).

## Threat Flags

None. All mitigations from the plan's `<threat_model>` are implemented:

- **T-170-10 (open redirect)** → implemented with dual-guard `next.startsWith('/') && !next.startsWith('//')` at submit-time. Two tests pin both failure branches (`https://evil.example` and `//evil.com`).
- **T-170-11 (password in DevTools)** → accepted per plan — unavoidable auth-form constraint. httpOnly `ha_auth` cookie ensures password is never re-sent after login; no localStorage or non-httpOnly storage.
- **T-170-12 (credential stuffing)** → 30s client-side lockout after first 429; lockout test asserts fetch is NOT called during the window. Combined with server-side 10 req/min cap ~ 2 req/min effective rate.
- **T-170-13 (error oracle)** → single generic "Credenziali non valide" for 401; no distinction between "user not found" and "wrong password" (matches HA proxy's own 401 generic).
- **T-170-14 (plaintext in hook state)** → `create()` returns the APIKeyResponse; hook has zero retention after the promise resolves. Caller owns plaintext state. No auto-refetch-after-create means the list-view never shows plaintext.
- **T-170-15 (CSRF)** → same-origin fetch from SPA; sameSite=lax on `ha_auth` cookie (Plan 01) + Auth0 appSession same-site defaults block cross-site form POST replay.

## Known Stubs

None. All three files are fully wired:

- `useLogin.login()` hits real endpoint `/api/auth/login`.
- `useApiKeys` hits real endpoints `/api/auth/api-keys` (GET/POST) and `/api/auth/api-keys/{id}` (DELETE).
- `/login` page wires form submission through `useLogin()` and router.push to `/settings/api-keys` — /settings/api-keys will be built in Wave 3 (170-03), so on first deploy the redirect target is not yet a resolvable route. This is the expected Wave-2 intermediate state per plan `<objective>`: "a user can visit `/login`, authenticate, and be redirected to `/settings/api-keys` (which does not exist yet — Wave 3 builds the page)."

## TDD Gate Compliance

Tasks are `type="auto" tdd="true"` (per-task TDD). RED and GREEN observed per task:

- **Task 1 RED:** `Cannot find module '@/app/hooks/useLogin'` — confirmed pre-creation.
- **Task 1 GREEN:** 9 tests green after hook creation.
- **Task 2 RED:** `Cannot find module '@/app/hooks/useApiKeys'` — confirmed pre-creation.
- **Task 2 GREEN (initial):** 5/8 timed out under StrictMode; rewrote fetch mocks to URL-dispatch; all 8 green.
- **Task 3 RED:** `Cannot find module '@/app/login/page'` — confirmed pre-creation.
- **Task 3 GREEN:** 8 tests green after page creation.

Plan frontmatter type is `execute`, not `tdd`, so plan-level TDD gate (separate `test(…)` then `feat(…)` commits) does not apply. Each task bundles test + implementation into a single `feat(170-02)` commit per the `type="auto" tdd="true"` task contract.

## Self-Check: PASSED

Claims verified:

- `test -f app/hooks/useLogin.ts` → FOUND
- `test -f app/hooks/useApiKeys.ts` → FOUND
- `test -f app/login/page.tsx` → FOUND
- `test -f __tests__/hooks/useLogin.test.ts` → FOUND
- `test -f __tests__/hooks/useApiKeys.test.ts` → FOUND
- `test -f __tests__/app/login/page.test.tsx` → FOUND
- Commit `5a7d95d8` (Task 1) → FOUND in `git log --oneline`
- Commit `e9312e7f` (Task 2) → FOUND in `git log --oneline`
- Commit `5b3bba89` (Task 3) → FOUND in `git log --oneline`
- `npm test -- __tests__/hooks/useLogin __tests__/hooks/useApiKeys __tests__/app/login` → 3 suites, 25 tests, exit 0, 8.4s
- `npm test -- __tests__/api/auth __tests__/hooks/useLogin __tests__/hooks/useApiKeys __tests__/app/login` → 7 suites, 42 tests, exit 0, 11.2s (no regressions into Plan 01)
- All acceptance-criteria greps pass: see per-task verification sections above
- Open-redirect guard present exactly once: `grep -n "startsWith('/') && !next.startsWith('//')" app/login/page.tsx` → 1 match

## Next Phase Readiness

- Wave 3 (170-03) can consume `useApiKeys` directly for the api-keys management page. The no-auto-refetch-after-create contract is pinned and documented — the page must drive its own refetch after the reveal modal closes.
- Wave 3's page should wrap in a useUser() client-side guard per Q1 resolution (pattern from app/settings/thermostat/page.tsx:16).
- `useLogin().logout()` is ready for Wave 3 to wire into a top-bar logout affordance.
- The URL-dispatched fetch-mock pattern (`makeFetchMock`) should be copy-pasted into Wave 3 tests if they use a similar CRUD hook.
- No blockers.

---
*Phase: 170-auth-ui*
*Completed: 2026-04-23*
