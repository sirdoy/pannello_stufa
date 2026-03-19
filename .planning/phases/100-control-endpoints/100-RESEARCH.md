# Phase 100: Control Endpoints - Research

**Researched:** 2026-03-19
**Domain:** Next.js API route migration — proxy command wrappers, 202 Accepted pattern, history route
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Phase Boundary:** Migrate all stove command and settings API routes to the proxy client (ignit, shutdown, setPower, setFan, setWaterTemperature) and create a new history endpoint. All routes return proxy response shapes (202 Accepted for commands, paginated history for reads). Frontend hook changes are out of scope (Phase 101).

**Command wrappers:**
- Add `sendIgnit()`, `sendShutdown()`, `setPower(value)`, `setFan(value)`, `setWaterTemp(value)` to `lib/thermorossiProxy.ts`
- All command wrappers use `haPost` from `lib/haClient.ts`
- Return `ThermorossiCommandResponse` (already defined in `types/thermorossiProxy.ts`)
- Command endpoint paths match proxy API: `/api/v1/thermorossi/commands/ignit`, `/commands/shutdown`, `/settings/power`, `/settings/fan-level`, `/settings/temperature/water`

**Route path mapping:**
- Keep existing Next.js route paths: `/api/stove/ignite`, `/api/stove/shutdown`, `/api/stove/setPower`, `/api/stove/setFan`, `/api/stove/setWaterTemperature`
- Each route handler calls the new proxy convenience wrapper instead of StoveService/stoveApi
- New route: `/api/stove/history` (no existing route to migrate)

**Response shape:**
- Control routes return `ThermorossiCommandResponse` directly (202 Accepted with `suggested_poll_delay_s`)
- History route returns `ThermorossiHistoryResponse` directly (paginated with auto-granularity)
- No backward-compatible response transformation — Phase 101 frontend adapts to new shapes

**Idempotency:**
- Keep `withIdempotency` wrapper on ignite and shutdown routes (PWA-level deduplication)
- Settings routes (setPower, setFan, setWaterTemp) keep `withIdempotency` for consistency

**Analytics:**
- Keep fire-and-forget analytics logging on ignite, shutdown, setPower routes (consent-gated)
- Analytics logs the command name, not the proxy response details

**Validation:**
- Simplify validation: parse body for required fields (`value` for settings, `power`/`source` for ignite)
- Let proxy handle range validation (returns 422 for out-of-range values)
- Remove dependency on StoveService and stoveApi validators where possible

**History route:**
- `/api/stove/history` forwards query params (`start`, `end`, `scale`, `limit`, `offset`) to proxy via `getHistory(params)`
- `getHistory()` already exists in `lib/thermorossiProxy.ts` (created in Phase 99)
- Route parses query string into URLSearchParams and passes through

### Claude's Discretion
- Whether to keep or simplify the `source` parameter in ignite/shutdown bodies
- Exact error mapping for 409 Conflict (state gating) from proxy
- Whether dead routes (getRoomTemperature, getActualWaterTemperature, getWaterSetTemperature, settings, setSettings) are cleaned up now or deferred to Phase 103

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CMD-01 | POST /commands/ignit via proxy — handles 202 Accepted with suggested_poll_delay_s | `sendIgnit()` wrapper calls `haPost('/api/v1/thermorossi/commands/ignit', {})`, route returns `success(data, null, 202)` |
| CMD-02 | POST /commands/shutdown via proxy — handles 202 Accepted with suggested_poll_delay_s | `sendShutdown()` wrapper calls `haPost('/api/v1/thermorossi/commands/shutdown', {})`, route returns `success(data, null, 202)` |
| CMD-03 | POST /settings/power via proxy — sends { value: N }, handles 202 Accepted | `setPower(value)` wrapper calls `haPost('/api/v1/thermorossi/settings/power', { value })` |
| CMD-04 | POST /settings/fan-level via proxy — sends { value: N }, handles 202 Accepted | `setFan(value)` wrapper calls `haPost('/api/v1/thermorossi/settings/fan-level', { value })` |
| CMD-05 | POST /settings/temperature/water via proxy — sends { value: N }, range 40-80C | `setWaterTemp(value)` wrapper calls `haPost('/api/v1/thermorossi/settings/temperature/water', { value })`, range validated by proxy (422) |
| READ-05 | GET /history available via proxy — paginated telemetry with auto-granularity | `getHistory()` already exists in Phase 99; new `/api/stove/history` route passes query string params through |
</phase_requirements>

