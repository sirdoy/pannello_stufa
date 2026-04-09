# Phase 161: Netatmo Gap Closure - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Create canonical `/api/v1/netatmo/*` route wrappers for all Netatmo endpoints specified in `docs/api/netatmo.md`. Most proxy functions already exist in `lib/netatmo/netatmoProxy.ts` — this phase creates the v1 Next.js route wrappers and adds missing proxy functions for 4 new endpoints: `getthermstate`, `valves/{module_id}/calibrate`, `renamehome`, `gethomedata`.

</domain>

<decisions>
## Implementation Decisions

### Route Migration Strategy
- **D-01:** Create v1 route files under `app/api/v1/netatmo/` for ALL 21 endpoints in the Netatmo API spec, not just the 9 gap requirements. This completes the full v1 migration for the Netatmo provider, matching the Phase 160 Sonos approach.
- **D-02:** All v1 routes follow the established pattern: `export const dynamic = 'force-dynamic'`, `withAuthAndErrorHandler` wrapper, proxy function delegation from `lib/netatmo/netatmoProxy.ts`.

### Missing Proxy Functions
- **D-03:** Add 4 new proxy functions to `lib/netatmo/netatmoProxy.ts`:
  - `getProxyThermState()` → `haGet('/api/v1/netatmo/getthermstate')`
  - `proxyCalibrateValve(moduleId)` → `haPost('/api/v1/netatmo/valves/{module_id}/calibrate', {})`
  - `proxyRenameHome(body)` → `haPost('/api/v1/netatmo/renamehome', body)`
  - `getProxyHomeData()` → `haGet('/api/v1/netatmo/gethomedata')`
- **D-04:** New types for these endpoints go in `types/netatmoProxy.ts` following existing patterns.

### Endpoint Mapping (21 routes)
- **D-05:** Route-to-proxy-function mapping:
  - `GET  /api/v1/netatmo/health` → `getProxyHealth()` — 200 OK
  - `GET  /api/v1/netatmo/homesdata` → `getProxyHomesdata()` — 200 OK
  - `GET  /api/v1/netatmo/homestatus` → `getProxyHomestatus()` — 200 OK
  - `GET  /api/v1/netatmo/getthermstate` → `getProxyThermState()` — 200 OK (NEW)
  - `GET  /api/v1/netatmo/getroommeasure` → `getProxyRoomMeasure(params)` — 200 OK
  - `GET  /api/v1/netatmo/gethomedata` → `getProxyHomeData()` — 200 OK (NEW)
  - `POST /api/v1/netatmo/setroomthermpoint` → `proxySetRoomThermpoint(body)` — 202 Accepted
  - `POST /api/v1/netatmo/setthermmode` → `proxySetThermMode(body)` — 202 Accepted
  - `POST /api/v1/netatmo/switchhomeschedule` → `proxySwitchHomeSchedule(body)` — 202 Accepted
  - `POST /api/v1/netatmo/synchomeschedule` → `proxySyncHomeSchedule(body)` — 202 Accepted
  - `POST /api/v1/netatmo/createnewhomeschedule` → `proxyCreateNewHomeSchedule(body)` — 202 Accepted
  - `POST /api/v1/netatmo/renamehome` → `proxyRenameHome(body)` — 202 Accepted (NEW)
  - `GET  /api/v1/netatmo/valves` → `getProxyValves()` — 200 OK
  - `POST /api/v1/netatmo/valves/calibrate` → `proxyCalibrateValves()` — 202 Accepted
  - `POST /api/v1/netatmo/valves/[moduleId]/calibrate` → `proxyCalibrateValve(moduleId)` — 202 Accepted (NEW)
  - `GET  /api/v1/netatmo/camera/events` → `getProxyCameraEvents(hours?)` — 200 OK
  - `GET  /api/v1/netatmo/camera/events/[eventId]/snapshot` → `getProxyCameraEventSnapshot(eventId)` — binary/redirect
  - `GET  /api/v1/netatmo/camera/status` → `getProxyCameraStatus()` — 200 OK
  - `GET  /api/v1/netatmo/camera/[cameraId]/stream` → `getProxyCameraStream(cameraId)` — 200 OK
  - `GET  /api/v1/netatmo/camera/[cameraId]/snapshot` → `getProxyCameraSnapshot(cameraId)` — 200 OK
  - `POST /api/v1/netatmo/camera/[cameraId]/monitoring` → `proxySetCameraMonitoring(cameraId, body)` — 202 Accepted

### Old Route Handling
- **D-06:** Old `/api/netatmo/*` routes remain for backward compatibility. They are NOT moved or deleted in this phase.

### Frontend Update Scope
- **D-07:** Frontend hooks (`useThermostatData`, etc.) are NOT updated in this phase. Old routes remain active. Frontend migration to v1 paths is a separate concern.

### Test Strategy
- **D-08:** Each new v1 route gets a co-located `__tests__/route.test.ts` test file, following the Phase 160 Sonos route test pattern.

### Response Consistency
- **D-09:** V1 routes return identical response shapes to old routes — thin wrappers around the same proxy functions. Command routes include `suggested_poll_delay_s: 1` in 202 responses.

### Claude's Discretion
- Log tag naming convention for `withAuthAndErrorHandler` (e.g., `'Netatmo/Health'`, `'Netatmo/Camera/Stream'`)
- Test assertion granularity and mock structure
- Query parameter parsing for `getroommeasure` endpoint

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### API Specification
- `docs/api/netatmo.md` — Authoritative Netatmo API spec with all 21 endpoints, request/response shapes, and TypeScript types

### Existing Implementation (patterns to follow)
- `lib/netatmo/netatmoProxy.ts` — All existing proxy functions (16 functions: haGet/haPost wrappers)
- `types/netatmoProxy.ts` — All existing TypeScript types for proxy responses
- `app/api/v1/thermorossi/status/route.ts` — Reference pattern for v1 GET routes
- `app/api/v1/hue/lights/[lightId]/state/route.ts` — Reference pattern for v1 PUT routes with body parsing
- `app/api/v1/sonos/zones/[groupId]/play/route.ts` — Reference pattern for v1 POST command routes (202 Accepted)

### Old Routes (for reference, not deletion)
- `app/api/netatmo/` — 14 existing old-path route directories (homestatus, homesdata, calibrate, camera/*, etc.)

### API Patterns
- `docs/api-routes.md` — Project API route conventions
- `docs/api/README.md` — API authentication patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/netatmo/netatmoProxy.ts`: 16 proxy functions already exist — routes just call them
- `types/netatmoProxy.ts`: Comprehensive type coverage for most endpoints
- `lib/core`: `withAuthAndErrorHandler`, `success`, `getPathParam`, `parseJson`, `HTTP_STATUS` utilities
- `lib/haClient.ts`: `haGet`/`haPost` shared transport functions

### Established Patterns
- V1 route structure: `export const dynamic = 'force-dynamic'` + `withAuthAndErrorHandler` + proxy call
- GET endpoints → 200 OK with `success()` wrapper
- POST/PUT command endpoints → 202 Accepted with `suggested_poll_delay_s: 1`
- Binary endpoints (camera event snapshot) → direct fetch with response streaming

### Integration Points
- New routes under `app/api/v1/netatmo/` directory tree
- 4 new proxy functions added to `lib/netatmo/netatmoProxy.ts`
- New types added to `types/netatmoProxy.ts`
- Old routes in `app/api/netatmo/` untouched

</code_context>

<specifics>
## Specific Ideas

No specific requirements — follows the established v1 route migration pattern from Phases 159-160.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 161-netatmo-gap-closure*
*Context gathered: 2026-04-09*
