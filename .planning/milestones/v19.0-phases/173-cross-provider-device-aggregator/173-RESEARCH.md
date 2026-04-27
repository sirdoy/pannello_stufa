# Phase 173: Cross-Provider Device Aggregator - Research

**Researched:** 2026-04-25
**Domain:** Multi-provider API aggregation (Next.js 15 App Router route handler)
**Confidence:** HIGH

## Summary

Phase 173 evolves `app/api/v1/devices/route.ts` from a 47-line Fritz!Box-only listing into a fan-out aggregator that calls all 8 provider proxies via `Promise.allSettled`, normalizes per-provider items into a unified `Device` shape with a `provider_type` discriminator, and surfaces partial failures as a non-fatal `errors[]` array (HTTP 200). Every required asset already exists in this codebase: the canonical fan-out template (`app/health/route.ts`), every provider listing function used by the mappers, the `success()` helper that already accepts arbitrary record shapes, the Italian-locale sort precedent (`localeCompare(b.name, 'it')`), and a mature test pattern for proxy mocking (e.g. `app/api/v1/sonos/zones/__tests__/route.test.ts`).

The only domain-modeling subtlety is **Netatmo**: CONTEXT.md D-08 references `getProxyHomestatus()` modules — but the proxy `/homestatus` response (`NetatmoProxyHomestatusResponse`) only exposes `rooms[]`, not modules. To enumerate Netatmo thermostats and valves, the mapper must combine `getProxyHomesdata()` (for module metadata: id, type, name, room_id, battery) with `getProxyCameraStatus()` (for cameras). Valves can also be sourced from the dedicated `/valves` endpoint (`getProxyValveStatus`) which carries a clean `reachable` boolean. This research surfaces both options; planner will pick.

**Primary recommendation:** Mirror `app/health/route.ts` byte-for-byte for the fan-out skeleton (same 8 promise array, same destructured `[Result]` pattern). Place per-provider mappers inline in the route file initially (each is ~10 lines); promote to `lib/devices/aggregator/mappers.ts` only if route exceeds ~250 LOC. Use `getProxyHomesdata()` (not `getProxyHomestatus()`) for Netatmo thermostats + valves. Tests follow the `automations/route.test.ts` template — single `jest.mock(@/lib/{provider}/...)` per provider, then `mockProvider.mockResolvedValue` / `mockResolvedValueOnce(Promise.reject(...))` to drive partial-failure scenarios.

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Item Shape (D-01..D-03):**
- Slim core + optional fields. Required: `id`, `name`, `provider_type`. Optional: `ip`, `mac`, `status` (0|1), `type`, `room`. Each provider populates only the fields it has.
- `id` is composite: `{provider_type}:{native_id}` (e.g. `fritzbox:AA:BB:CC:DD:EE:FF`, `hue:1`, `netatmo:09:00:00:01:23:45`, `raspi:host`, `thermorossi:stove`).
- `provider_type` is the literal union `'fritzbox' | 'hue' | 'sonos' | 'netatmo' | 'dirigera' | 'tuya' | 'raspi' | 'thermorossi'`.

**Provider Source Mapping (D-04..D-12):**
- All 8 providers contribute (matches `/health` symmetry).
- Fritz!Box: `fritzboxClient.getDevices()` → each → `type='network_device'`, `ip`, `mac`, `status=active?1:0`. No `room`.
- Hue: `getLights()` only (NOT groups/scenes). `name`, `status=reachable?1:0`, `type='light'`, `room` from `room_name`. No `ip`/`mac`.
- Sonos: `getDevices()` only (physical speakers, NOT zones). `type='speaker'`. `ip`/`mac` omitted. `room` not exposed in `SonosDeviceResponse` — see Pitfall 2.
- Netatmo: thermostats + valves (filter `homesdata().body.homes[0].modules` by type) + cameras (`getProxyCameraStatus()`). Composite id uses module `id` or `camera_id`.
- DIRIGERA: `getSensors()`. `type='contact_sensor'|'motion_sensor'|'sensor'`, `room` from `room`, `status=is_reachable?1:0`. No `ip`/`mac`.
- Tuya: `getPlugs()`. `type='plug'`, `name=custom_name||device_id`, `status` from `data_freshness`/`switch_on`. No `room`.
- Raspi: single item. `id='raspi:host'`, `name='Raspberry Pi'`, `type='host'`, `status` from health.
- Thermorossi: single item. `id='thermorossi:stove'`, `name='Stufa'`, `type='stove'`, `status` from health.

**Partial Failure (D-13..D-15):**
- Response shape adds `errors: Array<{ provider_type, message }>`. HTTP **200** even when providers fail.
- No explicit per-provider timeout; trust `haClient` defaults (15s default).
- Failures logged via `console.warn` mirroring `app/health/route.ts`.

**Pagination & Filtering (D-16..D-20):**
- Post-merge slice: fetch all, sort, then `offset` + `limit`. `total_count` reflects pre-paginated full length.
- Default sort: `provider_type` ASC alpha → then `name` ASC Italian-locale (`localeCompare(b.name, 'it')`).
- `limit`: 1–1000, default 100, clamp silently (no 400).
- `offset`: negative → 0, beyond `total_count` → `items: []`.
- `?provider_type=` single-value filter. Skip excluded providers (perf win — no fan-out call). Invalid value → 200 with `items: []`, `total_count: 0`, `errors: []`.

**Documentation (D-21):** `docs/api/README.md` §GET /api/v1/devices must be updated.

### Claude's Discretion

1. **Null vs omit** for absent optional fields — pick one; apply uniformly.
2. **Mapper file organization** — inline in `route.ts` vs `lib/devices/aggregator/mappers.ts` (or similar). Planner picks based on size estimate.
3. **`errors[]` raw vs sanitized message** — pick one.
4. **Test file location** — co-located `app/api/v1/devices/__tests__/route.test.ts` (project convention) vs `__tests__/api/...`. See Pattern 4.

### Deferred Ideas (OUT OF SCOPE)

- Per-provider timeout
- Response caching / ETag / 304
- Multi-value `?provider_type=hue,sonos` filter
- Cross-provider device dedup / identity matching
- Frontend consumer UI
- Discriminated-union typing per `provider_type`

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| COMMON-02 | GET /api/v1/devices ritorna lista aggregata dispositivi cross-provider | All 8 provider proxy listing functions exist (Pattern 1), `/health` provides the canonical fan-out template (Pattern 2), `success()` helper already accepts arbitrary record shapes (Pattern 3), test pattern established in `automations/route.test.ts` (Pattern 4). |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Auth (Auth0 session check) | Frontend Server (route handler) | — | `withAuthAndErrorHandler` already enforces; aggregator inherits unchanged. |
| Provider fan-out | Frontend Server (route handler) | API (HA proxy) | Each provider proxy module is a thin `haGet` wrapper; aggregation happens in the Next.js route, calls go to HA proxy backend. |
| Item normalization (mappers) | Frontend Server (route handler) | — | Pure functions over typed proxy responses; no I/O. |
| Sort + paginate | Frontend Server (route handler) | — | Post-merge slice in process memory (small N, single-home deployment). |
| Error logging | Frontend Server (route handler) | — | `console.warn` per `/health` precedent. No external logging service. |
| Persistence | — | — | None. Pure read aggregator. |

