# Phase 106: Proxy Client + Types + Read Endpoints - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Create the Hue proxy client function module using shared haGet/haPost transport, define TypeScript types for all proxy response interfaces, and migrate all read endpoints (health, lights, lights/{id}, groups, groups/{id}, scenes, history). This is the foundation phase — control endpoints and frontend hooks are separate phases (107, 108).

</domain>

<decisions>
## Implementation Decisions

### Client module structure
- Function module pattern (not class) — consistent with thermorossiProxy.ts, netatmoProxy.ts, raspiClient.ts
- File: `lib/hue/hueProxy.ts` — reuse existing `lib/hue/` directory (legacy files will be deleted in Phase 109)
- Import haGet from `@/lib/haClient` for all read wrappers
- One exported convenience function per endpoint: getLights, getLight, getGroups, getGroup, getScenes, getHealth, getHistory

### Type organization
- Separate file: `types/hueProxy.ts` — consistent with types/thermorossiProxy.ts
- Types match proxy API response shapes exactly as documented in docs/api/hue.md
- Interfaces: HueLight, HueGroup, HueScene, HueBridgeHealth, HueHistoryItem, HueHistoryResponse
- capability_tier as union type: `"white" | "ambiance" | "color"`
- data_freshness as union type: `"LIVE" | "STALE"` (UNREACHABLE triggers 503, never in body)
- HueHistoryItem.on_state and .reachable are `number | null` (0/1 integers from SQLite, not booleans)

### API route structure
- Rewrite existing route files under `app/api/hue/` to proxy through hueProxy.ts instead of direct Bridge API
- Route mapping:
  - `app/api/hue/status/route.ts` → calls getHealth() (health endpoint)
  - `app/api/hue/lights/route.ts` → calls getLights()
  - `app/api/hue/lights/[id]/route.ts` → calls getLight(id)
  - `app/api/hue/rooms/route.ts` → calls getGroups()
  - `app/api/hue/rooms/[id]/route.ts` → calls getGroup(id)
  - `app/api/hue/scenes/route.ts` → calls getScenes(groupId?)
  - New: `app/api/hue/history/route.ts` → calls getHistory(params)
- Each route: `export const dynamic = 'force-dynamic'`, auth check, try/catch with ApiError handling
- Legacy routes not needed for reads (discover, pair, remote/*, disconnect, test) left untouched — Phase 109 cleanup

### Error handling strategy
- Let haClient mapResponseError handle 503 (SERVICE_UNAVAILABLE), 401 (UNAUTHORIZED), 429 (RATE_LIMITED) automatically
- 404 from proxy (light/group not found) passes through as ApiError with BAD_GATEWAY — routes can catch and re-throw as 404
- No special retry logic for read endpoints (haClient default 15s timeout is sufficient)

### Claude's Discretion
- Exact JSDoc wording on convenience wrappers
- Whether to add query parameter builder utility for history endpoint
- Test file structure and mock patterns

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Hue Proxy API
- `docs/api/hue.md` — Complete Hue proxy API reference: all endpoints, response shapes, TypeScript interfaces, capability_tier values, data_freshness semantics, history auto-granularity, error responses, and Next.js fetch snippets
- `docs/api/README.md` — API authentication patterns (X-API-Key header)

### Established patterns (reference implementations)
- `lib/thermorossiProxy.ts` — Function module pattern to follow (convenience wrappers around haGet/haPost)
- `types/thermorossiProxy.ts` — Type file organization pattern
- `lib/haClient.ts` — Shared transport: haGet<T>/haPost<T> with error mapping
- `types/haClient.ts` — Shared transport types (RFC9457ProblemDetail, HaRequestOptions)

### Existing Hue code (to be rewritten/replaced)
- `lib/hue/hueApi.ts` — Legacy CLIP v2 local client (will be deleted Phase 109, but read for understanding current API surface)
- `lib/hue/hueRemoteApi.ts` — Legacy v1 remote client (will be deleted Phase 109)
- `app/api/hue/lights/route.ts` — Existing lights route to rewrite
- `app/api/hue/rooms/route.ts` — Existing rooms route to rewrite
- `app/api/hue/scenes/route.ts` — Existing scenes route to rewrite
- `app/api/hue/status/route.ts` — Existing status route to rewrite

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/haClient.ts`: haGet<T>/haPost<T> — shared transport for all providers, handles auth, timeouts, RFC 9457 errors
- `lib/core/apiErrors.ts`: ApiError class, ERROR_CODES, HTTP_STATUS — standard error handling
- `lib/hue/colorUtils.ts`: Color conversion utilities — likely reusable, not provider-specific

### Established Patterns
- Function module proxy client: thermorossiProxy.ts exports named functions calling haGet/haPost with typed generics
- Types in `types/` directory: thermorossiProxy.ts has 6 response interfaces matching proxy API shapes exactly
- API routes: `export const dynamic = 'force-dynamic'`, session auth check, try/catch mapping ApiError to NextResponse
- Existing Hue routes: `app/api/hue/lights/route.ts`, `app/api/hue/rooms/route.ts`, etc. — will be rewritten in place

### Integration Points
- `app/api/hue/` directory: 10+ existing route files, most will be rewritten to use hueProxy.ts
- `lib/hue/` directory: existing files (hueApi.ts, hueRemoteApi.ts, etc.) remain until Phase 109 cleanup
- `app/components/devices/lights/hooks/useLightsData.ts`: Frontend hook that calls these routes (Phase 108 rewrites this)
- Device registry and cron health monitoring may need hueProxy.getHealth() — Phase 108+ concern

</code_context>

<specifics>
## Specific Ideas

No specific requirements — follows the exact same pattern as Thermorossi (v13.0 Phase 99) and Netatmo (v10.0 Phase 75) proxy migrations. The proxy API doc (docs/api/hue.md) provides all response shapes with verified TypeScript interfaces.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 106-proxy-client-types-read-endpoints*
*Context gathered: 2026-03-20*
