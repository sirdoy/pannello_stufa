---
phase: 170-auth-ui
plan: 01
subsystem: auth

tags: [nextjs, api-route, httpOnly-cookie, cookies, ha-proxy, jest, tdd]

# Dependency graph
requires:
  - phase: 157-auth-module
    provides: "POST /api/auth/login with withAuthAndErrorHandler + login(user, pass) that calls HA proxy and preserves T-157-01 (access_token never returned to client)"
  - phase: 157-auth-module
    provides: "ApiError class + ERROR_CODES (including RATE_LIMITED, VALIDATION_ERROR, EXTERNAL_API_ERROR) + ApiError.badRequest() factory"

provides:
  - "POST /api/auth/login accepting optional JSON body {username, password} with env-var fallback"
  - "Short-lived httpOnly session-marker cookie `ha_auth=1` set on successful login (maxAge=3600, sameSite=lax, secure in production)"
  - "POST /api/auth/logout that deletes `ha_auth` cookie and returns {authenticated:false}"
  - "Tolerant body-parse pattern via request.text() + JSON.parse (safe on empty and malformed bodies)"
  - "Jest mock template for next/headers cookies() in Next.js 16 (async-returning)"

affects: [170-02-hooks-useLogin, 170-03-api-keys-page, Plan 170-04-navbar, future-plans-using-ha_auth-cookie]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Tolerant body parse: read request.text() first, check length, JSON.parse inside try/catch → ApiError.badRequest on failure (Next.js 16 Pitfall 4)"
    - "httpOnly session-marker cookie with flags mirroring lib/auth0.ts:46-52 (httpOnly, sameSite=lax, path=/, secure=NODE_ENV==='production', maxAge=60*60)"
    - "Optional request parameter in withAuthAndErrorHandler body (async (request?: Request) => …) to preserve backward-compat with zero-arg phase-157 test callers"
    - "Mock jest.mock('next/headers', () => ({ cookies: () => Promise.resolve({ set, delete }) })) — Next.js 16 async cookies() shape"
    - "Token-discard pattern: await login(user, pass) with NO binding — HA proxy JWT literally never has a variable name (T-157-01, T-170-01)"

key-files:
  created:
    - app/api/auth/logout/route.ts
    - __tests__/api/auth/logout/route.test.ts
  modified:
    - app/api/auth/login/route.ts
    - __tests__/api/auth/login/route.test.ts

key-decisions:
  - "Made request parameter optional in login handler (async (request?: Request) => …) rather than edit phase-157 test calls — preserves git blame on the original 3 assertions byte-for-byte"
  - "Added Phase-170 extensions in a SECOND describe block, leaving the original `describe('POST /api/auth/login', …)` block untouched — matches plan directive and keeps T-157-01 regression visible"
  - "Logout route is a pure local-cookie mutation; no HA-proxy call (HA proxy has no server-side JWT invalidation in this phase)"
  - "Logout route does NOT accept a body (plan Test 3 defensive propagation marked optional; skipped per planner note — covered by withAuthAndErrorHandler suites)"
  - "Used exactly ApiError.badRequest('Invalid JSON body') (existing static factory → code=VALIDATION_ERROR, status=400) for malformed body — avoided inventing new code"

patterns-established:
  - "Token-never-captured: HA-proxy JWT is never bound to a variable in route code — satisfies strict grep `access_token|eyJ` = 0 matches in route file"
  - "Cookie-flag parity with Auth0: new session cookies (ha_auth) mirror lib/auth0.ts:46-52 {httpOnly, sameSite, secure:NODE_ENV==='production', path, maxAge} — single source of truth for httpOnly policy"
  - "Two-describe pattern for TDD extensions: keep original describe block frozen, add `Phase N extensions` describe for new assertions → preserves git blame on untouched tests and isolates regression surface"
  - "Cookie set/delete mock (jest.fn spy + next/headers mock) reusable across any route that touches cookies — can be hoisted to a shared test helper in a future phase if the pattern recurs"

requirements-completed: [AUTH-01]

# Metrics
duration: 22min
completed: 2026-04-23
---

# Phase 170 Plan 01: Auth-UI Backend Routes (Login body + ha_auth cookie + Logout) Summary

**Extended POST /api/auth/login to accept an optional {username, password} body with env-var fallback and set a short-lived httpOnly ha_auth session-marker cookie; added POST /api/auth/logout that deletes the cookie — all while preserving T-157-01 (HA-proxy JWT never exposed to client).**

## Performance

- **Duration:** ~22 min
- **Started:** 2026-04-23 (worktree agent-a8b2ef5f, based on 55ef4c96)
- **Completed:** 2026-04-23
- **Tasks:** 2 (both TDD)
- **Files created:** 2 (1 route, 1 test)
- **Files modified:** 2 (1 route, 1 test)
- **Lines total:** 101 route LOC + 239 test LOC

## Accomplishments