## Standard Stack

### Core (no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.0 (App Router) | Route handler runtime | Project framework. `[VERIFIED: package.json#next "^16.1.0"]` |
| `@/lib/core` | internal | `withAuthAndErrorHandler`, `success()` | Already used by current `/api/v1/devices` route. `[VERIFIED: app/api/v1/devices/route.ts]` |
| Provider proxies | internal | Per-provider listing functions | All 8 already shipped and used by `/health`. `[VERIFIED: app/health/route.ts:25-33]` |
| Jest | 29.x | Unit tests | Project test framework. `[VERIFIED: package.json devDependencies + jest.config.ts]` |

**No new packages required.** No `npm install` (CLAUDE.md rule 4).

### Reused Internal Utilities

| Asset | Location | Use |
|-------|----------|-----|
| `withAuthAndErrorHandler` | `lib/core/middleware.ts:152` | Auth wrapper (kept identical to current route) |
| `success(data)` | `lib/core/apiResponse.ts:34` | Wraps response in `{ success: true, ...data }`. Accepts `Record<string, unknown>` — works for `{ items, total_count, limit, offset, errors }` directly. |
| `Promise.allSettled` | Native | Fan-out across 8 promises (mirror `/health`) |
| `localeCompare(b.name, 'it')` | Native + project convention | Italian-locale sort, used in `app/rooms/page.tsx:44`, `app/network/components/DeviceListTable.tsx:151`, `app/telefonia/components/DectHandsetsTable.tsx:106`. |

## Architecture Patterns

### System Architecture Diagram

```
                                      GET /api/v1/devices?provider_type=&limit=&offset=
                                      |
                                      v
                       +-----------------------------------+
                       |  withAuthAndErrorHandler          |
                       |  (Auth0 session check, ApiError   |
                       |   -> NextResponse handling)       |
                       +-----------------+-----------------+
                                         |
                                         v
                       +-----------------------------------+
                       |  Parse + clamp query params       |
                       |  - provider_type (filter)         |
                       |  - limit (clamp 1..1000, dflt 100)|
                       |  - offset (clamp >=0, dflt 0)     |
                       +-----------------+-----------------+
                                         |
                                 (filter active providers)
                                         |
                                         v
                       +-----------------------------------+
                       |  Promise.allSettled fan-out       |
                       +---+---+---+---+---+---+---+---+---+
                           |   |   |   |   |   |   |   |
                           v   v   v   v   v   v   v   v
                          [F] [H] [S] [N] [D] [T] [R] [Th]    each -> haGet via haClient
                           |   |   |   |   |   |   |   |       (X-API-Key) -> HA proxy
                           v   v   v   v   v   v   v   v
                       +-----------------------------------+
                       |  Per-provider mapper functions    |
                       |  (proxy response -> Device[])     |
                       |  fulfilled -> items.push(...)     |
                       |  rejected  -> errors.push({...})  |
                       |              + console.warn       |
                       +-----------------+-----------------+
                                         |
                                         v
                       +-----------------------------------+
                       |  Merge -> sort (provider_type,    |
                       |  then name 'it' locale)           |
                       +-----------------+-----------------+
                                         |
                                         v
                       +-----------------------------------+
                       |  total_count = merged.length      |
                       |  slice(offset, offset+limit)      |
                       +-----------------+-----------------+
                                         |
                                         v
                       +-----------------------------------+
                       |  success({ items, total_count,    |
                       |    limit, offset, errors })       |
                       |  -> HTTP 200                      |
                       +-----------------------------------+
```

### Component Responsibilities

| Component | Location | Responsibility |
|-----------|----------|----------------|
| Route handler | `app/api/v1/devices/route.ts` | Orchestrates: auth, parse query, fan-out, merge, sort, paginate, respond. |
| Per-provider mappers | inline in route OR `lib/devices/aggregator/mappers.ts` | Pure functions: `(proxyResponse) => Device[]`. One per provider. |
| Type definitions | `types/devices.ts` (NEW) OR co-located in route | `Device` interface, `ProviderType` literal union, `DeviceAggregatorResponse` shape. |
| Provider proxies | `lib/{provider}/{provider}Proxy.ts` (existing, unchanged) | Source-of-truth listing functions. |
| Tests | `app/api/v1/devices/__tests__/route.test.ts` (NEW) | Mock each proxy module; assert merge, filter, partial failure, pagination. |

### Recommended Project Structure

```
app/api/v1/devices/
├── route.ts                    # Aggregator (rewrite)
└── __tests__/
    └── route.test.ts           # New (project convention: co-located)

types/
└── devices.ts                  # NEW: Device, ProviderType, DeviceAggregatorResponse

lib/devices/                    # OPTIONAL: only if route gets large
├── deviceRegistry.ts           # (existing - UI nav, unrelated)
├── deviceTypes.ts              # (existing - UI nav, unrelated)
└── aggregator/                 # NEW (Claude's discretion)
    ├── mappers.ts              # Per-provider mappers
    └── __tests__/mappers.test.ts
```

### Pattern 1: Provider Listing Function Signatures (verified from source)

Every provider listing function **already exists** with these exact signatures `[VERIFIED: lib/{provider}/...]`:

| Provider | Function | Returns | Source line |
|----------|----------|---------|-------------|
| Fritz!Box | `fritzboxClient.getDevices()` | `Promise<Array<{ id, name, ip, mac, active }>>` | `lib/fritzbox/fritzboxClient.ts:62-74` |
| Hue | `getLights()` | `Promise<HueLight[]>` (each has `light_id`, `name`, `reachable`, `room_name`) | `lib/hue/hueProxy.ts:41-43` |
| Sonos | `getDevices()` | `Promise<SonosDeviceResponse[]>` (each has `uid`, `name`, `ip`, `is_visible`) | `lib/sonos/sonosProxy.ts:58-60` |
| Netatmo (homesdata) | `getProxyHomesdata()` | `Promise<{ body: { homes: [{ modules: [{ id, type, name, room_id, battery_level }], rooms: [{ id, name }] }] } }>` | `lib/netatmo/netatmoProxy.ts:68-70` |
| Netatmo (homestatus) | `getProxyHomestatus()` | `Promise<{ rooms: [{ home_id, room_id, room_name, temperature, ... }], data_freshness }>` ⚠️ rooms only, **no modules** | `lib/netatmo/netatmoProxy.ts:60-62` |
| Netatmo (cameras) | `getProxyCameraStatus()` | `Promise<{ cameras: [{ camera_id, name, device_type, status }], data_freshness }>` | `lib/netatmo/netatmoProxy.ts:132-134` |
| Netatmo (valves) | `getProxyValveStatus()` (alt) | `Promise<{ valves: [{ module_id, module_name, room_id, room_name, reachable }], data_freshness }>` — cleaner reachable signal than homesdata | `types/netatmoProxy.ts:338-341` |
| DIRIGERA | `getSensors()` | `Promise<{ sensors: DirigeraSensor[], count, is_stale }>` (each has `id`, `type`, `custom_name`, `room`, `is_reachable`) | `lib/dirigera/dirigeraProxy.ts:48-50` |
| Tuya | `getPlugs()` | `Promise<TuyaPlug[]>` (each has `device_id`, `custom_name`, `switch_on`, `data_freshness`) — **no `name` field**, use `custom_name \|\| device_id` | `lib/tuya/tuyaProxy.ts:46-48`, `types/tuyaProxy.ts:33-45` |
| Raspi | `raspiClient.getHealth()` | `Promise<{ status: 'ok', data_freshness: 'LIVE' }>` — no error means up | `lib/raspi/raspiClient.ts:28-30` |
| Thermorossi | `getHealth()` | `Promise<{ status: 'ok'\|'degraded', data_freshness, last_poll_at }>` | `lib/stove/thermorossiProxy.ts:63-65` |

**Used:** `[VERIFIED: app/health/route.ts:25-33]` already imports all 8 health functions in the same pattern.

### Pattern 2: Promise.allSettled Fan-Out (mirror `/health`)

```typescript
// Source: app/health/route.ts (lines 41-71) — adapted for devices
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { fritzboxClient } from '@/lib/fritzbox';
import { getLights } from '@/lib/hue/hueProxy';
import { getDevices as getSonosDevices } from '@/lib/sonos/sonosProxy';
import { getProxyHomesdata, getProxyCameraStatus } from '@/lib/netatmo/netatmoProxy';
import { getSensors } from '@/lib/dirigera/dirigeraProxy';
import { getPlugs } from '@/lib/tuya/tuyaProxy';
import { raspiClient } from '@/lib/raspi';
import { getHealth as getThermorossiHealth } from '@/lib/stove/thermorossiProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (request) => {
  // 1. parse query params (clamp limit/offset, validate provider_type)
  // 2. select promises by provider filter
  const results = await Promise.allSettled([
    fritzboxClient.getDevices(),     // index 0 -> 'fritzbox'
    getLights(),                     // index 1 -> 'hue'
    getSonosDevices(),               // index 2 -> 'sonos'
    Promise.all([                    // index 3 -> 'netatmo' (combined)
      getProxyHomesdata(),
      getProxyCameraStatus(),
    ]),
    getSensors(),                    // index 4 -> 'dirigera'
    getPlugs(),                      // index 5 -> 'tuya'
    raspiClient.getHealth(),         // index 6 -> 'raspi'
    getThermorossiHealth(),          // index 7 -> 'thermorossi'
  ]);

  const items: Device[] = [];
  const errors: Array<{ provider_type: ProviderType; message: string }> = [];

  // map per-provider result -> items / errors
  // (one branch per provider; mapper functions described in Pattern 5)

  // 3. sort + paginate
  // 4. return success({ items, total_count, limit, offset, errors })
}, 'Devices/Aggregated');
```

**Key verified facts:**
- `success(data)` returns `NextResponse.json({ success: true, ...data }, { status: 200 })`. Accepts any `Record<string, unknown>`. Adding `errors: [...]` works without modification. `[VERIFIED: lib/core/apiResponse.ts:34-49]`
- `withAuthAndErrorHandler` signature: `(request, context, session) => Promise<NextResponse>`. Auth0 session bypassed automatically when `BYPASS_AUTH=true`. `[VERIFIED: lib/core/middleware.ts:49-76, 152]`

### Pattern 3: Query Param Parsing (precedent in same codebase)

```typescript
// Source: app/api/registry/devices/route.ts:13-18 (verbatim approach)
const sp = request.nextUrl.searchParams;

// Limit clamping (precedent: app/api/notifications/errors/route.ts:69)
const PROVIDER_TYPES: ProviderType[] = [
  'fritzbox', 'hue', 'sonos', 'netatmo', 'dirigera', 'tuya', 'raspi', 'thermorossi',
];

const rawLimit = sp.has('limit') ? Number(sp.get('limit')) : 100;
const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(rawLimit, 1000)) : 100;

const rawOffset = sp.has('offset') ? Number(sp.get('offset')) : 0;
const offset = Number.isFinite(rawOffset) ? Math.max(0, rawOffset) : 0;

const providerFilterRaw = sp.get('provider_type');
const providerFilter = providerFilterRaw && PROVIDER_TYPES.includes(providerFilterRaw as ProviderType)
  ? (providerFilterRaw as ProviderType)
  : null;
const providerFilterIsInvalid = providerFilterRaw !== null && providerFilter === null;
// providerFilterIsInvalid -> short-circuit return success({ items: [], total_count: 0, limit, offset, errors: [] })
```

**Confidence:** HIGH. Pattern 3 directly composes existing precedents — no novel code.

### Pattern 4: Test File (analog from `automations/route.test.ts`)

