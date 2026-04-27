# Phase 163: DIRIGERA Gap Closure - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Proxy the three remaining read-only DIRIGERA endpoints through the existing `dirigeraProxy.ts` module: sensor event history (DIR-01), aggregation + retention stats (DIR-02), and sensor telemetry (DIR-03). No new UI, no new hooks — API-only completion of DIRIGERA provider coverage, mirroring the gap-closure pattern used for Sonos (Phase 160), Netatmo (Phase 161), and Fritz!Box (Phase 162).

</domain>

<decisions>
## Implementation Decisions

### Route Path Convention
- **D-01:** New routes live at `app/api/v1/dirigera/{history,stats,telemetry}/route.ts` — matches the roadmap goal verbatim (`GET /api/v1/dirigera/history`, etc.) and the base path declared in `docs/api/dirigera.md`. *[auto: recommended — literal roadmap spec match]*
- **D-02:** Existing routes at `app/api/dirigera/*` are NOT migrated in this phase. Mixed state is acceptable for scope; a dedicated v1 migration phase (matching Phase 161's Netatmo approach) can happen later. *[auto: recommended — avoids scope creep]*

### Client Function Signatures
- **D-03:** Three new exported functions in `lib/dirigera/dirigeraProxy.ts`:
  - `getHistory(params?: SensorHistoryParams): Promise<SensorHistoryResponse>`
  - `getStats(): Promise<DirigeraStatsResponse>`
  - `getTelemetry(params?: SensorTelemetryParams): Promise<SensorTelemetryResponse>`
- **D-04:** Query params passed as a single object argument (not positional) — consistent with readability for 4-6 optional fields. `params` is optional; when omitted the proxy uses its defaults (`limit=100`, `offset=0`). *[auto: recommended — matches docs + scales past 2 fields cleanly]*
- **D-05:** Client serializes params to a query string via `URLSearchParams`, skipping `null`/`undefined` values. Only non-empty string/number values are forwarded. *[auto: recommended — avoids sending empty filters]*

### Types & Envelopes
- **D-06:** Reuse the already-declared types in `types/dirigeraProxy.ts`: `SensorHistoryResponse`, `DirigeraStatsResponse`, `SensorTelemetryResponse` (and their element types). No new type definitions needed — the types were added speculatively in Phase 130 under comment `// FUTURE-PHASE TYPES (defined now per D-05, routes deferred)`. *[auto: recommended — types are ready]*
- **D-07:** Add two small param interfaces to `types/dirigeraProxy.ts`: `SensorHistoryParams { sensor_id?, event_type?, start?, end?, limit?, offset? }` and `SensorTelemetryParams { sensor_id?, start?, end?, limit?, offset? }`. Scoped to this file — do not export from `types/common.ts`. *[auto: recommended — locality over generic abstraction]*
- **D-08:** Do NOT use the generic `PaginatedResponse<T>` envelope from `types/common.ts`. DIRIGERA responses use provider-specific field names (`events`, `telemetry`, `total` instead of `total_count`) per the docs spec — raw pass-through wins over envelope normalization. *[auto: recommended — consistent with Phase 162 raw pass-through rule]*

### Route Implementation
- **D-09:** Routes follow the exact pattern of `app/api/dirigera/sensors/route.ts`:
  - `export const dynamic = 'force-dynamic'`
  - `withAuthAndErrorHandler` wrapper from `@/lib/core`
  - Delegate to the new proxy functions
  - Return the response as-is (no field renaming, no re-wrapping in `success()` — history/stats/telemetry responses are already the canonical shape per the docs)
- **D-10:** For history/telemetry, the route parses query params from `request.nextUrl.searchParams` and forwards them typed to the proxy function. Invalid params (e.g., non-numeric `limit`) are dropped silently; the HA proxy enforces 1-1000 clamping per the docs. *[auto: recommended — thin route, proxy is source of truth]*
- **D-11:** No rate-limiting or caching wrapper — existing dirigera routes (e.g., `/api/dirigera/sensors`) don't have them either. History/telemetry are diagnostic reads, not hot-path polling. *[auto: recommended — consistency with existing DIRIGERA routes]*

### Tests
- **D-12:** Extend `lib/dirigera/__tests__/dirigeraProxy.test.ts` with unit tests for `getHistory`, `getStats`, `getTelemetry` — mock `haGet`, assert the correct endpoint path, query string serialization (params present → included, params absent → omitted), and response pass-through.
- **D-13:** Add co-located route tests under `app/api/v1/dirigera/{history,stats,telemetry}/__tests__/route.test.ts` — mock `@/lib/dirigera/dirigeraProxy`, assert auth wrapper is applied, param forwarding works, and the JSON body matches the docs schema. *[auto: recommended — Phase 162 added route tests, tightening coverage for gap-closure phases]*

### Documentation
- **D-14:** `docs/api/dirigera.md` already documents these endpoints fully. No doc changes needed unless the implementation diverges from the spec. If divergence occurs, update docs in the same plan.

### Claude's Discretion
- Whether to split proxy functions and routes into one plan or two (likely one — small surface area)
- Exact Jest mock shape for `haGet` in the new tests (follow existing patterns)
- Whether `SensorHistoryParams`/`SensorTelemetryParams` live next to the response types or in a dedicated section of the same file

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### DIRIGERA API Specification
- `docs/api/dirigera.md` §History — GET /history schema, query params, response envelope (`events[]`, `total`, `limit`, `offset`)
- `docs/api/dirigera.md` §Statistics — GET /stats schema (`aggregation`, `retention` blocks)
- `docs/api/dirigera.md` §Telemetry — GET /telemetry schema, query params, response envelope (`telemetry[]`, `total`, `limit`, `offset`)

### Existing Implementation (reference patterns)
- `lib/dirigera/dirigeraProxy.ts` — Current proxy with 5 functions (health, sensors, contact, motion, summary). New functions append here, same `haGet` pattern.
- `lib/dirigera/__tests__/dirigeraProxy.test.ts` — Existing test patterns for `haGet` mocking and response assertions.
- `lib/haClient.ts` — Shared HA proxy transport (`haGet` handles auth, timeouts, RFC 9457 error mapping).
- `app/api/dirigera/sensors/route.ts` — Reference route implementation (auth wrapper, delegation to proxy).
- `types/dirigeraProxy.ts` §Future-Phase Types — Response types already declared for DIR-01/02/03.

### Prior Gap-Closure Precedents
- `.planning/phases/162-fritz-box-gap-closure/162-CONTEXT.md` — Raw pass-through rule (D-01), test patterns (D-10).
- `.planning/phases/161-netatmo-gap-closure/161-CONTEXT.md` — Full v1 migration approach (NOT followed here — see D-02).
- `.planning/phases/160-sonos-gap-closure/160-CONTEXT.md` — Pagination + query param patterns.

### Requirements
- `.planning/REQUIREMENTS.md` §DIR-01, §DIR-02, §DIR-03 — acceptance criteria for each endpoint.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `dirigeraProxy.ts` exports as named functions (not an object) — append `getHistory`, `getStats`, `getTelemetry` as sibling exports.
- `haGet<T>(path: string)` from `lib/haClient.ts` — handles all transport concerns. New functions need only the endpoint path + optional query string.
- `types/dirigeraProxy.ts` already has `SensorHistoryResponse`, `DirigeraStatsResponse`, `SensorTelemetryResponse`, `SensorEvent`, `SensorTelemetryReading`, `AggregationStats`, `RetentionStats` — zero new type work for responses.
- `withAuthAndErrorHandler` from `@/lib/core` — standard auth + error wrapping used by every existing DIRIGERA route.

### Established Patterns
- **Raw pass-through** (Phase 162 D-01): HA proxy returns snake_case JSON; routes return it as-is without camelCase conversion.
- **Named function exports** in proxy modules (unlike Fritz!Box which uses an object export). Match DIRIGERA's existing style.
- **Thin routes**: route file delegates 1:1 to a proxy function; no business logic in the route.
- **Co-located route tests**: `app/api/.../__tests__/route.test.ts` pattern exists elsewhere in the codebase (e.g., fritzbox routes); not yet used in DIRIGERA but should be adopted for new routes per D-13.

### Integration Points
- `lib/dirigera/dirigeraProxy.ts` — append 3 functions
- `types/dirigeraProxy.ts` — append 2 param interfaces (responses already there)
- `app/api/v1/dirigera/` — new directory; 3 new `route.ts` files in subdirectories
- No frontend hooks, components, or pages touched (API-only phase)

</code_context>

<specifics>
## Specific Ideas

No specific user-provided requirements — `--auto` mode selected standard approaches consistent with prior gap-closure phases. Downstream decisions are anchored in `docs/api/dirigera.md` which is the authoritative spec.

</specifics>

<deferred>
## Deferred Ideas

- **Migrate existing `/api/dirigera/*` routes to `/api/v1/dirigera/*`** — would match Phase 161's full-migration approach for Netatmo and eliminate the mixed state. Out of scope here (phase is strictly gap closure); candidate for a follow-up phase if path consistency becomes a priority.
- **Frontend UI for sensor history / telemetry charts** — `docs/api/dirigera.md` lists LineChart/AreaChart suggestions. These belong in a separate UI phase.
- **Rate-limiting / caching for history/telemetry reads** — no existing DIRIGERA route has them. If polling pressure emerges, add consistently across all DIRIGERA routes in a dedicated phase.

</deferred>

---

*Phase: 163-dirigera-gap-closure*
*Context gathered: 2026-04-14*
