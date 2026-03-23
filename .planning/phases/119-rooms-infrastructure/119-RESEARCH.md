# Phase 119: Rooms Infrastructure - Research

**Researched:** 2026-03-23
**Domain:** Next.js proxy layer for Rooms REST API — TypeScript types, proxy module, API route handlers
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Proxy module structure**
- D-01: Create `lib/rooms/roomsProxy.ts` as a function module — identical pattern to `registryProxy.ts` (named export object with method functions)
- D-02: Export as `roomsProxy` object with methods: `getRooms`, `createRoom`, `getRoom`, `updateRoom`, `deleteRoom`, `getRoomDevices`, `assignDevice`, `removeDevice`, `getHealth`, `getHouseStatus`, `getRoomStatus`
- D-03: Create `lib/rooms/index.ts` barrel exporting `roomsProxy`
- D-04: All methods use `haGet`/`haPost`/`haPut`/`haDelete` from `lib/haClient.ts` — no new transport needed (haDelete already added in Phase 118)

**TypeScript types**
- D-05: Create `types/rooms.ts` with all interfaces from the API spec: `Room`, `RoomCreate`, `RoomUpdate`, `DeviceAssignment`, `RoomsHealthResponse`, `DeviceStatus`, `RoomStatusResponse`, `HouseStatusResponse`
- D-06: Provider-specific status interfaces (`LightStatus`, `SensorStatus`, `ThermostatStatus`, `SpeakerStatus`, `StoveStatus`, `CameraStatus`) also go in `types/rooms.ts`
- D-07: `DeviceStatus.data` typed as a union of all provider status interfaces plus `null`
- D-08: Types match the API spec exactly (docs/api/rooms.md §TypeScript Interfaces) — no deviation

**API route structure**
- D-09: 8 route files under `app/api/rooms/`:
  - `route.ts` — GET (list all rooms) + POST (create room)
  - `health/route.ts` — GET (rooms health stats)
  - `house/status/route.ts` — GET (whole-house status)
  - `[room_id]/route.ts` — GET (single room) + PUT (update) + DELETE (delete)
  - `[room_id]/devices/route.ts` — GET (list room devices) + POST (assign device)
  - `[room_id]/devices/[device_registry_id]/route.ts` — DELETE (remove device from room)
  - `[room_id]/status/route.ts` — GET (room status)
- D-10: Auth follows API spec: read endpoints (GET) use `withErrorHandler` (public); write endpoints (POST/PUT/DELETE) use `withAuthAndErrorHandler`
- D-11: DELETE responses return `noContent()` (204)
- D-12: POST /rooms/ returns `created()` (201)
- D-13: Dynamic params extracted via `const params = await context.params` then `params['room_id']` — Next.js 15.5 async params pattern from Phase 118

### Claude's Discretion
- JSDoc comment style for proxy functions
- Import alias organization
- Test file structure (if tests are included in this phase)

### Deferred Ideas (OUT OF SCOPE)
- Room Management UI (create/edit/delete rooms) — Phase 122
- Room Device Assignment UI — Phase 123
- Room Status Views (per-room + whole-house) — Phase 124
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INFRA-03 | Proxy client per Rooms API con haGet/haPost/haPut/haDelete transport | `lib/rooms/roomsProxy.ts` — 11 method function module mirroring `registryProxy.ts` |
| INFRA-04 | TypeScript types per tutte le interfacce Rooms (Room, DeviceAssignment, RoomStatus, HouseStatus, RoomsHealth) | `types/rooms.ts` — verbatim interfaces from docs/api/rooms.md §TypeScript Interfaces |
| INFRA-06 | Next.js API routes per Rooms (11 endpoint proxy) | 8 route files under `app/api/rooms/` covering all 11 HTTP method+path combinations |
</phase_requirements>

---

## Summary

Phase 119 creates the Next.js proxy layer for the Rooms API. The deliverables are three artefacts: a types file, a proxy module, and a set of API route handlers. All three follow the exact patterns established in Phase 118 (registry infrastructure) — there is nothing new to invent.

The Rooms API has 11 endpoints across 4 concern areas: room CRUD (5 endpoints), device association (3 endpoints), status aggregation (2 endpoints), and health stats (1 endpoint). Two paths — `/rooms/health` and `/rooms/house/status` — are static and must live in their own route files to avoid collision with the `[room_id]` dynamic segment. Next.js resolves static segments before dynamic ones automatically, so no special configuration is needed.

