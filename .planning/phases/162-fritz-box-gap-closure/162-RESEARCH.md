# Phase 162: Fritz!Box Gap Closure - Research

**Researched:** 2026-04-09
**Domain:** Fritz!Box proxy client extension + Next.js API routes
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Raw pass-through for all telephony endpoints — no field transformation in the client. HA proxy returns snake_case JSON; routes return it as-is.
- **D-02:** Three new client functions: `getDectHandsets()`, `getCallHistory(params?)`, `getTamStatus()` — each maps to one HA proxy endpoint.
- **D-03:** Call history supports pagination via `limit`/`offset` query params (same `PaginatedResponse<T>` envelope).
- **D-04:** Existing `getBandwidthHistory()` and `getDeviceEvents()` already cover FRITZ-04 and FRITZ-06 use cases **if** the HA proxy exposes distinct raw endpoints. If the endpoint exists, add a new function; otherwise mark as already satisfied and skip.
- **D-05:** FRITZ-05 (raw device presence history) — check if HA proxy has a `/history/devices` endpoint distinct from `/history/devices/daily`. Add client function only if the endpoint exists.
- **D-06:** Parse TR-064 XML response to JSON in the client function. Single `getServiceDiscovery()` function returning a structured JSON object.
- **D-07:** `getServiceDiscovery()` returns structured JSON with service list (name, type, URL fields).
- **D-08:** Telephony routes: `app/api/fritzbox/telephony/dect/route.ts`, `app/api/fritzbox/telephony/calls/route.ts`, `app/api/fritzbox/telephony/tam/route.ts`.
- **D-09:** Service discovery flat: `app/api/fritzbox/service-discovery/route.ts`.
- **D-10:** All new routes follow `export const dynamic = 'force-dynamic'` + try/catch (via `withAuthAndErrorHandler`) + `NextResponse.json()` (via `success()`) pattern.

### Claude's Discretion

- TypeScript interface naming for telephony types (DectHandset, CallRecord, TamStatus, etc.)
- Test file placement follows existing co-located `__tests__/` pattern
- Whether to add new functions to the existing `fritzboxClient` object or create a sub-module

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FRITZ-01 | GET /api/v1/fritzbox/telephony/dect — registered DECT handsets | New `getDectHandsets()` client function + `app/api/fritzbox/telephony/dect/route.ts` |
| FRITZ-02 | GET /api/v1/fritzbox/telephony/calls — paginated call history | New `getCallHistory(params?)` client function + `app/api/fritzbox/telephony/calls/route.ts` |
| FRITZ-03 | GET /api/v1/fritzbox/telephony/tam — answering machine state | New `getTamStatus()` client function + `app/api/fritzbox/telephony/tam/route.ts` |
| FRITZ-04 | GET /api/v1/fritzbox/history/bandwidth — raw bandwidth history | `getBandwidthHistory()` client already exists; needs a corresponding Next.js route at `app/api/fritzbox/history/bandwidth/route.ts` (if raw endpoint needed; see gap analysis) |
| FRITZ-05 | GET /api/v1/fritzbox/history/devices — raw device presence history | Distinct from `/daily`; per D-05, add client function only if HA proxy endpoint exists |
| FRITZ-06 | GET /api/v1/fritzbox/history/device-events — join/leave event log | `getDeviceEvents()` client exists; needs Next.js route at `app/api/fritzbox/history/device-events/route.ts` (old `/history` route reads Firebase, not proxy) |
| FRITZ-07 | GET /api/v1/fritzbox/service-discovery — TR-064 XML parsed to JSON | New `getServiceDiscovery()` client function + `app/api/fritzbox/service-discovery/route.ts` |

</phase_requirements>

---

## Summary

Phase 162 closes the remaining Fritz!Box API surface: telephony (DECT handsets, call history, answering machine/TAM), raw history data, and TR-064 service discovery. This is an API-only phase — no new UI pages or dashboard cards.

