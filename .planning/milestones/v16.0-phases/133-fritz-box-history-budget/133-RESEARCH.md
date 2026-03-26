# Phase 133: Fritz!Box History & Budget - Research

**Researched:** 2026-03-25
**Domain:** Fritz!Box HA proxy — history tier routes + budget-stats API extension
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Add 5 new methods to existing `fritzboxClient` object in `lib/fritzbox/fritzboxClient.ts` — same pattern as Phase 132
- **D-02:** Each method is a thin `haGet` wrapper with inline response type, matching the 13 existing methods
- **D-03:** Keep inline types in `fritzboxClient.ts` — use exact interface names and field types from `docs/api/fritzbox.md` TypeScript blocks
- **D-04:** History endpoints use `BandwidthHourlyRecord`, `BandwidthDailyRecord`, `DeviceDailyRecord`, `BandwidthAggregatedRecord`; budget uses `BudgetStats`
- **D-05:** All 5 new endpoints use raw pass-through — NO transformation (no bps→Mbps, no camelCase, no timestamp conversion)
- **D-06:** Existing `getBandwidthHistory()` remains unchanged — it serves different consumers
- **D-07:** History endpoints accept `params?: URLSearchParams` for `days`/`limit`/`offset` — matches `getWifiClients`/`getDhcpReservations`/`getPortForwarding` pattern
- **D-08:** Budget-stats has no query params — simple no-arg method like `getSystemInfo()`
- **D-09:** Expose `/history/bandwidth/auto` response as-is using `BandwidthAggregatedRecord` with generic `timestamp` + `granularity: "hourly" | "daily"` discriminator
- **D-10:** All 5 new routes get rate limiting via `checkRateLimitFritzBox(session.user.sub, endpoint)`
- **D-11:** All 5 new routes get caching via `getCachedData(key, fetcher)` with default 60s TTL
- **D-12:** Routes under `app/api/fritzbox/`: `history/bandwidth/hourly/`, `history/bandwidth/daily/`, `history/bandwidth/auto/`, `history/devices/daily/`, `budget-stats/`
- **D-13:** All routes use `withAuthAndErrorHandler` + `success()` pattern from `lib/core`
- **D-14:** All route files export `const dynamic = 'force-dynamic'`
- **D-15:** Let haGet propagate RFC 9457 errors — no extra error wrapping in client methods
- **D-16:** 503 from HA proxy (router unreachable, cache empty) passes through to frontend

### Claude's Discretion

- JSDoc comments on new client methods (brief, optional)
- Exact cache key naming within the kebab-case convention
- Whether to reuse existing `PaginatedResponse<T>` interface for history endpoints (they use the same envelope)

### Deferred Ideas (OUT OF SCOPE)

- Fritz!Box frontend page enhancements (history charts toggle, system info display) — Phase 134
- Telephony endpoints (DECT, calls, TAM) — explicitly excluded from v16.0 scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FRITZ-08 | GET /fritzbox/history/bandwidth/hourly — bandwidth aggregato orario | New client method `getBandwidthHourly(params?)` + route `app/api/fritzbox/history/bandwidth/hourly/route.ts`. Returns `PaginatedResponse<BandwidthHourlyRecord>`. |
| FRITZ-09 | GET /fritzbox/history/bandwidth/daily — bandwidth aggregato giornaliero | New client method `getBandwidthDaily(params?)` + route `app/api/fritzbox/history/bandwidth/daily/route.ts`. Returns `PaginatedResponse<BandwidthDailyRecord>`. |
| FRITZ-10 | GET /fritzbox/history/devices/daily — device count giornaliero | New client method `getDevicesDaily(params?)` + route `app/api/fritzbox/history/devices/daily/route.ts`. Returns `PaginatedResponse<DeviceDailyRecord>`. Note: 24 rows/day. |
| FRITZ-11 | GET /fritzbox/history/bandwidth/auto — auto-granularity (hour/day switch) | New client method `getBandwidthAuto(params?)` + route `app/api/fritzbox/history/bandwidth/auto/route.ts`. Returns `PaginatedResponse<BandwidthAggregatedRecord>` with `granularity` discriminator. |
| FRITZ-12 | GET /fritzbox/budget-stats — statistiche budget dati | New client method `getBudgetStats()` + route `app/api/fritzbox/budget-stats/route.ts`. Returns flat `BudgetStats` object (no pagination, no query params). |
</phase_requirements>

