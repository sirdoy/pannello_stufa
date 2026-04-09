---
phase: 157-auth-module
plan: "01"
subsystem: auth
tags: [auth, proxy-client, api-routes, jwt, api-keys, tdd]
dependency_graph:
  requires:
    - lib/haClient.ts (pattern reference)
    - lib/core/apiErrors.ts
    - lib/core/middleware.ts (withAuthAndErrorHandler)
  provides:
    - lib/auth/authProxy.ts
    - types/authProxy.ts
    - app/api/auth/login/route.ts
    - app/api/auth/api-keys/route.ts
    - app/api/auth/api-keys/[keyId]/route.ts
  affects:
    - Any future UI page that needs JWT login or API key management
tech_stack:
  added: []
  patterns:
    - direct fetch() with form-encoded body for OAuth2 PasswordRequestForm
    - Bearer token auth (distinct from X-API-Key pattern used by haClient)
    - JWT server-side only (never forwarded to browser, per D-03)
    - withAuthAndErrorHandler for all auth routes (T-157-06)
    - Number.isFinite + isInteger + > 0 validation for numeric path params (T-157-03)
key_files:
  created:
    - types/authProxy.ts
    - lib/auth/authProxy.ts
    - app/api/auth/login/route.ts
    - app/api/auth/api-keys/route.ts
    - app/api/auth/api-keys/[keyId]/route.ts
    - __tests__/lib/auth/authProxy.test.ts
    - __tests__/api/auth/login/route.test.ts
    - __tests__/api/auth/api-keys/route.test.ts
    - __tests__/api/auth/api-keys/[keyId]/route.test.ts
  modified: []
decisions:
  - "login() uses application/x-www-form-urlencoded (OAuth2 PasswordRequestForm) — JSON would return 422"
  - "API key endpoints use Authorization: Bearer header, not X-API-Key (haClient pattern)"
  - "mapResponseError includes NOT_FOUND (404) mapping unlike haClient — needed for deleteApiKey"
  - "GET /api/auth/api-keys returns NextResponse.json() not success() to preserve {keys,count} shape"
metrics:
  duration: "23 minutes"
  completed_date: "2026-04-08"
  tasks_completed: 2
  files_created: 9
  tests_added: 20
requirements:
  - AUTH-01
  - AUTH-02
  - AUTH-03
  - AUTH-04
---

# Phase 157 Plan 01: Auth Module (Proxy Client + Routes) Summary

**One-liner:** JWT login + API key CRUD via HA proxy using form-encoded auth and Bearer tokens, all routes Auth0-guarded with JWT never leaked to client.

## What Was Built

### types/authProxy.ts
Five TypeScript interfaces matching the HA proxy auth API spec:
- `Token` — login response with access_token and token_type
- `APIKeyCreate` — request body for key creation (name field)
- `APIKeyResponse` — key creation response (includes full api_key, shown once)
- `APIKeyInfo` — list entry (no plaintext key)
- `APIKeyListResponse` — list response with keys array and count

### lib/auth/authProxy.ts
Four exported async functions using **direct fetch()** (not haGet/haPost/haDelete):
- `login(username, password)` — POST /auth/login with `application/x-www-form-urlencoded` and `new URLSearchParams`
- `createApiKey(bearerToken, name)` — POST /auth/api-keys with `Authorization: Bearer`
- `listApiKeys(bearerToken)` — GET /auth/api-keys with `Authorization: Bearer`
- `deleteApiKey(bearerToken, keyId)` — DELETE /auth/api-keys/{keyId}, returns void on 204

Internal helpers replicate haClient patterns: `getHaBaseUrl()`, `mapResponseError()` (adds NOT_FOUND mapping), `mapCaughtError()`. All functions use 15s AbortController timeout.

### API Routes (3 files)
- `POST /api/auth/login` — validates HA_ADMIN_USER/HA_ADMIN_PASSWORD, calls login(), returns `{ authenticated: true }` only (T-157-01: access_token never in response)
- `GET /api/auth/api-keys` — login() → listApiKeys() → NextResponse.json(data)
- `POST /api/auth/api-keys` — validates `name`, login() → createApiKey() → created(data)
- `DELETE /api/auth/api-keys/[keyId]` — validates keyId (Number.isFinite + isInteger + > 0), login() → deleteApiKey() → noContent()

All routes use `withAuthAndErrorHandler` (T-157-06).

### Tests (3 test files, 20 total tests)
- `__tests__/lib/auth/authProxy.test.ts` — 11 unit tests for proxy functions
- `__tests__/api/auth/login/route.test.ts` — 3 route tests
- `__tests__/api/auth/api-keys/route.test.ts` — 3 tests (GET + POST)
- `__tests__/api/auth/api-keys/[keyId]/route.test.ts` — 3 tests (DELETE + validation)

## Deviations from Plan

### Auto-fixed Issues

None — plan executed as written with one minor test fix:

**[Rule 1 - Bug] Fixed double-invocation pattern in test assertions**
- **Found during:** Task 1 (GREEN phase) and Task 2 (GREEN phase)
- **Issue:** Tests used `mockResolvedValueOnce` then called the function twice (once for `.rejects.toThrow()` and once for `.rejects.toMatchObject()`). Second call had no mock, causing resolution instead of rejection.
- **Fix:** Changed `mockResolvedValueOnce` → `mockResolvedValue` for error-path tests that assert twice on the same behavior.
- **Files modified:** `__tests__/lib/auth/authProxy.test.ts`, `__tests__/api/auth/login/route.test.ts`

## Threat Mitigations Applied

| Threat | Mitigation |
|--------|-----------|
| T-157-01 (Info Disclosure) | login route returns `{ authenticated: true }` only — access_token discarded |
| T-157-02 (Info Disclosure) | api_key in POST response is intentional (shown once at creation) |
| T-157-03 (Tampering) | Number.isFinite + isInteger + keyId > 0 validation before proxying |
| T-157-04 (DoS) | Missing HA_API_URL throws ApiError(EXTERNAL_API_ERROR) immediately |
| T-157-06 (Spoofing) | All 4 route handlers wrapped in withAuthAndErrorHandler |

## Known Stubs

None.

## Threat Flags

None — all new surface is internal Next.js API routes guarded by Auth0 session.

## Self-Check: PASSED

All 9 files created and verified present. Both task commits found:
- `0bc55b18` feat(157-01): auth proxy client and types
- `1f5fff98` feat(157-01): auth API route handlers and tests

20 tests passing (4 test suites). No regressions detected in 186-test expanded run.
