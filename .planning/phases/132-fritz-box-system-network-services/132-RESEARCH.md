# Phase 132: Fritz!Box System & Network Services - Research

**Researched:** 2026-03-25
**Domain:** Fritz!Box API route extension (haGet proxy, Next.js App Router)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Add 7 new methods to existing `fritzboxClient` object in `lib/fritzbox/fritzboxClient.ts` — no new module or file split
- **D-02:** Each method is a thin `haGet` wrapper with inline response type, matching the 6 existing methods
- **D-03:** Keep inline types in `fritzboxClient.ts` — matches existing pattern (all current Fritz!Box methods use inline types, no separate `types/fritzboxProxy.ts` file exists)
- **D-04:** Use exact interface names and field types from `docs/api/fritzbox.md` TypeScript blocks as the haGet generic parameter
- **D-05:** New endpoints pass through raw API responses WITHOUT transformation (no camelCase renaming, no unit conversion)
- **D-06:** Existing bandwidth/device transformations remain untouched
- **D-07:** Reuse existing `parseTimestamp()` for any `fetched_at` fields in responses that need timestamp parsing
- **D-08:** All 7 new routes get rate limiting via `checkRateLimitFritzBox(session.user.sub, endpoint)`
- **D-09:** All 7 new routes get caching via `getCachedData(key, fetcher)` with default 60s TTL
- **D-10:** Cache keys follow existing convention: descriptive kebab-case (e.g., `system`, `wifi-clients`, `mesh-topology`)
- **D-11:** Nested route directories: `app/api/fritzbox/system/`, `app/api/fritzbox/wifi/clients/`, `app/api/fritzbox/wifi/networks/`, `app/api/fritzbox/network/dhcp/reservations/`, `app/api/fritzbox/network/port-forwarding/`, `app/api/fritzbox/network/upnp/`, `app/api/fritzbox/network/mesh/`
- **D-12:** All routes use `withAuthAndErrorHandler` + `success()` pattern from `lib/core`
- **D-13:** All route files export `const dynamic = 'force-dynamic'`
- **D-14:** WiFi clients route accepts `band` query parameter for filtering (passed through to HA proxy)
- **D-15:** Paginated endpoints (wifi/clients, dhcp/reservations, port-forwarding) accept `limit` + `offset` query params
- **D-16:** Let haGet propagate RFC 9457 errors — no extra error wrapping in client methods
- **D-17:** 503 from HA proxy passes through to frontend

### Claude's Discretion

- JSDoc comments on new client methods (brief, optional)
- Exact cache key naming within the kebab-case convention
- Whether to extract shared PaginatedResponse<T> from inline to a local type alias (it already exists inline)

### Deferred Ideas (OUT OF SCOPE)

- History tiers (bandwidth hourly/daily, device daily, auto-granularity) — Phase 133
- Budget stats endpoint — Phase 133
- Fritz!Box frontend page enhancements — Phase 134
- Telephony endpoints (DECT, calls, TAM) — explicitly excluded from v16.0 scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FRITZ-01 | GET /fritzbox/system — model, firmware, uptime, CPU load | `SystemResponse` interface fully documented in `docs/api/fritzbox.md` §Real-time Data; no CPU load field in spec — uptime + firmware + model confirmed present |
| FRITZ-02 | GET /fritzbox/wifi/clients — WiFi clients con signal, band, speed (filtro per band) | `WiFiClientModel` interface + `band` query param documented; paginated (`limit`/`offset`) |
| FRITZ-03 | GET /fritzbox/wifi/networks — reti WiFi configurate con stato | `WiFiStatusResponse` + `WiFiNetworkModel` documented; not paginated, flat `networks` array |
| FRITZ-04 | GET /fritzbox/network/dhcp/reservations — DHCP leases statici | `DhcpReservationModel` documented; paginated |
| FRITZ-05 | GET /fritzbox/network/port-forwarding — regole port forwarding attive | `PortForwardingRuleModel` documented; paginated; static rules only (UPnP rules excluded) |
| FRITZ-06 | GET /fritzbox/network/upnp — stato UPnP e port mappings | `UPnPStatusResponse` documented; flat object (enabled + upnp_ports array); NOT paginated |
| FRITZ-07 | GET /fritzbox/network/mesh — topologia mesh (nodi e link) | `MeshTopologyResponse` + `MeshNodeModel` + `MeshLinkModel` documented; flat object with richer metadata |
</phase_requirements>

---

## Summary

