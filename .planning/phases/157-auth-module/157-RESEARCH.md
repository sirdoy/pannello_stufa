# Phase 157: Auth Module - Research

**Researched:** 2026-04-08
**Domain:** Next.js API routes proxying HA proxy auth endpoints (JWT login + API key CRUD)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Single `lib/auth/authProxy.ts` function module — same pattern as thermorossiProxy.ts, sonosProxy.ts, etc.
- **D-02:** Login uses `application/x-www-form-urlencoded` (OAuth2 PasswordRequestForm), NOT JSON. authProxy must call fetch directly with HA base URL + API key for login only (bypassing haPost which sends JSON).
- **D-03:** HA proxy JWT is handled server-side only. Next.js routes call `/auth/login` on the HA proxy and use the returned JWT for subsequent API key calls within the same request.
- **D-04:** HA proxy JWT is completely separate from Auth0 session. Auth0 authenticates users to Next.js; HA proxy JWT authenticates Next.js server to the HA proxy backend for auth-specific operations.
- **D-05:** Routes mounted at `/auth` on HA proxy (not `/api/v1/auth`). Next.js routes:
  - `app/api/auth/login/route.ts` → `POST /auth/login`
  - `app/api/auth/api-keys/route.ts` → `POST /auth/api-keys` + `GET /auth/api-keys`
  - `app/api/auth/api-keys/[keyId]/route.ts` → `DELETE /auth/api-keys/{key_id}`
- **D-06:** `app/auth/` already exists for Auth0 callback routes. New routes go under `app/api/auth/` — no conflict.
- **D-07:** Auth0 session guard (`withAuthAndErrorHandler`) remains on all new API routes.
- **D-08:** API key management routes require both Auth0 session AND HA proxy JWT.

### Claude's Discretion

- TypeScript type file location and naming (e.g., `types/authProxy.ts`)
- Error mapping specifics — follow existing RFC 9457 pattern from haClient
- Whether to add a `haPostForm()` helper to haClient or handle form-encoding in authProxy directly
- Test file organization — follow existing patterns

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User può autenticarsi via POST /auth/login con credenziali form-based e ricevere JWT | authProxy.login() using fetch with x-www-form-urlencoded; route at app/api/auth/login/route.ts |
| AUTH-02 | User può creare API key via POST /auth/api-keys | authProxy.createApiKey() using haPost with Bearer token; route at app/api/auth/api-keys/route.ts |
| AUTH-03 | User può listare le proprie API key via GET /auth/api-keys | authProxy.listApiKeys() using haGet with Bearer token; same route file as AUTH-02 |
| AUTH-04 | User può revocare una API key via DELETE /auth/api-keys/{key_id} | authProxy.deleteApiKey() using haDelete with Bearer token; route at app/api/auth/api-keys/[keyId]/route.ts |
</phase_requirements>

---

## Summary

Phase 157 is a focused proxy + route phase: create `lib/auth/authProxy.ts`, `types/authProxy.ts`, and 3 Next.js route files. The HA proxy auth module is mounted at `/auth` (not `/api/v1/auth`), which is the only structural difference from all other proxy modules. The auth module exposes 4 endpoints: one unauthenticated form-encoded POST for JWT login, and three JWT-authenticated JSON endpoints for API key CRUD.

The critical design constraint is the login endpoint's transport: it requires `Content-Type: application/x-www-form-urlencoded` with a `URLSearchParams` body, which the existing `haPost` helper cannot do (haPost always sends JSON). The authProxy must call `fetch` directly for `/auth/login`, re-using `getEnvConfig()` from haClient if exported, or independently reading `HA_API_URL` + `HA_API_KEY` env vars. The three API key management endpoints use standard `haGet`/`haPost`/`haDelete` — but with a `Authorization: Bearer <jwt>` header instead of `X-API-Key`. This means those three calls also cannot use the standard haClient helpers as-is (which hardcode `X-API-Key` auth). The authProxy must call `fetch` directly for all four endpoints, or a `haPostForm` / `haGetWithBearer` / `haDeleteWithBearer` pattern must be introduced.

**Primary recommendation:** Handle all four auth endpoints with direct `fetch` calls inside `authProxy.ts`, reading `HA_API_URL` and `HA_API_KEY` from env vars directly. This keeps authProxy self-contained and avoids polluting haClient with auth-token-passing overloads. The login call uses form-encoding; the three API key calls use Bearer token (obtained from login). The approach follows the existing pattern of proxy modules calling transport helpers — except here the transport is inline fetch rather than haClient wrappers.

