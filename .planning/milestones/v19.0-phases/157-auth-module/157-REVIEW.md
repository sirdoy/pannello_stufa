---
phase: 157-auth-module
reviewed: 2026-04-08T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - types/authProxy.ts
  - lib/auth/authProxy.ts
  - app/api/auth/login/route.ts
  - app/api/auth/api-keys/route.ts
  - app/api/auth/api-keys/[keyId]/route.ts
  - __tests__/lib/auth/authProxy.test.ts
  - __tests__/api/auth/login/route.test.ts
  - __tests__/api/auth/api-keys/route.test.ts
  - __tests__/api/auth/api-keys/[keyId]/route.test.ts
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: issues_found
---

# Phase 157: Code Review Report

**Reviewed:** 2026-04-08T00:00:00Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

This phase implements a server-side auth proxy client (`lib/auth/authProxy.ts`) and four Next.js API route handlers that expose login and API-key management over the HA proxy. The security-critical design constraint — that the JWT `access_token` is never forwarded to the browser — is correctly upheld in every route. Types are clean, error handling is thorough, and the timeout+AbortController pattern is applied consistently.

One critical finding: the `login` route handler (`POST /api/auth/login`) discards the JWT without ever using it for a downstream call, making the login step a no-op with no useful server-side effect beyond a connectivity check. This appears to be a logic error introduced during implementation — the endpoint as written cannot fulfill any meaningful "admin logged in" state on the server.

Three warnings cover: a credential-in-error-log risk in `mapCaughtError`, missing `name` length validation on the `POST /api/auth/api-keys` route, and a test assertion gap on the GET route that silently does not verify the returned payload.

---

## Critical Issues

### CR-01: POST /api/auth/login discards the token and returns no server-side state

**File:** `app/api/auth/login/route.ts:31`
**Issue:** `login(username, password)` is called with `await` but its return value is thrown away. The route returns `{ authenticated: true }` regardless of what the token contains, and the token is never stored anywhere (e.g., a server-side session, a cookie, Firebase). The intent documented in the header comment is that this is a "server-side login via HA proxy", but after this call the app has no access_token available for subsequent API-key operations — each of those routes independently re-calls `login()` to obtain a fresh token. If the goal is merely a connectivity check that confirms credentials are valid, the endpoint name and docs should say so. If the goal is to establish a session that subsequent calls can reuse, the token must be stored (e.g., encrypted HttpOnly cookie, server-side cache, or Firebase RTDB) — otherwise every API-key operation re-authenticates from scratch.

This is either a missing feature (session establishment was not implemented) or a misleading endpoint (it does not actually "log in" in any durable sense).

**Fix (option A — keep as connectivity check, rename intent):**
```typescript
// Rename the intent in the doc comment and return value to be honest:
// "Validates HA proxy credentials are correct and reachable."
return success({ reachable: true });
```

**Fix (option B — implement durable session via encrypted cookie):**
```typescript
import { cookies } from 'next/headers';
import { encrypt } from '@/lib/auth/sessionCrypto'; // to be implemented

export const POST = withAuthAndErrorHandler(async () => {
  const username = process.env.HA_ADMIN_USER;
  const password = process.env.HA_ADMIN_PASSWORD;
  if (!username || !password) {
    throw new ApiError(ERROR_CODES.EXTERNAL_API_ERROR, '...', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
  const { access_token } = await login(username, password);
  const cookieStore = await cookies();
  cookieStore.set('ha_session', encrypt(access_token), {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 3600,
    path: '/',
  });
  return success({ authenticated: true });
}, 'Auth/Login');
```

---

## Warnings

### WR-01: Fetch network errors include raw error message in external-facing ApiError

