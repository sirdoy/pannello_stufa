# Phase 173: Cross-Provider Device Aggregator - Pattern Map

**Mapped:** 2026-04-25
**Files analyzed:** 5 (1 rewrite, 1 new types, 1 optional new mappers, 1 doc edit, 1 new test)
**Analogs found:** 5 / 5

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/api/v1/devices/route.ts` (rewrite) | route handler / aggregator | request-response, fan-out | `app/health/route.ts` | exact (8-provider Promise.allSettled fan-out) |
| `types/devices.ts` (new) | type module (literal union + interface) | n/a | `types/websocket.ts` (Topic union) + `types/registry.ts` (interface module) | exact (same 8-provider literal set, same project convention) |
| `lib/devices/aggregator/mappers.ts` (new, OPTIONAL) | utility / pure transform | transform | inline mappers in `app/health/route.ts` | role-match (no existing extracted mapper module) |
| `app/api/v1/devices/__tests__/route.test.ts` (new) | unit test | request-response mock | `app/api/v1/automations/__tests__/route.test.ts` | exact (multi-mock Jest scaffold for `withAuthAndErrorHandler` route) |
| `docs/api/README.md` §GET /api/v1/devices (edit) | documentation | n/a | existing same-section block | exact (in-place rewrite of same section) |

## Pattern Assignments

### `app/api/v1/devices/route.ts` (route handler, fan-out + sort + paginate)

**Primary analog:** `app/health/route.ts` (lines 1-79)
**Secondary analog (query params):** `app/api/registry/devices/route.ts` (lines 12-20)
**Secondary analog (limit clamp):** `app/api/notifications/errors/route.ts` line 69
**Existing file being rewritten:** `app/api/v1/devices/route.ts` (47 lines, Fritz!Box-only)

**Imports pattern** — copy directly from `app/health/route.ts:25-33`:
```typescript
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getHealth as getThermorossiHealth } from '@/lib/stove/thermorossiProxy';
import { getProxyHealth as getNetatmoHealth } from '@/lib/netatmo/netatmoProxy';
import { getHealth as getHueHealth } from '@/lib/hue/hueProxy';
import { getHealth as getSonosHealth } from '@/lib/sonos/sonosProxy';
import { getHealth as getDirigeraHealth } from '@/lib/dirigera/dirigeraProxy';
import { getHealth as getTuyaHealth } from '@/lib/tuya/tuyaProxy';
import { raspiClient } from '@/lib/raspi';
import { fritzboxClient } from '@/lib/fritzbox';
```
For Phase 173 swap the health calls for listing calls: `getLights`, `getDevices` (Sonos), `getProxyHomesdata` + `getProxyCameraStatus` (Netatmo, NOT homestatus — see Pitfall 1 in RESEARCH), `getSensors`, `getPlugs`, `fritzboxClient.getDevices()`, `raspiClient.getHealth()`, `getThermorossiHealth()`. Also import the new types: `import type { Device, ProviderType } from '@/types/devices';`.

**Route export header** — copy from `app/health/route.ts:35`:
```typescript
export const dynamic = 'force-dynamic';
```

**Auth/wrapper pattern** — copy from `app/health/route.ts:41` and from current `app/api/v1/devices/route.ts:29`:
```typescript
export const GET = withAuthAndErrorHandler(async (request) => {
  // ... handler body ...
}, 'Devices/Aggregated');
```
Note the second arg `'Devices/Aggregated'` is the log context — keep it (current route already uses this exact label).

**Promise.allSettled fan-out skeleton** — mirror `app/health/route.ts:42-60` byte-for-byte, replacing health calls with listing calls:
```typescript
const [
  thermorossiResult,
  netatmoResult,
  hueResult,
  sonosResult,
  dirigeraResult,
  tuyaResult,
  raspiResult,
  fritzboxResult,
] = await Promise.allSettled([
  getThermorossiHealth(),                     // single-item provider
  Promise.all([                               // Netatmo: combine homesdata + cameras
    getProxyHomesdata(),
    getProxyCameraStatus(),
  ]),
  getLights(),
  getSonosDevices(),
  getSensors(),
  getPlugs(),
  raspiClient.getHealth(),                    // single-item provider
  fritzboxClient.getDevices(),
]);
```
This destructured pattern is unambiguous (one named slot per provider). Trade-off vs. the perf-optimized provider-filter loop in RESEARCH §Pitfall 5: planner should pick. If the destructured form is kept, the `?provider_type=` filter is applied AFTER the fan-out (still correct, but wastes 7 HTTP calls when filter is set).

**Per-result mapping (fulfilled → items, rejected → errors[] + warn)** — pattern mirrors `app/health/route.ts:62-71` (which maps `result.status === 'fulfilled' ? 'ok' : 'down'`). For Phase 173 we need a richer mapping: on success push mapped items, on failure push `{ provider_type, message }` to `errors[]` and `console.warn`. Use this idiom:
```typescript
const items: Device[] = [];
const errors: Array<{ provider_type: ProviderType; message: string }> = [];

