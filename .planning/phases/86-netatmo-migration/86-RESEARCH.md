# Phase 86: Netatmo Migration - Research

**Researched:** 2026-03-17
**Domain:** TypeScript client migration — Netatmo proxy transport replacement
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Replace `netatmoProxyGet<T>` and `netatmoProxyPost<T>` internals with calls to `haGet<T>` and `haPost<T>` from `lib/haClient.ts`
- Keep all 20+ convenience wrappers (`getProxyHomestatus`, `proxySetRoomThermpoint`, `getProxyCameraStatus`, etc.) — they are the public API consumed by routes
- Routes import convenience wrappers, not core transport — so route files should need zero or minimal changes
- Remove `NETATMO_PROXY_URL` / `NETATMO_PROXY_API_KEY` env var validation and usage from `netatmoProxy.ts`
- `netatmoCameraApi.ts` is display helpers only (no proxy calls) — no changes needed
- `netatmoCalibrationService.ts` imports `proxyCalibrateValves` from netatmoProxy — works unchanged after migration
- Netatmo endpoints keep the same paths: `/homestatus`, `/homesdata`, `/setroomthermpoint`, `/camera/status`, `/valves`, `/health`, etc.
- The HA proxy routes internally by provider — Netatmo paths go to the Netatmo provider, Fritz!Box paths to Fritz!Box provider
- No endpoint renaming needed — `haGet('/homestatus')` replaces `netatmoProxyGet('/homestatus')`
- `getProxyCameraEventSnapshot` returns raw `Response` (JPEG binary), not parsed JSON — cannot use `haGet` (which calls `.json()`) — use raw `fetch` with `HA_API_URL` + `HA_API_KEY` env vars directly
- Remove `NETATMO_PROXY_URL` and `NETATMO_PROXY_API_KEY` from: `lib/netatmoProxy.ts`, `lib/envValidator.ts`, `.env.local` / `.env.example` if they exist
- Tests that mock these env vars update to `HA_API_URL` / `HA_API_KEY`
- Update `__tests__/lib/netatmoProxy.test.ts` and `netatmoProxy-camera.test.ts`: change env mock references, verify fetch calls use `HA_API_URL` base
- Route tests should pass unchanged (they mock netatmoProxy convenience functions, not the transport)

### Claude's Discretion

- Whether to keep `netatmoProxyGet`/`netatmoProxyPost` as thin aliases over `haGet`/`haPost` for readability, or replace all internal calls directly with `haGet`/`haPost`
- Exact approach for binary endpoint env var access (import helper vs inline)
- Whether to update error messages from "Netatmo proxy" to "HA proxy" or keep provider-specific messages for debugging clarity

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| API-07 | Netatmo client migrated to shared HA client (separate env vars removed) | Replace `netatmoProxyGet`/`netatmoProxyPost` internals with `haGet`/`haPost`; remove NETATMO_PROXY_URL and NETATMO_PROXY_API_KEY from netatmoProxy.ts and envValidator.ts |
| API-08 | Netatmo convenience wrappers preserved on top of shared transport | All 20+ wrappers keep identical signatures; only transport layer changes; binary endpoint handled separately |
| API-09 | Netatmo API routes updated to use new client (no behavior change) | Routes import wrappers not transport — 19 routes need zero changes; getroommeasure route calls `netatmoProxyGet` directly and needs updating to use a wrapper or `haGet` directly |
</phase_requirements>

## Summary

Phase 86 migrates `lib/netatmoProxy.ts` from its own transport layer (`netatmoProxyGet`/`netatmoProxyPost` reading `NETATMO_PROXY_URL`/`NETATMO_PROXY_API_KEY`) to the shared `haGet`/`haPost` from `lib/haClient.ts` (reading `HA_API_URL`/`HA_API_KEY`). The migration is a mechanical transport replacement — the 20+ convenience wrappers that are the public API for all route consumers remain completely unchanged in signature and behavior.

