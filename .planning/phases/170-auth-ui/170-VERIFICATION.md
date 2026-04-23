---
phase: 170-auth-ui
verified: 2026-04-23T15:15:00Z
status: human_needed
score: 10/10 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Cookie httpOnly flag observed in real browser DevTools against real HA proxy"
    expected: "ha_auth cookie present in Application → Cookies with HttpOnly=true and Secure=true in production; no cookie accessible via document.cookie"
    why_human: "Playwright can assert the Set-Cookie header, but real cross-browser enforcement of HttpOnly / Secure flags in Chrome + Safari against a live HA proxy is a browser-level side effect that is not introspectable from unit or smoke tests"
    requirement: AUTH-01
  - test: "Created plaintext API key actually authenticates against HA proxy"
    expected: "curl -H 'X-API-Key: <plaintext copied from reveal modal>' <HA_API_URL>/health returns HTTP 200"
    why_human: "The plaintext key is only revealed once in the modal and never persists in any list endpoint — correctness of the value itself can only be validated end-to-end against a live HA proxy, not in a unit test"
    requirement: AUTH-02
  - test: "Revoked key returns 401 on subsequent use"
    expected: "After clicking Revoca in the UI, a subsequent curl with the previously-copied plaintext returns HTTP 401 (or equivalent auth failure)"
    why_human: "Verifies the side effect propagates to the HA proxy backend (server state change); our mocks confirm the DELETE fires but cannot confirm the backend honors it"
    requirement: AUTH-04
  - test: "Copy-to-clipboard button actually populates the OS clipboard"
    expected: "Create a key, click Copia (icon swaps Copy → Check and label changes to 'Copiato' for ~2s), paste into another application, verify the full plaintext appears"
    why_human: "Clipboard permissions and OS-level paste behavior vary by browser and platform; the only reliable verification is a manual paste test into a separate application"
    requirement: "D-10 UX"
---

# Phase 170: Auth UI Verification Report

**Phase Goal:** Users can log in via form UI and manage API keys end-to-end
**Verified:** 2026-04-23T15:15:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | POST /api/auth/login accepts optional body + sets ha_auth cookie with correct attrs | VERIFIED | `app/api/auth/login/route.ts:34-76` — tolerant body parse (L38-46), env fallback (L48-49), cookieStore.set('ha_auth', '1', {httpOnly:true, sameSite:'lax', secure:NODE_ENV==='production', path:'/', maxAge:3600}) (L67-73), T-157-01 preserved: `grep access_token` returns 0 matches |
| 2 | POST /api/auth/logout deletes ha_auth cookie | VERIFIED | `app/api/auth/logout/route.ts:21-25` — withAuthAndErrorHandler wrapping `cookieStore.delete('ha_auth')` returning `success({authenticated:false})` |
| 3 | useLogin hook POSTs to login/logout with sentinel error codes + 30s lockout | VERIFIED | `app/hooks/useLogin.ts:44-114` — LoginError union (L11-16), RATE_LIMIT_WINDOW_MS=30_000 (L42), lockout short-circuit (L52-56), 429/401/500/throw branches (L73-88), logout POSTs '{}' (L96-111) |
| 4 | useApiKeys exposes CRUD with SESSION_EXPIRED sentinel + 404-as-success | VERIFIED | `app/hooks/useApiKeys.ts:50-111` — `{keys, loading, error, refetch, create, revoke}` return, 401→SESSION_EXPIRED (L60-63), 404-as-success (`!res.ok && res.status !== 404`, L101), create returns plaintext without storing (L82-96) |
| 5 | /login page renders form, validates via Zod, respects ?next= open-redirect guard | VERIFIED | `app/login/page.tsx:40-151` — Zod schema (L28-34), Controller-bound Inputs with autoFocus + autoComplete (L109-134), open-redirect guard `next.startsWith('/') && !next.startsWith('//')` (L87) |
| 6 | /login page disables submit with countdown during rate-limit lockout | VERIFIED | `app/login/page.tsx:56-66, 137-146` — countdown setInterval, `isLockedOut` disables submit, label `Accedi (riprova tra ${secondsLeft}s)` |
| 7 | /settings/api-keys page lists keys with is_active badges and empty state | VERIFIED | `app/settings/api-keys/page.tsx:128-189, 235-247` — DataTable 6 columns, Badge ocean/neutral, custom Italian empty state ("Nessuna API key" / "Crea la tua prima chiave") |
| 8 | Create flow: FormModal submit → reveal Modal with plaintext + Copia → close wipes plaintext | VERIFIED | `app/settings/api-keys/page.tsx:80-99, 106-111, 252-333` — handleRevealClose single exit path wipes revealedKey+revealedKeyName+copied AND refetches (L81-86); reveal Modal renders `<code>` with userSelect:all; Copy state machine (2000ms icon swap); D-10 warning banner copy verbatim |
| 9 | Revoke flow: ConfirmationDialog danger variant → DELETE → list refetched | VERIFIED | `app/settings/api-keys/page.tsx:115-125, 336-345` — handleRevoke calls revoke() then toastSuccess; ConfirmationDialog variant="danger" with irreversibile warning; revoke in hook auto-refetches |
| 10 | Navbar entry + Playwright smoke + feature spec cover the happy path | VERIFIED | `lib/devices/deviceTypes.ts:332-337` (API_KEYS entry with KeyRound-icon route), `app/components/Navbar.tsx:7,176,197` (KeyRound import + isGlobalActive two-segment refactor + path.includes('api-keys') case), `tests/smoke/page-loads.spec.ts:131-186` (4 Auth UI tests), `tests/features/auth-ui.spec.ts` (5 page.route mocks, full happy-path walk) |

