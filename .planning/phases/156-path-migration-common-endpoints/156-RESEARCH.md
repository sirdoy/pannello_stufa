# Phase 156: Path Migration & Common Endpoints - Research

**Researched:** 2026-04-07
**Domain:** Next.js App Router API route migration + cross-provider aggregation
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Remove old `/api/stove/*` routes entirely after creating new `/api/v1/thermorossi/*` routes. No redirects — the success criteria requires 404 on old paths, and this is a local PWA with no external consumers.
- **D-02:** The service worker (`app/sw.ts`) references `/api/stove/status` and must be updated to the new path.
- **D-03:** Follow `docs/api/thermorossi.md` path structure exactly. Current route names differ significantly from the documented API:
  - `GET /api/stove/status` → `GET /api/v1/thermorossi/status`
  - `GET /api/stove/health` → `GET /api/v1/thermorossi/health`
  - `GET /api/stove/getPower` → `GET /api/v1/thermorossi/power`
  - `GET /api/stove/getFan` → `GET /api/v1/thermorossi/fan-level`
  - `GET /api/stove/history` → `GET /api/v1/thermorossi/history`
  - `POST /api/stove/ignite` → `POST /api/v1/thermorossi/commands/ignit`
  - `POST /api/stove/shutdown` → `POST /api/v1/thermorossi/commands/shutdown`
  - `POST /api/stove/setPower` → `POST /api/v1/thermorossi/settings/power`
  - `POST /api/stove/setFan` → `POST /api/v1/thermorossi/settings/fan-level`
  - `POST /api/stove/setWaterTemperature` → `POST /api/v1/thermorossi/settings/temperature/water`
- **D-04:** The proxy client (`lib/stove/thermorossiProxy.ts`) itself does NOT change — it calls the HA proxy, not the Next.js routes. Only the Next.js route file locations and frontend fetch paths change.
- **D-05:** `GET /health` replaces the current simple connectivity check with an aggregated status covering all 8 registered providers (Thermorossi, Netatmo, Fritz!Box, Raspberry Pi, Hue, Sonos, DIRIGERA, Tuya).
- **D-06:** The existing `/api/health` route stays as-is for backward compatibility (simple connectivity check). The new aggregated health is at `GET /health` as documented in `docs/api/README.md` Common module.
- **D-07:** `GET /api/v1/devices` returns a unified device list combining all providers. This is a new route — the existing `/api/devices/config` and `/api/devices/preferences` are unrelated (device registry config).