The Fritz!Box migration (Phase 85) established the exact pattern this phase follows: keep the public API surface intact, replace only the internal transport. One exception exists: `getProxyCameraEventSnapshot` returns raw binary (JPEG), so it cannot use `haGet` which calls `.json()` — it must call `fetch` directly using `HA_API_URL`/`HA_API_KEY` env vars (via import of `getEnvConfig` from haClient or an equivalent approach).

One route file (`app/api/netatmo/getroommeasure/route.ts`) imports `netatmoProxyGet` directly rather than through a convenience wrapper. This route must be updated — either by introducing a `getProxyRoomMeasure` convenience wrapper in `netatmoProxy.ts` or by changing its import to `haGet`. Additionally, `lib/envValidator.ts` and its tests reference the old env var names and must be updated. The `.env.local` and `.env.example` files also need the old vars removed.

**Primary recommendation:** Replace `netatmoProxyGet`/`netatmoProxyPost` bodies with direct `haGet`/`haPost` calls (no thin-alias layer), extract env var reading for binary endpoint via importing `getEnvConfig` from haClient. Keep all error messages provider-neutral ("HA proxy" instead of "Netatmo proxy") to match the shared client pattern established in Phase 85.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `lib/haClient.ts` | Phase 84 (project) | Shared transport with X-API-Key auth, AbortController timeout, RFC 9457 error mapping | Already proven in Fritz!Box migration (Phase 85) |
| `lib/netatmoProxy.ts` | Current (project) | Convenience wrapper layer for all Netatmo API operations | Public API consumed by 20 route files + calibration service |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `types/haClient.ts` | Phase 84 (project) | `RFC9457ProblemDetail` and `HaRequestOptions` types | `RFC9457ProblemDetail` import can be removed from netatmoProxy.ts (haClient handles error parsing internally) |
| `types/netatmoProxy.ts` | Current (project) | Netatmo response types | Stays unchanged — no type changes needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Direct `haGet`/`haPost` in wrapper bodies | Thin alias functions `netatmoProxyGet = haGet` | Alias approach adds indirection for no benefit; direct calls match Phase 85 pattern |
| Import `getEnvConfig` from haClient for binary endpoint | Inline env var reading in `getProxyCameraEventSnapshot` | `getEnvConfig` is not exported from haClient — inline reading is simpler and consistent with current code |

**Note:** `getEnvConfig` in `haClient.ts` is not exported (it is an internal helper). The binary endpoint must read `process.env.HA_API_URL` / `process.env.HA_API_KEY` directly, matching the same inline pattern already used in `getProxyCameraEventSnapshot`.

## Architecture Patterns

### Recommended Migration Structure

The migration touches exactly these files:

```
lib/
├── netatmoProxy.ts           # MODIFY: replace transport internals, remove env vars
├── envValidator.ts           # MODIFY: remove NETATMO_PROXY_URL/NETATMO_PROXY_API_KEY
app/api/netatmo/
├── getroommeasure/route.ts   # MODIFY: only route that imports netatmoProxyGet directly
__tests__/lib/
├── netatmoProxy.test.ts      # MODIFY: update env var mocks to HA_API_URL/HA_API_KEY
├── netatmoProxy-camera.test.ts  # MODIFY: update env var mocks
├── envValidator.test.ts      # MODIFY: update NETATMO_PROXY_URL/NETATMO_PROXY_API_KEY references
.env.local                    # MODIFY: remove old vars
.env.example                  # MODIFY: remove old vars (if present)
```

Files NOT modified:
- All 19 other route files (import convenience wrappers only)
- `lib/netatmoCameraApi.ts` (display helpers only)
- `lib/netatmoCalibrationService.ts` (imports `proxyCalibrateValves` wrapper, works unchanged)
- `types/netatmoProxy.ts` (response types unchanged)
- `types/external-apis/netatmo.d.ts` (external API types unchanged)