---

## Standard Stack

### Core (no new dependencies required)

| Component | Version | Purpose | Source |
|-----------|---------|---------|--------|
| Next.js App Router | 15.5 (existing) | Route handlers | [VERIFIED: CLAUDE.md] |
| `lib/haClient.ts` | existing | env config, error mapping utilities | [VERIFIED: codebase read] |
| `lib/core` | existing | `withAuthAndErrorHandler`, `success`, `created`, `noContent` | [VERIFIED: codebase read] |
| `lib/core/apiErrors.ts` | existing | `ApiError`, `ERROR_CODES`, `HTTP_STATUS` | [VERIFIED: codebase read] |
| TypeScript | existing (strict) | Type safety | [VERIFIED: CLAUDE.md] |

No new npm packages are needed. All primitives are in place.

---

## Architecture Patterns

### Recommended File Layout

```
lib/
└── auth/
    ├── authProxy.ts          # All 4 endpoint wrappers (function module)
    └── index.ts              # Re-exports (pattern: lib/registry/index.ts)

types/
└── authProxy.ts              # Token, APIKeyCreate, APIKeyResponse, APIKeyInfo, APIKeyListResponse

app/api/auth/
├── login/
│   └── route.ts              # POST /auth/login (withAuthAndErrorHandler — Auth0 guard)
├── api-keys/
│   ├── route.ts              # GET + POST /auth/api-keys
│   └── [keyId]/
│       └── route.ts          # DELETE /auth/api-keys/{key_id}

__tests__/api/auth/
├── login/
│   └── route.test.ts
├── api-keys/
│   ├── route.test.ts
│   └── [keyId]/
│       └── route.test.ts
```

### Pattern 1: authProxy.ts Function Module

All four functions in one file. Login uses direct fetch with form encoding. API key operations use direct fetch with `Authorization: Bearer` header (obtained by calling `login()` first in the same server action, or passed in as argument to the function).

**Key question resolved by research:** The `haGet`/`haPost`/`haDelete` helpers in `haClient.ts` always authenticate with `X-API-Key: apiKey`. They cannot be used for endpoints that require `Authorization: Bearer <token>`. Therefore authProxy must use `fetch` directly for all 4 calls. [VERIFIED: haClient.ts read — all helpers hardcode X-API-Key header]

```typescript
// Source: docs/api/auth.md + docs/api/README.md (form-encoded login pattern)

// lib/auth/authProxy.ts

import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';

function getHaBaseUrl(): string {
  const url = process.env.HA_API_URL;
  if (!url) throw new ApiError(ERROR_CODES.EXTERNAL_API_ERROR, 'HA_API_URL not configured', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  return url;
}

export async function login(username: string, password: string): Promise<Token> {
  const baseUrl = getHaBaseUrl();
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username, password }),
  });
  if (!response.ok) { /* map error */ }
  return response.json() as Promise<Token>;
}

export async function listApiKeys(bearerToken: string): Promise<APIKeyListResponse> {
  const baseUrl = getHaBaseUrl();
  const response = await fetch(`${baseUrl}/auth/api-keys`, {
    headers: { Authorization: `Bearer ${bearerToken}` },
  });
  if (!response.ok) { /* map error */ }
  return response.json() as Promise<APIKeyListResponse>;
}
```

### Pattern 2: Route Handler (GET + POST on same file)

Mirrors the existing `app/api/rooms/route.ts` pattern for co-located methods:

```typescript
// Source: app/api/rooms/route.ts — verified pattern
// app/api/auth/api-keys/route.ts

import { withAuthAndErrorHandler, success, created } from '@/lib/core';
import { listApiKeys, createApiKey, login } from '@/lib/auth/authProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const { access_token } = await login(
    process.env.HA_ADMIN_USER!,
    process.env.HA_ADMIN_PASSWORD!
  );
  const data = await listApiKeys(access_token);
  return success(data as unknown as Record<string, unknown>);
}, 'Auth/ApiKeys/List');

export const POST = withAuthAndErrorHandler(async (request) => {
  const body = (await request.json()) as APIKeyCreate;
  const { access_token } = await login(
    process.env.HA_ADMIN_USER!,
    process.env.HA_ADMIN_PASSWORD!
  );
  const data = await createApiKey(access_token, body.name);
  return created(data as unknown as Record<string, unknown>);
}, 'Auth/ApiKeys/Create');
```