---

## Summary

Phase 100 is a focused migration: 5 existing control routes replace their `StoveService`/`stoveApi` calls with new proxy wrappers, and 1 new history route is created. All types are already defined in `types/thermorossiProxy.ts`. The `getHistory()` convenience wrapper already exists in `lib/thermorossiProxy.ts`. The only new code is 5 command wrappers in `lib/thermorossiProxy.ts` and 6 route files (5 migrated, 1 new).

The critical behavioral change is the response status: all control routes must return **202 Accepted** instead of 200. The `success()` helper in `lib/core/apiResponse.ts` accepts a status parameter (`success(data, null, 202)`), and `HTTP_STATUS` does not include a 202 constant — use the literal `202` directly. The proxy handles state gating (409 Conflict) and range validation (422); the routes do minimal local validation.

The `haPost` transport already handles all error mapping (RFC 9457, timeouts, 503) and throws `ApiError` instances that `withAuthAndErrorHandler` converts to appropriate responses. The 409 Conflict from state gating will propagate via `ApiError(EXTERNAL_API_ERROR)` with status 502 unless explicitly mapped — this is Claude's discretion area.

**Primary recommendation:** Add 5 command wrappers to `lib/thermorossiProxy.ts` using `haPost`, migrate 5 routes to call those wrappers returning `success(data, null, 202)`, create `/api/stove/history` route forwarding query params via existing `getHistory()`, and extend `__tests__/lib/thermorossiProxy.test.ts` with command wrapper tests.

---

## Standard Stack

### Core (all already installed)
| Asset | Location | Purpose | Status |
|-------|----------|---------|--------|
| `haPost` | `lib/haClient.ts` | POST transport to HA proxy, handles X-API-Key, timeouts, RFC 9457 errors | Ready |
| `ThermorossiCommandResponse` | `types/thermorossiProxy.ts` | Typed response for all 5 command wrappers | Ready |
| `ThermorossiHistoryResponse` | `types/thermorossiProxy.ts` | Typed response for history route | Ready |
| `getHistory()` | `lib/thermorossiProxy.ts` | History convenience wrapper with URLSearchParams | Ready (Phase 99) |
| `withAuthAndErrorHandler` | `lib/core/middleware.ts` | Auth + error boundary for all routes | Ready |
| `withIdempotency` | `lib/core/middleware.ts` | PWA-level dedup for ignite/shutdown/settings | Ready |
| `success()` | `lib/core/apiResponse.ts` | JSON response builder, accepts custom status (use `202`) | Ready |
| `parseJson` / `parseJsonOrThrow` | `lib/core/requestParser.ts` | Body parsing for settings routes | Ready |

### No new dependencies needed
All libraries for this phase are already in the codebase. No `npm install` required.

---

## Architecture Patterns

### Pattern 1: Proxy command wrapper in `lib/thermorossiProxy.ts`

All 5 command wrappers follow the same shape — `haPost` with typed response, no body for commands, `{ value }` body for settings:

```typescript
// Source: lib/netatmoProxy.ts (reference pattern) + lib/haClient.ts haPost signature
export async function sendIgnit(): Promise<ThermorossiCommandResponse> {
  return haPost<ThermorossiCommandResponse>(
    '/api/v1/thermorossi/commands/ignit',
    {}
  );
}

export async function setPower(value: number): Promise<ThermorossiCommandResponse> {
  return haPost<ThermorossiCommandResponse>(
    '/api/v1/thermorossi/settings/power',
    { value }
  );
}
```

