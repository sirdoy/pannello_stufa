---
phase: quick-30
plan: 01
subsystem: auth
tags: [auth0, bypass, dev, mock-session, firebase, swr]

requires: []
provides:
  - BYPASS_AUTH=true env var enables local dev without Auth0 credentials
  - auth0 stub returning MOCK_SESSION when bypassed
  - withAuth middleware providing DEV_SESSION to all 90+ API routes
  - /auth/profile route returning mock user for client-side useUser()
  - ClientProviders passing mock user to Auth0Provider SWR fallback
affects: [auth, middleware, client-components, firebase-paths]

tech-stack:
  added: []
  patterns:
    - "BYPASS_AUTH=true (server) + NEXT_PUBLIC_BYPASS_AUTH=true (client) env vars for dev bypass"
    - "Auth0Client stub pattern: ({ getSession: async () => MOCK_SESSION } as unknown as Auth0Client)"
    - "Auth0Provider user prop for SWR fallback in bypass mode"
    - "Consistent mock userId 'local-dev-user' for Firebase paths in bypass mode"

key-files:
  created:
    - app/auth/profile/route.ts
  modified:
    - lib/auth0.ts
    - lib/core/middleware.ts
    - app/components/ClientProviders.tsx
    - lib/core/__tests__/middleware.test.ts

key-decisions:
  - "Auth0Client stub via as unknown as cast — cleanest approach, no changes to 90+ API route files"
  - "Auth0Provider user prop for client bypass — uses built-in SWR fallback mechanism, zero useUser() file changes"
  - "Created /auth/profile route using auth0 stub so SWR revalidation returns mock user consistently"
  - "NEXT_PUBLIC_ prefix required for client-side bypass flag (different from server-side BYPASS_AUTH)"

requirements-completed: [QUICK-30]

duration: 15min
completed: 2026-02-17
---

# Quick Task 30: Bypass Auth0 in Local Env Summary

**Auth0 dev bypass via env vars: stub Auth0Client, DEV_SESSION in middleware, and Auth0Provider SWR fallback so the app runs at localhost:3000 without Auth0 credentials**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-02-17T00:00:00Z
- **Completed:** 2026-02-17
- **Tasks:** 3
- **Files modified:** 5 (4 modified + 1 created)

## Accomplishments

- Auth0Client stub returns MOCK_SESSION when BYPASS_AUTH=true — all server pages work without credentials
- withAuth middleware short-circuits to DEV_SESSION — all 90+ API routes work without auth
- ClientProviders passes mock User to Auth0Provider user prop — all client useUser() calls get mock user
- /auth/profile route uses auth0 stub — SWR revalidation stays consistent with mock user
- New middleware tests verify production auth (401 for unauthenticated) still works correctly

## Task Commits

1. **Task 1: Add BYPASS_AUTH mock session to auth0.ts and middleware.ts** - `a177bb1` (feat)
2. **Task 2: Handle client-side auth bypass in ClientProviders** - `d9fec41` (feat)
3. **Task 3: Add middleware bypass tests** - `c19f8e1` (test)

## Files Created/Modified

- `lib/auth0.ts` - Guard auth0Config construction; export Auth0Client stub when BYPASS_AUTH=true
- `lib/core/middleware.ts` - Add BYPASS_AUTH check and DEV_SESSION to withAuth function
- `app/components/ClientProviders.tsx` - Pass MOCK_USER to Auth0Provider user prop when NEXT_PUBLIC_BYPASS_AUTH=true
- `app/auth/profile/route.ts` - NEW: Profile route using auth0 stub for consistent SWR behavior
- `lib/core/__tests__/middleware.test.ts` - Add 2 new tests for production auth behavior

## User Setup Required

To use local dev bypass, add to `.env.local`:

```bash
BYPASS_AUTH=true
NEXT_PUBLIC_BYPASS_AUTH=true
```

Remove or set to `false` for production behavior.

Firebase paths will use userId `local-dev-user` in bypass mode.

## Decisions Made

- **Auth0Client stub over conditional imports**: Using `as unknown as Auth0Client` cast means zero changes to `app/page.tsx` or any API route files. The stub's `getSession()` returns MOCK_SESSION without cookies/session store.
- **Auth0Provider user prop for client bypass**: Auth0 v4 `Auth0Provider` accepts a `user` prop that sets SWR fallback, so `useUser()` returns the mock user immediately on first render. Zero changes to 18+ client components.
- **Created `/auth/profile` route**: Auth0 v4 uses SWR in `useUser()` which revalidates in background. Without a profile route returning the mock user, SWR would override the fallback with null. The route delegates to `auth0.getSession()` which returns MOCK_SESSION when bypassed.
- **NEXT_PUBLIC_ prefix**: Client components run in browser — env vars must have NEXT_PUBLIC_ prefix to be available client-side. Server-side BYPASS_AUTH and client-side NEXT_PUBLIC_BYPASS_AUTH are separate but should both be set.

## Deviations from Plan

### Auto-added Beyond Plan

**1. [Rule 2 - Missing Critical] Created /auth/profile route**
- **Found during:** Task 2 (ClientProviders bypass)
- **Issue:** Plan said to use UserContext.Provider (not exported from Auth0 v4) or Auth0Provider user prop. Auth0 v4 uses SWR which revalidates in background, so without a profile endpoint returning the mock user, SWR would override the fallback with null/error after initial render.
- **Fix:** Created `app/auth/profile/route.ts` that calls `auth0.getSession()` (which returns MOCK_SESSION via stub) so SWR revalidation returns mock user consistently.
- **Files modified:** app/auth/profile/route.ts (new file)
- **Verification:** TypeScript compiles clean, no new errors
- **Committed in:** d9fec41 (Task 2 commit)

---

**Total deviations:** 1 auto-added (missing critical for correctness)
**Impact on plan:** The /auth/profile route was essential — without it, SWR background revalidation would override the Auth0Provider fallback with null. No scope creep.

## Issues Encountered

- **Pre-existing test failures in withIdempotency**: 3 tests in middleware.test.ts were already failing before our changes (confirmed by git stash test). These are unrelated to this task (mock Firebase set not being called). Not fixed per scope boundary rules.
- **UserContext not exported from Auth0 v4**: Plan's priority 1 approach (UserContext.Provider) wasn't available. Used priority 2 approach (Auth0Provider user prop) which is actually cleaner.

## Next Phase Readiness

- Dev bypass ready: add `BYPASS_AUTH=true` and `NEXT_PUBLIC_BYPASS_AUTH=true` to .env.local
- Production behavior completely unchanged when BYPASS_AUTH is unset
- Firebase paths will use 'local-dev-user' consistently in bypass mode

---
*Phase: quick-30*
*Completed: 2026-02-17*
