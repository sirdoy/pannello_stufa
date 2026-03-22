# Phase 118: Registry Infrastructure - Research

**Researched:** 2026-03-22
**Domain:** Next.js proxy layer for Device Registry API — haClient transport extension, typed proxy module, API route files
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**haDelete transport:**
- D-01: Add `haDelete` function to `lib/haClient.ts` — identical pattern to `haPut` but with `method: 'DELETE'` and no request body
- D-02: `haDelete` returns `void` for 204 responses — check `response.status === 204` before attempting `response.json()`
- D-03: Export from haClient alongside existing `haGet`, `haPost`, `haPut` — Phase 119 (Rooms) will also need it

**Proxy module structure:**
- D-04: Create `lib/registry/registryProxy.ts` as a function module following `raspiClient.ts` pattern (named export object with method functions)
- D-05: Export as `registryProxy` object with methods: `getTypes`, `createType`, `deleteType`, `getDevices`, `registerDevice`, `updateDevice`, `unregisterDevice`, `getHealth`
- D-06: Pagination params (`limit`, `offset`, `provider_name`) forwarded as query string — build URL with `URLSearchParams`

**TypeScript types:**
- D-07: Create `types/registry.ts` with all interfaces from the API spec: `DeviceType`, `DeviceTypeCreate`, `RegistryDevice`, `DeviceCreate`, `DeviceUpdate`, `RegistryHealthResponse`
- D-08: `PaginatedResponse<T>` generic goes in `types/common.ts` — shared across registry and future rooms/automations modules
- D-09: Types match the API spec exactly (docs/api/registry.md §TypeScript Interfaces) — no deviation

**API route structure:**
- D-10: 5 route files under `app/api/registry/`:
  - `types/route.ts` — GET (list) + POST (create)
  - `types/[slug]/route.ts` — DELETE
  - `devices/route.ts` — GET (list, paginated) + POST (register)
  - `devices/[device_id]/route.ts` — PUT (update) + DELETE (unregister)
  - `health/route.ts` — GET
- D-11: All routes use `withAuthAndErrorHandler` wrapper with descriptive label (e.g. `'Registry/Types'`)
- D-12: GET /types and GET /health are public (no auth) — use `withErrorHandler` instead of `withAuthAndErrorHandler`
- D-13: Query params for GET /devices extracted from `request.nextUrl.searchParams` and forwarded to proxy

### Claude's Discretion
- JSDoc comment style for proxy functions
- Import alias organization
- Test file structure (if tests are included in this phase)

### Deferred Ideas (OUT OF SCOPE)
- Rooms proxy + routes — Phase 119
- Device Types UI — Phase 120
- Device Registry UI (CRUD) — Phase 121
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INFRA-01 | Proxy client per Device Registry API con haGet/haPost transport | registryProxy.ts function module pattern documented below; haDelete needs adding to haClient.ts |
| INFRA-02 | TypeScript types per tutte le interfacce Device Registry (DeviceType, RegistryDevice, RegistryHealth) | Full interface list from docs/api/registry.md + PaginatedResponse<T> from docs/api/common.md |
| INFRA-05 | Next.js API routes per Device Registry (8 endpoint proxy) | 5 route files covering all 8 endpoints documented below; withAuthAndErrorHandler / withErrorHandler patterns confirmed |
</phase_requirements>

---

## Summary

Phase 118 adds the Device Registry proxy layer to the Next.js application. The work is entirely mechanical: extend haClient.ts with a `haDelete` transport method, create typed interfaces matching the API contract, write a thin proxy module following the raspiClient pattern, and mount 5 route files that cover all 8 endpoints.

All patterns are already established in the codebase and fully verified by reading the actual source files. There are no novel decisions to make — every implementation choice is locked in CONTEXT.md and has a direct precedent in raspiClient.ts / hueProxy.ts / thermorossiProxy.ts. The highest-risk item is `haDelete` returning `void` for 204 responses: the existing transports always call `response.json()`, so the new transport must guard with `if (response.status === 204) return;` before parsing.

Two new files have no precedent: `types/common.ts` (new shared types file) and `lib/registry/index.ts` (barrel export). Both are trivial. The `types/common.ts` file is intentionally minimal — only `PaginatedResponse<T>` in this phase.

**Primary recommendation:** Follow raspiClient.ts exactly for the proxy module; follow app/api/raspi/health/route.ts exactly for route files; haDelete mirrors haPut minus the body.

---

## Standard Stack

### Core (already installed — no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 15.5 | Route handlers under `app/api/registry/` | Project standard |
| TypeScript strict + noUncheckedIndexedAccess | project tsconfig | Zero `as any` requirement | Project v14.1 decision |