Note: `haPost` signature is `haPost<T>(endpoint, body: Record<string, unknown>, options?)`. Empty body `{}` is valid for ignit/shutdown since proxy accepts no body on those endpoints.

### Pattern 2: Control route (202 Accepted)

Migrated route structure — replaces `getStoveService()` call with proxy wrapper:

```typescript
// Source: app/api/stove/health/route.ts (Phase 99 pattern)
import { withAuthAndErrorHandler, withIdempotency, success } from '@/lib/core';
import { sendIgnit } from '@/lib/thermorossiProxy';
import { logAnalyticsEvent } from '@/lib/analyticsEventLogger';

export const dynamic = 'force-dynamic';

export const POST = withAuthAndErrorHandler(
  withIdempotency(async (request) => {
    const data = await sendIgnit();

    const consent = request.headers.get('x-analytics-consent');
    if (consent === 'granted') {
      logAnalyticsEvent({ eventType: 'stove_ignite' }).catch(() => {});
    }

    return success(data as unknown as Record<string, unknown>, null, 202);
  }),
  'Stove/Ignite'
);
```

Key: `success()` third argument is the HTTP status. Use literal `202` (not `HTTP_STATUS.ACCEPTED` — that constant does not exist in `lib/core/apiErrors.ts`).

### Pattern 3: History route (query param forwarding)

```typescript
// Source: lib/thermorossiProxy.ts getHistory() + existing GET route patterns
import { withAuthAndErrorHandler, success, parseQuery } from '@/lib/core';
import { getHistory } from '@/lib/thermorossiProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (request) => {
  const { searchParams } = request.nextUrl;
  const params = new URLSearchParams(searchParams.toString());
  const data = await getHistory(params.size > 0 ? params : undefined);
  return success(data as unknown as Record<string, unknown>);
}, 'Stove/History');
```

### Pattern 4: Settings route body parsing

Settings routes need to extract `value` from body. Use `parseJsonOrThrow` (matches existing `setPower`/`setFan` pattern) or `parseJson`. Let proxy handle range validation:

```typescript
export const POST = withAuthAndErrorHandler(
  withIdempotency(async (request) => {
    const body = await parseJsonOrThrow(request);
    const value = body['value'] as number;
    // No local range check — proxy returns 422 for out-of-range
    const data = await setPower(value);
    return success(data as unknown as Record<string, unknown>, null, 202);
  }),
  'Stove/SetPower'
);
```

### Recommended Project Structure (no structural changes needed)

The 6 routes land in existing directories:

```
app/api/stove/
├── ignite/route.ts        # migrated (5 routes already exist)
├── shutdown/route.ts      # migrated
├── setPower/route.ts      # migrated
├── setFan/route.ts        # migrated
├── setWaterTemperature/route.ts  # migrated
└── history/route.ts       # new (CREATE this directory)

lib/
└── thermorossiProxy.ts    # extended with 5 command wrappers
```

### Anti-Patterns to Avoid

- **Importing `StoveService` or `stoveApi`:** These are being replaced entirely. All calls go through `lib/thermorossiProxy.ts`.
- **Returning `success(data)` (200) for command routes:** Must be `success(data, null, 202)`. Proxy explicitly returns 202; the client in Phase 101 will check for 202.
- **Local range validation on settings routes:** The CONTEXT.md decision delegates range validation to the proxy (422). Do not replicate proxy logic.
- **Using `HTTP_STATUS.ACCEPTED`:** This constant does not exist in `lib/core/apiErrors.ts`. Use the literal `202`.
- **Passing `params` to `getHistory()` when no query params present:** Pass `undefined` for bare requests to avoid empty `?` in URL.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| POST to HA proxy | Custom fetch with auth | `haPost` from `lib/haClient.ts` | X-API-Key, AbortController timeout, RFC 9457 error mapping already implemented |
| Error boundary on routes | Try-catch in every handler | `withAuthAndErrorHandler` | Converts all `ApiError` throws to correct HTTP responses |
| Idempotency cache | Firebase writes per-route | `withIdempotency` | Already wraps handler, checks RTDB cache, stores response |
| History query forwarding | Manual param extraction | `new URLSearchParams(request.nextUrl.searchParams.toString())` + `getHistory(params)` | `getHistory` already appends query string; just convert `searchParams` to `URLSearchParams` |
| Type definitions | New interfaces | `ThermorossiCommandResponse`, `ThermorossiHistoryResponse` in `types/thermorossiProxy.ts` | All types defined in Phase 99 |