The work follows a fully established, uniform pattern: add a client function to `fritzboxClient.ts`, create a Next.js route file, and write a co-located unit test. The fritzbox barrel export (`lib/fritzbox/index.ts`) does not need updating because `fritzboxClient` is already exported as an object — new methods added to the object are automatically available.

A critical finding: the existing `fritzboxClient` source uses FRITZ-01..07 labels that refer to a **previous** phase (phase 133 — system, WiFi, DHCP, port forwarding, UPnP, mesh). The v19.0 REQUIREMENTS.md defines a new FRITZ-01..07 covering telephony and gaps. There is no naming collision in the TypeScript code, only in the comments; no renaming of existing functions is needed.

A second critical finding concerns history gap coverage. The client has `getBandwidthHistory()` (calls `/api/v1/fritzbox/history/bandwidth`) and `getDeviceEvents()` (calls `/api/v1/fritzbox/history/device-events`), but the corresponding Next.js routes do **not exist** for these paths. The old `app/api/fritzbox/bandwidth-history/route.ts` applies transformation (bps → Mbps) and uses `range` param semantics, not raw pagination. The old `app/api/fritzbox/history/route.ts` reads Firebase (not the HA proxy). Per D-04, the planner must determine whether FRITZ-04 and FRITZ-06 require new raw-pass-through routes or whether the existing transformed routes satisfy the acceptance criteria.

**Primary recommendation:** Add 3 telephony client functions + 1 service-discovery client function + their routes + tests in a single plan wave. Then decide (per D-04/D-05) whether FRITZ-04, FRITZ-05, FRITZ-06 need new raw routes or are already satisfied.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `haGet` from `lib/haClient.ts` | — (project internal) | Transport for all Fritz!Box reads | All existing Fritz!Box client functions use it |
| `withAuthAndErrorHandler` from `lib/core` | — (project internal) | Route auth + error handling wrapper | All phase 133+ Fritz!Box routes use it |
| `success()` from `lib/core` | — (project internal) | Standard JSON response envelope | All Fritz!Box routes use it |
| `getCachedData` from `lib/fritzbox` | — (project internal) | 60s TTL cache layer | All recent Fritz!Box routes use it |
| `checkRateLimitFritzBox` from `lib/fritzbox` | — (project internal) | 10 req/min rate limiter | All recent Fritz!Box routes use it |
| Node.js built-in XML parsing | — | TR-064 XML → JSON for service discovery | Used in `getServiceDiscovery()` per D-06 |

**No new npm dependencies required.** All tools are already in the project. [VERIFIED: codebase grep]

### XML Parsing Note

The codebase has no existing XML parsing utility. For `getServiceDiscovery()` (D-06, D-07), use Node.js built-in `DOMParser` (available in Next.js server context) or a lightweight approach. The simplest option for TR-064 service XML: parse with regex or use the built-in XML facilities since the structure is simple and fixed. [ASSUMED — TR-064 XML structure assumed to be simple enough for lightweight parsing]

---

## Architecture Patterns

### Recommended File Structure (new files for this phase)

```
lib/fritzbox/
└── fritzboxClient.ts          # MODIFY: add getDectHandsets, getCallHistory, getTamStatus, getServiceDiscovery

app/api/fritzbox/
├── telephony/
│   ├── dect/
│   │   ├── route.ts           # NEW: FRITZ-01
│   │   └── __tests__/
│   │       └── route.test.ts  # NEW
│   ├── calls/
│   │   ├── route.ts           # NEW: FRITZ-02
│   │   └── __tests__/
│   │       └── route.test.ts  # NEW
│   └── tam/
│       ├── route.ts           # NEW: FRITZ-03
│       └── __tests__/
│           └── route.test.ts  # NEW
├── service-discovery/
│   ├── route.ts               # NEW: FRITZ-07
│   └── __tests__/
│       └── route.test.ts      # NEW
├── history/
│   ├── bandwidth/             # POSSIBLY NEW: FRITZ-04 raw route (if needed)
│   │   └── route.ts
│   ├── device-events/         # POSSIBLY NEW: FRITZ-06 raw route (if needed)
│   │   └── route.ts
│   └── devices/               # POSSIBLY NEW: FRITZ-05 (if HA proxy has /history/devices)
│       └── route.ts
```