**Score:** 10/10 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/api/auth/login/route.ts` | Extended login route with body parsing + ha_auth cookie set | VERIFIED | 76 LOC; `grep cookieStore.set` = 1; `grep access_token` = 0; `grep 'await login'` = 1; tolerant body parse via request.text() then JSON.parse in try/catch |
| `app/api/auth/logout/route.ts` | New logout route that clears ha_auth cookie | VERIFIED | 25 LOC; `grep cookieStore.delete('ha_auth')` = 1; `grep 'export const POST'` = 1; `grep force-dynamic` = 1; no HA_ADMIN_USER/access_token refs |
| `app/hooks/useLogin.ts` | Imperative login/logout hook with sentinels + 30s lockout | VERIFIED | 114 LOC; 'use client' declared; RATE_LIMIT_WINDOW_MS=30_000; 5 sentinel codes in LoginError union; lockout short-circuits before fetch |
| `app/hooks/useApiKeys.ts` | CRUD hook for API keys | VERIFIED | 111 LOC; GET/POST/DELETE endpoints hit; 401→SESSION_EXPIRED; 404-on-revoke treated as success; plaintext returned from create but not stored |
| `app/login/page.tsx` | Login form page at /login route | VERIFIED | 151 LOC; SettingsLayout(showBackButton=false); Card variant="glass" max-w-sm; Zod + RHF Controller; autoFocus + autoComplete (D-17); 30s countdown; open-redirect guard (T-170-10 dual-check: `/` AND NOT `//`) |
| `app/settings/api-keys/page.tsx` | API-keys management page with list/create/revoke/reveal | VERIFIED | 348 LOC; single revealedKey useState cell; handleRevealClose single-close-path wipe; navigator.clipboard.writeText; 2000ms Copy→Check swap; ConfirmationDialog danger + irreversibile copy; SESSION_EXPIRED banner links to /login?next=/settings/api-keys |
| `app/components/Navbar.tsx` | Extended with KeyRound icon + isGlobalActive refactor | VERIFIED | KeyRound imported from lucide-react; `path.includes('api-keys')` case returns KeyRound; isGlobalActive dual-mode (two-segment routes use exact-or-deeper match); aria-current="page" emitted |
| `lib/devices/deviceTypes.ts` | Extended GLOBAL_SECTIONS with API_KEYS entry | VERIFIED | `API_KEYS: {id:'api-keys', name:'API Keys', icon:'🔑', route:'/settings/api-keys'}` at lines 332-337 (after AUTOMAZIONI, mirrors single-page section shape) |
| `__tests__/api/auth/login/route.test.ts` | Phase 157 tests + 4 new Phase 170 cases | VERIFIED | 192 LOC; original describe byte-for-byte (Tests 1-3) + "Phase 170 extensions" describe (Tests 4-9 covering body override, env fallback, cookie attrs, T-157-01, 429 propagation, invalid JSON) |
| `__tests__/api/auth/logout/route.test.ts` | New logout route tests | VERIFIED | 47 LOC; 2 tests asserting `.delete('ha_auth')` called once + `.set` never called |
| `__tests__/hooks/useLogin.test.ts` | useLogin behavior tests | VERIFIED | 148 LOC; 9 tests covering all sentinel branches + lockout-without-fetch |
| `__tests__/hooks/useApiKeys.test.ts` | useApiKeys CRUD tests | VERIFIED | 238 LOC; 8 tests; URL-dispatched fetch-mock for StrictMode safety |
| `__tests__/app/login/page.test.tsx` | LoginPage component tests | VERIFIED | 171 LOC; 8 tests including the two open-redirect guard cases (absolute URL + protocol-relative) |
| `__tests__/app/settings/api-keys/page.test.tsx` | ApiKeysPage component tests including plaintext-cleared assertion | VERIFIED | 252 LOC; 12 tests including `queryByText(/ha_live_.../)` returns null after Chiudi |
| `tests/smoke/page-loads.spec.ts` | Extended smoke matrix with /login + /settings/api-keys | VERIFIED | New "Auth UI" describe block with 4 tests: /login loads, /settings/api-keys loads, active-nav /registry lights Registro only, active-nav /settings/api-keys lights API Keys only |
| `tests/features/auth-ui.spec.ts` | Full mocked happy-path E2E | VERIFIED | 141 LOC; 5 page.route() mocks (login, logout, api-keys list+post, api-keys/{id} delete); mutable fixture simulates CRUD state; walk: login → redirect → list → create → reveal → close → revoke → removed |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| app/api/auth/login/route.ts | next/headers cookies() | `await cookies()` then `cookieStore.set('ha_auth', …)` | WIRED | Match at L66-73 with all 5 attributes (httpOnly, sameSite, secure, path, maxAge) |
| app/api/auth/logout/route.ts | next/headers cookies() | `await cookies()` then `cookieStore.delete('ha_auth')` | WIRED | Match at L22-23 |
| app/hooks/useLogin.ts | /api/auth/login | `fetch('/api/auth/login', {method:'POST', …})` | WIRED | L62-66 |
| app/hooks/useLogin.ts | /api/auth/logout | `fetch('/api/auth/logout', …)` | WIRED | L99-103 |
| app/hooks/useApiKeys.ts | /api/auth/api-keys | GET L59, POST L84-88, DELETE L100 template literal `api-keys/${id}` | WIRED | All three methods present |
| app/login/page.tsx | app/hooks/useLogin.ts | `const { login, error, rateLimitedUntil } = useLogin();` then `await login(values);` in onSubmit | WIRED | L43, L80 |
| app/settings/api-keys/page.tsx | app/hooks/useApiKeys.ts | `const { keys, loading, error, refetch, create, revoke } = useApiKeys();` + handler calls to create/revoke | WIRED | L59, L107 (create), L118 (revoke) |
| app/settings/api-keys/page.tsx | revealedKey React state | `setRevealedKey(res.api_key)` after create; `setRevealedKey(null)` in handleRevealClose | WIRED | L82 (wipe in single close path), L108 (set from create) |
| app/components/Navbar.tsx | lib/devices/deviceTypes.ts GLOBAL_SECTIONS | Consumed by navStructure → desktop + mobile Link rendering | WIRED | GLOBAL_SECTIONS.API_KEYS entry present, KeyRound icon case added to getIconForPath, isGlobalActive handles /settings/api-keys two-segment route |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|-------------------|--------|
| app/login/page.tsx | isLockedOut / secondsLeft / error | useLogin() hook state derived from live fetch() results | Yes — real fetch to /api/auth/login + server 429/401 responses | FLOWING |
| app/settings/api-keys/page.tsx | keys / loading / error / revealedKey | useApiKeys() hook (GET/POST/DELETE to /api/auth/api-keys) + local revealedKey state from create() return | Yes — real fetch + phase-157 routes already query HA proxy | FLOWING |
| app/settings/api-keys/page.tsx | revealedKey | set from `await create(values.name)` return.api_key — hook fetches real POST response, returns plaintext to caller | Yes — plaintext comes from real server response | FLOWING |
| app/components/Navbar.tsx | API Keys link destination | Static route `/settings/api-keys` from GLOBAL_SECTIONS.API_KEYS | N/A — static navigation entry, no data fetch required | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All auth tests pass | `npm test -- __tests__/api/auth __tests__/hooks/useLogin __tests__/hooks/useApiKeys __tests__/app/login __tests__/app/settings/api-keys` | 8 suites, 54 tests, exit 0, 14.55s | PASS |
| T-157-01 preservation: no access_token in login route source | `grep -c access_token app/api/auth/login/route.ts` | 0 | PASS |
| Open-redirect guard: dual check on /login | `grep "startsWith('/') && !next.startsWith('//')" app/login/page.tsx` | 1 match at L87 | PASS |
| Plaintext wipe wired: setRevealedKey(null) present | `grep -c "setRevealedKey(null)" app/settings/api-keys/page.tsx` | 1 (inside handleRevealClose at L82) | PASS |
| Cookie flags mirror lib/auth0.ts pattern | Visual inspection of login route lines 67-73 | All 5 flags set (httpOnly:true, sameSite:'lax', secure:NODE_ENV==='production', path:'/', maxAge:3600) | PASS |
| API_KEYS GLOBAL_SECTIONS entry wired | `grep API_KEYS lib/devices/deviceTypes.ts` | 1 match at L332 with route:'/settings/api-keys' and icon:'🔑' | PASS |
| KeyRound icon + isGlobalActive refactor in Navbar | `grep -E "KeyRound\|api-keys\|segments.length" app/components/Navbar.tsx` | KeyRound imported, path.includes('api-keys') case, two-segment comment at L176 | PASS |
| Playwright smoke extended with auth routes | `grep -E "/login loads|/settings/api-keys loads" tests/smoke/page-loads.spec.ts` | 2 matches in new "Auth UI" describe block at L129+ | PASS |
| Playwright feature spec uses page.route for mocking | `grep page.route tests/features/auth-ui.spec.ts` | 5 matches (login + logout + api-keys GET/POST + api-keys/{id} DELETE) | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|------------|-------------|-------------|--------|----------|
| AUTH-01 | 170-01, 170-02, 170-03 | User can authenticate via POST /auth/login with form-based credentials and receive JWT | SATISFIED | Login route extension (plan 01) + useLogin hook + /login page with Zod+rate-limit (plan 02) + smoke/feature E2E (plan 03). Note: JWT stays server-side (T-157-01); client receives ha_auth httpOnly cookie as authentication marker — this is a deliberate tightening of the original requirement wording and is documented in 170-CONTEXT.md D-15 |
| AUTH-02 | 170-02, 170-03 | User can create API key via POST /auth/api-keys | SATISFIED | useApiKeys.create() POSTs to /api/auth/api-keys returning plaintext; ApiKeysPage FormModal submit → reveal Modal; T-170-14 plaintext wipe assertion in component test; Playwright feature spec walks full create flow |
| AUTH-03 | 170-02, 170-03 | User can list their own API keys via GET /auth/api-keys | SATISFIED | useApiKeys auto-fetches on mount; ApiKeysPage renders DataTable with 6 columns; empty state + SESSION_EXPIRED banner; Playwright feature spec asserts list rendering after login |
| AUTH-04 | 170-02, 170-03 | User can revoke an API key via DELETE /auth/api-keys/{key_id} | SATISFIED | useApiKeys.revoke() DELETEs with 404-as-success; ApiKeysPage ConfirmationDialog danger variant with irreversibile copy; revoke auto-refetches list; Playwright feature spec walks revoke flow → row removed |