### Pattern 3: Dynamic Route with Numeric ID

Mirrors the existing `app/api/rooms/[room_id]/route.ts` pattern:

```typescript
// Source: app/api/rooms/[room_id]/route.ts — verified pattern
// app/api/auth/api-keys/[keyId]/route.ts

export const DELETE = withAuthAndErrorHandler(async (_request, context) => {
  const params = await context.params;
  const keyId = params['keyId'] ?? '';
  const { access_token } = await login(...);
  await deleteApiKey(access_token, Number(keyId));
  return noContent();
}, 'Auth/ApiKeys/Delete');
```

### Pattern 4: TypeScript Types

Follow `types/thermorossiProxy.ts` structure — interfaces match docs/api/auth.md TypeScript Interfaces section exactly:

```typescript
// Source: docs/api/auth.md TypeScript Interfaces section
// types/authProxy.ts

export interface Token {
  access_token: string;
  token_type: 'bearer';
}

export interface APIKeyCreate {
  name: string; // 1–100 characters
}

export interface APIKeyResponse {
  id: number;
  name: string;
  api_key: string;      // Full plaintext — shown only at creation
  created_at: string;   // ISO 8601
}

export interface APIKeyInfo {
  id: number;
  name: string;
  created_at: string;         // ISO 8601
  last_used_at: string | null;
  is_active: boolean;
}

export interface APIKeyListResponse {
  keys: APIKeyInfo[];
  count: number;
}
```

### Anti-Patterns to Avoid

- **Using haPost for login:** haPost sends JSON; login requires form-encoded. Will return 422 from the HA proxy. [VERIFIED: docs/api/auth.md]
- **Using haGet/haPost/haDelete for API key management:** These helpers hardcode `X-API-Key` auth; the API key management endpoints require `Authorization: Bearer` and explicitly reject API key auth. [VERIFIED: docs/api/auth.md — "API key auth is NOT accepted"]
- **Adding login credentials to existing HA_API_KEY auth:** The HA proxy JWT is a separate auth layer; do not conflate with the X-API-Key used by all other haClient calls.
- **Returning JWT to the client:** HA proxy JWT must stay server-side only (D-03). Never pass it in the route response.
- **Putting routes under app/auth/ instead of app/api/auth/:** `app/auth/` is Auth0 callback routes. [VERIFIED: filesystem check — app/auth/profile/route.ts exists]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Error response formatting | Custom error JSON | `ApiError` + `withAuthAndErrorHandler` | Consistent RFC 9457 mapping already in place |
| Auth0 session guard | Manual session check | `withAuthAndErrorHandler` from `@/lib/core` | Handles bypass mode, error wrapping, context |
| HTTP status codes | Magic numbers | `HTTP_STATUS` from `@/lib/core/apiErrors` | Type-safe, centralized |
| 204 No Content response | `new NextResponse(null, {status: 204})` | `noContent()` from `@/lib/core` | Consistent with all other delete routes |
| 201 Created response | Manual NextResponse | `created()` from `@/lib/core` | Consistent with all other create routes |

---

## Common Pitfalls

### Pitfall 1: Login body encoding
**What goes wrong:** Sending JSON to `/auth/login` returns HTTP 422 Unprocessable Entity from the HA proxy.
**Why it happens:** HA proxy uses FastAPI's `OAuth2PasswordRequestForm` which only parses `application/x-www-form-urlencoded`.
**How to avoid:** Use `new URLSearchParams({ username, password })` as the body and set `Content-Type: application/x-www-form-urlencoded`.
**Warning signs:** 422 response from HA proxy during login.

### Pitfall 2: Using X-API-Key for API key management endpoints
**What goes wrong:** GET/POST/DELETE `/auth/api-keys` return HTTP 401 when called with `X-API-Key` header.
**Why it happens:** The HA proxy intentionally blocks API key auth on key management routes to prevent compromised keys from creating new keys.
**How to avoid:** Obtain a JWT via `login()` first; pass it as `Authorization: Bearer <token>` on all three API key endpoints.
**Warning signs:** 401 from HA proxy when using `haGet`/`haPost`/`haDelete` for these endpoints.

