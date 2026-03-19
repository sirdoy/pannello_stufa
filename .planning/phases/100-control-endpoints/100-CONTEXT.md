# Phase 100: Control Endpoints - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate all stove command and settings API routes to the proxy client (ignit, shutdown, setPower, setFan, setWaterTemperature) and create a new history endpoint. All routes return proxy response shapes (202 Accepted for commands, paginated history for reads). Frontend hook changes are out of scope (Phase 101).

</domain>

<decisions>
## Implementation Decisions

### Command wrappers
- Add `sendIgnit()`, `sendShutdown()`, `setPower(value)`, `setFan(value)`, `setWaterTemp(value)` to `lib/thermorossiProxy.ts`
- All command wrappers use `haPost` from `lib/haClient.ts`
- Return `ThermorossiCommandResponse` (already defined in `types/thermorossiProxy.ts`)
- Command endpoint paths match proxy API: `/api/v1/thermorossi/commands/ignit`, `/commands/shutdown`, `/settings/power`, `/settings/fan-level`, `/settings/temperature/water`

### Route path mapping
- Keep existing Next.js route paths: `/api/stove/ignite`, `/api/stove/shutdown`, `/api/stove/setPower`, `/api/stove/setFan`, `/api/stove/setWaterTemperature`
- Each route handler calls the new proxy convenience wrapper instead of StoveService/stoveApi
- New route: `/api/stove/history` (no existing route to migrate)

### Response shape
- Control routes return `ThermorossiCommandResponse` directly (202 Accepted with `suggested_poll_delay_s`)
- History route returns `ThermorossiHistoryResponse` directly (paginated with auto-granularity)
- No backward-compatible response transformation — Phase 101 frontend adapts to new shapes

### Idempotency
- Keep `withIdempotency` wrapper on ignite and shutdown routes (PWA-level deduplication, separate from proxy concerns)
- Settings routes (setPower, setFan, setWaterTemp) keep `withIdempotency` for consistency

### Analytics
- Keep fire-and-forget analytics logging on ignite, shutdown, setPower routes (consent-gated, cross-cutting PWA concern)
- Analytics logs the command name, not the proxy response details

### Validation
- Simplify validation: parse body for required fields (`value` for settings, `power`/`source` for ignite)
- Let proxy handle range validation (returns 422 for out-of-range values)
- Remove dependency on StoveService and stoveApi validators where possible

### History route
- `/api/stove/history` forwards query params (`start`, `end`, `scale`, `limit`, `offset`) to proxy via `getHistory(params)`
- `getHistory()` already exists in `lib/thermorossiProxy.ts` (created in Phase 99)
- Route parses query string into URLSearchParams and passes through

### Claude's Discretion
- Whether to keep or simplify the `source` parameter in ignite/shutdown bodies
- Exact error mapping for 409 Conflict (state gating) from proxy
- Whether dead routes (getRoomTemperature, getActualWaterTemperature, getWaterSetTemperature, settings, setSettings) are cleaned up now or deferred to Phase 103

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Proxy API specification
- `docs/api/thermorossi.md` — Complete Thermorossi proxy API: control endpoint specs (202 Accepted pattern, state gating table, error responses), history endpoint (auto-granularity, pagination), field verification status
- `docs/api/README.md` — HA proxy authentication (X-API-Key), RFC 9457 error format

### Existing proxy client (extend this)
- `lib/thermorossiProxy.ts` — Phase 99 proxy client with read wrappers; add command wrappers here using `haPost`
- `types/thermorossiProxy.ts` — All types already defined: `ThermorossiCommandResponse`, `ThermorossiHistoryResponse`, `ThermorossiHistoryItem`
- `lib/haClient.ts` — Shared transport: `haGet`/`haPost` with timeout, RFC 9457 error mapping

### Current control routes (to be migrated)
- `app/api/stove/ignite/route.ts` — Uses StoveService + withIdempotency + analytics
- `app/api/stove/shutdown/route.ts` — Uses StoveService + withIdempotency + analytics
- `app/api/stove/setPower/route.ts` — Uses StoveService + withIdempotency + analytics
- `app/api/stove/setFan/route.ts` — Uses StoveService + withIdempotency
- `app/api/stove/setWaterTemperature/route.ts` — Uses stoveApi directly (no idempotency, no analytics)

### Reference pattern (Netatmo control migration)
- `lib/netatmoProxy.ts` — Reference for how command wrappers use `haPost`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/haClient.ts` (haPost): Shared POST transport — used for all command wrappers
- `lib/thermorossiProxy.ts`: Already has `getHistory()` — no new read wrapper needed
- `types/thermorossiProxy.ts`: `ThermorossiCommandResponse` already defined with all fields
- `lib/core` (withAuthAndErrorHandler, withIdempotency, success): Route middleware reused as-is

### Established Patterns
- Function module proxy clients: all use haGet/haPost, no class state
- Control routes: withAuthAndErrorHandler + withIdempotency + fire-and-forget analytics
- Route handlers return `success()` with typed response objects
- `export const dynamic = 'force-dynamic'` on all API routes

### Integration Points
- 5 existing control routes under `app/api/stove/` to migrate (ignite, shutdown, setPower, setFan, setWaterTemperature)
- 1 new route to create: `/api/stove/history`
- `lib/stoveApi.ts` and `lib/services/StoveService.ts` imports to replace with `lib/thermorossiProxy.ts`
- Validators in `lib/validators.ts` may need simplification (proxy handles range validation)

</code_context>

<specifics>
## Specific Ideas

- The proxy API path is `/commands/ignit` (no trailing 'e') but the Next.js route is `/api/stove/ignite` — the proxy wrapper handles the path mapping internally
- `setWaterTemperature` route currently validates range 30-80 but proxy spec says 40-80 — use proxy's 422 as source of truth
- Settings routes send `{ value: N }` to proxy, different from current body shapes (e.g. `{ level: N }` for setPower)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 100-control-endpoints*
*Context gathered: 2026-03-19*