The only structurally interesting aspect of the Rooms API compared to the Registry API is the nested dynamic route: `[room_id]/devices/[device_registry_id]/route.ts` requires two params extracted from `context.params`. The `assignDevice` POST returns 200 (not 201) with a `DeviceAssignment` object — this differs from the room `createRoom` POST which returns 201. Both patterns are already present in the project.

**Primary recommendation:** Copy the `registryProxy.ts` shape exactly, substitute Rooms endpoints and types, and produce 8 route files that follow the same import/export/handler patterns as the 5 registry route files already in the codebase.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `lib/haClient.ts` | project-local | HTTP transport (haGet/haPost/haPut/haDelete) | Shared by all 5 device providers; all 4 verbs already implemented |
| `lib/core` | project-local | withErrorHandler, withAuthAndErrorHandler, success, created, noContent | Established API route wrapper pattern |
| Next.js App Router | 15.5 | Route handlers | Project framework — async params pattern confirmed via Phase 118 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `types/registry.ts` | project-local | `RegistryDevice` type reuse | `GET /rooms/{id}/devices` returns registry device rows — import `RegistryDevice` rather than redefining |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Project Structure

```
lib/rooms/
├── roomsProxy.ts       # Function module proxy — 11 named async functions
└── index.ts            # Barrel: export { roomsProxy } from './roomsProxy'

types/
└── rooms.ts            # All interfaces from docs/api/rooms.md §TypeScript Interfaces

app/api/rooms/
├── route.ts                                    # GET list + POST create
├── health/
│   └── route.ts                               # GET health stats (static path)
├── house/
│   └── status/
│       └── route.ts                           # GET house status (static path)
├── [room_id]/
│   ├── route.ts                               # GET single + PUT update + DELETE delete
│   ├── devices/
│   │   ├── route.ts                           # GET list devices + POST assign
│   │   └── [device_registry_id]/
│   │       └── route.ts                       # DELETE remove device from room
│   └── status/
│       └── route.ts                           # GET room status
```

### Pattern 1: Function Module Proxy

Identical shape to `registryProxy.ts`. Each function is a standalone `async function`, all collected into a single named export object at the bottom of the file.

```typescript
// Source: lib/registry/registryProxy.ts (verified in codebase)
import { haGet, haPost, haPut, haDelete } from '@/lib/haClient';
import type { Room, RoomCreate, RoomUpdate, DeviceAssignment, RoomsHealthResponse, RoomStatusResponse, HouseStatusResponse } from '@/types/rooms';
import type { RegistryDevice } from '@/types/registry';

async function getRooms(): Promise<Room[]> {
  return haGet<Room[]>('/api/v1/rooms/');
}

async function createRoom(body: RoomCreate): Promise<Room> {
  return haPost<Room>('/api/v1/rooms/', body as unknown as Record<string, unknown>);
}

async function getRoom(roomId: number): Promise<Room> {
  return haGet<Room>(`/api/v1/rooms/${roomId}`);
}

async function updateRoom(roomId: number, body: RoomUpdate): Promise<Room> {
  return haPut<Room>(`/api/v1/rooms/${roomId}`, body as unknown as Record<string, unknown>);
}

async function deleteRoom(roomId: number): Promise<void> {
  return haDelete(`/api/v1/rooms/${roomId}`);
}

async function getRoomDevices(roomId: number): Promise<RegistryDevice[]> {
  return haGet<RegistryDevice[]>(`/api/v1/rooms/${roomId}/devices`);
}

async function assignDevice(roomId: number, body: { device_registry_id: number }): Promise<DeviceAssignment> {
  return haPost<DeviceAssignment>(`/api/v1/rooms/${roomId}/devices`, body as unknown as Record<string, unknown>);
}

async function removeDevice(roomId: number, deviceRegistryId: number): Promise<void> {
  return haDelete(`/api/v1/rooms/${roomId}/devices/${deviceRegistryId}`);
}

async function getHealth(): Promise<RoomsHealthResponse> {
  return haGet<RoomsHealthResponse>('/api/v1/rooms/health');
}

async function getHouseStatus(): Promise<HouseStatusResponse> {
  return haGet<HouseStatusResponse>('/api/v1/rooms/house/status');
}

async function getRoomStatus(roomId: number): Promise<RoomStatusResponse> {
  return haGet<RoomStatusResponse>(`/api/v1/rooms/${roomId}/status`);
}

export const roomsProxy = {
  getRooms, createRoom, getRoom, updateRoom, deleteRoom,
  getRoomDevices, assignDevice, removeDevice,
  getHealth, getHouseStatus, getRoomStatus,
};
```