if (fritzboxResult.status === 'fulfilled') {
  items.push(...mapFritzbox(fritzboxResult.value));
} else {
  const message = fritzboxResult.reason instanceof Error
    ? fritzboxResult.reason.message
    : String(fritzboxResult.reason);
  errors.push({ provider_type: 'fritzbox', message });
  console.warn('[Devices/Aggregated] fritzbox failed:', message);
}
// ... repeat per provider
```
The `console.warn` matches the diagnostic pattern in `app/health/route.ts` and the project convention from CONTEXT.md §code_context (`console.warn for infra failures`).

**Query-param parsing pattern** — copy from `app/api/registry/devices/route.ts:13-18` (verbatim approach: `request.nextUrl.searchParams`):
```typescript
const sp = request.nextUrl.searchParams;
const rawLimit = sp.has('limit') ? Number(sp.get('limit')) : 100;
const rawOffset = sp.has('offset') ? Number(sp.get('offset')) : 0;
const providerFilterRaw = sp.get('provider_type');
```

**Limit clamp pattern** — copy from `app/api/notifications/errors/route.ts:69`:
```typescript
// Existing precedent: const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
// For Phase 173, extend to clamp BOTH ends per D-18:
const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(rawLimit, 1000)) : 100;
const offset = Number.isFinite(rawOffset) ? Math.max(0, rawOffset) : 0;
```

**Italian-locale sort pattern** — copy from `app/network/components/DeviceListTable.tsx:145-152` (the closest analog, since it sorts a device list by a primary key then locale name):
```typescript
const sortedDevices = [...devices].sort((a, b) => {
  // Primary sort: online devices first
  if (a.active !== b.active) {
    return a.active ? -1 : 1;
  }
  // Secondary sort: alphabetical by name
  return a.name.localeCompare(b.name, 'it');
});
```
Adapt for D-17 (provider_type ASC then name Italian-locale):
```typescript
items.sort((a, b) => {
  const providerCmp = a.provider_type.localeCompare(b.provider_type);
  if (providerCmp !== 0) return providerCmp;
  return a.name.localeCompare(b.name, 'it');
});
```
Simpler precedent for the second key alone: `app/rooms/page.tsx:44`:
```typescript
const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name, 'it'));
```

**Pagination slice pattern** — there is no exact in-process slice precedent in the codebase (existing paginated routes delegate to `proxy.getXxx({limit, offset})`). Use the standard JS idiom:
```typescript
const total_count = items.length;
const paged = items.slice(offset, offset + limit);
```
Apply AFTER sort, per D-16.

**Response wrapper pattern** — copy from current `app/api/v1/devices/route.ts:40-45`:
```typescript
return success({
  items: paged,
  total_count,
  limit,
  offset,
  errors,
});
```
**Verified safe to extend with `errors[]`:** `success()` signature is `(data: Record<string, unknown>, ...)` — see `lib/core/apiResponse.ts:34-49`. It spreads `data` into `{ success: true, ...data }`. Adding the new `errors` field requires no helper change.

---

### `types/devices.ts` (type module — NEW)

**Primary analog (literal union):** `types/websocket.ts:29-31` — exact same 8-provider literal set, same alphabetical-ish grouping convention.
**Secondary analog (interface module conventions):** `types/registry.ts:1-43` and `types/sonosProxy.ts` — short interface-only files at project root `/types/`, JSDoc per field, no `lib/types/` (CONTEXT.md mention of `lib/types/common.ts` is stale per RESEARCH §State of the Art).

**ProviderType literal union pattern** — copy structure from `types/websocket.ts:29-31`:
```typescript
/** All available WebSocket subscription topics */
export type Topic =
  | 'fritzbox' | 'dirigera' | 'netatmo' | 'thermorossi'
  | 'hue' | 'sonos' | 'raspi' | 'tuya';
