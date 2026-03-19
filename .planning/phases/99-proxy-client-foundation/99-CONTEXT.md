# Phase 99: Proxy Client Foundation - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Create the thermorossi proxy client module using shared haGet/haPost transport, define TypeScript interfaces for all proxy response shapes, and migrate all read-only API routes (status, power, fan-level, health) to proxy through the new client. Control endpoints and frontend changes are out of scope (Phases 100-101).

</domain>

<decisions>
## Implementation Decisions

### Client pattern
- Function module at `lib/thermorossiProxy.ts` — identical pattern to `lib/netatmoProxy.ts`
- Import `haGet` from `lib/haClient.ts` — X-API-Key auth handled by shared transport
- Convenience wrappers: `getStatus()`, `getPower()`, `getFan()`, `getHealth()`
- No retry logic in the proxy client — `haClient.ts` handles timeouts, the HA proxy handles retries to WiNet

### Type definitions
- Separate types file at `types/thermorossiProxy.ts` — matches `types/netatmoProxy.ts` pattern
- Interfaces defined per API doc spec: `ThermorossiStatusResponse`, `ThermorossiPowerResponse`, `ThermorossiFanResponse`, `ThermorossiHealthResponse`
- Also define `ThermorossiCommandResponse` (202 Accepted shape) and `ThermorossiHistoryResponse`/`ThermorossiHistoryItem` now — Phase 100 will use them
- `stove_state` typed as union literal: `"off" | "igniting" | "working" | "standby" | "cleaning" | "alarm" | "modulating"`
- `data_freshness` typed as `"LIVE" | "STALE"` (UNREACHABLE triggers 503, never appears in response body)

### API route migration
- Keep existing route paths: `/api/stove/status`, `/api/stove/getPower`, `/api/stove/getFan`
- Each route handler calls the new proxy convenience wrapper instead of `lib/stoveApi.ts`
- Routes return the proxy response shape directly (new shape replaces old WiNet shape)
- Health route: new `/api/stove/health` route (or update existing health check path)
- `export const dynamic = 'force-dynamic'` on all routes

### Error handling
- RFC 9457 errors from proxy mapped to ApiError via haClient's `mapResponseError()`
- 503 from proxy (UNREACHABLE) → pass through as 503 to frontend
- No custom error mapping needed in the proxy client — haClient covers all cases

### Claude's Discretion
- Whether to add `getHistory()` convenience wrapper now or defer to Phase 100
- Exact JSDoc comment style on convenience wrappers
- Whether to create a barrel export or keep direct imports

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Proxy API specification
- `docs/api/thermorossi.md` — Complete Thermorossi proxy API: 10 endpoints, response interfaces, state mapping table, field verification status
- `docs/api/README.md` — HA proxy authentication (X-API-Key), RFC 9457 error format, pagination pattern

### Existing patterns (reference implementations)
- `lib/haClient.ts` — Shared transport: haGet/haPost with timeout, RFC 9457 error mapping
- `lib/netatmoProxy.ts` — Reference proxy client: convenience wrappers over haGet/haPost, type imports from separate file
- `types/netatmoProxy.ts` — Reference type file structure for proxy response interfaces

### Current WiNet client (to be replaced)
- `lib/stoveApi.ts` — Current direct WiNet cloud client with sandbox mode, retry logic, hardcoded API key

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/haClient.ts` (haGet/haPost): Shared transport — no new fetch logic needed
- `lib/core/apiErrors.ts` (ApiError, ERROR_CODES, HTTP_STATUS): Error types for route handlers
- `types/netatmoProxy.ts`: Template for proxy type file structure

### Established Patterns
- Function module proxy clients: netatmoProxy.ts, raspiClient.ts — all use haGet/haPost
- Types in separate `types/*.ts` files imported by both client and route handlers
- Route handlers use `try/catch` with `ApiError` → JSON response mapping
- `export const dynamic = 'force-dynamic'` on all API routes

### Integration Points
- 13 existing stove API routes under `app/api/stove/` — 4 read routes to migrate (status, getPower, getFan + new health)
- `lib/stoveApi.ts` — imports to replace with `lib/thermorossiProxy.ts` in migrated routes
- No frontend changes in this phase — hooks still call the same Next.js API routes

</code_context>

<specifics>
## Specific Ideas

No specific requirements — the API spec in `docs/api/thermorossi.md` is the authoritative reference with exact response shapes, field types, and state mapping.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 99-proxy-client-foundation*
*Context gathered: 2026-03-19*