### Claude's Discretion
- Response shapes for /health and /api/v1/devices — follow whatever the HA proxy returns or match documented shapes in docs/api/
- Error handling patterns — use existing `withErrorHandler` + `success()` pattern from `lib/core`
- Test file organization — follow existing patterns

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PATH-01 | Tutte le route thermorossi migrate da /api/stove/* a /api/v1/thermorossi/* | 10 new route files under `app/api/v1/thermorossi/`, 10 old route directories deleted |
| PATH-02 | Frontend (hooks, componenti, debug panels) aggiornato ai nuovi path thermorossi | 6 non-route files contain fetch calls or string literals referencing `/api/stove/` that must be updated |
| COMMON-01 | GET /health ritorna stato aggregato di tutti i provider | New `app/health/route.ts`; calls 8 provider health functions with Promise.allSettled |
| COMMON-02 | GET /api/v1/devices ritorna lista aggregata dispositivi cross-provider | New `app/api/v1/devices/route.ts`; fritzboxClient.getDevices() is the only known provider returning network devices |
</phase_requirements>

---

## Summary

Phase 156 is a pure structural migration with zero new proxy-client logic. The proxy client (`lib/stove/thermorossiProxy.ts`) already calls the HA proxy at the correct `/api/v1/thermorossi/*` paths — only the Next.js route file tree and frontend fetch strings need to change. The directory rename is mechanical: create `app/api/v1/thermorossi/` with deeply-nested route segments matching the documented path structure, copy each route handler verbatim (updating only the JSDoc comment), delete the old `app/api/stove/` directories, then sweep the frontend files for string replacements.

The two new aggregate endpoints (`GET /health` and `GET /api/v1/devices`) are also additive. Each calls existing proxy functions and fans out with `Promise.allSettled` to stay resilient against individual provider failures. The `/health` response shape is documented in `docs/api/README.md` and matches what `fritzboxClient.ping()` already returns from the HA proxy. The `/api/v1/devices` response shape is documented in the same file and returns fritzbox network devices tagged with `provider_type`.

The highest-risk area is completeness — missing any single reference to `/api/stove/` in the frontend will cause a silent runtime 404. The mitigation is a post-migration `grep -r '/api/stove/' --include='*.ts' --include='*.tsx'` as a verification step (excluding `.next/`, `lib/version.ts` changelog, and test comments that use URLs as arbitrary strings for idempotency tests).

**Primary recommendation:** Perform the migration in two sequential plans: (1) create new routes + delete old directories, (2) update all frontend references + service worker, then run the verification grep and update tests.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 15.5 | File-system routing for API routes | Project stack |
| `lib/core` (internal) | — | `withAuthAndErrorHandler`, `withErrorHandler`, `withIdempotency`, `success()`, `noContent()`, `parseJson`, `parseJsonOrThrow`, `HTTP_STATUS` | Established project pattern — all routes use this |
| `lib/haClient` | — | `haGet`, `haPost`, `haPut`, `haDelete` | Shared HA proxy transport |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `Promise.allSettled` | built-in | Fan-out health/device calls with partial failure tolerance | Required for aggregated endpoints — one provider down must not return 500 |

**Installation:** No new packages required. This phase adds no dependencies.

---

## Architecture Patterns

### Next.js App Router — Nested Route Segments

The documented path `/api/v1/thermorossi/commands/ignit` maps to the file:

```
app/api/v1/thermorossi/commands/ignit/route.ts
```

Similarly `/api/v1/thermorossi/settings/temperature/water` maps to:

```
app/api/v1/thermorossi/settings/temperature/water/route.ts
```

The `GET /health` endpoint is at the app root (not under `/api/`):

```
app/health/route.ts
```

This directory does not exist yet. In Next.js App Router, a route file at `app/health/route.ts` serves `GET /health` with no additional configuration.

### Full New Directory Tree

```
app/
├── health/
│   └── route.ts                                      # GET /health (COMMON-01)
├── api/
│   └── v1/
│       ├── devices/
│       │   └── route.ts                              # GET /api/v1/devices (COMMON-02)
│       └── thermorossi/
│           ├── health/
│           │   └── route.ts                          # GET /api/v1/thermorossi/health
│           ├── status/
│           │   └── route.ts                          # GET /api/v1/thermorossi/status
│           ├── power/
│           │   └── route.ts                          # GET /api/v1/thermorossi/power
│           ├── fan-level/
│           │   └── route.ts                          # GET /api/v1/thermorossi/fan-level
│           ├── history/
│           │   └── route.ts                          # GET /api/v1/thermorossi/history
│           ├── commands/
│           │   ├── ignit/
│           │   │   └── route.ts                      # POST /api/v1/thermorossi/commands/ignit
│           │   └── shutdown/
│           │       └── route.ts                      # POST /api/v1/thermorossi/commands/shutdown
│           └── settings/
│               ├── power/
│               │   └── route.ts                      # POST /api/v1/thermorossi/settings/power
│               ├── fan-level/
│               │   └── route.ts                      # POST /api/v1/thermorossi/settings/fan-level
│               └── temperature/
│                   └── water/
│                       └── route.ts                  # POST /api/v1/thermorossi/settings/temperature/water
```

### Pattern 1: Route Handler — Proxy Passthrough (GET)

Each read endpoint wraps one proxy function call in `withAuthAndErrorHandler`. The body is identical to the existing `app/api/stove/status/route.ts` — only the JSDoc path comment and file location change.

```typescript
// Source: app/api/stove/status/route.ts (existing pattern)
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getStatus } from '@/lib/stove/thermorossiProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/thermorossi/status
 * Returns combined stove telemetry from the HA proxy.
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getStatus();
  return success(data as unknown as Record<string, unknown>);
}, 'Stove/Status');
```

### Pattern 2: Route Handler — Command with Idempotency (POST, no body)

```typescript
// Source: app/api/stove/ignite/route.ts (existing pattern)
import { withAuthAndErrorHandler, withIdempotency, success, parseJson, HTTP_STATUS } from '@/lib/core';
import { sendIgnit } from '@/lib/stove/thermorossiProxy';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/thermorossi/commands/ignit
 * Ignites the stove via HA proxy. Returns 202 Accepted.
 */