```
Adapt for `ProviderType`:
```typescript
/** Source provider discriminator on aggregated Device items. */
export type ProviderType =
  | 'fritzbox' | 'hue' | 'sonos' | 'netatmo'
  | 'dirigera' | 'tuya' | 'raspi' | 'thermorossi';
```
Note: alphabetical ordering optional; matching the `Topic` grouping (8-tuple split 4+4) is fine. The set MUST equal `Topic` minus none (every WS-subscribable provider is also a device-listing provider).

**Interface pattern** — copy structure from `types/registry.ts:6-26`:
```typescript
export interface DeviceType {
  slug: string;        // Pattern: ^[a-z0-9_]+$, max 64 chars
  label: string;       // Max 128 chars
  is_builtin: boolean; // Built-in types cannot be deleted
  created_at: number;  // Unix timestamp
}

export interface RegistryDevice {
  id: number;
  provider_name: string;    // e.g. "hue", "dirigera", "netatmo"
  device_id: string;        // Provider-internal device identifier
  custom_name: string;
  device_type_slug: string;
  ...
}
```
Adapt for the new `Device` aggregator interface (slim core + optional fields per D-01, omit-when-absent convention per RESEARCH §Type Definitions):
```typescript
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

**PaginatedResponse extension precedent:** `types/common.ts:7-12` is the existing shared shape. The new `DeviceAggregatorResponse` adds `errors[]` and is intentionally NOT a `PaginatedResponse<Device> & { errors: ... }` intersection — D-13 mandates `errors[]` as a first-class field, and an explicit interface is clearer for downstream typing. Pattern: define standalone, document the relationship in JSDoc (as in the snippet above).

---

### `lib/devices/aggregator/mappers.ts` (utility — NEW, OPTIONAL per D-21)

**Primary analog:** No existing mapper-module precedent — closest pattern is the inline mapping inside `app/health/route.ts:62-71` (per-result `result.status === 'fulfilled' ? ... : ...`). Recommendation per RESEARCH §Open Questions #3: inline first, extract only if the route exceeds ~250 LOC.

