# Phase 86: Netatmo Migration - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate Netatmo proxy client (`lib/netatmoProxy.ts`) from its own `netatmoProxyGet`/`netatmoProxyPost` transport to the shared `haGet`/`haPost` transport (Phase 84). All 20 Netatmo API routes must return identical data. Provider-specific env vars (`NETATMO_PROXY_URL`, `NETATMO_PROXY_API_KEY`) are removed. All convenience wrappers (homestatus, homesdata, setpoint, mode, schedules, camera, valves, health, calibration) remain callable and functional.

</domain>

<decisions>
## Implementation Decisions

### Client replacement strategy
- Replace `netatmoProxyGet<T>` and `netatmoProxyPost<T>` internals with calls to `haGet<T>` and `haPost<T>` from `lib/haClient.ts`
- Keep all 20+ convenience wrappers (`getProxyHomestatus`, `proxySetRoomThermpoint`, `getProxyCameraStatus`, etc.) — they are the public API consumed by routes
- Routes import convenience wrappers, not core transport — so route files should need zero or minimal changes
- Remove `NETATMO_PROXY_URL` / `NETATMO_PROXY_API_KEY` env var validation and usage from `netatmoProxy.ts`
- `netatmoCameraApi.ts` is display helpers only (no proxy calls) — no changes needed
- `netatmoCalibrationService.ts` imports `proxyCalibrateValves` from netatmoProxy — works unchanged after migration

### Endpoint path mapping
- Netatmo endpoints keep the same paths: `/homestatus`, `/homesdata`, `/setroomthermpoint`, `/camera/status`, `/valves`, `/health`, etc.
- The HA proxy routes internally by provider — Netatmo paths go to the Netatmo provider, Fritz!Box paths to Fritz!Box provider
- No endpoint renaming needed — `haGet('/homestatus')` replaces `netatmoProxyGet('/homestatus')`

### Binary endpoint handling
- `getProxyCameraEventSnapshot` returns raw `Response` (JPEG binary), not parsed JSON
- This function cannot use `haGet` (which calls `.json()`) — use raw `fetch` with `HA_API_URL` + `HA_API_KEY` env vars directly
- Extract env var reading into a small helper or reuse `getEnvConfig` pattern from haClient (import or inline)

### Env var cleanup
- Remove `NETATMO_PROXY_URL` and `NETATMO_PROXY_API_KEY` from:
  - `lib/netatmoProxy.ts` (replaced by HA_API_URL/HA_API_KEY via haGet)
  - `lib/envValidator.ts` (remove from required env list)
  - `.env.local` / `.env.example` if they exist
- Tests that mock these env vars update to `HA_API_URL` / `HA_API_KEY`

### Test update approach
- Update `__tests__/lib/netatmoProxy.test.ts` and `netatmoProxy-camera.test.ts`:
  - Change `process.env.NETATMO_PROXY_URL` mocks to `process.env.HA_API_URL`
  - Change `process.env.NETATMO_PROXY_API_KEY` mocks to `process.env.HA_API_KEY`
  - Verify fetch calls use `HA_API_URL` base
- Route tests should pass unchanged (they mock netatmoProxy convenience functions, not the transport)

### Claude's Discretion
- Whether to keep `netatmoProxyGet`/`netatmoProxyPost` as thin aliases over `haGet`/`haPost` for readability, or replace all internal calls directly with `haGet`/`haPost`
- Exact approach for binary endpoint env var access (import helper vs inline)
- Whether to update error messages from "Netatmo proxy" to "HA proxy" or keep provider-specific messages for debugging clarity

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Shared transport (Phase 84)
- `lib/haClient.ts` — Shared `haGet<T>` and `haPost<T>` with X-API-Key auth, AbortController timeout, RFC 9457 error mapping
- `types/haClient.ts` — `RFC9457ProblemDetail` and `HaRequestOptions` types

### Fritz!Box migration reference (Phase 85)
- `lib/fritzbox/fritzboxClient.ts` — Completed migration to haGet — reference pattern for this phase