---

## Summary

Phase 133 adds 5 new GET-only API routes extending the existing Fritz!Box infrastructure built in Phase 132. The implementation is purely mechanical: 5 new methods added to the `fritzboxClient` object in `lib/fritzbox/fritzboxClient.ts`, plus 5 new Next.js route files in `app/api/fritzbox/`. No new files outside these two concerns.

Four of the five endpoints (hourly, daily, devices/daily, auto) are paginated history endpoints that accept `days`/`limit`/`offset` query params forwarded via `URLSearchParams` — identical pattern to `getWifiClients`, `getDhcpReservations`, `getPortForwarding`. The fifth (budget-stats) is a flat-object endpoint with no query params — identical pattern to `getSystemInfo`, `getUpnpStatus`, `getMeshTopology`.

All routes follow the established Fritz!Box pattern: `withAuthAndErrorHandler` wrapper, `checkRateLimitFritzBox` rate limiting, `getCachedData` caching at 60s TTL, `success()` response. No transformation, no new environment variables, no new infrastructure.

**Primary recommendation:** Implement as a single plan (133-01) covering all 5 client methods + 5 routes simultaneously. The pattern is fully established and repetitive — no novel engineering decisions required.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@/lib/haClient` (haGet) | project-internal | HTTP transport to HA proxy | All 5 providers use this |
| `@/lib/fritzbox` | project-internal | Fritz!Box client + cache + rate limiter | Established in phases 61-67, extended in 132 |
| `@/lib/core` | project-internal | withAuthAndErrorHandler, success(), ApiError | Every Fritz!Box route uses this |

### No New Dependencies
This phase introduces no new npm packages or environment variables.

---

## Architecture Patterns

### Recommended Project Structure

New files for this phase:
```
lib/fritzbox/
└── fritzboxClient.ts        # ADD 5 methods + 5 interfaces (existing file)

app/api/fritzbox/
├── history/
│   ├── bandwidth/
│   │   ├── hourly/
│   │   │   └── route.ts     # NEW - FRITZ-08
│   │   ├── daily/
│   │   │   └── route.ts     # NEW - FRITZ-09
│   │   └── auto/
│   │       └── route.ts     # NEW - FRITZ-11
│   └── devices/
│       └── daily/
│           └── route.ts     # NEW - FRITZ-10
└── budget-stats/
    └── route.ts             # NEW - FRITZ-12
```

### Pattern 1: Paginated History Client Method (for FRITZ-08, FRITZ-09, FRITZ-10, FRITZ-11)

```typescript
// Source: lib/fritzbox/fritzboxClient.ts — getWifiClients pattern (verified)
interface BandwidthHourlyRecord {
  hour_timestamp: number;
  avg_upstream_rate: number;
  min_upstream_rate: number;
  max_upstream_rate: number;
  avg_downstream_rate: number;
  min_downstream_rate: number;
  max_downstream_rate: number;
  avg_bytes_sent: number;
  avg_bytes_received: number;
  sample_count: number;
}

async function getBandwidthHourly(params?: URLSearchParams): Promise<PaginatedResponse<BandwidthHourlyRecord>> {
  const query = params?.toString() ? `?${params.toString()}` : '';
  return haGet<PaginatedResponse<BandwidthHourlyRecord>>(`/api/v1/fritzbox/history/bandwidth/hourly${query}`);
}
```

### Pattern 2: Flat Object Client Method (for FRITZ-12)

```typescript
// Source: lib/fritzbox/fritzboxClient.ts — getSystemInfo pattern (verified)
interface BudgetStats {
  window_seconds: number;
  current_window_requests: number;
  soft_limit: number;
  hard_limit: number;
  total_lifetime_requests: number;
  warning_count: number;
  utilization_percent: number;
  status: 'ok' | 'warning' | 'danger';
  message: string;
}