### Pattern 2: Route Handler — Public GET + Authenticated POST

```typescript
// Source: app/api/registry/types/route.ts (verified in codebase)
import { withErrorHandler, withAuthAndErrorHandler, success, created } from '@/lib/core';
import { roomsProxy } from '@/lib/rooms';
import type { RoomCreate } from '@/types/rooms';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandler(async () => {
  const data = await roomsProxy.getRooms();
  return success(data as unknown as Record<string, unknown>);
}, 'Rooms');

export const POST = withAuthAndErrorHandler(async (request) => {
  const body = (await request.json()) as RoomCreate;
  const data = await roomsProxy.createRoom(body);
  return created(data as unknown as Record<string, unknown>);
}, 'Rooms/Create');
```

### Pattern 3: Route Handler — Dynamic Params (single segment)

```typescript
// Source: app/api/registry/devices/[device_id]/route.ts (verified in codebase)
export const GET = withErrorHandler(async (_request, context) => {
  const params = await context.params;
  const room_id = params['room_id'] ?? '';
  const data = await roomsProxy.getRoom(Number(room_id));
  return success(data as unknown as Record<string, unknown>);
}, 'Rooms/Get');

export const PUT = withAuthAndErrorHandler(async (request, context) => {
  const params = await context.params;
  const room_id = params['room_id'] ?? '';
  const body = (await request.json()) as RoomUpdate;
  const data = await roomsProxy.updateRoom(Number(room_id), body);
  return success(data as unknown as Record<string, unknown>);
}, 'Rooms/Update');

export const DELETE = withAuthAndErrorHandler(async (_request, context) => {
  const params = await context.params;
  const room_id = params['room_id'] ?? '';
  await roomsProxy.deleteRoom(Number(room_id));
  return noContent();
}, 'Rooms/Delete');
```

### Pattern 4: Route Handler — Nested Dynamic Params (two segments)

This is new relative to Phase 118. `[room_id]/devices/[device_registry_id]/route.ts` has two dynamic segments — both are available in `context.params`.

```typescript
// Derived from Next.js 15 async params pattern (verified via Phase 118 registry pattern)
export const DELETE = withAuthAndErrorHandler(async (_request, context) => {
  const params = await context.params;
  const room_id = params['room_id'] ?? '';
  const device_registry_id = params['device_registry_id'] ?? '';
  await roomsProxy.removeDevice(Number(room_id), Number(device_registry_id));
  return noContent();
}, 'Rooms/Devices/Remove');
```

### Pattern 5: assignDevice returns 200, not 201

POST `/rooms/{room_id}/devices` returns 200 (not 201). The API spec response for this endpoint is `{ device_registry_id, room_id, previous_room_id, assigned_at }` — it is an operation result, not a resource creation. Use `success()` not `created()`.

```typescript
export const POST = withAuthAndErrorHandler(async (request, context) => {
  const params = await context.params;
  const room_id = params['room_id'] ?? '';
  const body = (await request.json()) as { device_registry_id: number };
  const data = await roomsProxy.assignDevice(Number(room_id), body);
  return success(data as unknown as Record<string, unknown>);
}, 'Rooms/Devices/Assign');
```

### Anti-Patterns to Avoid
- **Skipping `export const dynamic = 'force-dynamic'`:** Every route file needs this — identical to all existing API routes.
- **Using `created()` for assignDevice:** The API spec returns 200 for device assignment (operation result), not 201 (resource created). Only `POST /rooms/` returns 201.
- **Redefining RegistryDevice:** `GET /rooms/{id}/devices` returns the same shape as the registry devices list. Import `RegistryDevice` from `@/types/registry` instead of creating a duplicate interface.
- **Omitting `house/` nesting:** The static path is `/rooms/house/status`, not `/rooms/houseStatus`. The Next.js file must be at `app/api/rooms/house/status/route.ts` to match.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP transport with X-API-Key auth | Custom fetch wrappers | `haGet`/`haPost`/`haPut`/`haDelete` | Already handles timeout, error mapping, RFC 9457, all 4 verbs |
| Route auth enforcement | Custom session checks | `withAuthAndErrorHandler` | Handles Auth0 session, returns 401 on missing auth |
| Error-to-response mapping | try/catch in each handler | `withErrorHandler` | Catches ApiError, maps to correct HTTP status |
| JSON response shaping | Manual NextResponse.json | `success()`, `created()`, `noContent()` | Consistent `{ success: true, ... }` envelope |