Phase 132 adds 7 new read-only GET endpoints extending the existing Fritz!Box infrastructure established in phases 61-67. All work is purely additive: 7 new methods appended to the `fritzboxClient` object in a single file, and 7 new route files in nested directories under `app/api/fritzbox/`. No new modules, no new environment variables, no frontend changes.

The pattern is identical across all 7 routes: `withAuthAndErrorHandler` + rate limit check + `getCachedData` + client method + `success()`. The only variation is the response shape passed to `success()` and the URL string passed to `haGet`. The canonical reference is `app/api/fritzbox/devices/route.ts` (confirmed read).

The Fritz!Box API spec in `docs/api/fritzbox.md` contains complete TypeScript interfaces and JSON examples for all 7 endpoints. All interfaces are to be copied verbatim as inline types in `fritzboxClient.ts` per D-04. No discovery of missing fields is needed — the spec is authoritative.

**Primary recommendation:** Follow the `devices/route.ts` + `getDevices()` pattern exactly, substituting the HA proxy path, inline type, and `success()` key name for each of the 7 endpoints. No architectural decisions remain open.

---

## Standard Stack

### Core (existing — no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `lib/haClient.ts` (internal) | — | haGet transport with X-API-Key auth | Shared across all 5 device providers |
| `lib/fritzbox/fritzboxCache.ts` (internal) | — | `getCachedData()` — 60s TTL Firebase RTDB | Used by all existing Fritz!Box routes |
| `lib/fritzbox/fritzboxRateLimiter.ts` (internal) | — | `checkRateLimitFritzBox()` — 10 req/min | Used by all existing Fritz!Box routes |
| `lib/core` (internal) | — | `withAuthAndErrorHandler`, `success`, `ApiError`, `ERROR_CODES`, `HTTP_STATUS` | Standard route wrapper |

No new packages required. All dependencies are already installed.

**Installation:** None needed.

---

## Architecture Patterns

### Route File Structure (7 new files)

```
app/api/fritzbox/
├── system/
│   └── route.ts                    # FRITZ-01
├── wifi/
│   ├── clients/
│   │   └── route.ts                # FRITZ-02
│   └── networks/
│       └── route.ts                # FRITZ-03
├── network/
│   ├── dhcp/
│   │   └── reservations/
│   │       └── route.ts            # FRITZ-04
│   ├── port-forwarding/
│   │   └── route.ts                # FRITZ-05
│   ├── upnp/
│   │   └── route.ts                # FRITZ-06
│   └── mesh/
│       └── route.ts                # FRITZ-07
```

### Client Method Structure (7 new methods in `lib/fritzbox/fritzboxClient.ts`)

```typescript
// Pattern: thin haGet wrapper, inline type, no transformation (D-05)
async function getSystemInfo(): Promise<SystemResponse> {
  return haGet<SystemResponse>('/api/v1/fritzbox/system');
}

// Pattern for paginated endpoints with query forwarding (D-14, D-15)
async function getWifiClients(params?: URLSearchParams): Promise<PaginatedResponse<WiFiClientModel>> {
  const query = params ? `?${params}` : '';
  return haGet<PaginatedResponse<WiFiClientModel>>(`/api/v1/fritzbox/wifi/clients${query}`);
}
```

### Route Pattern (canonical — `devices/route.ts`)

```typescript
// Source: app/api/fritzbox/devices/route.ts (confirmed)
import { withAuthAndErrorHandler, success, ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core';
import { fritzboxClient, getCachedData, checkRateLimitFritzBox } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (request, context, session) => {
  // 1. Rate limit check
  const rateLimitResult = await checkRateLimitFritzBox(session.user.sub, 'ENDPOINT_NAME');
  if (!rateLimitResult.allowed) {
    throw new ApiError(
      ERROR_CODES.RATE_LIMITED,
      `Troppe richieste. Riprova tra ${rateLimitResult.nextAllowedIn}s`,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      { retryAfter: rateLimitResult.nextAllowedIn }
    );
  }

  // 2. Fetch with cache (60s TTL)
  const data = await getCachedData('CACHE_KEY', () => fritzboxClient.METHOD());

  // 3. Return data
  return success({ KEY: data });
}, 'FritzBox/LABEL');
```

### Query Parameter Forwarding Pattern (for wifi/clients, dhcp/reservations, port-forwarding)