### Reused Internal Modules

| Module | Path | Purpose |
|--------|------|---------|
| haGet / haPost / haPut | `lib/haClient.ts` | Transport — already used by all 5 providers |
| haDelete (NEW) | `lib/haClient.ts` | DELETE transport for types/{slug} and devices/{device_id} |
| withAuthAndErrorHandler | `lib/core/middleware.ts` | Protected route wrapper |
| withErrorHandler | `lib/core/middleware.ts` | Public route wrapper (no auth check) |
| success / noContent | `lib/core/apiResponse.ts` | Response helpers |
| ApiError / ERROR_CODES / HTTP_STATUS | `lib/core/apiErrors.ts` | Error handling |

**No new npm packages required.**

---

## Architecture Patterns

### Recommended Project Structure (new files only)

```
lib/
└── registry/
    ├── registryProxy.ts     # Function module proxy (D-04, D-05)
    └── index.ts             # Barrel export: export { registryProxy } from './registryProxy'

types/
├── common.ts                # NEW — PaginatedResponse<T> (D-08)
└── registry.ts              # NEW — DeviceType, RegistryDevice, etc. (D-07)

app/api/registry/
├── types/
│   ├── route.ts             # GET + POST /registry/types (D-10)
│   └── [slug]/
│       └── route.ts         # DELETE /registry/types/{slug} (D-10)
├── devices/
│   ├── route.ts             # GET + POST /registry/devices (D-10)
│   └── [device_id]/
│       └── route.ts         # PUT + DELETE /registry/devices/{device_id} (D-10)
└── health/
    └── route.ts             # GET /registry/health (D-10)
```

### Pattern 1: haDelete transport (NEW addition to lib/haClient.ts)

haGet and haPut are the exact templates. haDelete differs in two ways: no `body` parameter, and must check `response.status === 204` before calling `response.json()`.

```typescript
// Source: lib/haClient.ts (existing haPut as template)
export async function haDelete(
  endpoint: string,
  options: HaRequestOptions = {}
): Promise<void> {
  const { baseUrl, apiKey } = getEnvConfig();
  const { timeout = DEFAULT_TIMEOUT_MS } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: { 'X-API-Key': apiKey },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return await mapResponseError(response);
    }

    // 204 No Content — no JSON body to parse
    // (mapResponseError already handles non-ok, so reaching here means success)
  } catch (error) {
    clearTimeout(timeoutId);
    return mapCaughtError(error);
  }
}
```

**Key difference from haPut:** no `Content-Type` header, no `body`, no `response.json()` call. The 204 success path simply returns `undefined` (implicit void return).

### Pattern 2: registryProxy.ts function module

Exact mirror of `lib/raspi/raspiClient.ts`. Named functions, exported as an object. Uses `URLSearchParams` for pagination on `getDevices`.

```typescript
// Source: lib/raspi/raspiClient.ts pattern
import { haGet, haPost, haPut, haDelete } from '@/lib/haClient';
import type { PaginatedResponse } from '@/types/common';
import type {
  DeviceType, DeviceTypeCreate,
  RegistryDevice, DeviceCreate, DeviceUpdate,
  RegistryHealthResponse,
} from '@/types/registry';

async function getTypes(): Promise<DeviceType[]> {
  return haGet<DeviceType[]>('/api/v1/registry/types');
}

async function createType(body: DeviceTypeCreate): Promise<DeviceType> {
  return haPost<DeviceType>('/api/v1/registry/types', body as Record<string, unknown>);
}

async function deleteType(slug: string): Promise<void> {
  return haDelete(`/api/v1/registry/types/${slug}`);
}

async function getDevices(params?: {
  limit?: number;
  offset?: number;
  provider_name?: string;
}): Promise<PaginatedResponse<RegistryDevice>> {
  const qs = new URLSearchParams();
  if (params?.limit !== undefined) qs.set('limit', String(params.limit));
  if (params?.offset !== undefined) qs.set('offset', String(params.offset));
  if (params?.provider_name) qs.set('provider_name', params.provider_name);
  const query = qs.toString();
  return haGet<PaginatedResponse<RegistryDevice>>(
    `/api/v1/registry/devices${query ? `?${query}` : ''}`
  );
}

// ... registerDevice, updateDevice, unregisterDevice, getHealth

export const registryProxy = {
  getTypes, createType, deleteType,
  getDevices, registerDevice, updateDevice, unregisterDevice,
  getHealth,
};
```

### Pattern 3: Route files

Two variants depending on auth requirement:

**Protected route (withAuthAndErrorHandler):**
```typescript
// Source: app/api/raspi/health/route.ts pattern
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { registryProxy } from '@/lib/registry';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (request) => {
  const data = await registryProxy.getDevices();
  return success(data as unknown as Record<string, unknown>);
}, 'Registry/Devices');
```

**Public route (withErrorHandler):**
```typescript
// Source: app/api/health/route.ts pattern
import { withErrorHandler, success } from '@/lib/core';
import { registryProxy } from '@/lib/registry';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandler(async () => {
  const data = await registryProxy.getTypes();
  return success(data as unknown as Record<string, unknown>);
}, 'Registry/Types');
```

**Route with URL params (dynamic segment):**
```typescript
// Pattern for DELETE /registry/types/[slug]
export const DELETE = withAuthAndErrorHandler(async (request, context) => {
  const { slug } = await context.params;
  await registryProxy.deleteType(slug);
  return noContent();
}, 'Registry/Types/Delete');
```

**Route with query params forwarded (GET /devices):**
```typescript
export const GET = withAuthAndErrorHandler(async (request) => {
  const sp = request.nextUrl.searchParams;
  const data = await registryProxy.getDevices({
    limit: sp.has('limit') ? Number(sp.get('limit')) : undefined,
    offset: sp.has('offset') ? Number(sp.get('offset')) : undefined,
    provider_name: sp.get('provider_name') ?? undefined,
  });
  return success(data as unknown as Record<string, unknown>);
}, 'Registry/Devices');
```

### Pattern 4: POST returning 201

The `success()` helper accepts an optional status parameter. For POST /registry/types and POST /registry/devices (backend returns 201):

```typescript
// Source: lib/core/apiResponse.ts — success() signature
// success(data, message?, status?) — status defaults to 200
return success(data as unknown as Record<string, unknown>, null, 201);
```

### Anti-Patterns to Avoid

- **Calling response.json() in haDelete:** The DELETE endpoints return 204 No Content. Attempting `await response.json()` on a 204 will throw a parse error. The void return path must be reached without calling json().
- **Missing `export const dynamic = 'force-dynamic'`:** All route files require this. Omitting it causes Next.js to statically cache the route at build time.
- **Transforming proxy responses:** raspiProxy, thermorossiProxy, hueProxy all return data as-is. Do not reshape or validate response data in the proxy layer.
- **Inline body interfaces in route files:** Use types from `types/registry.ts` rather than inline interface definitions in route files. This follows the project's zero-`as any` requirement.
- **Using `as any` for request body parsing:** Use `parseJson<T>()` from `lib/core/requestParser.ts` or cast through `unknown` if needed, but never `as any`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP transport with auth + timeout + error mapping | Custom fetch wrapper | haGet / haPost / haPut / haDelete | Already handles RFC 9457, AbortError, 401/429/503, X-API-Key |
| Route auth + error handling | try/catch + session check | withAuthAndErrorHandler / withErrorHandler | Eliminates boilerplate; consistent error format across all 90+ routes |
| 204 response | `NextResponse.json({})` or empty json | `noContent()` from lib/core | Correct HTTP semantics; already used in project |
| Query string building | String concatenation | URLSearchParams | Handles encoding; project pattern for haClient endpoints |

---

## Common Pitfalls

### Pitfall 1: haDelete calling response.json() on 204
**What goes wrong:** SyntaxError or "Unexpected end of JSON input" thrown inside haDelete, propagates as ApiError(EXTERNAL_API_ERROR) to the route.
**Why it happens:** The existing haGet/haPost/haPut always call `response.json()` after checking `response.ok`. 204 responses have no body. Copying the pattern without removing the json() call causes a silent crash.
**How to avoid:** In haDelete, after confirming `response.ok`, simply return without calling `response.json()`. The function return type is `Promise<void>`.
**Warning signs:** `SyntaxError: Unexpected end of JSON input` in API route error logs.

### Pitfall 2: Route context.params not awaited
**What goes wrong:** TypeScript error or runtime warning "params should be awaited" for dynamic route segments.
**Why it happens:** Next.js 15 App Router made `params` a Promise. The RouteContext type in `lib/core/middleware.ts` already reflects this: `params: Promise<Record<string, string>>`.
**How to avoid:** Always `const { slug } = await context.params;` before using path params.
**Warning signs:** tsc error on `context.params.slug` (accessing non-awaited Promise property).