export const POST = withAuthAndErrorHandler(
  withIdempotency(async (request) => {
    const body = await parseJson(request);
    void (body?.['source'] as string | undefined);
    const data = await sendIgnit();
    return success(data as unknown as Record<string, unknown>, null, HTTP_STATUS.ACCEPTED);
  }),
  'Stove/Ignit'
);
```

### Pattern 3: Route Handler — Command with Body (POST, value param)

```typescript
// Source: app/api/stove/setPower/route.ts (existing pattern)
import { withAuthAndErrorHandler, withIdempotency, success, parseJsonOrThrow, HTTP_STATUS } from '@/lib/core';
import { setPower } from '@/lib/stove/thermorossiProxy';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/thermorossi/settings/power
 * Sets the power level (1-5) via HA proxy. Returns 202 Accepted.
 */
export const POST = withAuthAndErrorHandler(
  withIdempotency(async (request) => {
    const body = await parseJsonOrThrow(request);
    const value = body['value'] as number;
    const data = await setPower(value);
    return success(data as unknown as Record<string, unknown>, null, HTTP_STATUS.ACCEPTED);
  }),
  'Stove/SetPower'
);
```

### Pattern 4: Aggregated Health — Promise.allSettled Fan-Out

The `/health` route calls all 8 provider health functions in parallel. Each call is allowed to fail without breaking the overall response. The documented shape from `docs/api/README.md`:

```typescript
// Source: docs/api/README.md §Common Endpoints
interface HealthResponse {
  status: "ok" | "degraded";
  cache_age_seconds: number | null;
  providers: Record<string, "ok" | "degraded" | "down"> | null;
  flush: FlushStats | null;
  aggregation: AggregationStats | null;
  retention: RetentionStats | null;
}
```

Implementation approach — call the HA proxy's `/health` endpoint (which already aggregates fritzbox/netatmo/etc.) and also call each per-provider health function for providers not covered there:

```typescript
// app/health/route.ts
import { withErrorHandler, success } from '@/lib/core';
import { getHealth as getThermorossiHealth } from '@/lib/stove/thermorossiProxy';
import { getProxyHealth as getNetatmoHealth } from '@/lib/netatmo/netatmoProxy';
import { getHealth as getHueHealth } from '@/lib/hue/hueProxy';
import { getHealth as getSonosHealth } from '@/lib/sonos/sonosProxy';
import { getHealth as getDirigeraHealth } from '@/lib/dirigera/dirigeraProxy';
import { getHealth as getTuyaHealth } from '@/lib/tuya/tuyaProxy';
import { raspiClient } from '@/lib/raspi';
import { fritzboxClient } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandler(async () => {
  const [thermorossi, netatmo, hue, sonos, dirigera, tuya, raspi, fritzbox] =
    await Promise.allSettled([
      getThermorossiHealth(),
      getNetatmoHealth(),
      getHueHealth(),
      getSonosHealth(),
      getDirigeraHealth(),
      getTuyaHealth(),
      raspiClient.getHealth(),
      fritzboxClient.ping(),
    ]);

  const toStatus = (r: PromiseSettledResult<unknown>) =>
    r.status === 'fulfilled' ? 'ok' : 'down';

  const providers = {
    thermorossi: toStatus(thermorossi),
    netatmo: toStatus(netatmo),
    hue: toStatus(hue),
    sonos: toStatus(sonos),
    dirigera: toStatus(dirigera),
    tuya: toStatus(tuya),
    raspi: toStatus(raspi),
    fritzbox: toStatus(fritzbox),
  };

  const allOk = Object.values(providers).every(s => s === 'ok');

  return success({
    status: allOk ? 'ok' : 'degraded',
    providers,
  });
}, 'Health/Aggregated');
```

**Note on auth:** The documented `/health` endpoint requires no authentication (`docs/api/README.md`). Use `withErrorHandler` (not `withAuthAndErrorHandler`) — consistent with the existing `app/api/health/route.ts` which also uses `withErrorHandler`.

### Pattern 5: Aggregated Devices — Single-Provider for Now

The documented `/api/v1/devices` shape returns devices with a `provider_type` field. The only provider that currently returns network-level devices is Fritz!Box. The route calls `fritzboxClient.getDevices()` and tags each item:

```typescript
// app/api/v1/devices/route.ts
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { fritzboxClient } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const devices = await fritzboxClient.getDevices();
  const items = devices.map(d => ({
    ip: d.ip,
    name: d.name,
    mac: d.mac,
    status: d.active ? 1 : 0,
    provider_type: 'fritzbox',
  }));
  return success({
    items,
    total_count: items.length,
    limit: items.length,
    offset: 0,
  });
}, 'Devices/Aggregated');
```

### Anti-Patterns to Avoid

- **Redirect instead of delete:** D-01 requires 404 on old paths. Do not add `next.config.ts` redirects — just delete the old directories.
- **Changing thermorossiProxy.ts:** D-04 prohibits changes to the proxy client. It already calls the correct HA paths.
- **Modifying lib/version.ts:** Changelog strings referencing `/api/stove/` are historical records. Do not update them.
- **Breaking /api/health:** D-06 requires the existing simple connectivity check at `/api/health` to remain. Do not modify `app/api/health/route.ts`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Partial failure tolerance in fan-out | Custom try/catch loops | `Promise.allSettled` | Handles fulfilled and rejected results uniformly |
| Auth middleware | Custom auth logic | `withAuthAndErrorHandler` from `lib/core` | Established pattern used by all 90+ routes |
| API error formatting | Custom error objects | `withErrorHandler` / `ApiError` from `lib/core` | RFC 9457 compliance built in |
| Route boilerplate | Custom handler wrapping | `withIdempotency` + `withAuthAndErrorHandler` | Idempotency key deduplication already wired |

---

## Complete File Inventory

### Files to Create (12 new route files)

| File | Handler | Exports |
|------|---------|---------|
| `app/health/route.ts` | Aggregated health (COMMON-01) | `GET` |
| `app/api/v1/devices/route.ts` | Aggregated devices (COMMON-02) | `GET` |
| `app/api/v1/thermorossi/health/route.ts` | Proxy health | `GET` |
| `app/api/v1/thermorossi/status/route.ts` | Combined telemetry | `GET` |
| `app/api/v1/thermorossi/power/route.ts` | Power level | `GET` |
| `app/api/v1/thermorossi/fan-level/route.ts` | Fan level | `GET` |
| `app/api/v1/thermorossi/history/route.ts` | Telemetry history | `GET` |
| `app/api/v1/thermorossi/commands/ignit/route.ts` | Ignite command | `POST` |
| `app/api/v1/thermorossi/commands/shutdown/route.ts` | Shutdown command | `POST` |
| `app/api/v1/thermorossi/settings/power/route.ts` | Set power level | `POST` |
| `app/api/v1/thermorossi/settings/fan-level/route.ts` | Set fan level | `POST` |
| `app/api/v1/thermorossi/settings/temperature/water/route.ts` | Set water temp | `POST` |

### Directories to Delete (10 old route directories)

| Directory | Old Path |
|-----------|----------|
| `app/api/stove/status/` | `GET /api/stove/status` |
| `app/api/stove/health/` | `GET /api/stove/health` |
| `app/api/stove/getPower/` | `GET /api/stove/getPower` |
| `app/api/stove/getFan/` | `GET /api/stove/getFan` |
| `app/api/stove/history/` | `GET /api/stove/history` |
| `app/api/stove/ignite/` | `POST /api/stove/ignite` |
| `app/api/stove/shutdown/` | `POST /api/stove/shutdown` |
| `app/api/stove/setPower/` | `POST /api/stove/setPower` |
| `app/api/stove/setFan/` | `POST /api/stove/setFan` |
| `app/api/stove/setWaterTemperature/` | `POST /api/stove/setWaterTemperature` |

After deleting all 10 subdirectories, `app/api/stove/` itself will be empty and should also be removed.

### Files to Update (PATH-02 — frontend references)

| File | References | Nature |
|------|-----------|--------|
| `lib/commands/deviceCommands.tsx` | `/api/stove/ignite`, `/api/stove/shutdown`, `/api/stove/get-power`, `/api/stove/set-power`, `/api/stove/get-fan`, `/api/stove/set-fan` | `fetch()` call strings in `executeStoveAction` |
| `app/debug/api/components/tabs/StoveTab.tsx` | All 10 old paths | fetch strings in `fetchAllGetEndpoints` and `callPostEndpoint` |
| `app/debug/components/tabs/StoveTab.tsx` | All 10 old paths | fetch strings (mirrors the api debug tab) |
| `app/sw.ts` | `/api/stove/status` (lines 597 and 718) | SW cache matcher and offline fallback fetch |
| `lib/hooks/useRetryableCommand.ts` | `/api/stove/ignite` in JSDoc (line 74) | Comment only — cosmetic but should be updated |
| `types/api/responses.ts` | `StoveStatusResponse` JSDoc comment references old path | Comment only — cosmetic but should be updated |

### Test Files to Update

| File | References | What to Change |
|------|-----------|----------------|
| `__tests__/components/devices/stove/hooks/useStoveData.test.ts` | Line 141: `expect.stringContaining('/api/stove/status')` | Update to `/api/v1/thermorossi/status` |
| `__tests__/components/devices/stove/hooks/useStoveCommands.test.ts` | Lines 71, 187, 246, 260, 284, 298, 331, 355, 369 | Update all `/api/stove/` strings to canonical paths |
| `lib/retry/__tests__/idempotencyManager.test.ts` | Lines 25–71: uses `/api/stove/ignite` and `/api/stove/shutdown` as test key strings | Update to `/api/v1/thermorossi/commands/ignit` and `/api/v1/thermorossi/commands/shutdown` |
| `lib/hooks/__tests__/useRetryableCommand.test.ts` | Line 74: JSDoc example | Update comment |

**Important note on idempotencyManager.test.ts:** These tests use the URL strings purely as arbitrary key discriminators (any unique string works). The test semantics do not depend on these being real API paths. Update them to the new canonical paths for consistency, but the tests will pass either way.

---

## Common Pitfalls

### Pitfall 1: Forgetting the `fan-level` Segment (Hyphen in Directory Name)

**What goes wrong:** Developer creates `app/api/v1/thermorossi/fanLevel/route.ts` (camelCase) instead of `app/api/v1/thermorossi/fan-level/route.ts`.
**Why it happens:** Next.js directory names are case-sensitive and hyphen-literal. The documented path `/api/v1/thermorossi/fan-level` requires a directory literally named `fan-level`.
**How to avoid:** Follow `docs/api/thermorossi.md` exactly. The directory name is the URL segment verbatim.

### Pitfall 2: `commands/ignit` — No Trailing `e`

**What goes wrong:** Creating `app/api/v1/thermorossi/commands/ignite/route.ts` (with trailing `e`).
**Why it happens:** The word is "ignite" in English, but the HA proxy endpoint uses `ignit` (no trailing e). This is documented in `docs/api/thermorossi.md`: "Note: the URL path is `/commands/ignit` (no trailing `e`); the response body uses `"command": "ignite"`."
**How to avoid:** Directory name must be `ignit`, not `ignite`. The tag in `withAuthAndErrorHandler` can be `'Stove/Ignit'` for clarity.
**Warning signs:** `useStoveCommands.test.ts` line 187 checks `expect.stringContaining('/api/stove/ignite')` — after migration the equivalent check should be `.../commands/ignit` (no `e`).

### Pitfall 3: `deviceCommands.tsx` Uses Non-Canonical Old Paths

**What goes wrong:** The file already uses incorrect paths even for the old routes (`/api/stove/get-power`, `/api/stove/set-power`, `/api/stove/get-fan`, `/api/stove/set-fan` with hyphens and lowercase). These routes never existed — the old routes were `getPower`, `getFan`, `setPower`, `setFan` (camelCase). The migration to new paths must map to the correct canonical new paths, not preserve the broken old names.
**Correct new paths for deviceCommands.tsx:**
  - `get-power` → `GET /api/v1/thermorossi/power`
  - `set-power` → `POST /api/v1/thermorossi/settings/power`
  - `get-fan` → `GET /api/v1/thermorossi/fan-level`
  - `set-fan` → `POST /api/v1/thermorossi/settings/fan-level`
**How to avoid:** Treat `deviceCommands.tsx` as a bug-fix opportunity, not just a string replacement. The `executeStoveAction` helper always POSTs, but `power` and `fan-level` reads are GETs.

### Pitfall 4: Service Worker Cache Rule Will Miss New Path

**What goes wrong:** `app/sw.ts` has a `pathname === '/api/stove/status'` matcher in the runtime cache config (line 597) and a fetch fallback at line 718. If only the fetch fallback is updated but not the cache matcher (or vice versa), status data will silently bypass the offline cache.
**How to avoid:** Update both occurrences in `app/sw.ts` to `/api/v1/thermorossi/status`.

### Pitfall 5: POST Route Method on GET Endpoint or Vice Versa

**What goes wrong:** The history route handler exports `GET`; the ignit handler exports `POST`. Accidentally exporting the wrong HTTP verb silently creates a 405 Method Not Allowed.
**How to avoid:** Use the source route files as exact templates. Read handler signatures before copy-paste.

### Pitfall 6: `withErrorHandler` vs `withAuthAndErrorHandler` for `/health`

**What goes wrong:** Using `withAuthAndErrorHandler` on `app/health/route.ts` would require an Auth0 session for the health check. The documented endpoint is unauthenticated.
**How to avoid:** Use `withErrorHandler` (no auth) — same as the existing `app/api/health/route.ts`.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (via `npm test`) |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern="stove" --no-coverage` |
| Full suite command | `npm test -- --no-coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PATH-01 | New routes return 200 on new paths | unit/integration | Manual: curl against `npm run dev` | N/A — verified by 404 on old paths |
| PATH-01 | Old routes return 404 | smoke | `grep -r '/api/stove/' app/api/ --include='*.ts'` (must return empty) | N/A |
| PATH-02 | Frontend fetch strings updated | unit | `npm test -- --testPathPattern="useStoveData|useStoveCommands" --no-coverage` | ✅ (after test update) |
| PATH-02 | idempotencyManager test strings updated | unit | `npm test -- --testPathPattern="idempotencyManager" --no-coverage` | ✅ (after test update) |
| COMMON-01 | /health returns aggregated providers object | unit | `npm test -- --testPathPattern="health" --no-coverage` | ❌ Wave 0 gap |
| COMMON-02 | /api/v1/devices returns items array | unit | `npm test -- --testPathPattern="devices" --no-coverage` | ❌ Wave 0 gap |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="stove" --no-coverage`
- **Per wave merge:** `npm test -- --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/api/health.test.ts` — covers COMMON-01 (aggregated response shape, partial failure handling)
- [ ] `__tests__/api/v1/devices.test.ts` — covers COMMON-02 (items shape, provider_type field)