async function getBudgetStats(): Promise<BudgetStats> {
  return haGet<BudgetStats>('/api/v1/fritzbox/budget-stats');
}
```

### Pattern 3: Paginated History Route (for FRITZ-08, FRITZ-09, FRITZ-10, FRITZ-11)

```typescript
// Source: app/api/fritzbox/network/dhcp/reservations/route.ts (verified)
import { withAuthAndErrorHandler, success, ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core';
import { fritzboxClient, getCachedData, checkRateLimitFritzBox } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (request, _context, session) => {
  const rateLimitResult = await checkRateLimitFritzBox(session.user.sub, 'history-bandwidth-hourly');
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
  const days = searchParams.get('days');
  const limit = searchParams.get('limit');
  const offset = searchParams.get('offset');
  if (days) params.set('days', days);
  if (limit) params.set('limit', limit);
  if (offset) params.set('offset', offset);

  const data = await getCachedData('history-bandwidth-hourly', () => fritzboxClient.getBandwidthHourly(params));
  return success({ data });
}, 'FritzBox/HistoryBandwidthHourly');
```

### Pattern 4: Flat Object Route (for FRITZ-12)

```typescript
// Source: app/api/fritzbox/system/route.ts (verified)
import { withAuthAndErrorHandler, success, ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core';
import { fritzboxClient, getCachedData, checkRateLimitFritzBox } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (_request, _context, session) => {
  const rateLimitResult = await checkRateLimitFritzBox(session.user.sub, 'budget-stats');
  if (!rateLimitResult.allowed) {
    throw new ApiError(
      ERROR_CODES.RATE_LIMITED,
      `Troppe richieste. Riprova tra ${rateLimitResult.nextAllowedIn}s`,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      { retryAfter: rateLimitResult.nextAllowedIn }
    );
  }

  const stats = await getCachedData('budget-stats', () => fritzboxClient.getBudgetStats());
  return success({ stats });
}, 'FritzBox/BudgetStats');
```

### Pattern 5: BandwidthAggregatedRecord (for FRITZ-11)

The auto endpoint uses a unified record with a granularity discriminator. The timestamp field name is `timestamp` (not `hour_timestamp` or `day_timestamp`):

```typescript
// Source: docs/api/fritzbox.md lines 1224-1237 (verified)
interface BandwidthAggregatedRecord {
  timestamp: number;           // Unix timestamp of period start
  granularity: 'hourly' | 'daily';
  avg_upstream_rate: number;
  min_upstream_rate: number;
  max_upstream_rate: number;
  avg_downstream_rate: number;
  min_downstream_rate: number;
  max_downstream_rate: number;
  avg_bytes_sent: number;
  avg_bytes_received: number;
  sample_count: number;
}
```

### Anti-Patterns to Avoid

- **Transforming rates:** Do NOT convert bps to Mbps in client methods. D-05 mandates raw pass-through for all 5 new methods. Existing `getBandwidth()` and `getBandwidthHistory()` transform — but new methods do not.
- **Transforming timestamps:** Do NOT multiply Unix timestamps by 1000. Raw pass-through only; transformation belongs in Phase 134 frontend hooks.
- **Renaming fields to camelCase:** Fields like `hour_timestamp`, `avg_upstream_rate` pass through unchanged.
- **Cache key collisions:** Use distinct cache keys for each endpoint: `history-bandwidth-hourly`, `history-bandwidth-daily`, `history-devices-daily`, `history-bandwidth-auto`, `budget-stats`. Do not reuse an existing key like `bandwidth`.
- **Adding query params to budget-stats route:** D-08 is explicit — no query params. Use `_request` (underscore prefix, unused) same as `getSystemInfo`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Authentication | JWT validation middleware | `withAuthAndErrorHandler` from `@/lib/core` | Already handles Auth0 session check + error wrapping |
| Rate limiting | Custom window counter | `checkRateLimitFritzBox` from `@/lib/fritzbox` | Firebase RTDB persistent counter, per-user per-endpoint |
| Caching | In-memory Map | `getCachedData` from `@/lib/fritzbox` | Firebase RTDB cache-aside, 60s TTL, env-aware paths |
| HTTP transport | Direct fetch to HA proxy | `haGet` from `@/lib/haClient` | X-API-Key auth, RFC 9457 error parsing, TypeScript generics |
| Response envelope | Custom JSON builder | `success()` from `@/lib/core/apiResponse` | Consistent `{ success: true, ...data }` format |
| Granularity logic | Client-side switch | Pass `days` param to auto endpoint | Server-side selection: `days <= 7` → hourly, `days > 7` → daily |

---

## Common Pitfalls

### Pitfall 1: Response Key Naming in success()

**What goes wrong:** Using inconsistent response key names, making Phase 134 hooks harder to consume.
**Why it happens:** Different devs name keys differently (`data`, `items`, `result`, etc.).
**How to avoid:** Follow the Phase 132 pattern — use descriptive keys matching the endpoint: `{ hourly }`, `{ daily }`, `{ deviceCounts }`, `{ auto }`, `{ stats }`. The exact key is Claude's discretion, but must be consistent and documented in the route JSDoc.
**Warning signs:** Route returns `{ data: { items: [...] } }` where `data` adds no semantic value.

### Pitfall 2: Cache Key Shared with Paginated Params

**What goes wrong:** Two requests with different `days` params get each other's cached data. E.g., `?days=7` and `?days=30` both hit the `history-bandwidth-hourly` cache key.
**Why it happens:** The existing pattern (e.g., `getCachedData('dhcp-reservations', ...)`) does not encode params into the cache key.
**How to avoid:** This is an existing limitation accepted by the project (see Phase 132 DHCP route — same issue, not addressed). Carry forward the same pattern: single cache key per endpoint, no param-keying. Document this as a known limitation.
**Warning signs:** Inconsistency if you try to add param-based cache keys for some endpoints but not others.

### Pitfall 3: Confusing `hour_timestamp` vs `day_timestamp` vs `timestamp`

**What goes wrong:** Using the wrong field name when defining interfaces, causing TypeScript errors or silent wrong-field access.
**Why it happens:** Three distinct timestamp field names across the four history interfaces.
**How to avoid:** Copy exact field names from `docs/api/fritzbox.md`:
- `BandwidthHourlyRecord` uses `hour_timestamp`
- `BandwidthDailyRecord` uses `day_timestamp`
- `DeviceDailyRecord` uses `day_timestamp`
- `BandwidthAggregatedRecord` uses `timestamp` (unified field for auto endpoint)

### Pitfall 4: Adding budget-stats to `fritzboxClient` export object

**What goes wrong:** Forgetting to add new method names to the exported `fritzboxClient` object literal at the bottom of `fritzboxClient.ts`.
**Why it happens:** The file uses an explicit object export, not automatic namespace export. New methods defined but not listed in the object are invisible to consumers.
**How to avoid:** After adding all 5 function declarations, verify all 5 are listed in the `export const fritzboxClient = { ... }` block.

### Pitfall 5: Route handler using `request` for budget-stats

**What goes wrong:** Including `request` parameter in the budget-stats route handler causes TypeScript to warn about unused variables.
**Why it happens:** Copy-paste from paginated routes without adjusting.
**How to avoid:** Use `_request` (unused) for budget-stats route, matching `getSystemInfo`/`getMeshTopology` pattern.

---

## Code Examples

### Complete interface set to add to fritzboxClient.ts

```typescript
// Source: docs/api/fritzbox.md lines 1039-1051, 1101-1113, 1160-1167, 1225-1237, 1317-1328 (verified)

