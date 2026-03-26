# Phase 132: Fritz!Box System & Network Services - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning
**Mode:** Auto (recommended defaults applied)

<domain>
## Phase Boundary

Expose Fritz!Box system info, WiFi client data, and network service details via new API routes. Seven new GET endpoints: system, wifi/clients, wifi/networks, network/dhcp/reservations, network/port-forwarding, network/upnp, network/mesh. All read-only. Frontend and history tiers are separate phases (133-134).

</domain>

<decisions>
## Implementation Decisions

### Client extension approach
- **D-01:** Add 7 new methods to existing `fritzboxClient` object in `lib/fritzbox/fritzboxClient.ts` — no new module or file split
- **D-02:** Each method is a thin `haGet` wrapper with inline response type, matching the 6 existing methods

### Type organization
- **D-03:** Keep inline types in `fritzboxClient.ts` — matches existing pattern (all current Fritz!Box methods use inline types, no separate `types/fritzboxProxy.ts` file exists)
- **D-04:** Use exact interface names and field types from `docs/api/fritzbox.md` TypeScript blocks as the haGet generic parameter

### Response transformation
- **D-05:** New endpoints pass through raw API responses WITHOUT transformation (no camelCase renaming, no unit conversion) — these are administrative/config data, not chart data
- **D-06:** Existing bandwidth/device transformations (bps→Mbps, snake_case→camelCase, Unix→ms) remain untouched — they serve chart/hook consumers
- **D-07:** Reuse existing `parseTimestamp()` for any `fetched_at` fields in responses that need timestamp parsing

### Rate limiting & caching
- **D-08:** All 7 new routes get rate limiting via `checkRateLimitFritzBox(session.user.sub, endpoint)` — matches every existing Fritz!Box route
- **D-09:** All 7 new routes get caching via `getCachedData(key, fetcher)` with default 60s TTL — matches existing pattern
- **D-10:** Cache keys follow existing convention: descriptive kebab-case (e.g., `system`, `wifi-clients`, `mesh-topology`)

### Route structure
- **D-11:** Nested route directories matching API paths: `app/api/fritzbox/system/`, `app/api/fritzbox/wifi/clients/`, `app/api/fritzbox/wifi/networks/`, `app/api/fritzbox/network/dhcp/reservations/`, `app/api/fritzbox/network/port-forwarding/`, `app/api/fritzbox/network/upnp/`, `app/api/fritzbox/network/mesh/`
- **D-12:** All routes use `withAuthAndErrorHandler` + `success()` pattern from `lib/core`
- **D-13:** All route files export `const dynamic = 'force-dynamic'`
- **D-14:** WiFi clients route accepts `band` query parameter for filtering (passed through to HA proxy)
- **D-15:** Paginated endpoints (wifi/clients, dhcp/reservations, port-forwarding) accept `limit` + `offset` query params

### Error handling
- **D-16:** Let haGet propagate RFC 9457 errors — no extra error wrapping in client methods
- **D-17:** 503 from HA proxy (router unreachable, cache empty) passes through to frontend

### Claude's Discretion
- JSDoc comments on new client methods (brief, optional)
- Exact cache key naming within the kebab-case convention
- Whether to extract shared PaginatedResponse<T> from inline to a local type alias (it already exists inline)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Fritz!Box API specification
- `docs/api/fritzbox.md` — Complete endpoint specification with TypeScript interfaces, response examples, query parameters. Phase 132 uses §Real-time Data (system only), §WiFi, and §Network Services sections.

### Existing Fritz!Box infrastructure
- `lib/fritzbox/fritzboxClient.ts` — Current client with 6 methods (ping, debugRequest, getDevices, getBandwidth, getBandwidthHistory, getWanStatus, getDeviceEvents). New methods extend this file.
- `lib/fritzbox/index.ts` — Barrel export aggregating fritzboxClient, fritzboxCache, fritzboxRateLimiter, deviceEventLogger
- `lib/fritzbox/fritzboxCache.ts` — `getCachedData(key, fetcher)` with 60s TTL Firebase RTDB cache
- `lib/fritzbox/fritzboxRateLimiter.ts` — `checkRateLimitFritzBox(userId, endpoint)` with 10 req/min limit

### Shared transport layer
- `lib/haClient.ts` — haGet implementation, X-API-Key auth, RFC 9457 error parsing
- `types/haClient.ts` — HaRequestOptions, RFC9457ProblemDetail interfaces

### Route pattern references
- `app/api/fritzbox/devices/route.ts` — Canonical Fritz!Box route pattern: withAuthAndErrorHandler → rate limit → cache → client call → success()
- `lib/core/apiResponse.ts` — success(), error(), withAuthAndErrorHandler()

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `haGet<T>()` from `lib/haClient.ts`: Direct reuse for all 7 new client methods
- `withAuthAndErrorHandler()` from `lib/core`: Wraps all route handlers
- `success()` from `lib/core/apiResponse.ts`: Standard JSON response
- `getCachedData()` from `lib/fritzbox/fritzboxCache.ts`: 60s TTL caching for all routes
- `checkRateLimitFritzBox()` from `lib/fritzbox/fritzboxRateLimiter.ts`: Rate limiting for all routes
- `parseTimestamp()` from `lib/fritzbox/fritzboxClient.ts`: Handles HA proxy timestamp format quirk

### Established Patterns
- Fritz!Box client: object export with method per endpoint, inline response types, `haGet` calls
- Route pattern: `export const dynamic = 'force-dynamic'` + `withAuthAndErrorHandler(async (request, context, session) => { ... })`
- Rate limit check: `const rateLimitResult = await checkRateLimitFritzBox(session.user.sub, 'endpoint-name'); if (!rateLimitResult.allowed) throw new ApiError(ERROR_CODES.RATE_LIMITED, ...)`
- Cache pattern: `const data = await getCachedData('key', () => fritzboxClient.method())`
- Query param forwarding: append search params to HA proxy URL string

### Integration Points
- `lib/fritzbox/fritzboxClient.ts` gets 7 new methods added to the exported object
- 7 new route directories under `app/api/fritzbox/` (nested: wifi/*, network/*)
- No new environment variables needed — reuses HA_API_URL + HA_API_KEY
- No frontend integration in this phase — routes only

</code_context>

<specifics>
## Specific Ideas

- Follow the exact route pattern from `app/api/fritzbox/devices/route.ts` — it's the canonical Fritz!Box route
- WiFi clients endpoint supports band filter via query param (`?band=5GHz`) — pass through to HA proxy URL
- UPnP response has a top-level `enabled` boolean plus `upnp_ports` array — not paginated, just a flat object
- Mesh response has `schema_version`, `node_count`, `link_count` metadata — richer than other endpoints
- System endpoint is slow-tier (hourly poll) but still gets 60s cache on our side

</specifics>

<deferred>
## Deferred Ideas

- History tiers (bandwidth hourly/daily, device daily, auto-granularity) — Phase 133
- Budget stats endpoint — Phase 133
- Fritz!Box frontend page enhancements — Phase 134
- Telephony endpoints (DECT, calls, TAM) — explicitly excluded from v16.0 scope

</deferred>

---

*Phase: 132-fritz-box-system-network-services*
*Context gathered: 2026-03-25*