### Pitfall 3: app/api/auth/ route conflict with Auth0
**What goes wrong:** Auth0 SDK may intercept requests to `/api/auth/*` depending on middleware configuration.
**Why it happens:** Auth0 v4 middleware can register `/api/auth` as its handler path.
**How to avoid:** Verify middleware.ts does not intercept `/api/auth/*` for our new proxy routes. The Auth0 routes are at `/auth/*` (not `/api/auth/*`), so there should be no conflict — but confirm by checking middleware.ts matcher config.
**Warning signs:** Auth0 redirect loop on new routes.

### Pitfall 4: Missing HA_ADMIN_USER / HA_ADMIN_PASSWORD env vars
**What goes wrong:** `login()` call throws ApiError at runtime because credentials are not configured.
**Why it happens:** The login proxy requires admin credentials that don't exist in haClient (which only needs HA_API_KEY).
**How to avoid:** Document the two new required env vars in authProxy.ts. Read them with null-safety checks; throw descriptive ApiError if missing.
**Warning signs:** Runtime error on first call to any auth route.

### Pitfall 5: Exposing HA JWT in route response
**What goes wrong:** If the `access_token` is included in the Next.js route response, it leaks a server-side credential to the browser.
**Why it happens:** Temptation to proxy the token response verbatim.
**How to avoid:** The `login` route in Next.js should use the JWT server-side and NOT return it in the response body. Return only the operation result (or a success indicator).

---

## Code Examples

### Login (form-encoded fetch)
```typescript
// Source: docs/api/README.md §JWT Login — Next.js fetch example
const res = await fetch(`${process.env.HA_API_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    username: process.env.HA_ADMIN_USER!,
    password: process.env.HA_ADMIN_PASSWORD!,
  }),
});
const { access_token } = await res.json() as Token;
```

### API key list (Bearer auth)
```typescript
// Source: docs/api/auth.md GET /auth/api-keys curl example — adapted for fetch
const res = await fetch(`${process.env.HA_API_URL}/auth/api-keys`, {
  headers: { Authorization: `Bearer ${access_token}` },
});
const data = await res.json() as APIKeyListResponse;
```

### Delete route with numeric keyId
```typescript
// Source: app/api/rooms/[room_id]/route.ts — verified project pattern
export const DELETE = withAuthAndErrorHandler(async (_request, context) => {
  const params = await context.params;
  const keyId = params['keyId'] ?? '';
  const { access_token } = await login(...);
  await deleteApiKey(access_token, Number(keyId));
  return noContent();
}, 'Auth/ApiKeys/Delete');
```

### Test pattern (route unit test)
```typescript
// Source: __tests__/api/netatmo/health/route.test.ts — verified project pattern
jest.mock('@/lib/auth/authProxy');
jest.mock('@/lib/core', () => ({
  withAuthAndErrorHandler: (fn: Function) => fn,
  success: (data: unknown) => ({ ok: true, data }),
  created: (data: unknown) => ({ ok: true, data, status: 201 }),
  noContent: () => ({ ok: true, status: 204 }),
}));
```

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `HA_API_URL` | All auth proxy calls | Assumed (set for all other providers) | — | None — blocks all routes |
| `HA_ADMIN_USER` | `login()` | Unknown — NEW env var | — | None — blocks login |
| `HA_ADMIN_PASSWORD` | `login()` | Unknown — NEW env var | — | None — blocks login |
| `HA_API_KEY` | Existing haClient (not used by authProxy) | Verified present | — | — |

**Missing dependencies with no fallback:**
- `HA_ADMIN_USER` and `HA_ADMIN_PASSWORD` — these are new env vars not present in existing `.env`. The plan must include a task documenting these in `.env.example` or equivalent. Runtime will fail gracefully via ApiError if missing.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (existing) |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern="auth"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | POST /auth/login returns JWT, propagates errors | unit | `npm test -- --testPathPattern="auth/login"` | No — Wave 0 |
| AUTH-02 | POST /auth/api-keys creates key, returns 201 | unit | `npm test -- --testPathPattern="auth/api-keys/route"` | No — Wave 0 |
| AUTH-03 | GET /auth/api-keys returns list | unit | `npm test -- --testPathPattern="auth/api-keys/route"` | No — Wave 0 |
| AUTH-04 | DELETE /auth/api-keys/[keyId] returns 204 | unit | `npm test -- --testPathPattern="auth/api-keys/\\[keyId\\]"` | No — Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="auth"`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `__tests__/api/auth/login/route.test.ts` — covers AUTH-01
- [ ] `__tests__/api/auth/api-keys/route.test.ts` — covers AUTH-02, AUTH-03
- [ ] `__tests__/api/auth/api-keys/[keyId]/route.test.ts` — covers AUTH-04

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | HA proxy JWT is obtained via admin credentials; store credentials in env vars only (never in code) |
| V3 Session Management | No | JWT is server-side only; no client session |
| V4 Access Control | Yes | All routes guarded by `withAuthAndErrorHandler` (Auth0 session) |
| V5 Input Validation | Yes | Validate `keyId` is a non-NaN number before passing to proxy; validate `name` field present in POST body |
| V6 Cryptography | No | JWT issued by HA proxy; no crypto in this phase |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Credential leak in response | Information Disclosure | Never return `access_token` from Next.js routes |
| Numeric ID injection | Tampering | Validate `Number(keyId)` is finite and positive before proxying |
| Missing env var at runtime | Denial of Service | Throw descriptive `ApiError(EXTERNAL_API_ERROR)` early if `HA_ADMIN_USER` or `HA_ADMIN_PASSWORD` missing |
| Rate limit bypass | Elevation of Privilege | HA proxy enforces 10 req/min; no additional rate limiting needed in Next.js for this phase |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `HA_ADMIN_USER` and `HA_ADMIN_PASSWORD` env vars do not yet exist in the project `.env` | Environment Availability | Low — authProxy will throw a clear ApiError; planner must add env var documentation task |
| A2 | Auth0 middleware matcher does not intercept `/api/auth/*` requests | Common Pitfalls | Medium — if Auth0 intercepts, all new routes will redirect to Auth0 login before reaching the handler. Mitigation: check `middleware.ts` matcher in Wave 0 |