**File:** `lib/auth/authProxy.ts:124-127`
**Issue:** `mapCaughtError` constructs the error message by embedding `error.message` directly. If `fetch` throws with a message that includes internal hostnames, URLs, or other infrastructure details (e.g. `"getaddrinfo ENOTFOUND ha.internal.example.com"`), that string propagates into the `ApiError` which is then serialised and returned to the client by `withAuthAndErrorHandler`. This leaks internal network topology.
**Fix:**
```typescript
function mapCaughtError(error: unknown): never {
  if (error instanceof ApiError) throw error;

  if (error instanceof Error && error.name === 'AbortError') {
    throw ApiError.timeout('HA proxy timeout');
  }

  // Log internally, return generic message to caller
  console.error('[authProxy] fetch failed:', error instanceof Error ? error.message : error);
  throw new ApiError(
    ERROR_CODES.EXTERNAL_API_ERROR,
    'HA proxy request failed',
    HTTP_STATUS.BAD_GATEWAY
  );
}
```

### WR-02: Missing name length validation on POST /api/auth/api-keys

**File:** `app/api/auth/api-keys/route.ts:55`
**Issue:** The validation checks that `name` is a non-empty string after trimming, but `APIKeyCreate` documents "1-100 characters" as the valid range. There is no upper-bound check. A caller can send a name of 10,000 characters, which will be forwarded to the HA proxy verbatim. If the HA proxy enforces the 100-char limit it will return a 4xx, but this app will propagate a generic error instead of a clear `VALIDATION_ERROR` with a useful message.
**Fix:**
```typescript
const trimmed = body.name.trim();
if (!trimmed || trimmed.length === 0) {
  throw ApiError.badRequest('name is required and must be a non-empty string');
}
if (trimmed.length > 100) {
  throw ApiError.badRequest('name must be 100 characters or fewer');
}
// use trimmed downstream
const data = await createApiKey(access_token, trimmed);
```

### WR-03: Test 4 does not assert the shape of the GET response payload

**File:** `__tests__/api/auth/api-keys/route.test.ts:66-74`
**Issue:** The test for `GET /api/auth/api-keys` asserts only that the result is defined (`expect(result).toBeDefined()`). Because `GET` uses `NextResponse.json(data)` (not the `success()` helper), the actual returned value in the test environment depends on how `NextResponse.json` is resolved by the mock — this assertion will pass even if the response contains a completely wrong or empty body. The test provides no correctness guarantee for the list payload.
**Fix:**
```typescript
// Mock NextResponse.json so it returns an inspectable value in tests
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown) => data,
  },
}));

// Then assert the actual shape:
const result = await (GET as unknown as () => Promise<unknown>)() as APIKeyListResponse;
expect(result).toEqual(mockListResponse);
expect(result.count).toBe(1);
expect(result.keys[0]?.name).toBe('Test Key');
```

---

## Info

### IN-01: Credential validation duplicated across three route files

**File:** `app/api/auth/api-keys/route.ts:21-34`, `app/api/auth/api-keys/[keyId]/route.ts:28-37`, `app/api/auth/login/route.ts:20-29`
**Issue:** The same pattern — read `HA_ADMIN_USER` / `HA_ADMIN_PASSWORD` from env, throw `ApiError(EXTERNAL_API_ERROR)` if missing — is repeated verbatim in three route files. `api-keys/route.ts` already extracted it into a local `getAdminCredentials()` helper, but the other two routes did not use it (nor could they, since it is not exported).
**Fix:** Extract a shared utility (e.g., `lib/auth/getAdminCredentials.ts`) and import it in all three routes. This is purely a maintainability concern — no bug risk today, but any future change to the error message or logic will need to be made in three places.

### IN-02: Test 3 (authProxy) calls login() twice to test the same assertion

**File:** `__tests__/lib/auth/authProxy.test.ts:95-98`
**Issue:** The test calls `login('admin', 'wrong')` twice in consecutive `await expect(...)` lines. `mockFetch.mockResolvedValue` (not `mockResolvedValueOnce`) is used so this does not fail, but it creates two real async calls in the test, each exercising the same code path. The second call is redundant.
**Fix:**
```typescript
const result = login('admin', 'wrong');
await expect(result).rejects.toThrow(ApiError);
await expect(result).rejects.toMatchObject({ code: ERROR_CODES.UNAUTHORIZED });
```
Note: the same pattern appears in Test 10 (`deleteApiKey`) and Tests 8/9 of the `[keyId]` route test. All three should reuse a single promise reference rather than issuing a duplicate call.

---

_Reviewed: 2026-04-08T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