```typescript
// Source: existing pattern from devices/route.ts extended for query forwarding
export const GET = withAuthAndErrorHandler(async (request, context, session) => {
  // ... rate limit ...

  const { searchParams } = new URL(request.url);
  const params = new URLSearchParams();
  if (searchParams.get('band')) params.set('band', searchParams.get('band')!);
  if (searchParams.get('limit')) params.set('limit', searchParams.get('limit')!);
  if (searchParams.get('offset')) params.set('offset', searchParams.get('offset')!);

  const data = await getCachedData('wifi-clients', () => fritzboxClient.getWifiClients(params));
  return success({ clients: data });
}, 'FritzBox/WiFiClients');
```

### Anti-Patterns to Avoid

- **Transforming pass-through responses:** D-05 locks no camelCase or unit conversion for these 7 endpoints. Don't apply `.map()` transformations — return raw response.
- **Using `request` as unused variable:** For routes without query params (system, wifi/networks, upnp, mesh), the request parameter is not used. Mark `_request` or use `request` silently — TypeScript strict mode won't error since `withAuthAndErrorHandler` provides it.
- **Forgetting `export const dynamic = 'force-dynamic'`:** Every route file requires this export per D-13 and the Next.js 15 App Router pattern.
- **Creating separate type files:** D-03 locks inline types in `fritzboxClient.ts`. Do not create `types/fritzboxProxy.ts` or similar.
- **Caching query-variant responses with a static key:** For paginated endpoints where band/limit/offset vary, consider whether the cache key should include params. The decision log specifies `getCachedData('wifi-clients', ...)` — a static key — which caches the default response only. Match existing decisions.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth + error handling | Custom try/catch wrapper | `withAuthAndErrorHandler` from `lib/core` | Handles Auth0 session, ApiError propagation, RFC 9457 format |
| Rate limiting | Custom counter logic | `checkRateLimitFritzBox` from `lib/fritzbox` | Firebase RTDB-backed, 10 req/min, already configured |
| Response caching | Custom TTL logic | `getCachedData` from `lib/fritzbox` | 60s TTL, Firebase RTDB-backed, handles stale-on-error |
| HTTP transport | Direct fetch to HA proxy | `haGet` from `lib/haClient` | X-API-Key injection, RFC 9457 error parsing, timeout handling |
| Timestamp parsing | Custom Date parsing | `parseTimestamp()` in `fritzboxClient.ts` | Handles non-standard ISO 8601 with duplicate timezone suffix |

**Key insight:** Every cross-cutting concern (auth, rate limiting, caching, transport) has a pre-built solution. The only novel code is the inline type definition and the HA proxy path string for each endpoint.

---

## Common Pitfalls

### Pitfall 1: Passing query params through incorrectly for paginated routes

**What goes wrong:** Route reads `request.url` searchParams but builds the HA proxy URL incorrectly (e.g., appending raw search string `?band=5GHz&limit=50` to the path), causing the proxy to receive malformed URLs.
**Why it happens:** URLSearchParams vs string concatenation confusion.
**How to avoid:** Use `new URLSearchParams()` to build outbound params explicitly, set only params that are present in the inbound request.
**Warning signs:** Band filter returns all clients instead of filtered set.

### Pitfall 2: Static cache key for band-filtered wifi/clients requests

**What goes wrong:** `getCachedData('wifi-clients', ...)` caches the response for the first caller. A subsequent `?band=5GHz` request returns the unfiltered cached result.
**Why it happens:** The cache key doesn't encode the query variant.
**How to avoid:** Per D-14 and D-10, the decision is to pass params through to the HA proxy which handles filtering server-side. If caching variant responses is needed, include params in the cache key (e.g., `wifi-clients-5ghz`). However, since CONTEXT.md specifies a static `wifi-clients` key, pass params to the client method and let the proxy handle filtering. The 60s TTL is acceptable for this use case.
**Warning signs:** Band filter appears to work initially but returns wrong data after cache warms up.

### Pitfall 3: UPnP endpoint response shape — not paginated

**What goes wrong:** Treating `UPnPStatusResponse` as paginated (it has a `upnp_ports` array, not `items`/`total_count`), causing the route to incorrectly wrap `{ items: data }` instead of `{ upnp: data }`.
**Why it happens:** The other network service endpoints are paginated — UPnP is the exception.
**How to avoid:** UPnP response: `{ enabled: boolean, upnp_ports: [...], is_stale, fetched_at }`. Return as `success({ upnp: data })`, not `success({ items: data })`.
**Warning signs:** Frontend receives `{ upnp: { items: undefined } }`.

### Pitfall 4: Mesh topology has nullable fields in links