*(Existing stove hook tests cover PATH-02 after their URL strings are updated — no new test files needed for PATH-01/PATH-02.)*

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `app/api/stove/*` flat route directories | `app/api/v1/thermorossi/*` nested segments | This phase | Next.js supports arbitrary nesting depth; hyphens in segment names are valid |
| Simple `/api/health` connectivity ping | Aggregated `GET /health` with all-provider fan-out | This phase | Adds a new root-level route file in `app/health/` |

---

## Environment Availability

Step 2.6: SKIPPED — this phase is purely code/config changes (route file creation/deletion and string replacement). No external tools, services, runtimes, or CLI utilities beyond the existing project stack are required.

---

## Open Questions

1. **`/api/v1/devices` — other providers**
   - What we know: Fritz!Box `getDevices()` returns network devices. The documented shape includes `provider_type`. No other provider in the codebase has a comparable "get all devices" function.
   - What's unclear: Whether providers like Hue (lights as devices), DIRIGERA (sensors as devices), or Tuya (plugs as devices) should appear in the aggregated list.
   - Recommendation: Start with Fritz!Box only (the only provider that returns IP/MAC network devices). The route structure supports adding providers later by extending the `Promise.allSettled` fan-out.

2. **`app/health/route.ts` — fritzboxClient.ping() returns HA proxy's `/health` payload**
   - What we know: `fritzboxClient.ping()` calls `haGet('/health', { timeout: 10_000 })` on the HA proxy, which returns the full documented `HealthResponse` shape including `providers`, `flush`, `aggregation`, and `retention`.
   - What's unclear: Whether the Next.js `/health` route should pass through the full HA proxy health payload, or summarize it.
   - Recommendation: Use the HA proxy response as the primary source of truth for fritzbox/netatmo/other HA-managed providers, and supplement with individual health checks for thermorossi, hue, sonos, dirigera, tuya, raspi. The final response should match the documented shape.