interface BandwidthHourlyRecord {
  hour_timestamp: number;
  avg_upstream_rate: number;
  min_upstream_rate: number;
  max_upstream_rate: number;
  avg_downstream_rate: number;
  min_downstream_rate: number;
  max_downstream_rate: number;
  avg_bytes_sent: number;
  avg_bytes_received: number;
  sample_count: number;
}

interface BandwidthDailyRecord {
  day_timestamp: number;
  avg_upstream_rate: number;
  min_upstream_rate: number;
  max_upstream_rate: number;
  avg_downstream_rate: number;
  min_downstream_rate: number;
  max_downstream_rate: number;
  avg_bytes_sent: number;
  avg_bytes_received: number;
  sample_count: number;
}

interface DeviceDailyRecord {
  day_timestamp: number;
  hour_bucket: number;    // 0-23
  online_count: number;
  offline_count: number;
  total_devices: number;
}

interface BandwidthAggregatedRecord {
  timestamp: number;
  granularity: 'hourly' | 'daily';
  avg_upstream_rate: number;
  min_upstream_rate: number;
  max_upstream_rate: number;
  avg_downstream_rate: number;
  min_downstream_rate: number;
  max_downstream_rate: number;
  avg_bytes_sent: number;
  avg_bytes_received: number;
  sample_count: number;
}