### Pitfall 3: Exporting withAuthAndErrorHandler for public routes
**What goes wrong:** GET /registry/types and GET /registry/health become auth-protected — browsers without a session get 401, breaking UI that expects public access.
**Why it happens:** CONTEXT.md D-12 locks that these two endpoints must use `withErrorHandler`. The distinction is easy to miss when copy-pasting from protected route templates.
**How to avoid:** Check docs/api/registry.md auth column: "No" = `withErrorHandler`, "Yes" = `withAuthAndErrorHandler`.

### Pitfall 4: PaginatedResponse<T> placed in types/registry.ts
**What goes wrong:** Phase 119 (Rooms) cannot import `PaginatedResponse<T>` without a circular or duplicated definition.
**Why it happens:** CONTEXT.md D-08 locks the location as `types/common.ts` for cross-module sharing. It is tempting to co-locate it with registry types.
**How to avoid:** Create `types/common.ts` as the sole location; import from there in both `types/registry.ts` and future `types/rooms.ts`.

### Pitfall 5: Double assertion omission on success()
**What goes wrong:** TypeScript error `Argument of type 'DeviceType[]' is not assignable to parameter of type 'Record<string, unknown>'`.
**Why it happens:** `success()` accepts `Record<string, unknown>`. Typed proxy returns are interfaces or arrays, not index-signature objects.
**How to avoid:** Use the established project pattern: `success(data as unknown as Record<string, unknown>)`.

---

## Code Examples

### types/common.ts (new file, minimal)
```typescript
// Source: docs/api/common.md §TypeScript Interfaces
export interface PaginatedResponse<T> {
  items: T[];
  total_count: number;
  limit: number;
  offset: number;
}
```

### types/registry.ts (full interface set)
```typescript
// Source: docs/api/registry.md §TypeScript Interfaces

export interface DeviceType {
  slug: string;        // Pattern: ^[a-z0-9_]+$, max 64 chars
  label: string;       // Max 128 chars
  is_builtin: boolean; // Built-in types cannot be deleted
  created_at: number;  // Unix timestamp
}

export interface DeviceTypeCreate {
  slug: string;   // Pattern: ^[a-z0-9_]+$, max 64 chars
  label: string;  // Max 128 chars
}

export interface RegistryDevice {
  id: number;
  provider_name: string;    // e.g. "hue", "dirigera", "netatmo"
  device_id: string;        // Provider-internal device identifier
  custom_name: string;
  device_type_slug: string;
  created_at: number;       // Unix timestamp
  updated_at: number;       // Unix timestamp
}

export interface DeviceCreate {
  provider_name: string;    // 1-64 chars
  device_id: string;        // 1-256 chars
  custom_name: string;      // 1-128 chars
  device_type_slug: string; // 1-64 chars, must match existing type
}

export interface DeviceUpdate {
  custom_name: string;      // 1-128 chars
  device_type_slug: string; // 1-64 chars
}

export interface RegistryHealthResponse {
  device_types_count: number;
  device_registry_count: number;
}
```