---

## Sources

### Primary (HIGH confidence)
- `docs/api/thermorossi.md` — All 10 endpoint paths, request/response shapes, state gating table, ignit vs ignite note
- `docs/api/README.md` §Common Endpoints — `/health` and `/api/v1/devices` documented shapes + TypeScript interfaces
- `app/api/stove/*/route.ts` (10 files) — Existing handler implementations verified by direct read
- `lib/stove/thermorossiProxy.ts` — Confirmed does NOT need changes; already calls `/api/v1/thermorossi/*` on HA proxy
- `app/sw.ts` lines 597, 718 — Confirmed 2 references to `/api/stove/status`
- `lib/commands/deviceCommands.tsx` — Confirmed fetch calls with both old and broken paths

### Secondary (MEDIUM confidence)
- Project MEMORY.md v13.0 section — Confirms thermorossi proxy migration history and 202 Accepted pattern
- `lib/fritzbox/fritzboxClient.ts` — Confirmed `ping()` calls `/health` on HA proxy, `getDevices()` returns `{ ip, name, mac, active }` array

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — No new dependencies; all patterns verified in existing codebase
- Architecture: HIGH — All 12 new route files are direct analogs of existing routes; directory structure confirmed valid
- Pitfalls: HIGH — Pitfalls derived from direct code inspection (ignit spelling, sw.ts two occurrences, deviceCommands broken paths)
- Common endpoints: MEDIUM — `/api/v1/devices` provider scope is an open question; Fritz!Box is confirmed, others are unclear

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stable Next.js routing conventions)
