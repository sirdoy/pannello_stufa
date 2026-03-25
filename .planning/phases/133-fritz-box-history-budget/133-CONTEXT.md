# Phase 133: Fritz!Box History & Budget - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning
**Mode:** Auto (recommended defaults applied)

<domain>
## Phase Boundary

Expose multi-resolution bandwidth history (hourly, daily, auto-granularity), daily device count history, and TR-064 budget statistics via 5 new GET API routes. All read-only, extending the existing Fritz!Box client. Frontend consumption is Phase 134.

</domain>

<decisions>
## Implementation Decisions

### Client extension approach
- **D-01:** Add 5 new methods to existing `fritzboxClient` object in `lib/fritzbox/fritzboxClient.ts` — same pattern as Phase 132
- **D-02:** Each method is a thin `haGet` wrapper with inline response type, matching the 13 existing methods

### Type organization
- **D-03:** Keep inline types in `fritzboxClient.ts` — use exact interface names and field types from `docs/api/fritzbox.md` TypeScript blocks
- **D-04:** History endpoints use `BandwidthHourlyRecord`, `BandwidthDailyRecord`, `DeviceDailyRecord`, `BandwidthAggregatedRecord`; budget uses `BudgetStats`

### Response transformation
- **D-05:** All 5 new endpoints use raw pass-through — NO transformation (no bps→Mbps, no camelCase, no timestamp conversion). Consistent with Phase 132's D-05 for new endpoints. Transformation belongs in frontend/hooks (Phase 134).
- **D-06:** Existing `getBandwidthHistory()` remains unchanged — it serves different consumers (current chart hooks)

### Query parameter forwarding
- **D-07:** History endpoints accept `params?: URLSearchParams` for `days`/`limit`/`offset` — matches `getWifiClients`/`getDhcpReservations`/`getPortForwarding` pattern
- **D-08:** Budget-stats has no query params — simple no-arg method like `getSystemInfo()`

### Auto endpoint handling
- **D-09:** Expose `/history/bandwidth/auto` response as-is using `BandwidthAggregatedRecord` interface with generic `timestamp` + `granularity: "hourly" | "daily"` discriminator — no client-side normalization

### Rate limiting & caching
- **D-10:** All 5 new routes get rate limiting via `checkRateLimitFritzBox(session.user.sub, endpoint)` — no exceptions
- **D-11:** All 5 new routes get caching via `getCachedData(key, fetcher)` with default 60s TTL — including budget-stats (dashboard doesn't need sub-minute accuracy)

### Route structure
- **D-12:** Routes under `app/api/fritzbox/`: `history/bandwidth/hourly/`, `history/bandwidth/daily/`, `history/bandwidth/auto/`, `history/devices/daily/`, `budget-stats/`
- **D-13:** All routes use `withAuthAndErrorHandler` + `success()` pattern from `lib/core`
- **D-14:** All route files export `const dynamic = 'force-dynamic'`

### Error handling
- **D-15:** Let haGet propagate RFC 9457 errors — no extra error wrapping in client methods
- **D-16:** 503 from HA proxy (router unreachable, cache empty) passes through to frontend

### Claude's Discretion
- JSDoc comments on new client methods (brief, optional)
- Exact cache key naming within the kebab-case convention
- Whether to reuse existing `PaginatedResponse<T>` interface for history endpoints (they use the same envelope)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Fritz!Box API specification
- `docs/api/fritzbox.md` — Complete endpoint specification. Phase 133 uses §Historical Data section (lines 1000-1248 for history tiers, lines 1295-1345 for budget-stats). Contains exact TypeScript interfaces and response examples.

### Existing Fritz!Box infrastructure
- `lib/fritzbox/fritzboxClient.ts` — Current client with 13 methods (ping, debugRequest, getDevices, getBandwidth, getBandwidthHistory, getWanStatus, getDeviceEvents, getSystemInfo, getWifiClients, getWifiNetworks, getDhcpReservations, getPortForwarding, getUpnpStatus, getMeshTopology). New methods extend this file.
- `lib/fritzbox/index.ts` — Barrel export
- `lib/fritzbox/fritzboxCache.ts` — `getCachedData(key, fetcher)` with 60s TTL
- `lib/fritzbox/fritzboxRateLimiter.ts` — `checkRateLimitFritzBox(userId, endpoint)` with 10 req/min limit

### Shared transport layer
- `lib/haClient.ts` — haGet implementation, X-API-Key auth, RFC 9457 error parsing

### Route pattern references
- `app/api/fritzbox/devices/route.ts` — Canonical Fritz!Box route pattern: withAuthAndErrorHandler → rate limit → cache → client call → success()
- `lib/core/apiResponse.ts` — success(), error(), withAuthAndErrorHandler()

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `haGet<T>()` from `lib/haClient.ts`: Direct reuse for all 5 new client methods
- `PaginatedResponse<T>` already defined in `fritzboxClient.ts`: Reuse for all 4 history endpoints (same `items`/`total_count`/`limit`/`offset` envelope)
- `withAuthAndErrorHandler()` from `lib/core`: Wraps all route handlers
- `success()` from `lib/core/apiResponse.ts`: Standard JSON response
- `getCachedData()` from `lib/fritzbox/fritzboxCache.ts`: 60s TTL caching
- `checkRateLimitFritzBox()` from `lib/fritzbox/fritzboxRateLimiter.ts`: Rate limiting

### Established Patterns
- URLSearchParams forwarding: `getWifiClients(params?)` constructs query string from optional URLSearchParams
- No-arg methods: `getSystemInfo()`, `getUpnpStatus()`, `getMeshTopology()` — simple haGet calls with inline return type
- Raw pass-through: Phase 132 methods return raw HA proxy response without transformation

### Integration Points
- `lib/fritzbox/fritzboxClient.ts` gets 5 new methods added to the exported object
- 5 new route directories under `app/api/fritzbox/` (3 nested under `history/bandwidth/`, 1 under `history/devices/`, 1 at `budget-stats/`)
- No new environment variables needed
- No frontend integration in this phase

</code_context>

<specifics>
## Specific Ideas

- History hourly accepts `days` param (1-365, default 7); daily accepts `days` (1-3650, default 30); devices/daily accepts `days` (1-3650, default 30); auto accepts `days` (1-3650, default 7)
- Auto endpoint switches granularity at `days <= 7` (hourly) vs `days > 7` (daily) — server-side logic, transparent to our client
- Budget-stats is a flat object (not paginated) with `status: "ok" | "warning" | "danger"` and `utilization_percent`
- DeviceDailyRecord has 24 rows per day (one per `hour_bucket: 0-23`), so `total_count` = days * 24
- Existing `getBandwidthHistory()` already covers raw bandwidth history — the new tier endpoints provide pre-aggregated data (min/max/avg per period)

</specifics>

<deferred>
## Deferred Ideas

- Fritz!Box frontend page enhancements (history charts toggle, system info display) — Phase 134
- Telephony endpoints (DECT, calls, TAM) — explicitly excluded from v16.0 scope

</deferred>

---

*Phase: 133-fritz-box-history-budget*
*Context gathered: 2026-03-25*