```typescript
// Source: app/api/v1/automations/__tests__/route.test.ts (verbatim test scaffold)
jest.mock('@/lib/fritzbox');
jest.mock('@/lib/hue/hueProxy');
jest.mock('@/lib/sonos/sonosProxy');
jest.mock('@/lib/netatmo/netatmoProxy');
jest.mock('@/lib/dirigera/dirigeraProxy');
jest.mock('@/lib/tuya/tuyaProxy');
jest.mock('@/lib/raspi');
jest.mock('@/lib/stove/thermorossiProxy');
jest.mock('@/lib/auth0', () => ({ auth0: { getSession: jest.fn() } }));

import { GET } from '../route';
import { fritzboxClient } from '@/lib/fritzbox';
import { getLights } from '@/lib/hue/hueProxy';
// ... etc
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockFritzGetDevices = jest.mocked(fritzboxClient.getDevices);
const mockGetLights = jest.mocked(getLights);
// ... etc

const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

describe('GET /api/v1/devices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/devices');
    const response = await GET(request as any, {} as any);
    expect(response.status).toBe(401);
  });

  it('aggregates items from all 8 providers', async () => {
    mockFritzGetDevices.mockResolvedValue([
      { id: 'aa:bb', name: 'iPhone', ip: '192.168.1.10', mac: 'aa:bb', active: true },
    ] as any);
    // ... seed each provider with one item
    const request = new Request('http://localhost:3000/api/v1/devices');
    const response = await GET(request as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.items.length).toBeGreaterThanOrEqual(8);
    expect(new Set(data.items.map((i: any) => i.provider_type)).size).toBe(8);
    expect(data.errors).toEqual([]);
  });

  it('returns 200 with errors[] when one provider rejects', async () => {
    mockFritzGetDevices.mockRejectedValue(new Error('Fritz!Box unreachable'));
    // other providers seeded successfully
    const request = new Request('http://localhost:3000/api/v1/devices');
    const response = await GET(request as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(200);  // NOT 500
    expect(data.errors).toContainEqual({
      provider_type: 'fritzbox',
      message: expect.stringContaining('Fritz!Box unreachable'),
    });
    expect(data.items.every((i: any) => i.provider_type !== 'fritzbox')).toBe(true);
  });

  it('skips fan-out for excluded providers when ?provider_type=hue', async () => {
    mockGetLights.mockResolvedValue([{ light_id: '1', name: 'Lampada', reachable: true } as any]);
    const request = new Request('http://localhost:3000/api/v1/devices?provider_type=hue');
    await GET(request as any, {} as any);
    expect(mockGetLights).toHaveBeenCalled();
    expect(mockFritzGetDevices).not.toHaveBeenCalled();  // skipped
  });
});
```

**File location convention:** Verified across the project — `app/api/v1/{resource}/__tests__/route.test.ts` co-located. `[VERIFIED: app/api/v1/automations/__tests__/route.test.ts, app/api/v1/sonos/zones/__tests__/route.test.ts]`. The legacy `__tests__/api/...` tree was retired in earlier phases.

### Pattern 5: Per-Provider Mapper Skeleton (recommended)

```typescript
// Each mapper is pure: (proxyResponse) => Device[]
function mapFritzbox(devices: Awaited<ReturnType<typeof fritzboxClient.getDevices>>): Device[] {
  return devices.map(d => ({
    id: `fritzbox:${d.mac || d.ip}`,
    name: d.name,
    provider_type: 'fritzbox',
    type: 'network_device',
    ip: d.ip,
    mac: d.mac,
    status: d.active ? 1 : 0,
  }));
}

function mapHue(lights: HueLight[]): Device[] {
  return lights.map(l => ({
    id: `hue:${l.light_id}`,
    name: l.custom_name ?? l.name,
    provider_type: 'hue',
    type: 'light',
    status: l.reachable ? 1 : 0,
    ...(l.room_name ? { room: l.room_name } : {}),
  }));
}

function mapNetatmo(
  homesdata: NetatmoProxyHomesdataResponse,
  cameras: CameraStatusResponse,
): Device[] {
  const home = homesdata.body.homes[0];
  if (!home) return [];
  const roomNames = new Map(home.rooms.map(r => [r.id, r.name]));
  const moduleItems = home.modules
    .filter(m => m.type === 'NATherm1' /* thermostat */ || m.type === 'NRV' /* valve */)
    .map(m => ({
      id: `netatmo:${m.id}`,
      name: m.name,
      provider_type: 'netatmo' as const,
      type: m.type === 'NATherm1' ? 'thermostat' : 'valve',
      ...(m.room_id && roomNames.get(m.room_id) ? { room: roomNames.get(m.room_id)! } : {}),
      // status: needs reachability — homesdata does not expose reachable directly.
      //         Either omit, OR use getProxyValveStatus() for valves to get clean reachable boolean.
    }));
  const cameraItems = cameras.cameras.map(c => ({
    id: `netatmo:${c.camera_id}`,
    name: c.name ?? c.camera_id,
    provider_type: 'netatmo' as const,
    type: 'camera',
    status: c.status === 'on' ? 1 : 0,
  }));
  return [...moduleItems, ...cameraItems];
}

// Single-item providers
function mapRaspi(result: PromiseSettledResult<unknown>): Device[] {
  return [{
    id: 'raspi:host',
    name: 'Raspberry Pi',
    provider_type: 'raspi',
    type: 'host',
    status: result.status === 'fulfilled' ? 1 : 0,
  }];
}

function mapThermorossi(result: PromiseSettledResult<ThermorossiHealthResponse>): Device[] {
  return [{
    id: 'thermorossi:stove',
    name: 'Stufa',
    provider_type: 'thermorossi',
    type: 'stove',
    status: result.status === 'fulfilled' && result.value.status === 'ok' ? 1 : 0,
  }];
}
```

**Single-item provider trick:** Raspi and Thermorossi don't fail the aggregator on rejection — they emit a single item with `status: 0`. This means **they never appear in `errors[]`** (unlike multi-item providers, which get added to `errors[]` and contribute zero items on failure). Planner should explicitly decide and document this asymmetry — alternative is to push to `errors[]` AND emit zero items.

### Pattern 6: Italian Locale Sort (verified pattern)

```typescript
// Source: app/rooms/page.tsx:44, app/network/components/DeviceListTable.tsx:151
items.sort((a, b) => {
  const providerCmp = a.provider_type.localeCompare(b.provider_type);
  if (providerCmp !== 0) return providerCmp;
  return a.name.localeCompare(b.name, 'it');
});
```

`[VERIFIED: 8+ usages across app/]`. Locale arg `'it'` only on the `name` comparison — `provider_type` is ASCII alphabetical so default `localeCompare` is fine.

### Anti-Patterns to Avoid

- **Don't use `Promise.all`** — first rejection blows up the entire response. CONTEXT.md D-13 mandates 200 with `errors[]`. `Promise.allSettled` is the only correct primitive.
- **Don't use `getProxyHomestatus()` for Netatmo modules** — it only returns `rooms[]`. Use `getProxyHomesdata()` (returns `body.homes[0].modules[]`) plus `getProxyCameraStatus()` for cameras. `[VERIFIED: types/netatmoProxy.ts:32-48, 113-120, 229-246]`
- **Don't return 500 on partial failure** — D-13 mandates 200. Reserve 500 for: missing `HA_API_URL`/`HA_API_KEY` env vars (already throws via `haClient`), unhandled exceptions (caught by `withErrorHandler`).
- **Don't skip the `console.warn`** — it's the only diagnostic surface for partial failures (no metrics service in this codebase). `[VERIFIED: app/health/route.ts pattern]`
- **Don't hand-roll auth check** — `withAuthAndErrorHandler` already does it. The current route uses it; the rewrite must keep using it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth0 session check | Custom `if (!session)` | `withAuthAndErrorHandler` | Already handles 401 + dev-bypass + error formatting. `[VERIFIED: lib/core/middleware.ts]` |
| HTTP transport to HA proxy | `fetch(...)` directly | Existing `lib/{provider}/*Proxy.ts` functions | All 8 already shipped, all use shared `haClient` with retries/timeouts/RFC9457 mapping. |
| Pagination envelope | New shape | Extend `PaginatedResponse<T>` from `types/common.ts` | Project standard since Phase 118. `[VERIFIED: types/common.ts:7-12]` |
| Error response formatting | Custom JSON | `success()`, `handleError()` from `@/lib/core` | Standard wrappers, already used by current route. `[VERIFIED: lib/core/apiResponse.ts]` |
| Locale-aware sort | Custom comparator | `localeCompare(other, 'it')` | 8+ usages established in Italian-language project. |
| Limit clamp | Custom validator | `Math.max(1, Math.min(rawLimit, 1000))` | One-liner, no library needed. Precedent: `app/api/notifications/errors/route.ts:69`. |