[VERIFIED: existing directory structure via ls commands]

### Pattern 1: Raw Pass-Through Route (Telephony)

Exactly follows the `getBandwidthHourly` / `getDevicesDaily` pattern from phase 133:

```typescript
// Source: app/api/fritzbox/history/bandwidth/hourly/route.ts (verified)
import { withAuthAndErrorHandler, success, ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core';
import { fritzboxClient, getCachedData, checkRateLimitFritzBox } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (request, _context, session) => {
  const rateLimitResult = await checkRateLimitFritzBox(session.user.sub, 'telephony-dect');
  if (!rateLimitResult.allowed) {
    throw new ApiError(
      ERROR_CODES.RATE_LIMITED,
      `Troppe richieste. Riprova tra ${rateLimitResult.nextAllowedIn}s`,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      { retryAfter: rateLimitResult.nextAllowedIn }
    );
  }
  const dect = await getCachedData('telephony-dect', () => fritzboxClient.getDectHandsets());
  return success({ dect });
}, 'FritzBox/TelephonyDect');
```

[VERIFIED: read from app/api/fritzbox/history/bandwidth/hourly/route.ts]

### Pattern 2: Raw Pass-Through Route with Query Param Forwarding (Calls pagination)

For `getCallHistory` (FRITZ-02) which has `limit`/`offset` pagination — follows the pattern of `getDhcpReservations`:

```typescript
// Source: app/api/fritzbox/history/bandwidth/auto/route.ts (verified)
const { searchParams } = new URL(request.url);
const params = new URLSearchParams();
const limit = searchParams.get('limit');
const offset = searchParams.get('offset');
if (limit) params.set('limit', limit);
if (offset) params.set('offset', offset);

const calls = await getCachedData('telephony-calls', () => fritzboxClient.getCallHistory(params));
return success({ calls });
```

[VERIFIED: read from existing routes]

### Pattern 3: Client Function — Raw Pass-Through (No Transformation)

For phase 133+ endpoints, client functions do NOT transform fields — pure type assertion:

```typescript
// Source: lib/fritzbox/fritzboxClient.ts (verified) - getSystemInfo() pattern
async function getDectHandsets(): Promise<PaginatedResponse<DectHandset>> {
  return haGet<PaginatedResponse<DectHandset>>('/api/v1/fritzbox/telephony/dect');
}
```

[VERIFIED: read fritzboxClient.ts — getSystemInfo, getWifiClients, getWifiNetworks all use raw pass-through]

### Pattern 4: Client Function — With Params

For `getCallHistory` following `getWifiClients` / `getDhcpReservations`:

```typescript
async function getCallHistory(params?: URLSearchParams): Promise<PaginatedResponse<CallRecord>> {
  const query = params?.toString() ? `?${params.toString()}` : '';
  return haGet<PaginatedResponse<CallRecord>>(`/api/v1/fritzbox/telephony/calls${query}`);
}
```

[VERIFIED: mirrors getDhcpReservations pattern in fritzboxClient.ts]

### Pattern 5: Service Discovery XML Parsing (FRITZ-07)

Per D-06, the TR-064 XML is parsed to JSON in the client function. HA proxy endpoint returns XML; the client function converts it before returning:

```typescript
async function getServiceDiscovery(): Promise<ServiceDiscoveryResponse> {
  // haGet expects JSON — need to fetch raw text and parse XML
  // Use a raw fetch approach or extend haGet options
  // Return: { services: Array<{ name, type, url }> }
}
```