No orphaned requirements. All 4 requirement IDs declared in plan frontmatter (AUTH-01 in plans 01+02+03; AUTH-02/03/04 in plans 02+03) are accounted for, and REQUIREMENTS.md maps exactly these 4 IDs to "Phase 157 + 170 (UI)".

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| _None detected_ | — | — | — | All phase-170 files verified: no TODO/FIXME/placeholder strings, no `return null` hollow implementations, no hardcoded `[]` or `{}` values flowing to render (initial states are overwritten by real fetches), no console.log of sensitive data (revealedKey never logged). Test files are intentionally comprehensive (54 tests green). |

### Human Verification Required

The VALIDATION.md §"Manual-Only Verifications" table declares 4 items that cannot be validated by Jest or headless Playwright. These are propagated to HUMAN-UAT.md:

#### 1. Cookie HttpOnly flag observed in real browser DevTools

**Test:** Open `/login` in Chrome + Safari against a running dev server connected to the real HA proxy. Submit valid credentials. Open DevTools → Application → Cookies → locate `ha_auth`.
**Expected:** `ha_auth` cookie present with `HttpOnly: true`; in production build also `Secure: true`. `document.cookie` in the console should NOT contain `ha_auth`.
**Why human:** Browser-level enforcement of cookie flags varies across Chrome/Safari/Firefox implementations; headless Playwright can inspect the Set-Cookie header but not the browser's actual storage policy.
**Requirement:** AUTH-01