**What goes wrong:** Accessing `link.type` or `link.cur_rx_kbps` directly without handling null causes TypeScript strict errors.
**Why it happens:** `MeshLinkModel` has `type: string | null`, `state: string | null`, `cur_rx_kbps: number | null`, etc.
**How to avoid:** Use exact interface from docs (all nullable fields preserved as `T | null`). Since D-05 mandates no transformation, the raw response passes through — TypeScript types just need to match the spec exactly.
**Warning signs:** tsc errors on `link.type.toLowerCase()`.

### Pitfall 5: `SystemResponse` has no CPU load field

**What goes wrong:** FRITZ-01 requirement says "CPU load" but the `SystemResponse` interface in `docs/api/fritzbox.md` does NOT include a CPU load field. The spec shows: `model`, `firmware_version`, `update_available`, `device_uptime_seconds`, `device_uptime_formatted`, `is_stale`, `fetched_at`.
**Why it happens:** The requirement description mentions CPU load but the API doesn't expose it.
**How to avoid:** Use the exact `SystemResponse` interface from `docs/api/fritzbox.md` (D-04). The planner should note FRITZ-01 is satisfied by returning the documented system fields — CPU load is not in scope at the API level.
**Warning signs:** Attempting to add `cpu_load` to the type definition when the proxy won't return it.

---

## Code Examples

### Inline type + thin wrapper (pass-through, no transform)

```typescript
// Source: docs/api/fritzbox.md §Real-time Data (SystemResponse)
interface SystemResponse {
  model: string;
  firmware_version: string;
  update_available: string;        // empty string = no update available
  device_uptime_seconds: number;
  device_uptime_formatted: string; // e.g. "5 days, 0:00:00"
  is_stale: boolean;
  fetched_at: string | null;
}

async function getSystemInfo(): Promise<SystemResponse> {
  return haGet<SystemResponse>('/api/v1/fritzbox/system');
}
```

### Paginated client method with optional query forwarding

```typescript
// Source: docs/api/fritzbox.md §WiFi (WiFiClientModel)
interface WiFiClientModel {
  hostname: string;
  mac: string;
  ip: string;
  band: string;             // "2.4GHz" | "5GHz" | "guest" | "wlanN"
  ssid: string;
  signal_strength: number;  // 0-100 Fritz!Box quality scale (not dBm)
  link_speed_mbps: number;
  is_active: boolean;
}

async function getWifiClients(params?: URLSearchParams): Promise<PaginatedResponse<WiFiClientModel>> {
  const query = params?.toString() ? `?${params.toString()}` : '';
  return haGet<PaginatedResponse<WiFiClientModel>>(`/api/v1/fritzbox/wifi/clients${query}`);
}
```

### WiFi clients route with query param forwarding

```typescript
// Source: pattern derived from devices/route.ts + wan/route.ts
export const GET = withAuthAndErrorHandler(async (request, context, session) => {
  const rateLimitResult = await checkRateLimitFritzBox(session.user.sub, 'wifi-clients');
  if (!rateLimitResult.allowed) {
    throw new ApiError(
      ERROR_CODES.RATE_LIMITED,
      `Troppe richieste. Riprova tra ${rateLimitResult.nextAllowedIn}s`,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      { retryAfter: rateLimitResult.nextAllowedIn }
    );
  }

  const { searchParams } = new URL(request.url);
  const params = new URLSearchParams();
  const band = searchParams.get('band');
  const limit = searchParams.get('limit');
  const offset = searchParams.get('offset');
  if (band) params.set('band', band);
  if (limit) params.set('limit', limit);
  if (offset) params.set('offset', offset);

  const clients = await getCachedData('wifi-clients', () => fritzboxClient.getWifiClients(params));
  return success({ clients });
}, 'FritzBox/WiFiClients');
```

### UPnP — flat object response (not paginated)

```typescript
// Source: docs/api/fritzbox.md §Network Services (UPnPStatusResponse)
interface UPnPStatusResponse {
  enabled: boolean;
  upnp_ports: PortForwardingRuleModel[];
  is_stale: boolean;
  fetched_at: string | null;
}

async function getUpnpStatus(): Promise<UPnPStatusResponse> {
  return haGet<UPnPStatusResponse>('/api/v1/fritzbox/network/upnp');
}
```

### Mesh topology — flat object response with nullable fields

