# Phase 75: API Client Foundation + Energy Read - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Create a shared Netatmo proxy client with X-API-Key authentication, then migrate the homestatus and homesdata API routes from direct Netatmo Cloud API calls to the local HomeAssistant proxy. Frontend components remain unchanged — API routes transform proxy response shapes to match existing frontend contracts. The proxy client (`lib/netatmoProxy.ts`) coexists with the old `lib/netatmoApi.ts` until Phase 79 cleanup.

</domain>

<decisions>
## Implementation Decisions

### Proxy client design
- Simple function module in `lib/netatmoProxy.ts` (not a class) — X-API-Key is stateless, no token caching needed
- API key from `NETATMO_PROXY_API_KEY` env var (no Firebase lookup)
- Base URL from `NETATMO_PROXY_URL` env var (e.g. `https://pdupun8zpr7exw43.myfritz.net/api/v1/netatmo`)
- Old `lib/netatmoApi.ts` stays untouched for non-migrated routes (Phases 76-78)

### Response shape mapping
- API routes transform proxy fields to existing frontend shape — frontend components stay unchanged
- Strip `{ body: { homes: [...] }, status }` envelope from homesdata — return rooms/modules/schedules directly
- Map proxy field names to existing frontend names (e.g. `therm_setpoint_temperature` → `setpoint`)
- Module battery/status info included by cross-referencing `/homesdata` modules data

### Staleness handling
- Pass `data_freshness` (LIVE|STALE|UNREACHABLE) from proxy to frontend in API response
- Reuse existing `useDeviceStaleness` / staleness indicator pattern from v7.0
- On UNREACHABLE: show last known temperatures with indicator, disable controls (similar to PWA offline behavior from v6.0)

### Migration strategy
- Hard cutover: swap existing route handlers in-place (`/api/netatmo/homestatus`, `/api/netatmo/homesdata`)
- No feature flag — routes call proxy directly, error handling covers proxy failures
- Remove `requireNetatmoToken()` from migrated routes — use proxy client with X-API-Key instead
- Non-migrated routes continue using OAuth until their respective phases

### Claude's Discretion
- Exact proxy client function signatures and error handling internals
- TypeScript types for proxy responses
- Test structure and mock patterns for proxy client
- Timeout configuration for proxy requests

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/core/apiErrors.ts`: `ApiError` class + `ERROR_CODES` + `HTTP_STATUS` constants — reuse for proxy error handling
- `lib/hooks/useDeviceStaleness.ts`: Hook for staleness monitoring — feed proxy `data_freshness` into this pattern
- `lib/pwa/stalenessDetector.ts`: Staleness detection utilities
- `lib/core/index.ts`: `withAuthAndErrorHandler`, `success`, `badRequest` — continue using for route wrappers

### Established Patterns
- Fritz!Box client (`lib/fritzbox/fritzboxClient.ts`): Server-side proxy with JWT auth — Netatmo proxy is simpler (API key), but error handling and timeout patterns transfer
- API route pattern: `withAuthAndErrorHandler` wrapper + `success()` response helper
- `export const dynamic = 'force-dynamic'` on all API routes
- `filterUndefined()` for Firebase writes
- `getEnvironmentPath()` for environment-scoped Firebase paths

### Integration Points
- `app/api/netatmo/homestatus/route.ts`: Currently calls `NETATMO_API.getHomeStatus()` + `requireNetatmoToken()` → swap to proxy client
- `app/api/netatmo/homesdata/route.ts`: Currently calls `NETATMO_API.getHomesData()` + `requireNetatmoToken()` → swap to proxy client
- `app/components/devices/thermostat/ThermostatCard.tsx`: Consumes homestatus response — must receive same shape after migration
- Firebase paths: `netatmo/currentStatus`, `netatmo/topology`, `netatmo/home_id` — continue writing to same paths
- Proxy API docs at `docs/api/netatmo.md` — reference for exact response shapes and types

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 75-api-client-foundation-energy-read*
*Context gathered: 2026-03-15*
