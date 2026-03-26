# Phase 126: Sonos Infrastructure - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning
**Mode:** Auto (recommended defaults applied)

<domain>
## Phase Boundary

Create the Sonos proxy client, TypeScript types, and read-only discovery routes (health, devices, device detail, zones). The application can discover and inspect the Sonos system via typed proxy API. Transport controls, volume, extended features, and frontend are separate phases (127-129).

</domain>

<decisions>
## Implementation Decisions

### Proxy module structure
- **D-01:** Single `lib/sonos/sonosProxy.ts` function module — matches thermorossiProxy.ts, hueProxy.ts, fritzboxProxy.ts pattern
- **D-02:** Phase 126 implements only read wrappers (getHealth, getDevices, getDevice, getZones) using `haGet` transport
- **D-03:** Future phases (127-128) add haPost/haPut wrappers to the same file — no split by concern

### TypeScript types organization
- **D-04:** Single `types/sonosProxy.ts` file containing all Sonos interfaces — matches existing provider type files
- **D-05:** Define ALL types upfront (health, device, zone, playback, volume, EQ, queue, history) even though Phase 126 only uses discovery types — avoids rework in phases 127-128
- **D-06:** Use exact field names and types from `docs/api/sonos.md` TypeScript blocks — no renaming

### Data freshness model
- **D-07:** Sonos uses 3-state freshness: `LIVE` (≤90s), `STALE` (>90s, still 200 OK), `UNREACHABLE` (3+ failures → 503)
- **D-08:** Define `SonosDataFreshness = 'LIVE' | 'STALE'` as provider-specific type — UNREACHABLE never appears in response body (triggers 503 at HA proxy level)
- **D-09:** No client-side staleness tracking in this phase — frontend hooks come in Phase 129

### Route structure and naming
- **D-10:** Dynamic segments: `[uid]` for speakers, `[groupId]` for zones — camelCase in Next.js folder names per existing codebase convention
- **D-11:** All routes use `withAuthAndErrorHandler` + `success()` pattern from `lib/core`
- **D-12:** All route files export `const dynamic = 'force-dynamic'`
- **D-13:** Route naming maps to API doc paths: `/api/sonos/health`, `/api/sonos/devices`, `/api/sonos/devices/[uid]`, `/api/sonos/zones`

### Error handling
- **D-14:** Let haGet propagate RFC 9457 errors — no extra error wrapping in proxy functions
- **D-15:** 404 for unknown speaker UID (from HA proxy), 503 for UNREACHABLE — pass through to client

### Claude's Discretion
- JSDoc comments on proxy functions (optional, brief)
- Internal helper functions if needed for response mapping
- Test file structure and mock data shapes

</decisions>

<specifics>
## Specific Ideas

- Follow the exact 7-step device onboarding path established in v11.0: types → client → routes → hook → card → page → cron (Phase 126 covers steps 1-3)
- Sonos speaker UID format is always `RINCON_*` — use this in mock data and type docs
- Zone group_id format is `{coordinator_uid}:N` — document in type JSDoc

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Sonos API specification
- `docs/api/sonos.md` — Complete 28-endpoint specification with TypeScript interfaces, response examples, error tables. Phase 126 uses §Health and §Discovery sections.

### Shared transport layer
- `lib/haClient.ts` — haGet/haPost/haPut/haDelete implementations, X-API-Key auth, RFC 9457 error parsing, timeout handling
- `types/haClient.ts` — HaRequestOptions, RFC9457ProblemDetail interfaces

### Reference proxy implementations
- `lib/stove/thermorossiProxy.ts` — Simplest proxy pattern (function module with typed haGet/haPost wrappers)
- `lib/hue/hueProxy.ts` — Complex proxy with GET/PUT wrappers (closer to final Sonos shape)
- `types/thermorossiProxy.ts` — Type file pattern (union types, response interfaces, command response)
- `types/hueProxy.ts` — Complex type file with state request interfaces

### Route pattern references
- `app/api/hue/lights/route.ts` — GET route using withAuthAndErrorHandler + success()
- `app/api/hue/lights/[id]/route.ts` — Dynamic segment route with getPathParam()

### Core utilities
- `lib/core/apiResponse.ts` — success(), error(), withAuthAndErrorHandler(), getPathParam(), parseJson()
- `types/common.ts` — PaginatedResponse<T>, shared types

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `haGet<T>()` from `lib/haClient.ts`: Direct reuse for all 4 read routes — just pass Sonos endpoint path and response type
- `withAuthAndErrorHandler()` from `lib/core`: Wraps all route handlers with auth check + error formatting
- `success()` from `lib/core/apiResponse.ts`: Standard JSON response wrapper
- `getPathParam()` from `lib/core`: Extracts dynamic path segments (for `[uid]`)

### Established Patterns
- Function module pattern (not class): export individual async functions, each wrapping a single haGet call
- All proxy endpoints use `/api/v1/{provider}/...` as HA base path
- Types file mirrors the provider proxy file name: `types/sonosProxy.ts` ↔ `lib/sonos/sonosProxy.ts`
- Response interfaces use snake_case field names matching the HA API

### Integration Points
- `lib/haClient.ts` → `lib/sonos/sonosProxy.ts` → `app/api/sonos/*/route.ts`
- HA proxy base path: `/api/v1/sonos/...` (env vars HA_API_URL + HA_API_KEY already configured for all providers)
- No new environment variables needed — reuses existing HA transport config

</code_context>

<deferred>
## Deferred Ideas

- Sonos transport controls (play/pause/stop/next/prev) — Phase 127
- Volume and seek controls — Phase 127
- Extended controls (EQ, play-mode, queue, home theater, grouping, sleep timer, history) — Phase 128
- Frontend (SonosCard, /sonos page, device registry, nav menu) — Phase 129

</deferred>

---

*Phase: 126-sonos-infrastructure*
*Context gathered: 2026-03-23*
