# Phase 81: Fix StoveSync & Debug Panel Cleanup - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove references to deleted API routes (stove-sync, devices, devices-temperatures, debug), clean stale JSDoc, and update debug panel Netatmo tabs to reflect proxy-era endpoints. Gap closure from v10.0 audit closing CLEAN-02.

</domain>

<decisions>
## Implementation Decisions

### StoveSyncPanel removal
- Delete `app/components/netatmo/StoveSyncPanel.tsx` entirely (600 LOC, obsolete)
- Delete `__tests__/components/StoveSyncPanel.test.tsx`
- Remove `NETATMO_ROUTES.stoveSync` from `lib/routes.ts`
- Remove StoveSyncPanel imports and JSX from `app/thermostat/page.tsx` and `app/settings/thermostat/page.tsx` silently (no replacement text)
- Leave Firebase stove-sync config data untouched (inert without UI)

### Debug NetatmoTab endpoint cleanup
- Remove 3 deleted endpoint cards from both `NetatmoTab` variants:
  - `/api/netatmo/devices` (Devices card)
  - `/api/netatmo/devices-temperatures` (Devices Temperatures card)
  - `/api/netatmo/debug` (Debug Info card)
- Add 3 proxy-era endpoint cards to both variants:
  - `/api/netatmo/valves` (Valves — Phase 78)
  - `/api/netatmo/camera/status` (Camera Status — Phase 77)
  - `/api/netatmo/schedules` (Schedules — Phase 76/80)
- Wire connectionStatus badge to `/health` endpoint response (`provider_status` or `data_freshness`) instead of deleted `/debug` response
- Keep both `NetatmoTab` variants (`debug/` and `debug/api/`) — update both identically

### Stale JSDoc and references cleanup
- Update `lib/coordinationNotificationThrottle.ts` module JSDoc: remove `USE_PERSISTENT_RATE_LIMITER` references, describe current behavior (always uses Firebase RTDB persistent throttle)
- Clean `externalUrl` props in NetatmoTab that point to `api.netatmo.com` — update to proxy URLs or remove
- Remove `NETATMO_ROUTES.disconnect` from `lib/routes.ts` (dead OAuth route, proxy handles auth)

### Claude's Discretion
- Check all consumers of `NETATMO_ROUTES.stoveSync` beyond StoveSyncPanel and handle accordingly
- Check if `app/api/netatmo/disconnect/route.ts` exists and delete if dead
- Exact wording of updated JSDoc for coordinationNotificationThrottle
- Which `/health` response field to use for connection status badge

</decisions>

<specifics>
## Specific Ideas

No specific requirements — straightforward cleanup following proxy migration patterns established in Phases 75-80.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `EndpointCard` and `PostEndpointCard` components in `app/debug/components/ApiTab` — used to render debug endpoint cards
- `NETATMO_ROUTES` in `lib/routes.ts` — centralized route definitions
- `CAMERA_ROUTES` in `lib/routes.ts` — camera endpoint definitions already established

### Established Patterns
- Debug panel uses `fetchGetEndpoint(name, url)` callback pattern for all GET cards
- `fetchAllGetEndpoints` is the central refresh function — add new endpoints here
- Two NetatmoTab variants are near-identical copies (debug/ and debug/api/)
- Phase 79 cleanup pattern: delete file + remove imports + update route constants

### Integration Points
- `app/thermostat/page.tsx` — imports StoveSyncPanel (to be removed)
- `app/settings/thermostat/page.tsx` — imports StoveSyncPanel (to be removed)
- `app/thermostat/page.test.tsx` — likely references StoveSyncPanel (to be updated)
- `lib/routes.ts` — NETATMO_ROUTES.stoveSync and .disconnect to be removed

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 81-fix-stovesync-debug-cleanup*
*Context gathered: 2026-03-15*