**Key insight:** This phase is purely mechanical migration. Every building block exists; the work is wiring them together.

---

## Common Pitfalls

### Pitfall 1: Wrong HTTP status on command routes
**What goes wrong:** Route returns 200 (default `success()`) instead of 202 Accepted.
**Why it happens:** Calling `success(data)` without the status argument.
**How to avoid:** Always call `success(data as unknown as Record<string, unknown>, null, 202)` on all 5 command routes.
**Warning signs:** Client test expecting `response.status === 202` fails.

### Pitfall 2: Proxy path `/commands/ignit` vs Next.js path `/api/stove/ignite`
**What goes wrong:** Using the Next.js route name (`ignite` with trailing `e`) in the proxy client path.
**Why it happens:** The proxy API URL is `/commands/ignit` (no `e`), but the existing Next.js route folder is `ignite/`.
**How to avoid:** The `sendIgnit()` wrapper uses `/api/v1/thermorossi/commands/ignit` (no `e`). The Next.js route folder `/ignite` stays unchanged.
**Warning signs:** Proxy returns 404 on ignite commands.

### Pitfall 3: 409 Conflict from state gating appears as 502 Bad Gateway
**What goes wrong:** Proxy returns 409 when stove is in wrong state; `haPost` maps this to `ApiError(EXTERNAL_API_ERROR)` with status 502.
**Why it happens:** `mapResponseError` in `lib/haClient.ts` has no explicit case for 409 — it falls through to `throw new ApiError(EXTERNAL_API_ERROR, ..., HTTP_STATUS.BAD_GATEWAY)`.
**How to avoid:** This is a Claude's Discretion area. Options:
  - Accept 502 passthrough (Phase 101 frontend handles it as a generic error)
  - Add 409 mapping in the route handler or in `haPost` extension
  - Recommended: Check if Phase 101 needs explicit 409 handling; for now accept 502 as tolerable since the CONTEXT.md does not require exact 409 forwarding.
**Warning signs:** Frontend receives 502 when trying to ignite an already-running stove; no actionable "wrong state" message.

### Pitfall 4: `withIdempotency` wrapping order
**What goes wrong:** `withIdempotency` wraps `withAuthAndErrorHandler`, but looking at existing ignite route it wraps the handler passed *inside* `withAuthAndErrorHandler`.
**Why it happens:** The existing pattern in `app/api/stove/ignite/route.ts` is `withAuthAndErrorHandler(withIdempotency(handler), logContext)` — the idempotency wrapper is the inner handler.
**How to avoid:** Follow the existing route pattern exactly: `withAuthAndErrorHandler(withIdempotency(async (request) => { ... }), 'Stove/Ignite')`.

### Pitfall 5: Settings body field name mismatch
**What goes wrong:** Current `setPower` route reads `body.level` (from `validateSetPowerInput`); new proxy expects `{ value: N }`.
**Why it happens:** Old StoveService used different field names (`level`, `source`). Proxy always uses `value`.
**How to avoid:** Read `body['value']` not `body['level']` in the new settings routes. The proxy wrapper sends `{ value }` to the proxy.