---

## Open Questions

1. **Does Auth0 middleware intercept `/api/auth/*`?**
   - What we know: Auth0 v4 routes are at `/auth/login`, `/auth/logout`, `/auth/callback` (not `/api/auth`). The middleware config in this project may or may not match `/api/auth/*`.
   - What's unclear: The exact matcher pattern in `middleware.ts` was not checked in this research.
   - Recommendation: The plan's Wave 0 task should include verifying `middleware.ts` does not block `/api/auth/*`.

2. **Should authProxy expose a `haLoginAndCall` helper to avoid calling login() twice per request?**
   - What we know: GET + POST on the same route each call `login()` separately; DELETE also calls `login()`. This means 1 extra round-trip to HA proxy per user action.
   - What's unclear: Whether the HA proxy JWT has a meaningful TTL that would support caching.
   - Recommendation: Not in scope for this phase (proxy + routes only). Can be optimized in a future phase if latency is observed.

---

## Sources

### Primary (HIGH confidence)
- `docs/api/auth.md` — Complete auth module spec read in this session
- `docs/api/README.md` — Authentication overview and fetch examples read in this session
- `lib/haClient.ts` — Transport helpers read in this session; confirmed all use X-API-Key header
- `lib/stove/thermorossiProxy.ts` — Reference proxy function module pattern
- `lib/core/apiErrors.ts` — ApiError class and ERROR_CODES constants
- `lib/core/middleware.ts` — withAuthAndErrorHandler implementation
- `app/api/rooms/route.ts` — Multi-method route pattern (GET + POST)
- `app/api/rooms/[room_id]/route.ts` — Dynamic route with numeric ID pattern
- `__tests__/api/netatmo/health/route.test.ts` — Route unit test pattern

### Secondary (MEDIUM confidence)
- `lib/auth0.ts` — Auth0 v4 client config; routes at `/auth/login|logout|callback` — confirmed no conflict with `/api/auth/`

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all primitives verified in codebase
- Architecture: HIGH — patterns verified from multiple existing proxy modules
- Pitfalls: HIGH — transport constraint (form-encoding, Bearer auth) verified from both docs and haClient source
- Env vars: MEDIUM — existence of `HA_ADMIN_USER`/`HA_ADMIN_PASSWORD` not verified (marked ASSUMED)

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable internal codebase)