**Key insight:** This phase is **almost entirely composition** of existing parts. The only new code is: (1) per-provider mapper functions (~10 lines each, pure), (2) the route handler that wires them via `Promise.allSettled`, (3) the `Device` type. No new infrastructure, no new dependencies.

## Common Pitfalls

### Pitfall 1: Netatmo modules live in `homesdata`, not `homestatus`
**What goes wrong:** Following CONTEXT.md D-08 literally and calling `getProxyHomestatus()` to enumerate modules — but the response shape is `{ rooms: [{ home_id, room_id, room_name, temperature, ... }], data_freshness }`. There are no modules.
**Why it happens:** Easy to confuse `homestatus` (live values per room) with `homesdata` (structure: rooms + modules + schedules). Netatmo's API has both names.
**How to avoid:** Use `getProxyHomesdata()` and read `response.body.homes[0].modules[]`. Filter `modules.filter(m => m.type === 'NATherm1' || m.type === 'NRV')` for thermostats and valves respectively. Cross-reference room names from `homes[0].rooms[]` via `room_id`.
**Warning signs:** TypeScript errors like "Property 'modules' does not exist on NetatmoProxyHomestatusResponse". Don't suppress with `as any` — fix the source.
**Confidence:** HIGH. `[VERIFIED: types/netatmoProxy.ts:32-48 vs 96-120]`. The exact module type strings (`NATherm1`, `NRV`) are common Netatmo terminology but should be **verified by reading actual proxy responses or live `homesdata` output before locking** — flag as `[ASSUMED]` until confirmed by planner.

### Pitfall 2: Sonos `room` is not in `SonosDeviceResponse`
**What goes wrong:** CONTEXT.md D-07 says Sonos items get `room` from "speaker room field" — but `SonosDeviceResponse` has no `room` field. The `name` is the player name (e.g. "Cucina"), `model`, `role`, `is_visible`, `is_coordinator`, etc., plus `custom_name`/`device_type` from registry.
**Why it happens:** Sonos's "room" concept is colloquial — speaker name often IS the room ("Sala", "Cucina"). The proxy doesn't expose a separate `room` field for devices.
**How to avoid:** Either omit `room` for Sonos items (consistent with D-01 "absent fields are omitted"), OR use `name` as the implicit room. Recommend: omit. Add a comment in the mapper.
**Warning signs:** Mapper code reaches for a non-existent `d.room` → TS error. Quick fix is to omit.
**Confidence:** HIGH. `[VERIFIED: types/sonosProxy.ts:36-48]`.

### Pitfall 3: Tuya plugs have no `name` field — use `custom_name`
**What goes wrong:** `TuyaPlug` type has `device_id`, `switch_on`, `power_w`, etc., but no `name`. Only `custom_name` (from device registry, nullable).
**Why it happens:** Tuya provider was added in Phase 147 with the registry-first design — plugs are identified by ID, named via the registry overlay.
**How to avoid:** `name: plug.custom_name ?? plug.device_id` (precedent: how DataTable renders Tuya plugs).
**Warning signs:** Aggregator returns items with `name: undefined` → fails the required `name` field per D-01.
**Confidence:** HIGH. `[VERIFIED: types/tuyaProxy.ts:33-45]`.

### Pitfall 4: Single-item providers (Raspi, Thermorossi) need a different failure model
**What goes wrong:** D-13 says failed providers contribute zero items and are surfaced in `errors[]`. But D-11/D-12 say Raspi and Thermorossi emit a single item with `status` derived from health. So if Raspi health rejects, do we (a) emit zero items + push to `errors[]`, or (b) emit one item with `status: 0`?
**Why it happens:** Two valid interpretations. The CONTEXT.md is implicit on this.
**How to avoid:** **Recommend (b)** — single-item providers always emit one item. Rationale: a "down" Raspi is itself useful information (UI shows it as offline). This matches the `/health` aggregator pattern which always reports `raspi: 'ok' | 'down'`. `errors[]` then captures only multi-item provider failures.
**Warning signs:** Tests pass for Raspi-down via either interpretation; planner must lock the choice in PLAN.md.
**Confidence:** MEDIUM (interpretation, not fact). Flag for confirmation in plan-check or discuss-phase.

### Pitfall 5: Filter optimization must skip the `Promise.allSettled` slot, not just return `[]`
**What goes wrong:** D-20 says skipping excluded providers is a perf win. Naive impl: still call all 8 functions, then filter — wastes HTTP roundtrips.
**Why it happens:** Easy to write `if (providerFilter !== 'fritzbox') items = items.filter(...)` after the fact.
**How to avoid:** Build the promise array conditionally:
```typescript
const promiseSpec = [
  { type: 'fritzbox' as const, fn: () => fritzboxClient.getDevices() },
  { type: 'hue' as const, fn: () => getLights() },
  // ...
].filter(p => providerFilter === null || p.type === providerFilter);

const results = await Promise.allSettled(promiseSpec.map(p => p.fn()));
results.forEach((r, i) => mapResult(promiseSpec[i].type, r));
```
This sacrifices the destructured `[fritzboxResult, hueResult, ...]` style for a loop — but matches D-20's perf intent.
**Warning signs:** Network tab in dev shows 8 HA proxy calls when filter is set to one provider.
**Confidence:** HIGH.