**Key insight:** The entire transport and response layer is reusable infrastructure. A Phase 119 route file is 10-20 lines total.

---

## Common Pitfalls

### Pitfall 1: Static paths must be file-system siblings of the dynamic segment
**What goes wrong:** Developer creates only `[room_id]/route.ts` and tries to add `health` as a query param or sub-path inside it. Next.js never routes `/api/rooms/health` to `[room_id]` — it routes to a dedicated `health/route.ts` file.
**Why it happens:** In FastAPI, static paths are declared first in code; in Next.js App Router, static segments win over dynamic ones automatically by file structure.
**How to avoid:** Create `app/api/rooms/health/route.ts` and `app/api/rooms/house/status/route.ts` as explicit files — confirmed pattern from registry (`health/route.ts` is a sibling of `devices/` and `types/`).
**Warning signs:** `/api/rooms/health` returning 404 or routing to the room-by-id handler.

### Pitfall 2: Both params must be awaited from the same context.params object
**What goes wrong:** Developer tries `context.params['room_id']` and `context.params['device_registry_id']` with separate awaits, or uses destructuring before awaiting.
**Why it happens:** Next.js 15 made `params` a Promise — the whole object must be awaited once, then all keys accessed.
**How to avoid:** `const params = await context.params;` then `params['room_id']` and `params['device_registry_id']` — both from the same resolved object.
**Warning signs:** TypeScript error "Property 'room_id' does not exist on type Promise".

### Pitfall 3: assignDevice 200 vs createRoom 201
**What goes wrong:** Using `created()` (201) for the device assignment POST because it is a POST endpoint.
**Why it happens:** Convention says POST creates → 201. But `POST /rooms/{id}/devices` is an "assign" operation that returns a join record, and the backend explicitly returns 200.
**How to avoid:** Check API spec response code table. `POST /rooms/` → 201 (`created()`). `POST /rooms/{id}/devices` → 200 (`success()`).
**Warning signs:** Integration test expecting 200 gets 201.

### Pitfall 4: Number() coercion for string params
**What goes wrong:** Passing `room_id` as a string directly to proxy methods typed as `number`.
**Why it happens:** `context.params` values are always strings in Next.js.
**How to avoid:** `Number(params['room_id'] ?? '')` — same pattern used in `registry/devices/[device_id]/route.ts`.
**Warning signs:** TypeScript error "Argument of type string is not assignable to parameter of type number".

---

## Code Examples

### types/rooms.ts — complete interface list

```typescript
// Source: docs/api/rooms.md §TypeScript Interfaces (verbatim)

export interface Room {
  id: number;
  name: string;
  description: string | null;
  created_at: number;        // Unix timestamp
  updated_at: number;        // Unix timestamp
  device_count?: number;     // Present in list response only
}

export interface RoomCreate {
  name: string;              // 1–100 chars
  description?: string | null; // Max 500 chars
}

export interface RoomUpdate {
  name: string;              // 1–100 chars
  description?: string | null; // Max 500 chars
}

export interface DeviceAssignment {
  device_registry_id: number;
  room_id: number;
  previous_room_id: number | null;
  assigned_at: number;       // Unix timestamp
}

export interface RoomsHealthResponse {
  room_count: number;
  total_device_count: number;
  orphan_device_count: number;
}

export interface LightStatus {
  status: 'available';
  on: boolean;
  brightness: number | null;
  reachable: boolean;
}

export interface SensorStatus {
  status: 'available';
  temperature: number | null;
  humidity: number | null;
  battery_percentage: number | null;
  is_reachable: boolean;
}

export interface ThermostatStatus {
  status: 'available';
  setpoint_temp: number | null;
  measured_temp: number | null;
  heating: boolean | null;
}

export interface SpeakerStatus {
  status: 'available';
  playing: boolean;
  volume: number | null;
  group_name: string | null;
}

export interface StoveStatus {
  status: 'available';
  active: boolean;
  temperature: number | null;
  power_level: number | null;
}

export interface CameraStatus {
  status: 'available';
  vpn_url: string | null;
  is_reachable: boolean;
}

export interface DeviceStatus {
  device_registry_id: number;
  custom_name: string;
  provider_name: string;
  device_type: string;
  status: 'available' | 'unavailable';
  data: LightStatus | SensorStatus | ThermostatStatus | SpeakerStatus | StoveStatus | CameraStatus | null;
}

export interface RoomStatusResponse {
  room_id: number;
  room_name: string;
  devices: DeviceStatus[];
  device_count: number;
  available_count: number;
  unavailable_count: number;
}

export interface HouseStatusResponse {
  rooms: RoomStatusResponse[];
  total_devices: number;
  total_available: number;
  total_unavailable: number;
}
```