- `POST /api/auth/login` now accepts an optional JSON body `{username, password}`; empty/absent body falls back to HA_ADMIN_USER / HA_ADMIN_PASSWORD env vars (Tests 4 and 5 prove both paths).
- On successful login, a short-lived httpOnly session-marker cookie `ha_auth=1` is set with exactly the attributes `{httpOnly:true, sameSite:'lax', secure: NODE_ENV==='production', path:'/', maxAge:3600}` mirroring `lib/auth0.ts:46-52`. Test 6 pins the full attribute object.
- `POST /api/auth/logout` (NEW) deletes the `ha_auth` cookie and returns `{ok:true, data:{authenticated:false}}`. Both tests green.
- T-157-01 preserved — Test 7 stringifies the full response body and asserts it contains neither `access_token` nor the mock JWT substring; the handler never binds the login() return value to any variable.
- 429 RATE_LIMITED responses from the HA proxy propagate unchanged to the client, and the cookie is NOT set on failure (Test 8).
- Invalid JSON body maps to `ApiError.badRequest('Invalid JSON body')` → code=VALIDATION_ERROR, status=400 (Test 9). No custom error code introduced.
- Full `__tests__/api/auth/` suite 17/17 green (3 phase-157 login + 6 phase-170 extensions + 2 logout + 6 api-keys).

## Task Commits

Each task was committed atomically (TDD: test edits + route edits bundled per task for a single logical unit).

1. **Task 1: Extend login route with body parsing + ha_auth cookie set** — `42b60eb1` (feat)
2. **Task 2: Create POST /api/auth/logout route + tests** — `035787d6` (feat)

## Files Created/Modified

- `app/api/auth/login/route.ts` (MODIFIED, 35 → 76 LOC) — Tolerant body parse via `request.text()` + `JSON.parse` guarded by try/catch; body.username/password override env vars when present; httpOnly `ha_auth=1` cookie set on success with Auth0-matching flags; `await login(...)` return value intentionally discarded (T-157-01 / T-170-01).
- `app/api/auth/logout/route.ts` (CREATED, 25 LOC) — Minimal `withAuthAndErrorHandler` route; `await cookies()` then `cookieStore.delete('ha_auth')`; returns `success({authenticated:false})`. No HA-proxy call, no env-var lookup — purely local cookie mutation.
- `__tests__/api/auth/login/route.test.ts` (MODIFIED, 69 → 192 LOC) — Original `describe('POST /api/auth/login', …)` block kept byte-for-byte (Tests 1-3). New `describe('POST /api/auth/login — Phase 170 extensions', …)` with Tests 4-9: body override, env fallback, cookie attribute pinning, T-157-01 preservation, 429 propagation, invalid-JSON → badRequest. Added module-scoped `makeRequest` helper + `makeRawRequest` for raw-text tests; hoisted `mockSet` / `mockDelete` jest.fn spies; `jest.mock('next/headers', () => ({ cookies: () => Promise.resolve({ set: mockSet, delete: mockDelete }) }))`.
- `__tests__/api/auth/logout/route.test.ts` (CREATED, 47 LOC) — Mirrors login test mock wiring; 2 tests: delete called with `'ha_auth'` exactly once + response body shape, and no-set assertion.

## Decisions Made

- **Optional request parameter (Option A from plan)** — the login handler signature is `async (request?: Request) => …` with `const raw = request ? await request.text() : '';`. This preserves the 3 phase-157 tests that call `POST()` with zero arguments — zero edits to the original describe block, zero regressions.
- **Separate describe block for Phase 170** — all new tests live in `describe('POST /api/auth/login — Phase 170 extensions', …)` below the original. Per plan directive "KEEP the existing describe block byte-for-byte" — git blame on Tests 1-3 stays 100% phase-157.
- **Used `ApiError.badRequest()` static factory** — confirmed it exists at `lib/core/apiErrors.ts:237` mapping to VALIDATION_ERROR / 400. No new error code invented.
- **Used `ERROR_CODES.RATE_LIMITED`** — confirmed at `lib/core/apiErrors.ts:97` with Italian message at `:162`. Test 8 uses `HTTP_STATUS.TOO_MANY_REQUESTS` (429) for status pinning.
- **Skipped optional Test 3 in logout test suite** — per plan guidance ("defensive propagation is implicitly covered by withAuthAndErrorHandler test suites"). Replaced with explicit "does not set any cookie" assertion so `mockSet`/`mockDelete` symmetry is exercised.
- **Tightened prose in login route file to satisfy strict grep counts** — removed `ha_auth` from docstring and `access_token` from docstring, and removed redundant mentions so `grep -c "ha_auth"` = 1, `grep -c "await login"` = 1, `grep -En "access_token|eyJ"` = NO MATCH. Acceptance criteria in the plan are literal grep counts; making docstrings slightly less explicit was the cleanest path.

## Deviations from Plan

None requiring deviation-rule classification.

Minor adjustments made in the spirit of the plan:

- The plan's acceptance criterion `grep -c "await login" app/api/auth/login/route.ts returns 1` conflicted with having "`await login(...)`" in the docstring. The docstring was rephrased to remove the backtick-quoted example — still conveys the security contract ("awaited for its side effect, return value discarded") but without a literal `await login` substring. Semantically equivalent; pedantically passes the grep.