### Pattern 1: Transport Replacement (JSON endpoints)

Replace the `netatmoProxyGet` body with `haGet`, remove env var boilerplate.

**Before:**
```typescript
export async function netatmoProxyGet<T>(
  endpoint: string,
  options: { timeout?: number } = {}
): Promise<T> {
  const baseUrl = process.env.NETATMO_PROXY_URL;
  const apiKey = process.env.NETATMO_PROXY_API_KEY;
  if (!baseUrl || !apiKey) { /* ... */ }
  // ... AbortController, fetch, error mapping ...
}
```

**After (direct haGet delegation):**
```typescript
import { haGet, haPost } from '@/lib/haClient';
// netatmoProxyGet and netatmoProxyPost become thin one-liners or are removed entirely.
// Convenience wrappers call haGet/haPost directly.

export async function getProxyHomestatus(): Promise<NetatmoProxyHomestatusResponse> {
  return haGet<NetatmoProxyHomestatusResponse>('/api/v1/netatmo/homestatus');
}
```

**Source:** `lib/fritzboxClient.ts` (Phase 85 reference pattern — confirmed in codebase)

### Pattern 2: Binary Endpoint (Raw fetch)

`getProxyCameraEventSnapshot` cannot use `haGet` (which calls `.json()`). It reads env vars inline and calls `fetch` directly.

