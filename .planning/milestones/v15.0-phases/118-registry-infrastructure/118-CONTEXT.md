# Phase 118: Registry Infrastructure - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Proxy client, TypeScript types, and API routes for the Device Registry API. The backend exposes 8 endpoints under `/api/v1/registry` for managing device types (taxonomy) and registered devices (CRUD + pagination). This phase creates the Next.js proxy layer to access them — no UI in this phase.

</domain>

<decisions>
## Implementation Decisions

### haDelete transport
- **D-01:** Add `haDelete` function to `lib/haClient.ts` — identical pattern to `haPut` but with `method: 'DELETE'` and no request body
- **D-02:** `haDelete` returns `void` for 204 responses — check `response.status === 204` before attempting `response.json()`
- **D-03:** Export from haClient alongside existing `haGet`, `haPost`, `haPut` — Phase 119 (Rooms) will also need it

### Proxy module structure
- **D-04:** Create `lib/registry/registryProxy.ts` as a function module following `raspiClient.ts` pattern (named export object with method functions)
- **D-05:** Export as `registryProxy` object with methods: `getTypes`, `createType`, `deleteType`, `getDevices`, `registerDevice`, `updateDevice`, `unregisterDevice`, `getHealth`
- **D-06:** Pagination params (`limit`, `offset`, `provider_name`) forwarded as query string — build URL with `URLSearchParams`

### TypeScript types
- **D-07:** Create `types/registry.ts` with all interfaces from the API spec: `DeviceType`, `DeviceTypeCreate`, `RegistryDevice`, `DeviceCreate`, `DeviceUpdate`, `RegistryHealthResponse`
- **D-08:** `PaginatedResponse<T>` generic goes in `types/common.ts` — shared across registry and future rooms/automations modules
- **D-09:** Types match the API spec exactly (docs/api/registry.md §TypeScript Interfaces) — no deviation

### API route structure
- **D-10:** 5 route files under `app/api/registry/`:
  - `types/route.ts` — GET (list) + POST (create)
  - `types/[slug]/route.ts` — DELETE
  - `devices/route.ts` — GET (list, paginated) + POST (register)
  - `devices/[device_id]/route.ts` — PUT (update) + DELETE (unregister)
  - `health/route.ts` — GET
- **D-11:** All routes use `withAuthAndErrorHandler` wrapper with descriptive label (e.g. `'Registry/Types'`)
- **D-12:** GET /types and GET /health are public (no auth) — use `withErrorHandler` instead of `withAuthAndErrorHandler`
- **D-13:** Query params for GET /devices extracted from `request.nextUrl.searchParams` and forwarded to proxy

### Claude's Discretion
- JSDoc comment style for proxy functions
- Import alias organization
- Test file structure (if tests are included in this phase)

</decisions>

<specifics>
## Specific Ideas

- Follow the `raspiClient.ts` pattern exactly — thin wrappers, no response transformation, types imported from `types/` directory
- The `success(data as unknown as Record<string, unknown>)` double assertion pattern used in existing routes (see `app/api/raspi/health/route.ts`)
- `export const dynamic = 'force-dynamic'` on all routes

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Device Registry API contract
- `docs/api/registry.md` — All 8 endpoints, request/response shapes, error codes, TypeScript interfaces
- `docs/api/common.md` §TypeScript Interfaces — `PaginatedResponse<T>` generic interface definition

### Existing patterns to follow
- `lib/haClient.ts` — Shared transport (haGet/haPost/haPut) — add haDelete here
- `lib/raspi/raspiClient.ts` — Function module proxy pattern (thin wrappers, typed returns)
- `types/raspi.ts` — Type definition file pattern
- `app/api/raspi/health/route.ts` — Route handler pattern with withAuthAndErrorHandler

### Error handling
- `lib/core/apiErrors.ts` — ApiError class, ERROR_CODES, HTTP_STATUS constants
- `types/haClient.ts` — RFC9457ProblemDetail, HaRequestOptions types

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `haGet<T>`, `haPost<T>`, `haPut<T>` from `lib/haClient.ts` — direct transport for all proxy calls
- `withAuthAndErrorHandler` from `lib/core` — route protection + error mapping
- `success()` from `lib/core` — standard JSON response wrapper
- `ApiError`, `ERROR_CODES` — standard error handling chain

### Established Patterns
- Function module proxy: object export with named methods (raspiClient, hueProxy, thermorossiProxy)
- Types in dedicated `types/*.ts` files, imported by proxy modules
- Route files: `export const dynamic = 'force-dynamic'` + `withAuthAndErrorHandler` wrapper
- Double assertion for success(): `success(data as unknown as Record<string, unknown>)`

### Integration Points
- `lib/haClient.ts` needs `haDelete` added (new transport method for DELETE endpoints)
- `types/common.ts` is a new shared types file (PaginatedResponse<T> used by registry + rooms + common devices endpoint)
- Routes mount under `app/api/registry/` — new directory

</code_context>

<deferred>
## Deferred Ideas

- Rooms proxy + routes — Phase 119
- Device Types UI — Phase 120
- Device Registry UI (CRUD) — Phase 121

</deferred>

---

*Phase: 118-registry-infrastructure*
*Context gathered: 2026-03-22*
