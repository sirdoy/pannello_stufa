# Phase 130: DIRIGERA Infrastructure - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning
**Mode:** Auto (recommended defaults applied)

<domain>
## Phase Boundary

Create the DIRIGERA proxy client, TypeScript types, and all sensor read routes (health, sensors, sensors/contact, sensors/motion, sensors/summary). The application can query DIRIGERA hub health and enumerate all sensors via typed proxy API. DIRIGERA is a read-only provider (haGet only) — no command endpoints exist. Frontend and device registry integration are Phase 131. History, stats, and telemetry endpoints are deferred to future phases.

</domain>

<decisions>
## Implementation Decisions

### Proxy module structure
- **D-01:** Single `lib/dirigera/dirigeraProxy.ts` function module — matches sonosProxy.ts, thermorossiProxy.ts, hueProxy.ts pattern
- **D-02:** Read-only provider: all wrappers use `haGet` transport exclusively — no haPost/haPut/haDelete needed (DIRIGERA has no control endpoints in v16.0 scope)
- **D-03:** 5 proxy functions: `getHealth`, `getSensors`, `getContactSensors`, `getMotionSensors`, `getSensorSummary`

### TypeScript types organization
- **D-04:** Single `types/dirigeraProxy.ts` file containing all DIRIGERA interfaces — matches existing provider type files
- **D-05:** Define ALL types upfront (health, sensor, contact, motion, summary, history events, stats, telemetry) even though Phase 130 only uses health and sensor types — avoids rework in future phases (same rationale as Sonos D-05)
- **D-06:** Use exact field names and types from `docs/api/dirigera.md` TypeScript blocks — no renaming

### Data freshness model
- **D-07:** DIRIGERA uses 3-state freshness on contact and motion endpoints: `LIVE` (reachable + last_seen ≤5min), `STALE` (reachable but last_seen >5min or null), `UNREACHABLE` (not reachable)
- **D-08:** Define `DirigeraDataFreshness = 'LIVE' | 'STALE' | 'UNREACHABLE'` — unlike Sonos, UNREACHABLE IS returned in the response body (computed per-sensor, not triggering 503)
- **D-09:** `is_stale` boolean on list responses indicates cache-level staleness (separate from per-sensor `data_freshness`)

### Route structure and naming
- **D-10:** All 5 routes are static paths — no dynamic segments needed in this phase
- **D-11:** Route paths: `/api/dirigera/health`, `/api/dirigera/sensors`, `/api/dirigera/sensors/contact`, `/api/dirigera/sensors/motion`, `/api/dirigera/sensors/summary`
- **D-12:** All routes use `withAuthAndErrorHandler` + `success()` pattern from `lib/core`
- **D-13:** All route files export `const dynamic = 'force-dynamic'`
- **D-14:** Array responses (sensors lists) wrapped in named object keys matching API spec (`sensors` key); object responses (health, summary) use double assertion for `success()` compatibility

### Error handling
- **D-15:** Let haGet propagate RFC 9457 errors — no extra error wrapping in proxy functions
- **D-16:** 503 for hub unreachable (from HA proxy), 401 for auth — pass through to client

### Claude's Discretion
- JSDoc comments on proxy functions (optional, brief)
- Test file structure and mock data shapes
- Whether to add query parameter forwarding for future history/telemetry routes

</decisions>

<specifics>
## Specific Ideas

- Follow the exact 7-step device onboarding path established in v11.0: types -> client -> routes -> hook -> card -> page -> cron (Phase 130 covers steps 1-3)
- DIRIGERA sensor IDs are UUID v4 format (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890`) — use this in mock data
- Sensor `custom_name` uses IKEA product names (e.g., "MYGGBETT Ingresso") — preserve as-is in types
- Motion sensors have `is_open: null` (only contact sensors have open/close state) — type reflects this with `boolean | null`
- `light_level` is motion-sensor-only field (merged from companion lightSensor by room) — only on MotionSensor interface, not base DirigeraSensor

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### DIRIGERA API specification
- `docs/api/dirigera.md` — Complete 8-endpoint specification with TypeScript interfaces, response examples, error tables. Phase 130 uses Health and Sensors sections (5 of 8 endpoints). History, Stats, and Telemetry sections define types for upfront definition but routes are deferred.

### Shared transport layer
- `lib/haClient.ts` — haGet implementation, X-API-Key auth, RFC 9457 error parsing, timeout handling
- `types/haClient.ts` — HaRequestOptions, RFC9457ProblemDetail interfaces

### Reference proxy implementations
- `lib/sonos/sonosProxy.ts` — Most recent proxy pattern (function module with typed haGet wrappers, same read-only shape needed here)
- `types/sonosProxy.ts` — Most recent type file pattern (all types defined upfront including future-phase types)
- `lib/stove/thermorossiProxy.ts` — Simplest proxy pattern for comparison

### Route pattern references
- `app/api/sonos/health/route.ts` — Static GET route using withAuthAndErrorHandler + success()
- `app/api/sonos/zones/route.ts` — Array response route (wraps in named key)
- `app/api/sonos/devices/route.ts` — Array response with double assertion pattern

### Core utilities
- `lib/core/apiResponse.ts` — success(), error(), withAuthAndErrorHandler(), parseJson()
- `types/common.ts` — PaginatedResponse<T>, shared types

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `haGet<T>()` from `lib/haClient.ts`: Direct reuse for all 5 read routes — just pass DIRIGERA endpoint path and response type
- `withAuthAndErrorHandler()` from `lib/core`: Wraps all route handlers with auth check + error formatting
- `success()` from `lib/core/apiResponse.ts`: Standard JSON response wrapper

### Established Patterns
- Function module pattern (not class): export individual async functions, each wrapping a single haGet call
- All proxy endpoints use `/api/v1/{provider}/...` as HA base path — DIRIGERA uses `/api/v1/dirigera/...`
- Types file mirrors the provider proxy file name: `types/dirigeraProxy.ts` <-> `lib/dirigera/dirigeraProxy.ts`
- Response interfaces use snake_case field names matching the HA API
- Array responses wrapped in named object key (e.g., `{ sensors: [...], count: N }`)

### Integration Points
- `lib/haClient.ts` -> `lib/dirigera/dirigeraProxy.ts` -> `app/api/dirigera/*/route.ts`
- HA proxy base path: `/api/v1/dirigera/...` (env vars HA_API_URL + HA_API_KEY already configured for all providers)
- No new environment variables needed — reuses existing HA transport config
- Nested route structure: `app/api/dirigera/sensors/contact/route.ts`, `app/api/dirigera/sensors/motion/route.ts`, `app/api/dirigera/sensors/summary/route.ts`

</code_context>

<deferred>
## Deferred Ideas

- GET /dirigera/history — paginated sensor event history (DIRIG-F01, future phase)
- GET /dirigera/stats — aggregation and retention statistics (DIRIG-F02, future phase)
- GET /dirigera/telemetry — sensor telemetry history (DIRIG-F03, future phase)
- DirigeraCard dashboard card + /dirigera page — Phase 131
- Device registry integration + navigation menu — Phase 131

</deferred>

---

*Phase: 130-dirigera-infrastructure*
*Context gathered: 2026-03-24*