### Pitfall 6: Netatmo cameras are NOT in `homesdata`
**What goes wrong:** Trying to derive cameras from `homesdata.body.homes[0].modules` — but `NetatmoProxyHomesdataResponse` only includes thermostats/valves modules. Cameras live in a separate proxy endpoint.
**Why it happens:** Netatmo legacy API mixed everything in `gethomedata` (`NetatmoHomedataResponse.body.homes[].cameras[]`), but the proxy split into `/homesdata` (heating modules only) + `/camera/status` (cameras).
**How to avoid:** Always combine `getProxyHomesdata()` + `getProxyCameraStatus()` for the Netatmo mapper. Wrap in `Promise.all` inside one `Promise.allSettled` slot — if either inner call fails, the entire Netatmo slot rejects (acceptable since both are part of "Netatmo"). Alternative: two separate slots with two `errors[]` entries (`netatmo` for both).
**How to avoid (decision):** Recommend single slot + `Promise.all` inside — keeps `provider_type` 1:1 with slot. If one of the two fails, the message says "Netatmo: <inner error>".
**Warning signs:** Cameras missing from results; tests for camera item shape fail.
**Confidence:** HIGH. `[VERIFIED: types/netatmoProxy.ts homesdata vs camera status separation]`.

## Code Examples

### Composite ID Format (D-02)
```typescript
// fritzbox: MAC preferred, IP fallback
`fritzbox:${d.mac || d.ip}`           // -> "fritzbox:AA:BB:CC:DD:EE:FF"
// hue: bridge string id
`hue:${l.light_id}`                    // -> "hue:5"
// sonos: RINCON UID
`sonos:${d.uid}`                       // -> "sonos:RINCON_949F3E2A1B0C01400"
// netatmo: module id (thermostat/valve) or camera id
`netatmo:${m.id}`                      // -> "netatmo:09:00:00:01:23:45"
`netatmo:${c.camera_id}`               // -> "netatmo:70:ee:50:12:34:56"
// dirigera: sensor uuid
`dirigera:${s.id}`
// tuya: device_id
`tuya:${p.device_id}`
// single-item providers
`raspi:host`
`thermorossi:stove`
```

### Type Definitions (recommend `types/devices.ts`)

```typescript
// types/devices.ts (NEW — follows project convention: types/ at root, not lib/types/)
// Source: project convention, e.g. types/sonosProxy.ts, types/registry.ts

export type ProviderType =
  | 'fritzbox'
  | 'hue'
  | 'sonos'
  | 'netatmo'
  | 'dirigera'
  | 'tuya'
  | 'raspi'
  | 'thermorossi';

/**
 * Aggregated cross-provider device representation.
 * Slim core + optional fields (D-01). Optional fields omitted (not null) when absent.
 */
export interface Device {
  /** Composite id: `{provider_type}:{native_id}` */
  id: string;
  /** Display name. Required. */
  name: string;
  /** Source provider discriminator. Required. */
  provider_type: ProviderType;
  /** Device type (e.g. 'light', 'speaker', 'thermostat', 'plug'). Optional. */
  type?: string;
  /** Local IP if exposed by provider. Optional. */
  ip?: string;
  /** MAC address if exposed by provider. Optional. */
  mac?: string;
  /** Reachability: 1 = online, 0 = offline. Optional (omit when unknown). */
  status?: 0 | 1;
  /** Room/area name if exposed by provider. Optional. */
  room?: string;
}

export interface DeviceAggregatorError {
  provider_type: ProviderType;
  message: string;
}

/**
 * Response shape for GET /api/v1/devices.
 * Extends PaginatedResponse<Device> with errors[] for partial-failure surfacing (D-13).
 */
export interface DeviceAggregatorResponse {
  items: Device[];
  total_count: number;
  limit: number;
  offset: number;
  errors: DeviceAggregatorError[];
}
```

`[VERIFIED file location convention: types/registry.ts, types/sonosProxy.ts, types/raspi.ts all live at project root /types/, not /lib/types/]`. CONTEXT.md mentions `lib/types/common.ts` but that file does NOT exist — `PaginatedResponse<T>` is at `types/common.ts`.

### Documentation Update Pattern (D-21)

Update `docs/api/README.md` §GET /api/v1/devices (currently lines 346-407 per file inspection). Replace:

1. Existing example response (single-provider Fritz!Box items) → multi-provider example with at least 3 distinct `provider_type` values, plus `errors: []`.
2. Existing `interface Device` block → new slim shape with optional fields, `provider_type` literal union.
3. Add `?provider_type=` query param to the params table.
4. Add `errors[]` to the response interface.
5. Add a one-line note: "Partial provider failures return HTTP 200 with the failed provider listed in `errors[]`."

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29.x via `next/jest.js` (App Router-aware) |
| Config file | `jest.config.ts` (root) |
| Quick run command | `npm test -- app/api/v1/devices/__tests__/route.test.ts` |
| Full suite command | `npm run test:api` (per CLAUDE.md rule 8 — never bare `npm test`) |
| Estimated runtime | ~3-5s for the new test file alone; ~30-60s for `test:api` |