```typescript
export async function getProxyCameraEventSnapshot(eventId: string): Promise<Response> {
  const baseUrl = process.env.HA_API_URL;
  const apiKey = process.env.HA_API_KEY;

  if (!baseUrl || !apiKey) {
    const missing = !baseUrl ? 'HA_API_URL' : 'HA_API_KEY';
    throw new ApiError(
      ERROR_CODES.EXTERNAL_API_ERROR,
      `HA proxy not configured: missing ${missing}`,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${baseUrl}/api/v1/netatmo/camera/events/${eventId}/snapshot`,
      { headers: { 'X-API-Key': apiKey }, signal: controller.signal }
    );
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw ApiError.timeout('HA proxy timeout');
    }
    throw new ApiError(
      ERROR_CODES.EXTERNAL_API_ERROR,
      `HA proxy request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      HTTP_STATUS.BAD_GATEWAY
    );
  }
}
```

**Source:** Direct inspection of `lib/netatmoProxy.ts` + `lib/haClient.ts` (confirmed in codebase)

### Pattern 3: envValidator Cleanup

`validateNetatmoEnv()` currently checks `NETATMO_PROXY_URL` and `NETATMO_PROXY_API_KEY`. After migration, Netatmo uses `HA_API_URL`/`HA_API_KEY` (shared with Fritz!Box). The function should check `HA_API_URL`/`HA_API_KEY` instead, or be simplified since these vars are already validated by `validateHealthMonitoringEnv` optional list.

The optional list in `validateHealthMonitoringEnv` currently contains:
```typescript
const optional = [
  'NETATMO_PROXY_URL',
  'NETATMO_PROXY_API_KEY',
];
```

After migration: replace with `HA_API_URL` / `HA_API_KEY` (if not already added there), or remove the optional block entirely since the shared vars are required for all HA providers.

### Pattern 4: getroommeasure Route Fix

This is the only route that imports `netatmoProxyGet` directly:

```typescript
// CURRENT (must change)
import { netatmoProxyGet } from '@/lib/netatmoProxy';
const result = await netatmoProxyGet<RoomMeasureResponse>(`/getroommeasure?${params.toString()}`);

// OPTION A: Add wrapper to netatmoProxy.ts and import it (preferred — keeps route imports consistent)
// In netatmoProxy.ts:
export async function getProxyRoomMeasure(params: URLSearchParams): Promise<RoomMeasureResponse> {
  return haGet<RoomMeasureResponse>(`/api/v1/netatmo/getroommeasure?${params.toString()}`);
}
// In route:
import { getProxyRoomMeasure } from '@/lib/netatmoProxy';

// OPTION B: Change import to haGet directly in route
import { haGet } from '@/lib/haClient';
const result = await haGet<RoomMeasureResponse>(`/api/v1/netatmo/getroommeasure?${params.toString()}`);
```

Option A is preferred: it keeps all routes importing from `netatmoProxy` (consistent with the other 19 routes) and closes the gap that netatmoProxyGet was previously filling.

### Anti-Patterns to Avoid

- **Keeping netatmoProxyGet/netatmoProxyPost as exported functions:** There is no longer a use case for them after migration. The getroommeasure route is the only caller and it should be fixed. Keeping the old transport exports adds confusion.
- **Forgetting the path prefix change:** The old `NETATMO_PROXY_URL` pointed to a Netatmo-specific proxy base URL. The new `HA_API_URL` is a multi-provider HA proxy. Netatmo endpoints need the `/api/v1/netatmo/` prefix added to each path (e.g., `/homestatus` becomes `/api/v1/netatmo/homestatus`).
- **Missing the `schedules` route:** `getProxySchedules` is not a direct wrapper — the schedules route calls `getProxyHomesdata()` and extracts schedules from it. No dedicated `schedules` wrapper needed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth header + timeout + RFC 9457 error mapping | Custom fetch wrapper in netatmoProxy.ts | `haGet`/`haPost` from `lib/haClient.ts` | Already built and tested in Phase 84; Fritz!Box migration (Phase 85) proved the pattern works |
| Env var validation | Repeat validation in netatmoProxy.ts | Remove it entirely — `haGet`/`haPost` validate `HA_API_URL`/`HA_API_KEY` internally | Avoids duplication; validation lives in one place |

**Key insight:** The transport layer is entirely generic. Any complexity in netatmoProxy.ts that duplicates haClient.ts logic should be deleted, not preserved.

## Common Pitfalls

### Pitfall 1: Missing the `/api/v1/netatmo/` prefix
**What goes wrong:** Current `netatmoProxyGet('/homestatus')` calls against a Netatmo-specific base URL. After migration, `haGet` uses the multi-provider `HA_API_URL` base, so the full path becomes `/api/v1/netatmo/homestatus`.
**Why it happens:** The old `NETATMO_PROXY_URL` encoded the provider prefix in the base URL. The new `HA_API_URL` does not — the provider path is part of each endpoint.
**How to avoid:** Update every endpoint path in the convenience wrappers to include `/api/v1/netatmo/` prefix.
**Warning signs:** 404 responses from the HA proxy after migration.

### Pitfall 2: Forgetting the binary endpoint's different env var names
**What goes wrong:** `getProxyCameraEventSnapshot` reads `NETATMO_PROXY_URL`/`NETATMO_PROXY_API_KEY` inline — if only the wrapper transport is updated and this function is overlooked, it will still use the old vars.
**Why it happens:** The binary endpoint bypasses `netatmoProxyGet` entirely and reads env vars directly.
**How to avoid:** Explicitly audit `getProxyCameraEventSnapshot` as a separate change from the transport wrappers.
**Warning signs:** Binary snapshot endpoint fails with "Netatmo proxy not configured" error while other endpoints work.

### Pitfall 3: Test env var mocks not updated
**What goes wrong:** Tests continue to set `process.env.NETATMO_PROXY_URL` and `process.env.NETATMO_PROXY_API_KEY`, which are no longer read. Tests pass but mock the wrong vars — fetch is actually called without auth header.
**Why it happens:** The test setup works structurally even after the migration because `haGet` internally reads `HA_API_URL`/`HA_API_KEY`, not the old vars.
**How to avoid:** Update all `beforeEach`/`afterEach` env setup in `netatmoProxy.test.ts` and `netatmoProxy-camera.test.ts` to use `HA_API_URL`/`HA_API_KEY`.
**Warning signs:** Tests pass locally but URL assertions fail (test checks for `TEST_PROXY_URL` but actual calls use `HA_API_URL`).

### Pitfall 4: envValidator.test.ts still referencing old vars
**What goes wrong:** `__tests__/lib/envValidator.test.ts` has multiple test cases setting/deleting `NETATMO_PROXY_URL`/`NETATMO_PROXY_API_KEY`. If `validateNetatmoEnv()` is updated but tests are not, the test suite will fail.
**Why it happens:** Test file found to reference the old vars on lines 95, 96, 109–110, 121–122, 132–133, 139, 142–144, 152–154, 163–164.
**How to avoid:** Update `envValidator.test.ts` in the same plan as `envValidator.ts`.

### Pitfall 5: RFC9457ProblemDetail import now redundant in netatmoProxy.ts
**What goes wrong:** `netatmoProxy.ts` currently imports `RFC9457ProblemDetail` from `@/types/netatmoProxy`. After migration, error parsing is handled entirely inside `haClient.ts`. If the import is not removed, TypeScript will report an unused import warning (or error under strict settings).
**Why it happens:** The import was needed for the old inline error parsing in `netatmoProxyGet`/`netatmoProxyPost`.
**How to avoid:** Remove the `RFC9457ProblemDetail` import from netatmoProxy.ts after migration.

## Code Examples

### Example: Updated convenience wrapper (JSON)

```typescript
// Source: lib/fritzboxClient.ts (Phase 85 pattern) + lib/haClient.ts

import { haGet, haPost } from '@/lib/haClient';

export async function getProxyHomestatus(): Promise<NetatmoProxyHomestatusResponse> {
  return haGet<NetatmoProxyHomestatusResponse>('/api/v1/netatmo/homestatus');
}

export async function proxySetRoomThermpoint(
  body: SetRoomThermpointRequest
): Promise<ProxyControlResponse> {
  return haPost<ProxyControlResponse>(
    '/api/v1/netatmo/setroomthermpoint',
    body as unknown as Record<string, unknown>
  );
}
```

### Example: Updated test env setup

```typescript
// Source: __tests__/lib/netatmoProxy.test.ts (current pattern, updated)

const TEST_PROXY_URL = 'https://ha.example.com';
const TEST_API_KEY = 'test-api-key-12345';

beforeEach(() => {
  jest.clearAllMocks();
  process.env.HA_API_URL = TEST_PROXY_URL;   // was NETATMO_PROXY_URL
  process.env.HA_API_KEY = TEST_API_KEY;     // was NETATMO_PROXY_API_KEY
});

afterEach(() => {
  delete process.env.HA_API_URL;
  delete process.env.HA_API_KEY;
});
```

### Example: URL assertion update in tests

```typescript
// BEFORE
expect(url).toBe(`${TEST_PROXY_URL}/homestatus`);

// AFTER
expect(url).toBe(`${TEST_PROXY_URL}/api/v1/netatmo/homestatus`);
```

### Example: envValidator after migration

```typescript
// validateNetatmoEnv becomes HA-aware
export function validateNetatmoEnv(): NetatmoValidationResult {
  const haUrl = process.env.HA_API_URL;
  const apiKey = process.env.HA_API_KEY;

  if (!haUrl || !apiKey) {
    return {
      valid: false,
      environment: 'unknown',
      warnings: ['HA_API_URL or HA_API_KEY missing'],
    };
  }

  return { valid: true, environment: 'proxy', warnings: [] };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Provider-specific env vars (NETATMO_PROXY_URL, NETATMO_PROXY_API_KEY) | Shared HA vars (HA_API_URL, HA_API_KEY) | Phase 84 (this milestone) | Single env var pair for all providers |
| Inline RFC 9457 parsing in netatmoProxy.ts | Centralized in haClient.ts | Phase 84 | Error handling in one place; netatmoProxy.ts becomes a thin wrapper |
| netatmoProxyGet/netatmoProxyPost transport functions | haGet/haPost from haClient.ts | Phase 86 (this phase) | Removes 200+ lines of duplicated transport logic |

## Open Questions

1. **Path prefix for Netatmo endpoints**
   - What we know: The HA proxy uses `/api/v1/netatmo/` prefix for all Netatmo endpoints (confirmed from `docs/api/README.md` and `docs/api/netatmo.md`)
   - What's unclear: The current `NETATMO_PROXY_URL` value in `.env.local` — does it already include `/api/v1/netatmo` in the base URL, or does it point to a root URL?
   - Recommendation: Read `.env.local` to determine if the old base URL already encoded the prefix. If `NETATMO_PROXY_URL=https://example.com/api/v1/netatmo`, then the current wrappers call `/homestatus` against that base, and the new `HA_API_URL=https://example.com` wrappers must call `/api/v1/netatmo/homestatus`. This is the critical path prefix determination.

2. **`validateNetatmoEnv` callers**
   - What we know: The function exists in envValidator.ts and is tested in envValidator.test.ts
   - What's unclear: Whether any route or service imports and calls `validateNetatmoEnv()` at runtime (e.g., health check routes)
   - Recommendation: Grep for `validateNetatmoEnv` callers before deciding whether to update or delete the function.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (project-standard) |
| Config file | jest.config.ts |
| Quick run command | `npm test -- --testPathPattern="netatmoProxy" --no-coverage` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| API-07 | haGet/haPost used instead of NETATMO_PROXY_URL/NETATMO_PROXY_API_KEY | unit | `npm test -- --testPathPattern="netatmoProxy.test" --no-coverage` | YES (needs update) |
| API-08 | All convenience wrappers still callable with correct behavior | unit | `npm test -- --testPathPattern="netatmoProxy" --no-coverage` | YES (needs update) |
| API-09 | Routes return identical data after migration | unit | `npm test -- --testPathPattern="netatmo" --no-coverage` | YES (passes unchanged for 19/20 routes) |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="netatmoProxy" --no-coverage`
- **Per wave merge:** `npm test -- --testPathPattern="netatmo|envValidator" --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
None — existing test infrastructure covers all phase requirements. The netatmoProxy test files exist and are comprehensive; they need env var mock updates, not new test creation.

## Sources

### Primary (HIGH confidence)
- `lib/netatmoProxy.ts` — Current implementation read directly; all 20 wrappers and binary endpoint documented
- `lib/haClient.ts` — Target transport; `getEnvConfig` confirmed unexported; `haGet`/`haPost` signatures confirmed
- `lib/fritzboxClient.ts` — Phase 85 reference migration; confirms pattern of direct haGet calls in thin wrapper
- `lib/envValidator.ts` — Confirmed NETATMO_PROXY_URL/NETATMO_PROXY_API_KEY in both required/optional lists and validateNetatmoEnv function
- `__tests__/lib/netatmoProxy.test.ts` — All env mock patterns confirmed; URL assertion patterns documented
- `__tests__/lib/netatmoProxy-camera.test.ts` — Binary endpoint test confirmed; env mocks use old vars
- `app/api/netatmo/getroommeasure/route.ts` — Only route importing `netatmoProxyGet` directly confirmed
- `docs/api/netatmo.md` — Netatmo endpoint path prefix `/api/v1/netatmo` confirmed

### Secondary (MEDIUM confidence)
- `docs/api/README.md` — HA proxy authentication and provider index confirmed

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all files read directly from codebase
- Architecture: HIGH — Phase 85 reference pattern confirmed; all wrappers enumerated; one exception route identified
- Pitfalls: HIGH — env var inline usage in binary endpoint confirmed by direct read; test mock patterns confirmed

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable codebase; no external dependencies change)
