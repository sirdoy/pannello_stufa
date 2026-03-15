# Phase 76: Energy Control Endpoints - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate all thermostat write operations (setroomthermpoint, setthermmode, switchhomeschedule, synchomeschedule) and add the getroommeasure read route — all through the Netatmo proxy instead of direct Netatmo API. Also add createnewhomeschedule as a transparent proxy route. Frontend components remain unchanged for control operations. No chart UI — API route only for getroommeasure.

</domain>

<decisions>
## Implementation Decisions

### Action logging
- Log only failures to Firebase 'log' path (not every successful action)
- Failure log entries include: error message/code + action context (action type, room_id/mode, user)
- Keep the same 'log' Firebase path — failed entries get an 'error' field to distinguish from normal changelog entries
- Keep `userSelectedScheduleId` Firebase write after successful schedule switch (calibration service depends on it)

### Validation strategy
- Keep local validation (validateRequired, validateEnum) before hitting proxy — fail fast with Italian error messages
- Match proxy's accepted mode values:
  - setroomthermpoint: `["manual", "home"]` (drop "max", "off")
  - setthermmode: `["schedule", "away", "hg"]` (drop "off")
- Frontend sends `home_id` in request body (no server-side Firebase lookup for home_id)

### Schedule route cleanup
- Strip netatmoCacheService, netatmoRateLimiter, and netatmoTokenHelper from the schedules route now (not deferred to Phase 79)
- GET /schedules reuses `getProxyHomesdata()` and extracts schedules from the response (no dedicated proxy endpoint)
- POST /schedules → new route at `/api/netatmo/switchhomeschedule` (frontend URL change). Old POST /schedules can be removed.

### Proxy client extension
- Add `netatmoProxyPost<T>()` to `lib/netatmoProxy.ts` for control endpoints (same error handling pattern as GET)
- Add convenience wrappers for each control endpoint

### getroommeasure route
- New route: GET `/api/netatmo/getroommeasure`
- Expose all four aggregation tiers: max, 30min, 1hour, 1day
- Pass query parameters through to proxy as-is (room_id, scale, start, end, limit, offset)
- Return proxy response shape as-is (thin proxy layer, no transformation)
- API route only — no chart UI in this phase

### Additional endpoints
- Also add POST `/api/netatmo/synchomeschedule` (transparent proxy — forward body as-is, ENERGY-06)
- Also add POST `/api/netatmo/createnewhomeschedule` (transparent proxy — forward body as-is, not in requirements but small extra effort)

### Claude's Discretion
- Exact netatmoProxyPost function signature and body serialization
- TypeScript types for proxy request/response bodies
- Test structure and mock patterns for POST endpoints
- Error mapping for proxy 422 validation errors

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/netatmoProxy.ts`: Existing `netatmoProxyGet<T>()` — extend with POST support
- `lib/core/apiErrors.ts`: `ApiError`, `ERROR_CODES`, `HTTP_STATUS` — reuse for error mapping
- `lib/core/index.ts`: `withAuthAndErrorHandler`, `success`, `badRequest`, `parseJsonOrThrow`, `validateRequired`, `validateEnum`
- `types/netatmoProxy.ts`: Existing proxy types — extend with control endpoint types

### Established Patterns
- Phase 75 migration pattern: swap `NETATMO_API.*` + `requireNetatmoToken()` with proxy client call
- `export const dynamic = 'force-dynamic'` on all API routes
- `adminDbPush('log', logEntry)` for action logging (now failure-only)
- Fritz!Box proxy client (`lib/fritzbox/fritzboxClient.ts`): Reference for POST patterns

### Integration Points
- `app/api/netatmo/setroomthermpoint/route.ts`: Swap NETATMO_API.setRoomThermpoint → proxy POST /setroomthermpoint
- `app/api/netatmo/setthermmode/route.ts`: Swap NETATMO_API.setThermMode → proxy POST /setthermmode
- `app/api/netatmo/schedules/route.ts`: GET reuses getProxyHomesdata(); POST moves to new /switchhomeschedule route
- New routes: `/api/netatmo/getroommeasure`, `/api/netatmo/switchhomeschedule`, `/api/netatmo/synchomeschedule`, `/api/netatmo/createnewhomeschedule`
- Proxy API docs: `docs/api/netatmo.md` — authoritative reference for request/response shapes
- Frontend components sending home_id: need to pass home_id in body for control operations

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

- Temperature history chart UI — could be a future quick task or phase
- POST /renamehome proxy endpoint — available in proxy but not needed

</deferred>

---

*Phase: 76-energy-control-endpoints*
*Context gathered: 2026-03-15*