```typescript
// Source: docs/api/fritzbox.md §Network Services (MeshTopologyResponse)
interface MeshNodeModel {
  uid: string;
  name: string;
  model: string;
  mac: string;
  vendor: string;
  is_meshed: boolean;
  device_category: string;
}

interface MeshLinkModel {
  source_uid: string;
  source_name: string;
  target_uid: string;
  target_name: string;
  type: string | null;
  state: string | null;
  cur_rx_kbps: number | null;
  cur_tx_kbps: number | null;
  max_rx_kbps: number | null;
  max_tx_kbps: number | null;
}

interface MeshTopologyResponse {
  schema_version: string | null;
  node_count: number;
  link_count: number;
  nodes: MeshNodeModel[];
  links: MeshLinkModel[];
  is_stale: boolean;
  fetched_at: string | null;
}

async function getMeshTopology(): Promise<MeshTopologyResponse> {
  return haGet<MeshTopologyResponse>('/api/v1/fritzbox/network/mesh');
}
```

---

## Endpoint Reference Summary

| Req | Client Method | HA Proxy Path | Response Shape | Cache Key | Route Rate-Limit Key | `success()` key |
|-----|--------------|---------------|---------------|-----------|---------------------|----------------|
| FRITZ-01 | `getSystemInfo()` | `/api/v1/fritzbox/system` | `SystemResponse` (flat object) | `system` | `system` | `system` |
| FRITZ-02 | `getWifiClients(params?)` | `/api/v1/fritzbox/wifi/clients[?params]` | `PaginatedResponse<WiFiClientModel>` | `wifi-clients` | `wifi-clients` | `clients` |
| FRITZ-03 | `getWifiNetworks()` | `/api/v1/fritzbox/wifi/networks` | `WiFiStatusResponse` (flat, `networks` array) | `wifi-networks` | `wifi-networks` | `networks` |
| FRITZ-04 | `getDhcpReservations(params?)` | `/api/v1/fritzbox/network/dhcp/reservations[?params]` | `PaginatedResponse<DhcpReservationModel>` | `dhcp-reservations` | `dhcp-reservations` | `reservations` |
| FRITZ-05 | `getPortForwarding(params?)` | `/api/v1/fritzbox/network/port-forwarding[?params]` | `PaginatedResponse<PortForwardingRuleModel>` | `port-forwarding` | `port-forwarding` | `portForwarding` |
| FRITZ-06 | `getUpnpStatus()` | `/api/v1/fritzbox/network/upnp` | `UPnPStatusResponse` (flat, `upnp_ports` array) | `upnp` | `upnp` | `upnp` |
| FRITZ-07 | `getMeshTopology()` | `/api/v1/fritzbox/network/mesh` | `MeshTopologyResponse` (flat, `nodes`+`links` arrays) | `mesh-topology` | `mesh` | `mesh` |

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest (existing, configured) |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern="fritzbox" --passWithNoTests` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FRITZ-01 | `getSystemInfo()` calls correct HA path, returns raw object | unit | `npm test -- --testPathPattern="fritzboxClient" -t "getSystemInfo"` | ❌ Wave 0 |
| FRITZ-02 | `getWifiClients()` calls correct path + forwards band/limit/offset params | unit | `npm test -- --testPathPattern="fritzboxClient" -t "getWifiClients"` | ❌ Wave 0 |
| FRITZ-03 | `getWifiNetworks()` calls correct path, returns flat `networks` array | unit | `npm test -- --testPathPattern="fritzboxClient" -t "getWifiNetworks"` | ❌ Wave 0 |
| FRITZ-04 | `getDhcpReservations()` calls correct path + forwards limit/offset | unit | `npm test -- --testPathPattern="fritzboxClient" -t "getDhcpReservations"` | ❌ Wave 0 |
| FRITZ-05 | `getPortForwarding()` calls correct path + forwards limit/offset | unit | `npm test -- --testPathPattern="fritzboxClient" -t "getPortForwarding"` | ❌ Wave 0 |
| FRITZ-06 | `getUpnpStatus()` calls correct path, returns flat UPnP object | unit | `npm test -- --testPathPattern="fritzboxClient" -t "getUpnpStatus"` | ❌ Wave 0 |
| FRITZ-07 | `getMeshTopology()` calls correct path, returns mesh object with nullable link fields | unit | `npm test -- --testPathPattern="fritzboxClient" -t "getMeshTopology"` | ❌ Wave 0 |

Tests are added to the **existing** `lib/fritzbox/__tests__/fritzboxClient.test.ts`. No new test file is needed — the file uses the established `jest.mock('@/lib/haClient')` + `jest.mocked(haGet)` pattern and is the correct home for new client method tests.

### Sampling Rate

- **Per task commit:** `npm test -- --testPathPattern="fritzboxClient"`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] New `describe` blocks in `lib/fritzbox/__tests__/fritzboxClient.test.ts` — covers FRITZ-01 through FRITZ-07 (7 new `describe` blocks with at minimum one `it` each)

*(No new test files required — existing infrastructure covers the pattern)*

---

## Environment Availability

Step 2.6: SKIPPED — Phase 132 is purely additive code changes. All dependencies (HA proxy, Firebase RTDB, Auth0) are already operational from phases 61-67. No new external services introduced.

---

## Open Questions

1. **Cache key for band-filtered wifi/clients**
   - What we know: D-10 specifies `wifi-clients` as the cache key. D-14 says `band` filter is passed through to HA proxy.
   - What's unclear: A static cache key means the 60s cache will serve the first response shape regardless of band filter. This is potentially incorrect for filtered requests.
   - Recommendation: The planner should use a dynamic cache key that includes the band param when present (e.g., `wifi-clients-5ghz`) OR accept that the 60s window is short enough that this is not a bug. The simplest safe approach matching existing patterns: pass params through, use static key (acceptable for admin/config data polled at this frequency). CONTEXT.md does not resolve this explicitly — planner should choose the static key approach to match D-10 and flag as acceptable.

2. **`success()` key names for paginated endpoints**
   - What we know: Existing routes use singular nouns matching the data type: `devices`, `wan`.
   - What's unclear: For paginated endpoints the full `PaginatedResponse<T>` object (with `items`, `total_count`, `limit`, `offset`) should be returned, not just the `items` array.
   - Recommendation: Return the full paginated envelope under the key: `{ clients: { items, total_count, limit, offset } }` for FRITZ-02, similarly for FRITZ-04 and FRITZ-05. This matches how the Rooms/Registry pages consume paginated data.

---

## Sources

### Primary (HIGH confidence)

- `docs/api/fritzbox.md` (local project file) — Complete TypeScript interfaces for all 7 endpoints: SystemResponse, WiFiClientModel, WiFiStatusResponse, WiFiNetworkModel, DhcpReservationModel, PortForwardingRuleModel, UPnPStatusResponse, MeshNodeModel, MeshLinkModel, MeshTopologyResponse
- `lib/fritzbox/fritzboxClient.ts` (local project file) — Existing 7 methods, `parseTimestamp()`, `PaginatedResponse<T>`, haGet import, exported object pattern
- `app/api/fritzbox/devices/route.ts` (local project file) — Canonical route pattern: rate limit → getCachedData → success()
- `app/api/fritzbox/wan/route.ts` (local project file) — Second canonical example confirming pattern consistency
- `lib/fritzbox/index.ts` (local project file) — Barrel exports confirming `fritzboxClient`, `getCachedData`, `checkRateLimitFritzBox` import paths
- `lib/fritzbox/__tests__/fritzboxClient.test.ts` (local project file) — Established test pattern: `jest.mock('@/lib/haClient')` + `jest.mocked(haGet)`

### Secondary (MEDIUM confidence)

- `.planning/phases/132-fritz-box-system-network-services/132-CONTEXT.md` — All 17 locked decisions from user discussion session

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all confirmed from existing codebase, no new packages
- Architecture patterns: HIGH — canonical route file read directly, pattern is mechanical reproduction
- Pitfalls: HIGH — derived from spec + code inspection (CPU load gap confirmed from SystemResponse interface, UPnP shape confirmed non-paginated, MeshLinkModel nullable fields confirmed)
- TypeScript interfaces: HIGH — copied verbatim from `docs/api/fritzbox.md` which is authoritative

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable API spec, no external dependencies)

## Project Constraints (from CLAUDE.md)

| Directive | Impact on Phase |
|-----------|----------------|
| NEVER run `npm run build` or `npm install` | Tests only via `npm test`; no build verification |
| NEVER break existing functionality | New methods appended only; existing methods untouched per D-06 |
| PREFER editing existing files over creating new | Client methods added to existing `fritzboxClient.ts`; tests added to existing test file |
| ALWAYS create/update unit tests | 7 new `describe` blocks required in `fritzboxClient.test.ts` |
| USE design system → `/debug/design-system` | Not applicable — API-only phase, no UI |
| NEVER commit/push without explicit request | Plans must not include commit steps |