### Pitfall 6: `getHistory()` called with empty URLSearchParams
**What goes wrong:** Passing `new URLSearchParams('')` appends a bare `?` to the URL instead of nothing.
**Why it happens:** `params.toString()` on empty params returns `''`, and the `getHistory` implementation concatenates `?${params.toString()}` → `history?`.
**How to avoid:** Pass `undefined` when `searchParams` is empty: `const params = searchParams.size > 0 ? new URLSearchParams(searchParams.toString()) : undefined`.

---

## Code Examples

Verified from actual codebase sources:

### haPost signature (from `lib/haClient.ts`)
```typescript
// Source: lib/haClient.ts lines 172-205
export async function haPost<T>(
  endpoint: string,
  body: Record<string, unknown>,
  options: HaRequestOptions = {}
): Promise<T>
```

### success() with custom status (from `lib/core/apiResponse.ts`)
```typescript
// Source: lib/core/apiResponse.ts lines 34-49
export function success(
  data: Record<string, unknown>,
  message: string | null = null,
  status: HttpStatus = HTTP_STATUS.OK  // default 200 — pass 202 for commands
): NextResponse
```

### Phase 99 read route pattern (canonical template for Phase 100)
```typescript
// Source: app/api/stove/status/route.ts
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getStatus } from '@/lib/thermorossiProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await getStatus();
  return success(data as unknown as Record<string, unknown>);
}, 'Stove/Status');
```

### Netatmo haPost command wrapper (reference pattern)
```typescript
// Source: lib/netatmoProxy.ts lines 72-76
export async function proxySetRoomThermpoint(
  body: SetRoomThermpointRequest
): Promise<ProxyControlResponse> {
  return haPost<ProxyControlResponse>(
    '/api/v1/netatmo/setroomthermpoint',
    body as unknown as Record<string, unknown>
  );
}
```

### ThermorossiCommandResponse (types already defined)
```typescript
// Source: types/thermorossiProxy.ts lines 93-100
export interface ThermorossiCommandResponse {
  command: string;
  status: 'accepted';
  previous_state: StoveState;
  suggested_poll_delay_s: number;
  poll_endpoint: string;
  requested_value: number | null;
}
```

### Analytics pattern (fire-and-forget, consent-gated)
```typescript
// Source: app/api/stove/ignite/route.ts lines 22-29
const consent = request.headers.get('x-analytics-consent');
if (consent === 'granted') {
  logAnalyticsEvent({
    eventType: 'stove_ignite',
    powerLevel: power,
    source: source ?? 'manual',
  }).catch(() {}); // Fire-and-forget
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `getStoveService().ignite()` → 200 OK | `sendIgnit()` via `haPost` → 202 Accepted | Phase 100 | Response status changes; frontend must check 202 (Phase 101) |
| `validateIgniteInput()` validates `power` + `source` | Parse `source` optionally; no range validation | Phase 100 | Simpler routes; proxy is the validator |
| Range 30-80 for water temp (`validateRange`) | Range 40-80 enforced by proxy 422 | Phase 100 | PWA route no longer validates range |
| `setWaterTemperature` has no idempotency or analytics | `setWaterTemp` gets `withIdempotency` for consistency | Phase 100 | Consistent with other settings routes |
| Backward-compatible response transformation in `setPower` | Returns `ThermorossiCommandResponse` directly | Phase 100 | No `modeChanged`/`newMode` in response |

**Deprecated patterns being removed:**
- `getStoveService()` import in all 5 routes
- `validateIgniteInput`, `validateShutdownInput`, `validateSetPowerInput`, `validateSetFanInput` validators
- `setWaterTemperature` import from `lib/stoveApi`
- `result.modeChanged` / `newMode: 'semi-manual'` response logic

---

## Open Questions

1. **409 Conflict state gating passthrough**
   - What we know: `haPost` in `haClient.ts` has no explicit 409 case; falls through to `ApiError(EXTERNAL_API_ERROR, ..., 502)`.
   - What's unclear: Does Phase 101's `useStoveCommands` need to distinguish 409 (wrong state) from other errors?
   - Recommendation: For Phase 100, accept 502 passthrough. If Phase 101 needs actionable 409 handling, add 409 mapping to `haClient.ts` in that phase.

2. **`source` parameter in ignite/shutdown**
   - What we know: Current routes parse `source` from body and pass to `StoveService`. Proxy API spec shows no body for `/commands/ignit` or `/commands/shutdown`.
   - What's unclear: Should `source` be dropped entirely or kept for analytics only?
   - Recommendation (Claude's discretion): Read `source` from body for analytics (`logAnalyticsEvent({ source })`), but do not forward it to the proxy. The proxy does not accept a body on command endpoints.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (project-wide) |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern=thermorossiProxy` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CMD-01 | `sendIgnit()` calls `/api/v1/thermorossi/commands/ignit` via POST | unit | `npm test -- --testPathPattern=thermorossiProxy -t "sendIgnit"` | Wave 0 — extend existing |