#### 2. Created plaintext API key authenticates against HA proxy

**Test:** Log in, click "Crea nuova API key" in `/settings/api-keys`, enter a name ("manual-uat"), submit. Copy the revealed plaintext. Run:
```bash
curl -H "X-API-Key: <plaintext>" <HA_API_URL>/health
```
**Expected:** HTTP 200 with the HA proxy health payload.
**Why human:** The plaintext is revealed only once and is never returned by any list endpoint — automated tests can only confirm that a response containing `api_key` was emitted, not that the value is accepted by the HA proxy backend.
**Requirement:** AUTH-02

#### 3. Revoked key returns 401 on subsequent use

**Test:** Using the plaintext copied in step 2 (still valid at this point), confirm the curl still returns 200. Then, in `/settings/api-keys`, click Revoca on that row → Confirm in the dialog. After the toast fires, re-run the same curl command.
**Expected:** The second curl returns HTTP 401 (or the HA proxy's configured auth-failure code).
**Why human:** End-to-end side effect on the HA proxy server; automated tests confirm DELETE is issued but cannot introspect server state.
**Requirement:** AUTH-04

#### 4. Copy-to-clipboard button populates the OS clipboard

**Test:** In the reveal Modal after creating a new key, click "Copia chiave". Observe the icon swap from Copy → Check and the label change to "Copiato" for ~2 seconds. Open a separate application (Notes, TextEdit, a code editor) and paste.
**Expected:** The pasted content is the full plaintext API key that was displayed in the Modal.
**Why human:** `navigator.clipboard.writeText()` success/failure depends on browser permission state (Safari and Firefox have stricter rules than Chrome); headless Playwright cannot verify the OS-level clipboard side effect.
**Requirement:** D-10 (UX contract from UI-SPEC)

### Gaps Summary

No gaps. Every must-have from Plans 01, 02, and 03 is present in the codebase with the expected wiring. All 4 requirement IDs (AUTH-01, AUTH-02, AUTH-03, AUTH-04) are SATISFIED by the combined deliverables. All 4 ROADMAP success criteria are met:

1. **Login page POSTs form credentials to `/auth/login`** — VERIFIED via `app/login/page.tsx` + `useLogin` + `__tests__/app/login/page.test.tsx` + Playwright feature spec. The codebase deliberately stores `ha_auth` httpOnly cookie instead of exposing the JWT to the client (T-157-01 hardening documented in 170-CONTEXT.md D-15).
2. **API-keys management page lists/creates/revokes** — VERIFIED via `app/settings/api-keys/page.tsx` + `useApiKeys` + 12 component tests + Playwright feature spec.
3. **Revoked keys disappear from list after refresh** — VERIFIED: `useApiKeys.revoke()` auto-refetches on success; Playwright feature spec asserts `page.getByText('Existing').not.toBeVisible()` after revoke.
4. **Jest + Playwright smoke covers happy path** — VERIFIED: 54 Jest tests green, Playwright smoke extended with 4 auth tests, feature spec walks the full mocked happy path.

The status is `human_needed` (not `passed`) because the 4 manual-only verifications from VALIDATION.md must be executed by a human against a live HA proxy — they test browser/OS-level behaviors (cookie flags, clipboard, real auth against a live backend) that are not introspectable from unit or headless E2E tests. The automated portion of the phase is complete and regression-safe.

---

*Verified: 2026-04-23T15:15:00Z*
*Verifier: Claude (gsd-verifier)*