**Important:** `haGet` in this project currently expects JSON responses (parses body as JSON). For the XML endpoint, the client function may need to use a direct fetch call with `HA_API_URL`/`HA_API_KEY` env vars, or `haGet` may need to accept a `rawText: true` option. Inspect `haGet` implementation to confirm. [ASSUMED — haGet JSON-only behavior inferred from usage; needs verification during implementation]

### Pattern 6: fritzboxClient Object Export — Append Only

New functions are appended to the exported object — never replace or restructure:

```typescript
// Source: lib/fritzbox/fritzboxClient.ts lines 459-480 (verified)
export const fritzboxClient = {
  // ... existing 19 functions ...
  // Phase 162 additions:
  getDectHandsets,
  getCallHistory,
  getTamStatus,
  getServiceDiscovery,
};
```

[VERIFIED: fritzboxClient export object pattern confirmed]

### Pattern 7: Test Structure

Co-located under `__tests__/route.test.ts`, mocking `@/lib/fritzbox` and `@/lib/auth0`:

```typescript
// Source: app/api/fritzbox/history/bandwidth/hourly/__tests__/route.test.ts (verified)
jest.mock('@/lib/fritzbox');
jest.mock('@/lib/auth0', () => ({ auth0: { getSession: jest.fn() } }));

import { GET } from '../route';
import { fritzboxClient, getCachedData, checkRateLimitFritzBox } from '@/lib/fritzbox';
import { auth0 } from '@/lib/auth0';
```

Standard test cases: 401 unauthenticated, 200 success, 429 rate-limited, cache key verification, error propagation.

[VERIFIED: confirmed in hourly/daily test files]

### Anti-Patterns to Avoid

