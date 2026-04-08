# Phase 157: Auth Module - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can authenticate via JWT and manage API keys through the HA proxy auth endpoints. This phase creates the proxy client, TypeScript types, and 4 Next.js API routes that proxy to the HA backend auth module at `/auth`. No frontend UI in this phase (v19.0 scope is proxy + routes only).

</domain>

<decisions>
## Implementation Decisions

### Proxy Client Structure
- **D-01:** Single `lib/auth/authProxy.ts` function module following the same pattern as `thermorossiProxy.ts`, `sonosProxy.ts`, etc. All 4 auth endpoints in one file — the module is small enough.
- **D-02:** Login uses `application/x-www-form-urlencoded` (OAuth2 PasswordRequestForm), not JSON. The proxy client must use a custom fetch call or a dedicated helper in haClient, since `haPost` sends JSON. Alternatively, authProxy can call fetch directly with the HA base URL + API key, bypassing haPost for login only.

### JWT Token Handling
- **D-03:** HA proxy JWT is handled server-side only. The Next.js API routes call `/auth/login` on the HA proxy and use the returned JWT for subsequent API key management calls within the same request or short-lived server cache.
- **D-04:** HA proxy JWT is completely separate from Auth0 session. Auth0 authenticates users to the Next.js app; HA proxy JWT authenticates Next.js server to the HA proxy backend for auth-specific operations.

### Route Prefix & File Layout
- **D-05:** Auth routes are mounted at `/auth` on the HA proxy (not `/api/v1/auth`). Next.js routes mirror this under `app/api/auth/`:
  - `app/api/auth/login/route.ts` → proxies `POST /auth/login`
  - `app/api/auth/api-keys/route.ts` → proxies `POST /auth/api-keys` and `GET /auth/api-keys`
  - `app/api/auth/api-keys/[keyId]/route.ts` → proxies `DELETE /auth/api-keys/{key_id}`
- **D-06:** Note: `app/auth/` already exists for Auth0 callback routes (`app/auth/profile/`). The new routes go under `app/api/auth/` which is a different path and does not conflict.

### Auth Relationship
- **D-07:** Auth0 session guard remains on all Next.js API routes (existing `withAuth` middleware). HA proxy JWT is an additional server-to-server credential, not a replacement for Auth0.
- **D-08:** API key management routes require both Auth0 session (user is logged in) AND HA proxy JWT (to authorize with HA backend).

### Claude's Discretion
- TypeScript type file location and naming (e.g., `types/authProxy.ts`)
- Error mapping specifics — follow existing RFC 9457 pattern from haClient
- Whether to add a `haPostForm()` helper to haClient or handle form-encoding in authProxy directly
- Test file organization — follow existing patterns

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Auth API Documentation
- `docs/api/auth.md` — Complete auth module spec: 4 endpoints, request/response shapes, TypeScript interfaces, rate limiting, form-encoded login requirement
- `docs/api/README.md` §Authentication — Overview of JWT + API Key auth methods, usage examples

### Existing Proxy Patterns
- `lib/haClient.ts` — Shared HA proxy transport (haGet/haPost/haPut/haDelete), env config, error mapping
- `lib/stove/thermorossiProxy.ts` — Reference proxy client pattern (function module wrapping haGet/haPost)
- `lib/core/apiErrors.ts` — ApiError class, ERROR_CODES, HTTP_STATUS constants

### Auth0 Integration (existing, do not modify)
- `lib/auth0.ts` — Auth0 SDK configuration (separate from HA proxy auth)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `haGet`/`haPost` from `lib/haClient.ts` — transport for JSON endpoints (api-keys CRUD)
- `withErrorHandler` + `success()` from `lib/core` — standard route wrapper pattern
- `ApiError`, `ERROR_CODES`, `HTTP_STATUS` from `lib/core/apiErrors.ts` — error handling
- Auth0 session guard middleware — already in place on API routes

### Established Patterns
- Proxy client as function module (export individual functions, not a class)
- Types in dedicated `types/*.ts` files
- RFC 9457 error response parsing in haClient
- 202 Accepted for commands, 200 for reads, 201 for creates, 204 for deletes

### Integration Points
- `lib/haClient.ts` may need a `haPostForm()` or similar for form-encoded login
- `app/api/auth/` directory (new — does not conflict with existing `app/auth/` Auth0 routes)
- No frontend hooks needed in this phase (v19.0 = routes only)

</code_context>

<specifics>
## Specific Ideas

- Login endpoint is unique: form-encoded body (not JSON), no auth required, returns JWT
- API key management endpoints all require JWT Bearer auth (not API key auth) — this is a security design choice documented in `docs/api/auth.md`
- The plaintext API key is returned only once at creation (POST response) — important for any future UI
- Auth prefix is `/auth` not `/api/v1/auth` — different from all other provider modules

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 157-auth-module*
*Context gathered: 2026-04-08*