| CMD-02 | `sendShutdown()` calls `/api/v1/thermorossi/commands/shutdown` via POST | unit | `npm test -- --testPathPattern=thermorossiProxy -t "sendShutdown"` | Wave 0 — extend existing |
| CMD-03 | `setPower(value)` sends `{ value }` to `/api/v1/thermorossi/settings/power` | unit | `npm test -- --testPathPattern=thermorossiProxy -t "setPower"` | Wave 0 — extend existing |
| CMD-04 | `setFan(value)` sends `{ value }` to `/api/v1/thermorossi/settings/fan-level` | unit | `npm test -- --testPathPattern=thermorossiProxy -t "setFan"` | Wave 0 — extend existing |
| CMD-05 | `setWaterTemp(value)` sends `{ value }` to `/api/v1/thermorossi/settings/temperature/water` | unit | `npm test -- --testPathPattern=thermorossiProxy -t "setWaterTemp"` | Wave 0 — extend existing |
| READ-05 | `getHistory()` already tested; history route forwards searchParams | unit | `npm test -- --testPathPattern=thermorossiProxy -t "getHistory"` | Exists (Phase 99) |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern=thermorossiProxy`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/lib/thermorossiProxy.test.ts` — extend with `sendIgnit`, `sendShutdown`, `setPower`, `setFan`, `setWaterTemp` test cases (file exists, needs new `describe` blocks for command wrappers)

*(No new test files needed — extend the existing `thermorossiProxy.test.ts` following the established mock-fetch pattern)*

---

## Sources

### Primary (HIGH confidence)
- `docs/api/thermorossi.md` — Proxy API spec: all 5 command endpoint paths, request bodies, response shapes, state gating table, history query params (live-verified 2026-03-18)
- `lib/haClient.ts` — `haPost` signature, error mapping behavior (no 409 case confirmed)
- `lib/thermorossiProxy.ts` — Phase 99 state: `getHistory()` exists, `haPost` not yet imported
- `types/thermorossiProxy.ts` — All types confirmed: `ThermorossiCommandResponse`, `ThermorossiHistoryResponse`, `ThermorossiHistoryItem`
- `lib/core/apiResponse.ts` — `success()` accepts optional status; `HTTP_STATUS` does not include 202
- `lib/core/middleware.ts` — `withIdempotency` wrapping order confirmed

### Secondary (MEDIUM confidence)
- `app/api/stove/ignite/route.ts` et al. — Current route implementations confirmed; validator/StoveService imports to remove
- `lib/netatmoProxy.ts` — `haPost` command wrapper reference pattern confirmed
- `__tests__/lib/thermorossiProxy.test.ts` — Test pattern: mock `global.fetch`, `jest.clearAllMocks()` in `beforeEach`

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all assets verified directly in codebase, no external dependencies
- Architecture patterns: HIGH — patterns extracted from Phase 99 routes and netatmo reference
- Pitfalls: HIGH — discovered by reading actual current route implementations and `haClient.ts` error mapping code
- Test patterns: HIGH — existing test file provides exact template to extend

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable internal codebase — changes only if proxy API spec changes)