- **Transforming fields in new client functions:** All phase 133+ Fritz!Box functions use raw pass-through (snake_case from proxy). Do NOT add camelCase transformation.
- **Creating a new sub-module** for telephony: CONTEXT.md says keep in `fritzboxClient` object (Claude's Discretion — but CONTEXT says "add new functions here, export via the same object"). Append to existing file.
- **Modifying `lib/fritzbox/index.ts`:** `fritzboxClient` is already exported; new methods on the object require no barrel update.
- **Using the old `/api/fritzbox/bandwidth-history` route as a model:** That route uses transformation and `range` string params — it predates the phase 133 pattern. Use `history/bandwidth/hourly` or `history/devices/daily` as the canonical model.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth + error handling | Custom try/catch wrapper | `withAuthAndErrorHandler` | Already wraps auth, error mapping, 401/500 responses |
| Rate limiting | Custom counter | `checkRateLimitFritzBox` | Firebase RTDB transaction-based, already deployed |
| Response caching | In-memory cache | `getCachedData` | 60s TTL cache already wired to Firebase |
| HTTP transport | Direct fetch | `haGet` | Already handles X-API-Key header, timeout, RFC 9457 error mapping |
| Response envelope | Custom `{ data: ... }` | `success()` from `lib/core` | Consistent `{ success: true, ...data }` format across all routes |

---

## Critical Gap Analysis

### History Endpoints: What Already Exists vs. What FRITZ-04/05/06 Need

**FRITZ-04: GET /api/v1/fritzbox/history/bandwidth (raw bandwidth history)**

| Layer | Existing | Gap |
|-------|----------|-----|
| Client function | `getBandwidthHistory(hours)` → `/api/v1/fritzbox/history/bandwidth?hours=N` ✓ | None in client |
| Next.js route | `app/api/fritzbox/bandwidth-history/route.ts` exists BUT transforms bps→Mbps and uses `range` string params | Need raw pass-through route at `app/api/fritzbox/history/bandwidth/route.ts` if FRITZ-04 requires it |

Per D-04: "If HA proxy exposes distinct raw endpoint, add new functions; otherwise mark as already satisfied." The client already hits the raw endpoint at `/api/v1/fritzbox/history/bandwidth`. Whether a new Next.js route is needed depends on whether callers use the transformed endpoint or need the raw paginated response. **Planner decision: create raw route or defer.**

**FRITZ-05: GET /api/v1/fritzbox/history/devices (raw device presence history)**

| Layer | Existing | Gap |
|-------|----------|-----|
| Client function | `getDevicesDaily()` → `/api/v1/fritzbox/history/devices/daily` | `/history/devices` (non-daily) is a different path — need check |
| Next.js route | `app/api/fritzbox/history/devices/daily/route.ts` exists | `/history/devices` has no route |

Per D-05: Add client function and route only if HA proxy has `/history/devices` distinct from `/daily`. This requires a runtime check or documentation lookup.

**FRITZ-06: GET /api/v1/fritzbox/history/device-events (device join/leave log)**

| Layer | Existing | Gap |
|-------|----------|-----|
| Client function | `getDeviceEvents(hours, mac?)` → `/api/v1/fritzbox/history/device-events` ✓ | None in client |
| Next.js route | `app/api/fritzbox/history/route.ts` exists BUT reads Firebase (old path, old implementation) | Need raw proxy route at `app/api/fritzbox/history/device-events/route.ts` |

The old `history/route.ts` reads from Firebase via `getDeviceEvents` (Firebase version from `deviceEventLogger.ts`), not from the HA proxy. A new route at `app/api/fritzbox/history/device-events/route.ts` is needed to expose the HA proxy data.

[VERIFIED: read history/route.ts — confirmed it imports from `@/lib/fritzbox` deviceEventLogger functions, not fritzboxClient]

### haGet XML Compatibility Check

`getServiceDiscovery()` must parse TR-064 XML. The current `haGet` implementation fetches JSON (calls `response.json()`). For an XML endpoint, either:
1. Add a `responseType: 'text'` option to `haGet` (modifies shared transport)
2. Implement a local `haGetText()` helper in `fritzboxClient.ts`
3. Use direct `fetch()` with env vars inside `getServiceDiscovery()`

Option 2 (local helper) is lowest risk — avoids touching shared `haClient.ts`. [ASSUMED — haGet JSON-only confirmed by reading usage patterns; exact implementation of haGet body parsing not fully read]

---

## Common Pitfalls

### Pitfall 1: FRITZ-01..07 Label Collision

**What goes wrong:** Developer sees `// FRITZ-01` through `// FRITZ-07` comments in `fritzboxClient.ts` and thinks those requirements are already satisfied.
**Why it happens:** Phase 133 used the same requirement ID range for a different set of endpoints (system, WiFi, DHCP, port forwarding, UPnP, mesh).
**How to avoid:** The new v19.0 FRITZ-01..07 are telephony + history + service-discovery. The existing labeled functions cover DIFFERENT functionality. No renaming needed — just add new functions.
**Warning signs:** If a plan says "FRITZ-01 already implemented as getSystemInfo()" — that is wrong for v19.0.

[VERIFIED: fritzboxClient.ts lines 191-357 — confirmed the labeling]

### Pitfall 2: Using the Wrong Route as a Template

**What goes wrong:** Using `app/api/fritzbox/bandwidth-history/route.ts` or `app/api/fritzbox/history/route.ts` as the template for new routes.
**Why it happens:** These are older routes from before phase 133 pattern was established.
**How to avoid:** Use `app/api/fritzbox/history/bandwidth/hourly/route.ts` or `app/api/fritzbox/history/devices/daily/route.ts` as canonical templates (these use `withAuthAndErrorHandler`, rate limiting, `getCachedData`).
**Warning signs:** Route imports without `checkRateLimitFritzBox`, or missing `getCachedData`.

[VERIFIED: bandwidth-history and history/route.ts read and confirmed as old pattern]

### Pitfall 3: haGet Expecting JSON for XML Endpoint

**What goes wrong:** `getServiceDiscovery()` calls `haGet(endpoint)` which tries `response.json()` on TR-064 XML → throws parse error.
**Why it happens:** `haGet` is JSON-only throughout the codebase.
**How to avoid:** Implement XML fetching with a local `haGetText` helper or direct fetch inside `getServiceDiscovery()`.
**Warning signs:** `SyntaxError: Unexpected token '<'` in server logs.

### Pitfall 4: Forgetting the Rate-Limit Cache Key Namespace

**What goes wrong:** Using the same cache key string for two different endpoints causes cross-contamination.
**Why it happens:** Cache key is a free-form string; no compile-time check.
**How to avoid:** Follow the naming pattern: `'telephony-dect'`, `'telephony-calls'`, `'telephony-tam'`, `'service-discovery'` — consistent with existing keys like `'history-bandwidth-hourly'`.
**Warning signs:** Route returns stale data from a different endpoint.

### Pitfall 5: Not Including new fritzboxClient Methods in Test Auto-Mock Guard

**What goes wrong:** Tests fail because `mockFritzboxClient.getDectHandsets` is undefined on the Jest auto-mock.
**Why it happens:** Jest auto-mocks reflect the module at mock-creation time; new methods may need explicit setup.
**How to avoid:** Follow the pattern in the hourly test — add explicit guards: `if (!mockFritzboxClient.getDectHandsets) { (mockFritzboxClient as any).getDectHandsets = jest.fn(); }`.
**Warning signs:** `TypeError: mockFritzboxClient.getDectHandsets is not a function`.

[VERIFIED: hourly test file shows this exact guard pattern for phase 133 additions]

---

## Code Examples

### Client Function — Raw Pass-Through (FRITZ-01)

```typescript
// Source: lib/fritzbox/fritzboxClient.ts — getSystemInfo() pattern (verified)

/** A DECT handset registered with the Fritz!Box */
interface DectHandset {
  id: string;
  name: string;
  model: string;
  firmware_version: string;
  battery_charge_level: number | null;
  is_registered: boolean;
}

/**
 * Get registered DECT handsets — FRITZ-01 (v19.0)
 * Raw pass-through: no field transformation.
 */
async function getDectHandsets(): Promise<PaginatedResponse<DectHandset>> {
  return haGet<PaginatedResponse<DectHandset>>('/api/v1/fritzbox/telephony/dect');
}
```

### Client Function — With Pagination Params (FRITZ-02)

```typescript
// Source: mirrors getDhcpReservations() in fritzboxClient.ts (verified)

/** A call log entry from Fritz!Box */
interface CallRecord {
  id: string;
  call_type: string;
  number: string;
  name: string | null;
  duration_seconds: number;
  timestamp: number;
  port: string | null;
}

/**
 * Get paginated call history — FRITZ-02 (v19.0)
 * Supports optional limit/offset query params.
 */
async function getCallHistory(params?: URLSearchParams): Promise<PaginatedResponse<CallRecord>> {
  const query = params?.toString() ? `?${params.toString()}` : '';
  return haGet<PaginatedResponse<CallRecord>>(`/api/v1/fritzbox/telephony/calls${query}`);
}
```

### Route — Telephony DECT (FRITZ-01)

```typescript
// Source: pattern from app/api/fritzbox/history/bandwidth/hourly/route.ts (verified)
import { withAuthAndErrorHandler, success, ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core';
import { fritzboxClient, getCachedData, checkRateLimitFritzBox } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (_request, _context, session) => {
  const rateLimitResult = await checkRateLimitFritzBox(session.user.sub, 'telephony-dect');
  if (!rateLimitResult.allowed) {
    throw new ApiError(
      ERROR_CODES.RATE_LIMITED,
      `Troppe richieste. Riprova tra ${rateLimitResult.nextAllowedIn}s`,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      { retryAfter: rateLimitResult.nextAllowedIn }
    );
  }
  const dect = await getCachedData('telephony-dect', () => fritzboxClient.getDectHandsets());
  return success({ dect });
}, 'FritzBox/TelephonyDect');
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Transformation in client (bps→Mbps, camelCase) | Raw pass-through for phase 133+ | Phase 133 | New client functions return snake_case as-is |
| Firebase-based event detection | HA proxy event detection | Phase 133 | `/api/fritzbox/history/route.ts` is legacy; new proxy routes needed |
| Auth with JWT | Auth0 session via `withAuthAndErrorHandler` | Phase 133+ | All new routes use `withAuthAndErrorHandler` |
| `bandwidth-history` route (transformed) | `history/bandwidth/hourly`, `/daily`, `/auto` routes (raw) | Phase 133 | Old route still exists; new pattern is under `history/` hierarchy |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `haGet` parses responses as JSON only (no raw text option) | Architecture Patterns, Pitfall 3 | If haGet already supports raw text, the XML workaround is simpler |
| A2 | TR-064 service XML has a simple, fixed structure suitable for lightweight parsing | Standard Stack | If complex/deeply nested, may need a proper XML parser library |
| A3 | HA proxy exposes `/api/v1/fritzbox/telephony/dect`, `/telephony/calls`, `/telephony/tam` endpoints | All telephony sections | If paths differ, client function URLs need adjustment |
| A4 | HA proxy exposes `/api/v1/fritzbox/service-discovery` returning TR-064 XML | Service Discovery section | If not exposed, FRITZ-07 cannot be implemented without HA proxy changes |
| A5 | HA proxy does NOT have a distinct `/api/v1/fritzbox/history/devices` endpoint (only `/daily`) | Gap Analysis FRITZ-05 | If it does exist, a new client function and route are needed for FRITZ-05 |

---

## Open Questions

1. **Does the HA proxy have `/api/v1/fritzbox/history/devices` (distinct from `/daily`)?**
   - What we know: Client has `getDevicesDaily()` → `/history/devices/daily`. FRITZ-05 requires `/history/devices`.
   - What's unclear: Whether the HA proxy exposes a flat `/devices` history endpoint separate from the daily aggregation.
   - Recommendation: Per D-05, treat as optional. Implement only if confirmed. Planner should add a conditional note.

2. **Do FRITZ-04 and FRITZ-06 require new Next.js routes, or do existing routes satisfy them?**
   - What we know: Client functions exist (`getBandwidthHistory`, `getDeviceEvents`). No raw-pass-through Next.js routes exist for these paths.
   - What's unclear: Whether the acceptance criteria ("raw bandwidth history", "log eventi join/leave") can be met by the existing transformed routes, or require new raw routes.
   - Recommendation: Per D-04, assume new raw routes are needed. The old routes serve transformed/aggregated data; the requirements specify "raw" data.

3. **How does `haGet` handle non-JSON responses?**
   - What we know: All existing usages return JSON. `haGet` calls `.json()` on the response body based on usage patterns.
   - What's unclear: Whether there's a `rawText` option already in `haGet` options interface.
   - Recommendation: Read `lib/haClient.ts` fully during implementation before writing `getServiceDiscovery()`.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — purely code changes to existing Next.js project).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest (confirmed from existing test files) |
| Config file | `jest.config.js` (project root) |
| Quick run command | `npm test -- --testPathPattern="fritzbox/telephony\|fritzbox/service-discovery"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FRITZ-01 | GET telephony/dect returns 200 with DECT list | unit | `npm test -- --testPathPattern="telephony/dect"` | Wave 0 |
| FRITZ-02 | GET telephony/calls returns paginated call history | unit | `npm test -- --testPathPattern="telephony/calls"` | Wave 0 |
| FRITZ-03 | GET telephony/tam returns answering machine state | unit | `npm test -- --testPathPattern="telephony/tam"` | Wave 0 |
| FRITZ-04 | GET history/bandwidth returns raw bandwidth data | unit | `npm test -- --testPathPattern="history/bandwidth/route"` | Wave 0 (if new route needed) |
| FRITZ-05 | GET history/devices returns device presence history | unit | `npm test -- --testPathPattern="history/devices/route"` | Wave 0 (if HA endpoint exists) |
| FRITZ-06 | GET history/device-events returns event log | unit | `npm test -- --testPathPattern="history/device-events"` | Wave 0 (if new route needed) |
| FRITZ-07 | GET service-discovery returns TR-064 as JSON | unit | `npm test -- --testPathPattern="service-discovery"` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- --testPathPattern="fritzbox"`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `app/api/fritzbox/telephony/dect/__tests__/route.test.ts` — covers FRITZ-01
- [ ] `app/api/fritzbox/telephony/calls/__tests__/route.test.ts` — covers FRITZ-02
- [ ] `app/api/fritzbox/telephony/tam/__tests__/route.test.ts` — covers FRITZ-03
- [ ] `app/api/fritzbox/service-discovery/__tests__/route.test.ts` — covers FRITZ-07
- [ ] Conditional: `app/api/fritzbox/history/bandwidth/__tests__/route.test.ts` — covers FRITZ-04
- [ ] Conditional: `app/api/fritzbox/history/device-events/__tests__/route.test.ts` — covers FRITZ-06
- [ ] Conditional: `app/api/fritzbox/history/devices/__tests__/route.test.ts` — covers FRITZ-05

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Auth0 via `withAuthAndErrorHandler` — session check on every route |
| V3 Session Management | no | Handled by Auth0, not this phase |
| V4 Access Control | no | No RBAC needed; single-user app |
| V5 Input Validation | yes | `limit`/`offset` params forwarded to HA proxy — proxy handles validation; no direct SQL/command injection path |
| V6 Cryptography | no | X-API-Key in env var, not this phase |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Query param injection via `limit`/`offset` | Tampering | Params forwarded to HA proxy as URL query strings; proxy validates. No shell exec or DB query in Next.js layer. |
| Unauthenticated access to telephony data | Information Disclosure | `withAuthAndErrorHandler` blocks unauthenticated requests with 401 |
| XML external entity (XXE) in TR-064 parsing | Information Disclosure | Use simple regex/DOM parse with external entity resolution disabled |

---

## Sources

### Primary (HIGH confidence)

- `lib/fritzbox/fritzboxClient.ts` — 19 existing client functions, export object, `PaginatedResponse<T>`, `parseTimestamp()` [VERIFIED: read full file]
- `app/api/fritzbox/history/bandwidth/hourly/route.ts` — canonical route template for phase 162 [VERIFIED: read full file]
- `app/api/fritzbox/history/bandwidth/auto/route.ts` — canonical template with query param forwarding [VERIFIED: read full file]
- `app/api/fritzbox/history/devices/daily/route.ts` — canonical devices history template [VERIFIED: read full file]
- `app/api/fritzbox/history/route.ts` — confirmed as legacy Firebase route (not proxy) [VERIFIED: read full file]
- `app/api/fritzbox/bandwidth-history/route.ts` — confirmed as legacy transformed route [VERIFIED: read full file]
- `lib/fritzbox/index.ts` — barrel exports confirmed [VERIFIED: read]
- `app/api/fritzbox/history/bandwidth/hourly/__tests__/route.test.ts` — canonical test template [VERIFIED: read full file]
- `.planning/phases/162-fritz-box-gap-closure/162-CONTEXT.md` — locked decisions [VERIFIED: read]
- `.planning/REQUIREMENTS.md` — v19.0 FRITZ-01..07 definitions [VERIFIED: read]

### Secondary (MEDIUM confidence)

- CONTEXT.md D-04/D-05 — guidance on history overlap resolution

### Tertiary (LOW confidence)

- A1-A5 in Assumptions Log — HA proxy endpoint paths/behaviors assumed from existing usage patterns

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools verified in codebase
- Architecture: HIGH — canonical patterns confirmed from multiple existing files
- Pitfalls: HIGH — identified from direct code reading, not inference
- History gap analysis: MEDIUM — coverage gaps confirmed, but resolution (whether new raw routes needed) depends on D-04 interpretation

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable codebase, no external APIs)