**Mapper function signature pattern** — pure function `(proxyResponse) => Device[]`. Use `Awaited<ReturnType<typeof providerFn>>` to derive input types without re-importing internal proxy types (matches the project's lightweight typing style):
```typescript
import { fritzboxClient } from '@/lib/fritzbox';
import type { Device } from '@/types/devices';

export function mapFritzbox(
  devices: Awaited<ReturnType<typeof fritzboxClient.getDevices>>
): Device[] {
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
```
The Fritz!Box `getDevices()` shape is verified at `lib/fritzbox/fritzboxClient.ts:62-74`:
```typescript
async function getDevices(): Promise<Array<{ id: string; name: string; ip: string; mac: string; active: boolean }>>
```

**Per-provider field-source map** (extracted from RESEARCH §Pattern 1 + verified shapes):

| Provider | Source fn | Native ID field | Name field | Status derivation | Optional fields |
|----------|-----------|-----------------|------------|-------------------|-----------------|
| fritzbox | `fritzboxClient.getDevices()` | `d.mac \|\| d.ip` | `d.name` | `d.active ? 1 : 0` | `ip`, `mac`, `type='network_device'` |
| hue | `getLights()` → `HueLight[]` | `l.light_id` | `l.custom_name ?? l.name` | `l.reachable ? 1 : 0` | `type='light'`, `room: l.room_name ?? undefined` |
| sonos | `getDevices()` → `SonosDeviceResponse[]` | `d.uid` | `d.custom_name ?? d.name` | `d.is_visible ? 1 : 0` (or omit; see Pitfall 2) | `type='speaker'`, `ip: d.ip` (verified `types/sonosProxy.ts:39`) — note Pitfall 2 says no `room` field |
| netatmo | `getProxyHomesdata()` + `getProxyCameraStatus()` | `m.id` / `c.camera_id` | `m.name` / `c.name ?? c.camera_id` | for cameras: `c.status === 'on' ? 1 : 0`; for modules: see Pitfall 1 + open Q #1 (use `getProxyValveStatus()` if cleaner reachable signal needed) | `type='thermostat'\|'valve'\|'camera'`, `room` from rooms map |
| dirigera | `getSensors()` → `{ sensors: DirigeraSensor[] }` | `s.id` | `s.custom_name` | `s.is_reachable ? 1 : 0` | `type` mapped from `s.type` (`'openCloseSensor'→'contact_sensor'`, `'occupancySensor'→'motion_sensor'`, fallback `'sensor'`), `room: s.room ?? undefined` |
| tuya | `getPlugs()` → `TuyaPlug[]` | `p.device_id` | `p.custom_name ?? p.device_id` (Pitfall 3) | `p.data_freshness === 'UNREACHABLE' ? 0 : 1` (or `p.switch_on === null ? 0 : 1`) | `type='plug'` |
| raspi | `raspiClient.getHealth()` (single-item) | literal `'host'` | literal `'Raspberry Pi'` | `result.status === 'fulfilled' ? 1 : 0` (Pitfall 4 — emit one item even on rejection, do NOT push to `errors[]`) | `type='host'` |
| thermorossi | `getHealth()` (single-item) → `ThermorossiHealthResponse` | literal `'stove'` | literal `'Stufa'` | `result.status === 'fulfilled' && result.value.status === 'ok' ? 1 : 0` (Pitfall 4 — same as raspi) | `type='stove'` |

**Single-item mapper signature pattern** (Raspi/Thermorossi take the raw `PromiseSettledResult` so they can emit a `status: 0` item even on rejection — see RESEARCH §Pattern 5 + Pitfall 4):
```typescript
export function mapRaspi(result: PromiseSettledResult<unknown>): Device[] {
  return [{
    id: 'raspi:host',
    name: 'Raspberry Pi',
    provider_type: 'raspi',
    type: 'host',
    status: result.status === 'fulfilled' ? 1 : 0,
  }];
}
```

---

### `app/api/v1/devices/__tests__/route.test.ts` (unit test — NEW)

**Primary analog:** `app/api/v1/automations/__tests__/route.test.ts` (lines 1-149 — full file is the scaffold).
**Secondary analog (provider-mock specifics):** `app/api/v1/sonos/zones/__tests__/route.test.ts:1-43` — minimal Jest pattern for mocking a proxy module + auth0.

**Imports + jest.mock setup** — copy from `automations/route.test.ts:1-22`, multiplied by 8 providers (one mock per provider proxy module, plus auth0):
```typescript
jest.mock('@/lib/automations');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));
jest.mock('@/lib/core/requestParser', () => ({
  ...jest.requireActual('@/lib/core/requestParser'),
  parseJson: jest.fn(),
}));

import { GET, POST } from '../route';
import { automationsProxy } from '@/lib/automations';
import { auth0 } from '@/lib/auth0';
import { parseJson } from '@/lib/core/requestParser';

const mockGetSession = jest.mocked(auth0.getSession);
const mockAutomationsProxy = jest.mocked(automationsProxy);
const mockParseJson = jest.mocked(parseJson);

const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };
```
Adapt for Phase 173 — 8 provider mocks:
```typescript
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
import { getDevices as getSonosDevices } from '@/lib/sonos/sonosProxy';
import { getProxyHomesdata, getProxyCameraStatus } from '@/lib/netatmo/netatmoProxy';
import { getSensors } from '@/lib/dirigera/dirigeraProxy';
import { getPlugs } from '@/lib/tuya/tuyaProxy';
import { raspiClient } from '@/lib/raspi';
import { getHealth as getThermorossiHealth } from '@/lib/stove/thermorossiProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockFritzGetDevices = jest.mocked(fritzboxClient.getDevices);
const mockGetLights = jest.mocked(getLights);
// ... etc per provider
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };
```

**`describe` + `beforeEach` reset pattern** — copy from `automations/route.test.ts:42-48`:
```typescript
describe('GET /api/v1/automations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  ...
});
```
The `console.warn` spy is critical — partial-failure tests assert on items in `errors[]`, but the route ALSO logs warnings. Without the spy, test output gets noisy.

**Auth 401 test pattern** — copy from `automations/route.test.ts:50-59` (verbatim, just rename the URL):
```typescript
it('returns 401 when not authenticated', async () => {
  mockGetSession.mockResolvedValue(null);
  const request = new Request('http://localhost:3000/api/v1/automations');

  const response = await GET(request as any, {} as any);
  const data = await response.json();

  expect(response.status).toBe(401);
  expect(data.code).toBe('UNAUTHORIZED');
});
```

**Happy-path test pattern** — copy from `automations/route.test.ts:61-72`, adapt for Phase 173 (seed each provider with one item, assert 8 distinct `provider_type` values):
```typescript
it('returns 200 with paginated automations data when authenticated', async () => {
  mockAutomationsProxy.getAutomations.mockResolvedValue(mockPaginatedRules);
  const request = new Request('http://localhost:3000/api/v1/automations');

  const response = await GET(request as any, {} as any);
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data.success).toBe(true);
  expect(data.items).toEqual([mockRule]);
  expect(mockAutomationsProxy.getAutomations).toHaveBeenCalled();
});
```

**Partial-failure test pattern** — no exact analog in `automations/route.test.ts`; build from RESEARCH §Pattern 4 (the proposed test in the research doc). The asymmetry to enforce: rejection of a multi-item provider → `errors[]` entry; rejection of a single-item provider (raspi/thermorossi) → no `errors[]` entry, item emitted with `status: 0`.

**Request constructor + handler invocation pattern** — copy from `automations/route.test.ts:53-55`:
```typescript
const request = new Request('http://localhost:3000/api/v1/devices');
const response = await GET(request as any, {} as any);
```
The double `as any` (request + context) is the project convention for invoking `withAuthAndErrorHandler`-wrapped routes in unit tests — verified across all `app/api/v1/**/__tests__/route.test.ts` files.

**Test-file location convention:** `app/api/v1/devices/__tests__/route.test.ts` (co-located). Verified across `app/api/v1/automations/__tests__/route.test.ts`, `app/api/v1/sonos/zones/__tests__/route.test.ts`, etc. Do NOT use `__tests__/api/...` (that tree was retired per RESEARCH §State of the Art).

**Test command (per CLAUDE.md rule 8):**
```bash
npm test -- app/api/v1/devices/__tests__/route.test.ts
```
NEVER bare `npm test`. For wave-merge gates: `npm run test:api`.

---

### `docs/api/README.md` §GET /api/v1/devices (edit, lines 346-407)

**Primary analog:** the existing same-section block at `docs/api/README.md:346-407`. This is an in-place rewrite, not a copy-from-elsewhere.

**Section structure to preserve** (already present, just update the contents):
1. Heading `### GET /api/v1/devices` + 1-line description
2. **Authentication:** line
3. **Query Parameters:** table — ADD a `provider_type` row
4. **Response:** JSON example — replace single-provider example with multi-provider items (≥3 distinct `provider_type` values) + `errors: []`
5. **TypeScript interface block** — replace `interface Device` with the new slim shape, add `interface DeviceAggregatorError`, update the response interface (add `errors`)
6. **curl** example — extend with `?provider_type=hue` example
7. New 1-line note: "Partial provider failures return HTTP 200 with the failed provider listed in `errors[]`."

**Existing block to replace** (`docs/api/README.md:385-400`):
```typescript
interface Device {
  ip: string;
  name: string;
  mac: string;
  status: 0 | 1; // 1=online, 0=offline
  provider_type: string | null;
}

interface PaginatedResponse<T> {
  items: T[];
  total_count: number;
  limit: number;
  offset: number;
}
```
Replace with the new `Device` (optional `ip`/`mac`/`status`/`type`/`room`, required `id`/`name`/`provider_type` literal union) plus `DeviceAggregatorResponse` with `errors[]`.

---

## Shared Patterns

### Auth (Auth0 session check)
**Source:** `lib/core/middleware.ts:152` — `withAuthAndErrorHandler(handler, logContext)`
**Apply to:** `app/api/v1/devices/route.ts` (kept identical to current route — no change required)
**Concrete usage:** `withAuthAndErrorHandler(async (request) => { ... }, 'Devices/Aggregated')`. Test stub: `jest.mock('@/lib/auth0', () => ({ auth0: { getSession: jest.fn() } }))`.

### Response wrapper
**Source:** `lib/core/apiResponse.ts:34-49` — `success(data, message?, status?)`
**Apply to:** `app/api/v1/devices/route.ts`
**Verified:** Accepts arbitrary `Record<string, unknown>` and spreads into `{ success: true, ...data }`. Adding `errors[]` requires no helper change.
```typescript
return success({ items: paged, total_count, limit, offset, errors });
```

### Promise.allSettled fan-out
**Source:** `app/health/route.ts:42-60`
**Apply to:** `app/api/v1/devices/route.ts`
**Excerpt:**
```typescript
const [aResult, bResult, ...] = await Promise.allSettled([fnA(), fnB(), ...]);
```
**Anti-pattern reminder (RESEARCH §Anti-Patterns):** never `Promise.all` — first rejection blows up the response. D-13 mandates 200 + `errors[]`.

### Italian-locale sort
**Source:** `app/network/components/DeviceListTable.tsx:151`, `app/rooms/page.tsx:44`, `app/telefonia/components/DectHandsetsTable.tsx:106` (8+ usages)
**Apply to:** `app/api/v1/devices/route.ts` and any extracted mapper that needs name ordering
**Excerpt:**
```typescript
a.name.localeCompare(b.name, 'it')
```
For provider_type primary key, use default `localeCompare` (ASCII-only): `a.provider_type.localeCompare(b.provider_type)` — no locale arg needed.

### Limit clamp
**Source:** `app/api/notifications/errors/route.ts:69`
**Apply to:** `app/api/v1/devices/route.ts`
**Excerpt:**
```typescript
const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
```
For Phase 173 (D-18: range 1–1000, default 100, clamp both ends, NaN-safe):
```typescript
const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(rawLimit, 1000)) : 100;
```

### Test scaffold (jest.mock + auth0 + console spies)
**Source:** `app/api/v1/automations/__tests__/route.test.ts` + `app/api/v1/sonos/zones/__tests__/route.test.ts`
**Apply to:** `app/api/v1/devices/__tests__/route.test.ts`
**Excerpt — beforeEach reset:**
```typescript
beforeEach(() => {
  jest.clearAllMocks();
  mockGetSession.mockResolvedValue(mockSession as any);
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});
```
**Excerpt — handler invocation:**
```typescript
const request = new Request('http://localhost:3000/api/v1/devices');
const response = await GET(request as any, {} as any);
const data = await response.json();
```

### `console.warn` for infra failures
**Source:** Inline pattern from `app/health/route.ts` philosophy + CONTEXT.md §code_context (`console.warn for infra failures — used across /health and other aggregator-style code; not a logging service abstraction`).
**Apply to:** `app/api/v1/devices/route.ts` per-provider rejection branch
**Excerpt:**
```typescript
console.warn('[Devices/Aggregated] fritzbox failed:', message);
```

### Literal-union type pattern
**Source:** `types/websocket.ts:29-31` — `Topic` (the only existing 8-provider literal union in the codebase)
**Apply to:** `types/devices.ts` — `ProviderType` (same set: fritzbox/dirigera/netatmo/thermorossi/hue/sonos/raspi/tuya)
**Excerpt:**
```typescript
export type Topic =
  | 'fritzbox' | 'dirigera' | 'netatmo' | 'thermorossi'
  | 'hue' | 'sonos' | 'raspi' | 'tuya';
```

### Type module location convention
**Source:** All current device/provider types live at `/types/` (root), not `/lib/types/`. Verified: `types/registry.ts`, `types/websocket.ts`, `types/sonosProxy.ts`, `types/hueProxy.ts`, `types/netatmoProxy.ts`, `types/dirigeraProxy.ts`, `types/tuyaProxy.ts`, `types/raspi.ts`, `types/common.ts`.
**Apply to:** new file goes at `types/devices.ts` (NOT `lib/types/devices.ts` — CONTEXT.md mention of `lib/types/common.ts` is stale per RESEARCH §State of the Art; the actual file is `types/common.ts`).

### `export const dynamic = 'force-dynamic'`
**Source:** Standard Next.js 15.5 / 16.x App Router header for API routes that read request data at call time. Used across all API routes (e.g. `app/health/route.ts:35`, `app/api/registry/devices/route.ts:5`, current `app/api/v1/devices/route.ts:23`).
**Apply to:** `app/api/v1/devices/route.ts` (already present in current file — keep it).

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| (none) | — | — | All five files in this phase have a strong codebase analog. The optional `lib/devices/aggregator/mappers.ts` extraction has no existing mapper-module precedent, but its function-export style mirrors any pure utility module under `lib/` (e.g. `lib/utils/*`); inline-first is recommended per RESEARCH §Open Questions #3. |

## Metadata

**Analog search scope:**
- `app/health/route.ts` (canonical 8-provider Promise.allSettled template)
- `app/api/v1/devices/route.ts` (current Fritz!Box-only impl — being rewritten)
- `app/api/v1/automations/__tests__/route.test.ts` + `app/api/v1/sonos/zones/__tests__/route.test.ts` (test scaffolds)
- `app/api/registry/devices/route.ts` + `app/api/notifications/errors/route.ts` (query-param + clamp precedents)
- `app/rooms/page.tsx` + `app/network/components/DeviceListTable.tsx` (Italian-locale sort)
- `lib/core/apiResponse.ts` + `lib/core/middleware.ts` (route helpers)
- `types/websocket.ts` (literal-union pattern)
- `types/registry.ts` + `types/sonosProxy.ts` + `types/dirigeraProxy.ts` + `types/tuyaProxy.ts` + `types/netatmoProxy.ts` + `types/hueProxy.ts` + `types/common.ts` (type-module conventions + verified provider response shapes)
- `lib/{fritzbox,hue,sonos,netatmo,dirigera,tuya,raspi,stove}/*.ts` (provider listing function signatures)
- `docs/api/README.md` lines 340-407 (existing doc block to update)

**Files scanned:** ~25
**Pattern extraction date:** 2026-04-25

---

## PATTERN MAPPING COMPLETE

**Phase:** 173 — Cross-Provider Device Aggregator
**Files classified:** 5
**Analogs found:** 5 / 5

### Coverage
- Files with exact analog: 4 (route, types, tests, docs)
- Files with role-match analog: 1 (optional mappers.ts — inline pattern in `app/health/route.ts` is closest)
- Files with no analog: 0

### Key Patterns Identified
- **Fan-out:** `Promise.allSettled([...8 promises])` with named destructure → per-result fulfilled/rejected branching, mirroring `app/health/route.ts:42-71` byte-for-byte.
- **Auth + response wrapper:** `withAuthAndErrorHandler(handler, 'Devices/Aggregated')` + `success({ items, total_count, limit, offset, errors })` — current route already uses these, no helper changes needed (`success()` accepts arbitrary `Record<string, unknown>`).
- **Type module location:** `/types/` at root (NOT `lib/types/`) — RESEARCH confirmed `lib/types/common.ts` referenced in CONTEXT.md is stale; actual file is `types/common.ts`.
- **Literal-union for `ProviderType`:** mirror `types/websocket.ts:29-31` `Topic` exactly (same 8-provider set, same grouping).
- **Italian-locale sort:** `a.name.localeCompare(b.name, 'it')` — 8+ existing usages, project convention since Phase 122.
- **Test scaffold:** `app/api/v1/automations/__tests__/route.test.ts` provides the full template (jest.mock per provider × 8 + auth0 mock + `console.warn` spy + `Request` + `as any` invocation pattern).
- **Single-item provider asymmetry (Raspi/Thermorossi):** mappers take `PromiseSettledResult` to emit `status: 0` on rejection rather than pushing to `errors[]` — locked decision per RESEARCH §Pitfall 4 / Open Q #2.

### File Created
`/Users/federicomanfredi/Sites/localhost/pannello-stufa/.planning/phases/173-cross-provider-device-aggregator/173-PATTERNS.md`

### Ready for Planning
Pattern mapping complete. Planner can now reference analog patterns in PLAN.md files with concrete file paths, line numbers, and copy-ready excerpts.