### Netatmo current implementation
- `lib/netatmoProxy.ts` — Current proxy client with `netatmoProxyGet`/`netatmoProxyPost` transport + 20 convenience wrappers (THIS IS THE FILE TO MIGRATE)
- `lib/netatmoCameraApi.ts` — Display helpers only (no proxy calls, no changes needed)
- `lib/netatmoCalibrationService.ts` — Imports `proxyCalibrateValves` from netatmoProxy (works unchanged after migration)
- `types/netatmoProxy.ts` — Netatmo proxy response types (stays unchanged)
- `types/external-apis/netatmo.d.ts` — External API type declarations (stays unchanged)

### Env validation
- `lib/envValidator.ts` — References `NETATMO_PROXY_URL` and `NETATMO_PROXY_API_KEY` (must be removed)

### API routes (consumers — 20 files)
- `app/api/netatmo/homestatus/route.ts` — Homestatus
- `app/api/netatmo/homesdata/route.ts` — Homesdata
- `app/api/netatmo/setroomthermpoint/route.ts` — Set room thermpoint
- `app/api/netatmo/setthermmode/route.ts` — Set therm mode
- `app/api/netatmo/switchhomeschedule/route.ts` — Switch schedule
- `app/api/netatmo/synchomeschedule/route.ts` — Sync schedule
- `app/api/netatmo/createnewhomeschedule/route.ts` — Create schedule
- `app/api/netatmo/schedules/route.ts` — List schedules
- `app/api/netatmo/getroommeasure/route.ts` — Room measurements
- `app/api/netatmo/camera/status/route.ts` — Camera status
- `app/api/netatmo/camera/stream/route.ts` — Camera stream
- `app/api/netatmo/camera/snapshot/route.ts` — Camera snapshot
- `app/api/netatmo/camera/monitoring/route.ts` — Camera monitoring toggle
- `app/api/netatmo/camera/events/route.ts` — Camera events
- `app/api/netatmo/camera/events/[eventId]/snapshot/route.ts` — Event snapshot (binary)
- `app/api/netatmo/valves/route.ts` — Valve status
- `app/api/netatmo/calibrate/route.ts` — Valve calibration
- `app/api/netatmo/health/route.ts` — Health check

### Tests
- `__tests__/lib/netatmoProxy.test.ts` — Core proxy client tests (env mocks need updating)
- `__tests__/lib/netatmoProxy-camera.test.ts` — Camera wrapper tests (env mocks need updating)
- `__tests__/lib/netatmoCalibrationService.test.ts` — Calibration service tests (mocks netatmoProxy, should pass unchanged)

### API documentation
- `docs/api/README.md` — HA proxy API overview and authentication

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/haClient.ts` (`haGet`, `haPost`): Direct replacement for `netatmoProxyGet`/`netatmoProxyPost` — identical auth, timeout, and error mapping
- `lib/fritzbox/fritzboxClient.ts`: Completed Phase 85 migration — reference for how convenience wrappers call `haGet` internally

### Established Patterns
- Fritz!Box migration (Phase 85): Kept convenience wrappers as public API, replaced internal transport with `haGet` — Netatmo follows the same pattern
- Function module pattern: Both Fritz!Box and Netatmo use exported functions (not class), consistent with project convention
- Routes import convenience wrappers, never the raw transport — migration is transparent to routes

### Integration Points
- `lib/netatmoProxy.ts` — 20 route files import from here (convenience wrappers)
- `lib/envValidator.ts` — Validates env vars at startup (must remove old vars)
- `lib/netatmoCalibrationService.ts` — Imports `proxyCalibrateValves` (indirect consumer)
- `lib/healthMonitoring.ts` — May reference Netatmo env vars for health checks
- `app/api/scheduler/check/route.ts` — Cron check that calls Netatmo health

</code_context>

<specifics>
## Specific Ideas

No specific requirements — straightforward migration following the established Fritz!Box pattern from Phase 85. The Netatmo proxy client is nearly identical in structure to the pre-migration Fritz!Box client (both were function modules with X-API-Key auth), making this a mechanical transport replacement.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 86-netatmo-migration*
*Context gathered: 2026-03-17*