interface BudgetStats {
  window_seconds: number;
  current_window_requests: number;
  soft_limit: number;
  hard_limit: number;
  total_lifetime_requests: number;
  warning_count: number;
  utilization_percent: number;
  status: 'ok' | 'warning' | 'danger';
  message: string;
}
```

### Updated fritzboxClient export object

```typescript
// Source: lib/fritzbox/fritzboxClient.ts lines 363-378 (verified)
export const fritzboxClient = {
  // existing methods...
  ping,
  debugRequest,
  getDevices,
  getBandwidth,
  getBandwidthHistory,
  getWanStatus,
  getDeviceEvents,
  getSystemInfo,
  getWifiClients,
  getWifiNetworks,
  getDhcpReservations,
  getPortForwarding,
  getUpnpStatus,
  getMeshTopology,
  // Phase 133 additions:
  getBandwidthHourly,
  getBandwidthDaily,
  getDevicesDaily,
  getBandwidthAuto,
  getBudgetStats,
};
```

### Query param forwarding for days param

```typescript
// Source: app/api/fritzbox/wifi/clients/route.ts lines 35-43 (verified — adapated for days param)
const { searchParams } = new URL(request.url);
const params = new URLSearchParams();
const days = searchParams.get('days');
const limit = searchParams.get('limit');
const offset = searchParams.get('offset');
if (days) params.set('days', days);
if (limit) params.set('limit', limit);
if (offset) params.set('offset', offset);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct Fritz!Box API calls | HA proxy (haGet + X-API-Key) | Phase 99-112 | All providers use shared transport |
| Custom `getBandwidthHistory()` with transformation | Raw pass-through methods | Phase 132 D-05 | New methods skip bps→Mbps, Unix→ms conversions |
| Separate rate limiter configs per feature | Shared `checkRateLimitFritzBox` | Phase 61-67 | One function handles all Fritz!Box endpoints |

**Note:** The existing `getBandwidthHistory()` method uses the raw `history/bandwidth` endpoint (not a history tier) and applies bps→Mbps + Unix→ms transformations. The 5 new methods target the aggregated tier endpoints and must NOT apply transformations (D-05). These are parallel paths serving different consumers.

---

## Open Questions

