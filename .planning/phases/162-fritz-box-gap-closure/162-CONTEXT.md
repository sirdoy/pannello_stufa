# Phase 162: Fritz!Box Gap Closure - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Proxy all remaining Fritz!Box endpoints through the HA proxy: telephony (DECT handsets, call history, answering machine/TAM), raw history data, and TR-064 service discovery. This completes Fritz!Box API coverage — no new UI pages or dashboard cards.

</domain>

<decisions>
## Implementation Decisions

### Telephony Endpoints
- **D-01:** Raw pass-through for all telephony endpoints — no field transformation in the client, consistent with the pattern established in phase 133 (FRITZ-07+). The HA proxy already returns snake_case JSON; routes return it as-is.
- **D-02:** Three new client functions: `getDectHandsets()`, `getCallHistory(params?)`, `getTamStatus()` — each maps to one HA proxy endpoint.
- **D-03:** Call history supports pagination via `limit`/`offset` query params (same `PaginatedResponse<T>` envelope as existing endpoints).

### Raw History Overlap
- **D-04:** Existing `getBandwidthHistory()` and `getDeviceEvents()` already cover FRITZ-04 and FRITZ-06 use cases. If the HA proxy exposes distinct raw endpoints (different path or schema), add new functions; otherwise mark FRITZ-04 and FRITZ-06 as already satisfied and skip.
- **D-05:** FRITZ-05 (raw device presence history) — check if HA proxy has a `/history/devices` endpoint distinct from the daily aggregation (`/history/devices/daily`). Add client function only if the endpoint exists.

### Service Discovery
- **D-06:** Parse TR-064 XML response to JSON in the client function. All other Fritz!Box endpoints return JSON — mixing XML into the frontend would break consistency.
- **D-07:** Single `getServiceDiscovery()` function returning a structured JSON object (service list with name, type, URL fields).

### Route Structure
- **D-08:** Telephony routes nested: `app/api/fritzbox/telephony/dect/route.ts`, `app/api/fritzbox/telephony/calls/route.ts`, `app/api/fritzbox/telephony/tam/route.ts`.
- **D-09:** Service discovery flat: `app/api/fritzbox/service-discovery/route.ts`.
- **D-10:** All new routes follow `export const dynamic = 'force-dynamic'` + try/catch + `NextResponse.json()` pattern from existing Fritz!Box routes.

### Claude's Discretion
- TypeScript interface naming for telephony types (DectHandset, CallRecord, TamStatus, etc.)
- Test file placement follows existing co-located `__tests__/` pattern
- Whether to add the new functions to the existing `fritzboxClient` object or create a sub-module

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Implementation
- `lib/fritzbox/fritzboxClient.ts` — Current client with 19 functions, all via `haGet`. New functions follow this exact pattern.
- `lib/haClient.ts` — Shared HA proxy transport (`haGet`, `haPost`, `haPut`, `haDelete`)
- `app/api/fritzbox/system/route.ts` — Reference route implementation (raw pass-through pattern)
- `app/api/fritzbox/devices/route.ts` — Reference route with query param forwarding

### Requirements
- `.planning/REQUIREMENTS.md` §FRITZ-01 through §FRITZ-07 — acceptance criteria for each endpoint

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `fritzboxClient` object in `lib/fritzbox/fritzboxClient.ts` — add new functions here, export via the same object
- `PaginatedResponse<T>` generic interface — reuse for call history
- `haGet` from `lib/haClient.ts` — all Fritz!Box reads use this transport
- `parseTimestamp()` utility in fritzboxClient — reuse if telephony endpoints return `fetched_at`

### Established Patterns
- Raw pass-through: no camelCase transformation for phase 133+ endpoints (getSystemInfo, getWifiClients, etc.)
- Route pattern: `export const dynamic = 'force-dynamic'` → `fritzboxClient.method()` → `NextResponse.json(data)`
- Query param forwarding: `new URLSearchParams(request.nextUrl.searchParams)` passed to client functions
- Test pattern: co-located `__tests__/route.test.ts` with `jest.mock('@/lib/fritzbox/fritzboxClient')`

### Integration Points
- `fritzboxClient` export object — append new methods
- Route directory `app/api/fritzbox/` — new subdirectories for telephony and service-discovery
- No frontend hooks or UI components needed (API-only phase)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches following established Fritz!Box client patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 162-fritz-box-gap-closure*
*Context gathered: 2026-04-09*