**Total deviations:** 0 (Rules 1-4 not triggered; two docstring tightenings to satisfy literal grep counts are cosmetic cleanup, not deviations)
**Impact on plan:** None. All success criteria met, all acceptance-criteria greps pass verbatim, T-157-01 preserved, full auth suite green.

## Issues Encountered

- **Pyenv rehash lock warning on every Bash invocation** — cosmetic noise in the test runner output; does not affect test results. Ignored.
- **Worktree base was incorrect at startup** — `git merge-base HEAD target` returned `65e42146` instead of the expected `55ef4c96649d…`. Hard-reset succeeded on first try; the `<worktree_branch_check>` protocol handled this cleanly.

## Threat Flags

None. No new security-relevant surface introduced beyond what the plan's `<threat_model>` covers (T-170-01…T-170-09). All mitigations from the threat register are in place:

- T-170-01 (JWT disclosure) → `await login(...)` with no binding; Test 7 asserts no `access_token` substring in response.
- T-170-02 (CSRF) → `sameSite: 'lax'` on `ha_auth` + Auth0-session gate via `withAuthAndErrorHandler`.
- T-170-03 (session fixation) → login OVERWRITES any existing cookie via `cookieStore.set`; logout DELETES explicitly.
- T-170-04 (body logging) → no `console.log` of parsed body; handler never captures raw body beyond parse.
- T-170-05 (brute force) → 429 propagation test (Test 8) confirms HA proxy rate-limit path is intact.
- T-170-06 (unauth access) → `withAuthAndErrorHandler` wraps both routes.
- T-170-07 (malformed body) → Test 9 proves `JSON.parse` failures become `ApiError.badRequest` with 400 status.
- T-170-08 (cookie JS read) → Test 6 asserts `httpOnly: true` in set call.
- T-170-09 (insecure transport) → `secure: process.env.NODE_ENV === 'production'` — matches `lib/auth0.ts:49`.

## Known Stubs

None. No placeholder data, no "coming soon" UI, no unwired components in this plan's surface (backend-only plan; UI plans in Wave 2/3 consume these routes).

## TDD Gate Compliance

This plan's tasks are `type="auto" tdd="true"` (per-task TDD). RED and GREEN phases were observed per task:

- **Task 1 RED:** 3 of 6 new tests failed on the un-modified route (Tests 4, 6, 9) — confirmed via test-runner output before Step B.
- **Task 1 GREEN:** All 9 tests green after handler rewrite.
- **Task 2 RED:** Test suite failed with "Cannot find module '…/logout/route'" — confirmed pre-creation.
- **Task 2 GREEN:** Both logout tests green after route creation.

Plan frontmatter type is `execute`, not `tdd`, so the plan-level TDD gate (separate `test(…)` then `feat(…)` commits) does not apply. Each task bundles the failing test + passing implementation into a single `feat(170-01)` commit as permitted by the `type="auto" tdd="true"` task contract.

## Self-Check: PASSED

Claims verified:

- `test -f app/api/auth/login/route.ts` → FOUND
- `test -f app/api/auth/logout/route.ts` → FOUND
- `test -f __tests__/api/auth/login/route.test.ts` → FOUND
- `test -f __tests__/api/auth/logout/route.test.ts` → FOUND
- Commit `42b60eb1` (Task 1) → FOUND in `git log --oneline`
- Commit `035787d6` (Task 2) → FOUND in `git log --oneline`
- `npm test -- __tests__/api/auth/` → 4 suites, 17 tests pass, exit 0
- `grep -c "Phase 170 extensions" __tests__/api/auth/login/route.test.ts` = 1 (expected 1)
- `grep -c "ha_auth" app/api/auth/login/route.ts` = 1 (expected 1)
- `grep -c "cookieStore.set" app/api/auth/login/route.ts` = 1 (expected 1)
- `grep -c "await login" app/api/auth/login/route.ts` = 1 (expected 1)
- `grep -En "access_token|eyJ" app/api/auth/login/route.ts` = NO MATCH (expected empty)
- `grep -c "cookieStore.delete('ha_auth')" app/api/auth/logout/route.ts` = 1
- `grep -c "export const POST" app/api/auth/logout/route.ts` = 1
- `grep -c "export const dynamic = 'force-dynamic'" app/api/auth/logout/route.ts` = 1
- `grep -En "HA_ADMIN_USER|HA_ADMIN_PASSWORD|access_token|import.*login" app/api/auth/logout/route.ts` = NO MATCH

## Next Phase Readiness

- Backend foundation for Wave 2 `useLogin` hook is in place: `POST /api/auth/login` accepts `{username, password}` body, sets httpOnly cookie, propagates 429.
- Backend foundation for Wave 3 api-keys page is in place: `POST /api/auth/logout` deletes the cookie so the page can offer a logout affordance.
- No blockers for subsequent plans in Phase 170.
- The `ha_auth` cookie is now a stable signal the frontend can use (via presence-check; its value `'1'` is never authoritative — the server always re-authenticates with HA proxy per D-03 + T-157-06).

---
*Phase: 170-auth-ui*
*Completed: 2026-04-23*