1. **Cache key for paginated requests with different `days` param**
   - What we know: Existing routes (DHCP, port-forwarding, WiFi clients) use a single cache key regardless of query params
   - What's unclear: For history endpoints, `days=7` and `days=30` will return different data but share the same cache key
   - Recommendation: Follow existing pattern — single cache key per endpoint, document as known limitation. Cache only matters for repeated identical requests (same user, same params within 60s), which is the common dashboard case.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — purely code changes extending existing `lib/fritzbox/fritzboxClient.ts` and adding route files)

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (via next/jest) |
| Config file | jest.config.ts |
| Quick run command | `npm test -- app/api/fritzbox/history` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FRITZ-08 | /api/fritzbox/history/bandwidth/hourly returns 200 with `PaginatedResponse<BandwidthHourlyRecord>`, 429 on rate limit | unit | `npm test -- app/api/fritzbox/history/bandwidth/hourly` | ❌ Wave 0 |
| FRITZ-09 | /api/fritzbox/history/bandwidth/daily returns 200 with `PaginatedResponse<BandwidthDailyRecord>`, 429 on rate limit | unit | `npm test -- app/api/fritzbox/history/bandwidth/daily` | ❌ Wave 0 |
| FRITZ-10 | /api/fritzbox/history/devices/daily returns 200 with `PaginatedResponse<DeviceDailyRecord>` (24 rows/day), 429 on rate limit | unit | `npm test -- app/api/fritzbox/history/devices/daily` | ❌ Wave 0 |
| FRITZ-11 | /api/fritzbox/history/bandwidth/auto returns 200 with `PaginatedResponse<BandwidthAggregatedRecord>`, includes `granularity` field | unit | `npm test -- app/api/fritzbox/history/bandwidth/auto` | ❌ Wave 0 |
| FRITZ-12 | /api/fritzbox/budget-stats returns 200 with flat `BudgetStats` object, 429 on rate limit | unit | `npm test -- app/api/fritzbox/budget-stats` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- app/api/fritzbox`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `app/api/fritzbox/history/bandwidth/hourly/__tests__/route.test.ts` — covers FRITZ-08
- [ ] `app/api/fritzbox/history/bandwidth/daily/__tests__/route.test.ts` — covers FRITZ-09
- [ ] `app/api/fritzbox/history/devices/daily/__tests__/route.test.ts` — covers FRITZ-10
- [ ] `app/api/fritzbox/history/bandwidth/auto/__tests__/route.test.ts` — covers FRITZ-11
- [ ] `app/api/fritzbox/budget-stats/__tests__/route.test.ts` — covers FRITZ-12

All 5 test files should follow the pattern established in `app/api/fritzbox/bandwidth/__tests__/route.test.ts`:
- `jest.mock('@/lib/fritzbox')` + `jest.mock('@/lib/auth0')`
- `mockCheckRateLimit` → `{ allowed: true, ... }` default
- `mockGetCachedData` → mock resolve with fixture data
- Tests: 401 unauthenticated, 200 success, 429 rate limited, cache key assertion, error propagation

---

## Sources

### Primary (HIGH confidence)
- `docs/api/fritzbox.md` — Complete endpoint specification, TypeScript interfaces for all 5 endpoints (lines 1000-1248 history tiers, lines 1295-1345 budget-stats). Verified directly.
- `lib/fritzbox/fritzboxClient.ts` — Existing 13-method client. Verified pattern for `PaginatedResponse<T>`, `getWifiClients(params?)`, `getSystemInfo()`. Verified directly.
- `app/api/fritzbox/network/dhcp/reservations/route.ts` — Canonical paginated route pattern with `days`/`limit`/`offset` forwarding. Verified directly.
- `app/api/fritzbox/system/route.ts` — Canonical flat-object route pattern (no query params). Verified directly.
- `app/api/fritzbox/bandwidth/__tests__/route.test.ts` — Canonical Phase 132 test pattern. Verified directly.

### Secondary (MEDIUM confidence)
- `lib/fritzbox/fritzboxCache.ts` — `getCachedData(key, fetcher)` signature confirmed. Single cache key per endpoint, no param-keying.
- `lib/fritzbox/fritzboxRateLimiter.ts` — `checkRateLimitFritzBox(userId, endpoint)` signature confirmed, kebab-case endpoint naming convention.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries are project-internal, verified by direct code inspection
- Architecture: HIGH — exact patterns verified from 4 existing Phase 132 route files
- Pitfalls: HIGH — derived from direct code inspection of existing patterns; confirmed by CONTEXT.md decisions
- TypeScript interfaces: HIGH — copied verbatim from official API spec in `docs/api/fritzbox.md`

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable internal code)
