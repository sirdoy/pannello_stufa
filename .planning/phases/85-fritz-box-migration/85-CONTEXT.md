# Phase 85: Fritz!Box Migration - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate Fritz!Box client and API routes from the class-based JWT-authenticated `FritzBoxClient` to the shared `haGet`/`haPost` transport (Phase 84). All Fritz!Box API routes must return identical data. JWT login flow, credential resolution from Firebase RTDB, and `HOMEASSISTANT_*` env vars are removed. Cache layer (60s TTL) and rate limiter (10 req/min) continue to function unchanged on top of the new transport.

</domain>

<decisions>
## Implementation Decisions

### Client replacement strategy
- Replace `FritzBoxClient` class with thin wrapper functions that call `haGet<T>()` internally
- Export the same function signatures (`getDevices()`, `getBandwidth()`, `getWanStatus()`, etc.) so route-level imports change minimally
- The barrel `lib/fritzbox/index.ts` continues to export `fritzboxClient` as an object with methods (or named function exports) — routes should require minimal diff
- No more JWT token cache, no more `getToken()`, no more `resolveCredentials()`, no more 401 retry logic — `haGet` handles auth via X-API-Key

### Response transformation
- Keep all response transformations (status→active, bps→Mbps, fetched_at→timestamp) inside the Fritz!Box wrapper functions, not in routes
- Routes continue to receive pre-transformed data exactly as before
- Type assertions against raw API responses stay in wrapper functions

### Credential cleanup
- Remove Firebase RTDB credential resolution (`resolveCredentials()`, `credentialCache`, `invalidateFritzBoxCredentialCache()`)
- Remove `HOMEASSISTANT_API_URL`, `HOMEASSISTANT_USER`, `HOMEASSISTANT_PASSWORD` env var references from Fritz!Box code
- The shared `HA_API_URL` + `HA_API_KEY` (from Phase 84) replaces all of these
- `invalidateFritzBoxCredentialCache` export is removed — check for any callers and delete them

### Endpoint path update
- Old client used `/api/v1/devices`, `/api/v1/bandwidth`, `/api/v1/wan`, `/health`
- These paths remain the same — `haGet('/api/v1/devices')` etc. — the HA proxy routes to Fritz!Box provider using the same paths
- No endpoint renaming needed

### What stays unchanged
- `fritzboxCache.ts` — Firebase RTDB cache-aside, 60s TTL (no changes)
- `fritzboxRateLimiter.ts` — 10 req/min persistent rate limiter (no changes)
- `fritzboxErrors.ts` — Fritz!Box error codes (no changes)
- `deviceEventLogger.ts` — Device event logging (no changes)
- All 7 API route files — minimal changes (import path may change, `fritzboxClient.method()` call pattern preserved or updated to named function calls)

### Claude's Discretion
- Whether to keep a `fritzboxClient` object with methods or switch to named function exports (either works, minimize route diff)
- Exact test update strategy for existing Fritz!Box tests
- Whether `fritzboxErrors.ts` static factory methods (e.g., `ApiError.fritzboxNotConfigured()`) need cleanup if they referenced JWT-specific errors

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Shared transport (Phase 84)
- `lib/haClient.ts` — Shared `haGet<T>` and `haPost<T>` with X-API-Key auth, AbortController timeout, RFC 9457 error mapping
- `types/haClient.ts` — `RFC9457ProblemDetail` and `HaRequestOptions` types

### Fritz!Box current implementation
- `lib/fritzbox/fritzboxClient.ts` — Current class-based client to be replaced (JWT login, credential resolution, response transformations)
- `lib/fritzbox/index.ts` — Barrel exports (must be updated)
- `lib/fritzbox/fritzboxCache.ts` — Cache layer (stays unchanged)
- `lib/fritzbox/fritzboxRateLimiter.ts` — Rate limiter (stays unchanged)
- `lib/fritzbox/deviceEventLogger.ts` — Event logger (stays unchanged)

### API routes (consumers)
- `app/api/fritzbox/wan/route.ts` — WAN status route
- `app/api/fritzbox/devices/route.ts` — Devices route (with event detection)
- `app/api/fritzbox/health/route.ts` — Health check route
- `app/api/fritzbox/bandwidth/route.ts` — Bandwidth route
- `app/api/fritzbox/bandwidth-history/route.ts` — Bandwidth history route
- `app/api/fritzbox/debug/route.ts` — Debug route
- `app/api/fritzbox/history/route.ts` — Device history route

### Netatmo reference pattern
- `lib/netatmoProxy.ts` — Function module pattern that Fritz!Box should follow (v10.0 decision)

### API documentation
- `docs/api/README.md` — HA proxy API overview and authentication
- `docs/api/raspberry-pi.md` — Raspberry Pi API docs (shows endpoint path pattern under HA proxy)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/haClient.ts` (`haGet`, `haPost`): Direct replacement for all Fritz!Box HTTP calls — handles auth, timeout, error mapping
- `lib/fritzbox/fritzboxCache.ts`: Cache-aside pattern fully decoupled from client — just needs a fetch function
- `lib/fritzbox/fritzboxRateLimiter.ts`: Rate limiter fully decoupled from client — no changes needed

### Established Patterns
- Function module pattern (from Netatmo v10.0): `netatmoProxyGet<T>` / `netatmoProxyPost<T>` — Fritz!Box wrappers should follow this
- Routes use `getCachedData('key', () => fetchFunction())` pattern — cache layer doesn't care where data comes from
- `withAuthAndErrorHandler` wraps all route handlers — error propagation is consistent

### Integration Points
- `lib/fritzbox/index.ts` barrel export — routes import from here
- `app/api/fritzbox/*/route.ts` — 7 route files that consume the client
- `lib/fritzbox/fritzboxErrors.ts` — May have `fritzboxNotConfigured` and `fritzboxTimeout` factory methods that reference JWT concepts
- Firebase RTDB path `config/fritzbox` — credential storage to be abandoned (no migration needed, just stop reading it)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — straightforward migration following the established Netatmo proxy pattern from v10.0.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 85-fritz-box-migration*
*Context gathered: 2026-03-17*