`[VERIFIED: jest.config.ts shows testMatch '**/__tests__/**/*.[jt]s?(x)' and '**/?(*.)+(spec|test).[jt]s?(x)']`. Co-located `app/api/v1/devices/__tests__/route.test.ts` is auto-picked up.

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COMMON-02 | All 8 providers contribute items via `Promise.allSettled` | unit | `npm test -- app/api/v1/devices/__tests__/route.test.ts -t "aggregates items from all 8 providers"` | ❌ Wave 0 |
| COMMON-02 | Each item carries `provider_type` matching its source | unit | `npm test -- app/api/v1/devices/__tests__/route.test.ts -t "provider_type discriminator"` | ❌ Wave 0 |
| COMMON-02 | Partial failure: one provider rejects, response stays 200 | unit | `npm test -- app/api/v1/devices/__tests__/route.test.ts -t "errors\[\] when one provider rejects"` | ❌ Wave 0 |
| COMMON-02 | Each provider mapper produces correct shape (8 tests, one per provider) | unit | `npm test -- app/api/v1/devices/__tests__/route.test.ts -t "mapper"` | ❌ Wave 0 |
| D-20 | `?provider_type=hue` skips fan-out to other 7 providers | unit | `npm test -- app/api/v1/devices/__tests__/route.test.ts -t "skips fan-out for excluded"` | ❌ Wave 0 |
| D-20 | Invalid `?provider_type=foo` returns 200 with `items: []` | unit | `npm test -- app/api/v1/devices/__tests__/route.test.ts -t "invalid provider_type"` | ❌ Wave 0 |
| D-18 | Limit clamping (limit=0 → 1, limit=2000 → 1000, limit=-5 → 100) | unit | `npm test -- app/api/v1/devices/__tests__/route.test.ts -t "limit clamping"` | ❌ Wave 0 |
| D-19 | Offset beyond `total_count` returns 200 + `items: []` + correct `total_count` | unit | `npm test -- app/api/v1/devices/__tests__/route.test.ts -t "offset"` | ❌ Wave 0 |
| D-17 | Sort: provider_type ASC then name Italian-locale | unit | `npm test -- app/api/v1/devices/__tests__/route.test.ts -t "sort"` | ❌ Wave 0 |
| Auth | Returns 401 when not authenticated | unit | `npm test -- app/api/v1/devices/__tests__/route.test.ts -t "401"` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- app/api/v1/devices/__tests__/route.test.ts` (~3-5s, well within 30s rule)
- **Per wave merge:** `npm run test:api` (~30-60s)
- **Phase gate (before `/gsd-verify-work`):** `npm run test:api` green + `npm run test:components` green + Playwright smoke green (no current consumer of `/api/v1/devices`, so smoke just verifies pages still load)

### Wave 0 Gaps

- [ ] `app/api/v1/devices/__tests__/route.test.ts` — covers ALL of COMMON-02. New file. Use `app/api/v1/automations/__tests__/route.test.ts` as scaffold.
- [ ] `types/devices.ts` — new type module (Device, ProviderType, DeviceAggregatorResponse, DeviceAggregatorError). Required before mappers compile.
- [ ] (Optional, if mappers extracted) `lib/devices/aggregator/__tests__/mappers.test.ts` — pure unit tests for each mapper function. Faster + finer-grained than the route-level test. Recommended for the multi-step Netatmo mapper specifically.

### Nyquist Coverage (2x sampling: bare-minimum independent test cases)

Per the Nyquist rule (sample at >=2x the failure rate), the **minimum independent test cases** are:

1. **Happy path (1 case):** All 8 providers succeed → 8 `provider_type` values present, `errors: []`.
2. **Partial failure (1 case per provider type, 8 cases):** One provider rejects → that provider in `errors[]`, others still contribute, status 200. **Reduce to 2 cases for the test file** (one multi-item provider e.g. Fritz!Box, one single-item provider e.g. Raspi) since the code path is symmetric.
3. **All-fail edge (1 case):** All 8 providers reject → `items: []`, `errors[].length === 8`, status 200.
4. **Filter (3 cases):** `?provider_type=hue` → only Hue called; `?provider_type=foo` (invalid) → 200 with empty items and no fan-out; missing param → all 8 called.
5. **Pagination (4 cases):** `limit=0` → effectively 1; `limit=2000` → 1000; `limit=-5` → 100 (default); `offset` beyond total → empty items, total preserved.
6. **Sort (1 case):** Seeded items in reverse provider/name order → output matches expected order.
7. **Auth (1 case):** No session → 401.
8. **Per-provider mapper shape (8 cases):** One assertion per provider that the emitted item has the required+expected optional fields. Can be done in a single parametrized `describe.each` block.

**Total minimum: ~20 distinct test cases** in one file. Estimated ~150-250 LOC. Well within 30s runtime budget.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Netatmo module type strings `'NATherm1'` (thermostat) and `'NRV'` (valve) | Pattern 5, Pitfall 1 | Mapper filters out everything → empty Netatmo contribution. Mitigation: planner should `console.log` actual `homesdata.body.homes[0].modules[].type` values during impl, OR use `getProxyValveStatus()` for valves (unambiguous reachable boolean) and only `homesdata` for thermostats. |
| A2 | Single-item providers (Raspi, Thermorossi) emit an item even on rejection rather than going to `errors[]` (Pitfall 4) | Pattern 5, Pitfall 4 | If wrong interpretation, tests will be written against the wrong contract. Mitigation: planner locks decision in PLAN.md before Wave 0 test scaffolding. |
| A3 | `success(data)` accepts the new `errors[]` field unchanged | Pattern 2 | Function spreads `data` into response object; verified against source `[VERIFIED: lib/core/apiResponse.ts:34-49]` — but planner should run a quick `tsc` check after first compile. |
| A4 | Hue `room_name` is the right room source (not e.g. `room_id` resolved against a separate rooms call) | D-06, Pattern 5 | If `room_name` is null in production, items get no room. `[VERIFIED: types/hueProxy.ts:69 — room_name is on HueLight directly]`. Acceptable. |
| A5 | DIRIGERA `is_reachable` is the right signal for status (not `data_freshness`) | D-09, Pattern 5 | `[VERIFIED: types/dirigeraProxy.ts:42-53]` — DirigeraSensor has both. `is_reachable` is the per-device signal, `data_freshness` is provider-wide. Use `is_reachable`. |

## Open Questions (RESOLVED)

1. **Netatmo module type filter (A1).**
   - What we know: `NetatmoProxyModule` has `type: string` field; common Netatmo types are `NATherm1` (thermostat), `NRV` (valve), `NACamera`/`NOC` (cameras — but those are in `cameras[]`, not modules).
   - What's unclear: Whether the proxy's `homesdata` exposes any other module types we should include or exclude (e.g., relays, weather modules).
   - Recommendation: Filter inclusively `m.type === 'NATherm1' || m.type === 'NRV'`. Log unknown types via `console.warn` for diagnostic. Or: remove the filter entirely and emit all modules (with `type` field reflecting the raw Netatmo type) — simpler and future-proof.
   - **RESOLVED:** filter to `'NATherm1'` (thermostat) and `'NRV'` (valve); skip other module types. A1 risk accepted — if an unknown module type appears in production, it is silently ignored. Future enhancement: log unknown types via `console.warn` for visibility.

2. **Status field for single-item providers (A2).**
   - What we know: D-11/D-12 say "status from getHealth() result". D-13 says failed providers go in `errors[]`.
   - What's unclear: Are Raspi/Thermorossi exempt from `errors[]`? My recommendation: yes (they always emit one item; status reflects health).
   - Recommendation: Lock in PLAN.md as a comment near the mapper.
   - **RESOLVED:** Raspi and Thermorossi mappers always emit exactly one item. On rejection, the item is emitted with `status=0` and the failure is NOT pushed to `errors[]`. Locked in Plan 02 `mapRaspi`/`mapThermorossi`.

3. **Whether to extract mappers to `lib/devices/aggregator/`.**
   - What we know: Each mapper is ~10-25 LOC. Total inline ≈ 80-150 LOC. Plus the orchestrator ≈ 60 LOC. Route file ≈ 250 LOC if inline.
   - What's unclear: Project preference for size threshold.
   - Recommendation: Inline first. Extract only if route exceeds 250 LOC OR if mapper unit tests are desired (cleaner test surface). The Netatmo mapper alone is a good candidate for extraction because it has 2 inputs and a non-trivial filter.
   - **RESOLVED:** keep all 8 mappers inline in `app/api/v1/devices/route.ts`. Re-evaluate extraction to `lib/devices/aggregator/mappers.ts` only if the file exceeds ~250 LOC after implementation. Locked in Plan 02.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js dev/test | ✓ (project precondition) | 20+ | — |
| HA proxy (HA_API_URL) | All 8 provider proxies at runtime | ✓ in dev/prod | — | Not required for unit tests (proxies are mocked) |
| Auth0 (AUTH0_*) | `withAuthAndErrorHandler` middleware | ✓ in prod | — | `BYPASS_AUTH=true` for local dev (already in jest.setup) |

**No external dependencies needed for testing** — all proxies are mocked via `jest.mock('@/lib/{provider}/...')`. Implementation runs in any Next.js dev environment with valid HA_API_URL/HA_API_KEY env vars (already configured for v19.0).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single-provider devices route | Multi-provider aggregator with `Promise.allSettled` | Phase 173 | Closes COMMON-02 audit gap |
| `Promise.all` for fan-out (rejects on first failure) | `Promise.allSettled` (per-result handling) | `/health` route Phase 156 | Pattern enables partial-failure responses |
| `lib/types/` location | `types/` at project root | Earlier phase (not pinpointed) | All current types live at `/types/`. CONTEXT.md ref to `lib/types/common.ts` is stale — actual file is `types/common.ts`. |

**Deprecated/outdated:**
- The old `/api/v1/devices` Fritz!Box-only contract is documented in `docs/api/README.md` and will be replaced.
- `lib/types/common.ts` referenced in CONTEXT.md does NOT exist — actual location is `types/common.ts`.

## Project Constraints (from CLAUDE.md)

| Rule | Applicability | Compliance |
|------|---------------|------------|
| 1. Never break existing functionality | Critical | Phase rewrites a route with **no current frontend consumer** (per CONTEXT.md "no frontend consumer of `/api/v1/devices` exists today"). Contract change is safe. Backwards-compat note: legacy field set (`ip`, `name`, `mac`, `status`, `provider_type`) for Fritz!Box items still works because all those fields are present in the new shape. |
| 2. Wait for user confirmation before version updates | N/A | No package updates. |
| 3. Prefer editing existing files over creating new | Applies | Plan should: rewrite `app/api/v1/devices/route.ts`, edit `docs/api/README.md`. Create only `types/devices.ts` (new types) and the test file (which is required). Optional new files limited to mapper extraction. |
| 4. Never execute `npm run build` or `npm install` | Applies | No new deps, no build commands in tasks. |
| 5. Always create/update unit tests | Applies | New test file mandatory per ROADMAP success criterion #4 ("Unit tests cover each provider contribution shape + one failed-provider scenario"). |
| 6. Use design system | N/A | No UI in this phase. |
| 7. Never commit/push without explicit request | Applies | Standard. |
| 8. Use scoped test subsets — never bare `npm test` | Critical for tasks | Every `<verify><automated>` block must use `npm test -- <path>` or `test:api` / `test:changed`. |

## Sources

### Primary (HIGH confidence)
- `app/health/route.ts` — Canonical 8-provider Promise.allSettled fan-out template
- `app/api/v1/devices/route.ts` — Current Fritz!Box-only impl (47 lines)
- `lib/core/apiResponse.ts:34-49` — `success()` signature accepts `Record<string, unknown>`
- `lib/core/middleware.ts:152` — `withAuthAndErrorHandler` signature
- `lib/fritzbox/fritzboxClient.ts:62-74` — `getDevices()` return shape
- `lib/hue/hueProxy.ts:41-43` — `getLights()` returns `HueLight[]`
- `lib/sonos/sonosProxy.ts:58-60` — `getDevices()` returns `SonosDeviceResponse[]`
- `lib/netatmo/netatmoProxy.ts:60-69, 132-134` — `getProxyHomestatus()`, `getProxyHomesdata()`, `getProxyCameraStatus()`
- `lib/dirigera/dirigeraProxy.ts:48-50` — `getSensors()` returns `DirigeraSensorsResponse`
- `lib/tuya/tuyaProxy.ts:46-48` — `getPlugs()` returns `TuyaPlug[]`
- `lib/raspi/raspiClient.ts:28-30` — `getHealth()` returns `RaspiHealthResponse`
- `lib/stove/thermorossiProxy.ts:63-65` — `getHealth()` returns `ThermorossiHealthResponse`
- `types/netatmoProxy.ts:32-48, 96-120, 229-246` — Netatmo response shapes (homestatus rooms-only vs homesdata modules)
- `types/sonosProxy.ts:36-48` — `SonosDeviceResponse` (no room field)
- `types/tuyaProxy.ts:33-45` — `TuyaPlug` (no name field, has custom_name)
- `types/dirigeraProxy.ts:42-53` — `DirigeraSensor` (is_reachable, room, custom_name)
- `types/hueProxy.ts:56-74` — `HueLight` (room_name, reachable, custom_name)
- `types/common.ts:7-12` — `PaginatedResponse<T>` shape
- `app/api/v1/automations/__tests__/route.test.ts` — Test scaffold template
- `app/api/v1/sonos/zones/__tests__/route.test.ts` — Provider-mock test pattern
- `app/api/registry/devices/route.ts:13-18` — Query param parsing precedent
- `app/api/notifications/errors/route.ts:69` — `Math.min` limit clamp precedent
- `app/rooms/page.tsx:44`, `app/network/components/DeviceListTable.tsx:151`, `app/telefonia/components/DectHandsetsTable.tsx:106` — `localeCompare(b.name, 'it')` precedent (8+ occurrences project-wide)
- `docs/api/README.md:346-407` — Current GET /api/v1/devices documentation to be updated

### Secondary (MEDIUM confidence)
- `.planning/milestones/v15.0-phases/121-device-registry-ui/121-01-SUMMARY.md` — Italian-locale sort historical note
- `.planning/phases/172-fritzbox-v1-path-migration/172-VALIDATION.md` — Recent VALIDATION.md template

### Tertiary (LOW confidence — to verify during impl)
- Netatmo module type strings `'NATherm1'`, `'NRV'` — common but not directly verified in this codebase. Planner should `console.log` actual values once during dev OR use `getProxyValveStatus()` (which has a clean `reachable` boolean) for valves and rely on `homesdata` for thermostats only.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every dependency already in repo and exercised by `/health`.
- Architecture: HIGH — direct mirror of `/health` route plus a per-provider mapping step. No novel architecture.
- Pitfalls: HIGH for #1, #2, #3, #5, #6 (all verified in source). MEDIUM for #4 (interpretation of D-11/D-12 vs D-13 — flagged in Assumptions Log).
- Test approach: HIGH — direct adaptation of `automations/route.test.ts` pattern, multiplied by 8 mocked providers.

**Research date:** 2026-04-25
**Valid until:** 2026-05-25 (stable codebase, no library churn expected; verify A1 module-type strings during implementation)

---

*Phase: 173-cross-provider-device-aggregator*
*Research completed: 2026-04-25*