### Endpoint-to-handler mapping (all 11 endpoints across 8 route files)

| File | Exported handlers | Proxy call | Auth | Response |
|------|------------------|------------|------|----------|
| `route.ts` | GET, POST | `getRooms()`, `createRoom(body)` | GET: public, POST: auth | GET: `success()`, POST: `created()` |
| `health/route.ts` | GET | `getHealth()` | public | `success()` |
| `house/status/route.ts` | GET | `getHouseStatus()` | public | `success()` |
| `[room_id]/route.ts` | GET, PUT, DELETE | `getRoom(id)`, `updateRoom(id, body)`, `deleteRoom(id)` | GET: public, PUT/DELETE: auth | GET/PUT: `success()`, DELETE: `noContent()` |
| `[room_id]/devices/route.ts` | GET, POST | `getRoomDevices(id)`, `assignDevice(id, body)` | GET: public, POST: auth | `success()` for both |
| `[room_id]/devices/[device_registry_id]/route.ts` | DELETE | `removeDevice(roomId, deviceId)` | auth | `noContent()` |
| `[room_id]/status/route.ts` | GET | `getRoomStatus(id)` | public | `success()` |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (project-wide) |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern="rooms"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-03 | roomsProxy methods call correct haGet/haPost/haPut/haDelete endpoints | unit | `npm test -- --testPathPattern="roomsProxy"` | Wave 0 |
| INFRA-04 | TypeScript interfaces compile without errors (tsc check) | compile | `npx tsc --noEmit` | Wave 0 (no separate test file needed — tsc validates) |
| INFRA-06 | Each route handler returns correct status code and delegates to roomsProxy | unit | `npm test -- --testPathPattern="app/api/rooms"` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="rooms" --passWithNoTests`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `lib/rooms/__tests__/roomsProxy.test.ts` — covers INFRA-03: verifies each proxy method calls the correct endpoint path with correct HTTP verb
- [ ] `app/api/rooms/__tests__/route.test.ts` — covers INFRA-06: GET list + POST create handlers
- [ ] `app/api/rooms/[room_id]/__tests__/route.test.ts` — covers INFRA-06: GET/PUT/DELETE single room
- [ ] `app/api/rooms/[room_id]/devices/__tests__/route.test.ts` — covers INFRA-06: GET devices + POST assign
- [ ] `app/api/rooms/[room_id]/devices/[device_registry_id]/__tests__/route.test.ts` — covers INFRA-06: DELETE remove device

Note: `health/route.ts`, `house/status/route.ts`, and `[room_id]/status/route.ts` are all simple pass-through GET handlers — they can be covered by the existing pattern tests or light additional test files. The five files above are the minimum required.

---

## Sources

### Primary (HIGH confidence)
- `docs/api/rooms.md` — full endpoint contract, all 11 endpoints, request/response shapes, TypeScript interfaces verbatim
- `lib/registry/registryProxy.ts` — function module proxy pattern to replicate exactly
- `app/api/registry/` (5 route files) — handler wrapper patterns, param extraction, response helpers
- `lib/haClient.ts` — all 4 transport verbs confirmed present (haGet, haPost, haPut, haDelete)
- `lib/core/apiResponse.ts` — success(), created(), noContent() signatures confirmed
- `types/registry.ts` — RegistryDevice interface confirmed for reuse in getRoomDevices return type

### Secondary (MEDIUM confidence)
- Next.js App Router docs (via project codebase evidence) — async params pattern, static-before-dynamic segment resolution

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all transport/helpers verified in codebase
- Architecture: HIGH — exact file paths and handler shapes confirmed from Phase 118 implementation
- Pitfalls: HIGH — derived from API spec differences and Next.js patterns verified in codebase
- TypeScript interfaces: HIGH — copied verbatim from docs/api/rooms.md

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable — no external dependencies)