### Route file: devices/[device_id]/route.ts (PUT + DELETE on same dynamic segment)
```typescript
// Source: pattern from existing dynamic segment routes + lib/core/apiResponse.ts
import { withAuthAndErrorHandler, noContent, success } from '@/lib/core';
import { registryProxy } from '@/lib/registry';
import type { DeviceUpdate } from '@/types/registry';

export const dynamic = 'force-dynamic';

export const PUT = withAuthAndErrorHandler(async (request, context) => {
  const { device_id } = await context.params;
  const body = await request.json() as DeviceUpdate;
  const data = await registryProxy.updateDevice(Number(device_id), body);
  return success(data as unknown as Record<string, unknown>);
}, 'Registry/Devices/Update');

export const DELETE = withAuthAndErrorHandler(async (_request, context) => {
  const { device_id } = await context.params;
  await registryProxy.unregisterDevice(Number(device_id));
  return noContent();
}, 'Registry/Devices/Delete');
```

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest (next/jest config) |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern="registry" --passWithNoTests` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | registryProxy methods call haGet/haPost/haPut/haDelete with correct endpoints | unit | `npm test -- --testPathPattern="registryProxy"` | No — Wave 0 |
| INFRA-02 | TypeScript interfaces compile with zero errors for all registry types | compile | `npx tsc --noEmit` | N/A — type-only |
| INFRA-05 (types GET) | GET /api/registry/types returns 200, no auth required | unit | `npm test -- --testPathPattern="api/registry/types"` | No — Wave 0 |
| INFRA-05 (types POST) | POST /api/registry/types returns 201, requires auth | unit | `npm test -- --testPathPattern="api/registry/types"` | No — Wave 0 |
| INFRA-05 (types DELETE) | DELETE /api/registry/types/[slug] returns 204 | unit | `npm test -- --testPathPattern="api/registry/types"` | No — Wave 0 |
| INFRA-05 (devices GET) | GET /api/registry/devices returns 200, requires auth, forwards pagination params | unit | `npm test -- --testPathPattern="api/registry/devices"` | No — Wave 0 |
| INFRA-05 (devices POST) | POST /api/registry/devices returns 201, requires auth | unit | `npm test -- --testPathPattern="api/registry/devices"` | No — Wave 0 |
| INFRA-05 (devices PUT) | PUT /api/registry/devices/[device_id] returns 200, requires auth | unit | `npm test -- --testPathPattern="api/registry/devices"` | No — Wave 0 |
| INFRA-05 (devices DELETE) | DELETE /api/registry/devices/[device_id] returns 204, requires auth | unit | `npm test -- --testPathPattern="api/registry/devices"` | No — Wave 0 |
| INFRA-05 (health GET) | GET /api/registry/health returns 200, no auth required | unit | `npm test -- --testPathPattern="api/registry/health"` | No — Wave 0 |
| haDelete (D-01/D-02) | haDelete calls fetch with DELETE method, returns void on 204, throws ApiError on error | unit | `npm test -- --testPathPattern="haClient"` | Partial — existing haClient tests exist |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="registry" --passWithNoTests`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `lib/registry/__tests__/registryProxy.test.ts` — covers INFRA-01 (proxy method + endpoint verification)
- [ ] `app/api/registry/types/__tests__/route.test.ts` — covers INFRA-05 GET + POST types
- [ ] `app/api/registry/types/[slug]/__tests__/route.test.ts` — covers INFRA-05 DELETE type
- [ ] `app/api/registry/devices/__tests__/route.test.ts` — covers INFRA-05 GET + POST devices
- [ ] `app/api/registry/devices/[device_id]/__tests__/route.test.ts` — covers INFRA-05 PUT + DELETE device
- [ ] `app/api/registry/health/__tests__/route.test.ts` — covers INFRA-05 GET health
- [ ] haDelete tests should be added to existing `lib/__tests__/haClient.test.ts` (if it exists) or a new file

---

## Open Questions

1. **device_id path param type: string vs number**
   - What we know: The API spec shows `id: number` in RegistryDevice (e.g. `"id": 5`), and the PUT/DELETE path is `/registry/devices/{device_id}`. The curl example uses `/registry/devices/5` (integer in path).
   - What's unclear: The route segment `[device_id]` will always be a string from `context.params`. The proxy should call `Number(device_id)` when passing to the backend URL, or keep it as string in the path.
   - Recommendation: Keep as string in the URL path (`/api/v1/registry/devices/${device_id}`) since it's an HTTP path segment — no conversion needed. The `id: number` in RegistryDevice is for response data only.

2. **haClient.ts test file location**
   - What we know: `lib/raspi/__tests__/raspiClient.test.ts` covers raspiClient. A haClient test may already exist.
   - What's unclear: The glob search did not surface `lib/__tests__/haClient.test.ts` directly.
   - Recommendation: Plan 118-01 should check for an existing haClient test and either add to it or create `lib/__tests__/haClient.test.ts` for haDelete coverage.

---

## Sources

### Primary (HIGH confidence)
- `docs/api/registry.md` — All 8 endpoint specs, error codes, TypeScript interfaces (read directly)
- `docs/api/common.md` — PaginatedResponse<T> interface definition (read directly)
- `lib/haClient.ts` — Transport pattern for haDelete (read directly)
- `lib/raspi/raspiClient.ts` — Function module proxy pattern (read directly)
- `app/api/raspi/health/route.ts` — Route handler pattern (read directly)
- `lib/core/middleware.ts` — withAuthAndErrorHandler / withErrorHandler signatures (read directly)
- `lib/core/apiResponse.ts` — success(), noContent(), created() signatures (read directly)
- `lib/core/apiErrors.ts` — ApiError, ERROR_CODES, HTTP_STATUS (read directly)
- `types/raspi.ts` — Type file pattern (read directly)
- `jest.config.ts` — Test configuration (read directly)

### Secondary (MEDIUM confidence)
- Existing test files `lib/raspi/__tests__/raspiClient.test.ts` and `app/api/raspi/health/__tests__/route.test.ts` — Test patterns for proxy + route unit tests (read directly)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all modules verified by direct file reading; no new packages
- Architecture: HIGH — all patterns are exact copies of verified existing code
- Pitfalls: HIGH — identified from direct inspection of haClient transport code and route middleware types
- Types: HIGH — interfaces copied verbatim from docs/api/registry.md and docs/api/common.md

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable internal patterns; no external dependencies)
