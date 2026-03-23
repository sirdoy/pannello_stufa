# Phase 119: Rooms Infrastructure - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Proxy client, TypeScript types, and API routes for the Rooms API. The backend exposes 11 endpoints under `/api/v1/rooms` for room CRUD, device association (assign/remove), per-room and whole-house status aggregation, and health statistics. This phase creates the Next.js proxy layer to access them — no UI in this phase.

</domain>

<decisions>
## Implementation Decisions

### Proxy module structure
- **D-01:** Create `lib/rooms/roomsProxy.ts` as a function module — identical pattern to `registryProxy.ts` (named export object with method functions)
- **D-02:** Export as `roomsProxy` object with methods: `getRooms`, `createRoom`, `getRoom`, `updateRoom`, `deleteRoom`, `getRoomDevices`, `assignDevice`, `removeDevice`, `getHealth`, `getHouseStatus`, `getRoomStatus`
- **D-03:** Create `lib/rooms/index.ts` barrel exporting `roomsProxy`
- **D-04:** All methods use `haGet`/`haPost`/`haPut`/`haDelete` from `lib/haClient.ts` — no new transport needed (haDelete already added in Phase 118)

### TypeScript types
- **D-05:** Create `types/rooms.ts` with all interfaces from the API spec: `Room`, `RoomCreate`, `RoomUpdate`, `DeviceAssignment`, `RoomsHealthResponse`, `DeviceStatus`, `RoomStatusResponse`, `HouseStatusResponse`
- **D-06:** Provider-specific status interfaces (`LightStatus`, `SensorStatus`, `ThermostatStatus`, `SpeakerStatus`, `StoveStatus`, `CameraStatus`) also go in `types/rooms.ts` — they are status aggregation types specific to rooms
- **D-07:** `DeviceStatus.data` typed as a union of all provider status interfaces plus `null` — matches API spec exactly
- **D-08:** Types match the API spec exactly (docs/api/rooms.md §TypeScript Interfaces) — no deviation

### API route structure
- **D-09:** 8 route files under `app/api/rooms/`:
  - `route.ts` — GET (list all rooms) + POST (create room)
  - `health/route.ts` — GET (rooms health stats)
  - `house/status/route.ts` — GET (whole-house status)
  - `[room_id]/route.ts` — GET (single room) + PUT (update) + DELETE (delete)
  - `[room_id]/devices/route.ts` — GET (list room devices) + POST (assign device)
  - `[room_id]/devices/[device_registry_id]/route.ts` — DELETE (remove device from room)
  - `[room_id]/status/route.ts` — GET (room status)
- **D-10:** Auth follows same pattern as Rooms API spec: read endpoints (GET) use `withErrorHandler` (public); write endpoints (POST/PUT/DELETE) use `withAuthAndErrorHandler`
- **D-11:** DELETE responses return `noContent()` (204) — same as registry pattern
- **D-12:** POST /rooms/ returns `created()` (201) — same as registry pattern
- **D-13:** Dynamic params extracted via `const params = await context.params` then `params['room_id']` — matches Next.js 15.5 async params pattern from Phase 118

### Claude's Discretion
- JSDoc comment style for proxy functions
- Import alias organization
- Test file structure (if tests are included in this phase)

</decisions>

<specifics>
## Specific Ideas

- Follow the `registryProxy.ts` pattern exactly — thin wrappers, no response transformation, types imported from `types/` directory
- The `success(data as unknown as Record<string, unknown>)` double assertion pattern used in Phase 118 routes
- `export const dynamic = 'force-dynamic'` on all routes
- `house/status` and `health` are static paths — must be separate route files to avoid collision with `[room_id]` dynamic segment (Next.js resolves static before dynamic automatically)

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Rooms API contract
- `docs/api/rooms.md` — All 11 endpoints, request/response shapes, error codes, TypeScript interfaces
- `docs/api/common.md` §TypeScript Interfaces — `PaginatedResponse<T>` generic (not used by rooms, but available if needed)

### Existing patterns to follow (Phase 118 implementation)
- `lib/registry/registryProxy.ts` — Function module proxy pattern to replicate exactly
- `lib/registry/index.ts` — Barrel export pattern
- `types/registry.ts` — Type definition file pattern
- `app/api/registry/types/route.ts` — Route handler with withErrorHandler (public GET) + withAuthAndErrorHandler (protected POST)
- `app/api/registry/devices/[device_id]/route.ts` — Dynamic param extraction + PUT/DELETE pattern

### Transport layer
- `lib/haClient.ts` — haGet/haPost/haPut/haDelete transport (all 4 already available)

### Error handling
- `lib/core/apiResponse.ts` — success(), created(), noContent() response helpers
- `lib/core/apiErrors.ts` — ApiError class, ERROR_CODES, HTTP_STATUS constants

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `haGet<T>`, `haPost<T>`, `haPut<T>`, `haDelete` from `lib/haClient.ts` — all 4 transports ready
- `withErrorHandler`, `withAuthAndErrorHandler` from `lib/core` — route protection + error mapping
- `success()`, `created()`, `noContent()` from `lib/core` — standard JSON response wrappers
- `RegistryDevice` from `types/registry.ts` — rooms GET /rooms/{id}/devices returns the same shape

### Established Patterns
- Function module proxy: object export with named methods (`registryProxy` pattern)
- Types in dedicated `types/*.ts` files, imported by proxy modules
- Route files: `export const dynamic = 'force-dynamic'` + handler wrapper
- Double assertion for success(): `success(data as unknown as Record<string, unknown>)`
- Dynamic params: `const params = await context.params; const id = params['key'] ?? '';`
- 204 responses: `await proxy.deleteX(id); return noContent();`
- 201 responses: `return created(data as unknown as Record<string, unknown>);`

### Integration Points
- `lib/rooms/` — new directory for proxy module
- `types/rooms.ts` — new types file
- `app/api/rooms/` — new route directory with 8 files
- `RegistryDevice` type from `types/registry.ts` will be reused for room device listing (GET /rooms/{id}/devices returns registry device rows)

</code_context>

<deferred>
## Deferred Ideas

- Room Management UI (create/edit/delete rooms) — Phase 122
- Room Device Assignment UI — Phase 123
- Room Status Views (per-room + whole-house) — Phase 124

</deferred>

---

*Phase: 119-rooms-infrastructure*
*Context gathered: 2026-03-23*
