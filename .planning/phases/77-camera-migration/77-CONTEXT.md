# Phase 77: Camera Migration - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate all camera operations (status, streams, snapshots, events, monitoring toggle, event snapshots) from direct Netatmo Cloud API (`netatmoCameraApi.ts` + OAuth) to the local proxy. Six requirements: CAM-01 through CAM-06. Frontend components are updated to match proxy field names and consume proxy response shapes directly. OAuth-related dead code is cleaned up in camera components. The `/netatmo` page removes camera scope references.

</domain>

<decisions>
## Implementation Decisions

### Response shape mapping
- Components updated to use proxy field names directly: `event_id` (not `id`), `event_type` (not `type`), `timestamp` (not `time`)
- API routes do NOT transform proxy fields to old names — components adapt to proxy schema
- Stream URLs: expose all quality tiers (high/medium/low) to frontend — proxy returns `vpn_streams` and optional `local_streams` objects with quality keys
- Staleness: pass `data_freshness` (LIVE/STALE/UNREACHABLE) from proxy `/camera/status` to frontend; reuse existing `useDeviceStaleness` pattern; disable controls on UNREACHABLE

### API route design
- Split into separate frontend fetches (not combined): frontend calls `/api/netatmo/camera/status` and `/api/netatmo/camera/events` separately
- Old combined GET `/api/netatmo/camera` route replaced by individual routes matching proxy structure
- Existing proxy client functions (`netatmoProxyGet<T>()`, `netatmoProxyPost<T>()`) used for all proxy calls

### netatmoCameraApi.ts cleanup
- Delete all API functions: `getCamerasData`, `getCameraEvents`, `getEventsUntil`, `parseCameras`, `parsePersons`, `parseEvents` (replaced by proxy)
- Delete all URL construction helpers: `getSnapshotUrl`, `getLiveStreamUrl`, `getEventSnapshotUrl`, `getEventVideoUrl`, `getEventVideoThumbnail`, `getEventVideoDownloadUrl` (proxy provides URLs directly)
- Keep display helpers only: `getCameraTypeName`, `getEventTypeName`, `getEventIcon`, `getSubTypeName`, `getSubTypeIcon`
- Keep type definitions that are still needed by display helpers

### Event snapshot handling
- Create `/api/netatmo/camera/events/[eventId]/snapshot` route that calls proxy binary endpoint, streams JPEG to client (for full-size snapshots in detail modal)
- Event list thumbnails use `snapshot_url` from proxy events response directly in `<img>` tags (no binary proxying for thumbnails)

### OAuth cleanup (in this phase, not deferred)
- Remove `needsReauth` state, `handleReauthorize` function, OAuth redirect logic, `reconnect` response handling, and token error detection from CameraCard and CameraDashboard
- Replace with standard error handling (proxy errors via RFC 9457, same pattern as thermostat)
- Remove Firebase camera cache (`adminDbSet`/`adminDbGet` for `netatmo/cameras` path) — proxy owns the cache
- Remove camera scope references from `/netatmo` page OAuth flow

### Claude's Discretion
- Exact TypeScript types for proxy camera responses
- Test structure and mock patterns for camera proxy routes
- How to handle the binary JPEG streaming (ReadableStream vs buffer)
- HlsPlayer component changes needed for quality-tiered stream URLs
- Error state UI after OAuth removal (what replaces the "Riautorizza Netatmo" flow)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/netatmoProxy.ts`: `netatmoProxyGet<T>()` and `netatmoProxyPost<T>()` — use for all proxy calls
- `types/netatmoProxy.ts`: Extend with camera-specific proxy types
- `lib/core/index.ts`: `withAuthAndErrorHandler`, `success`, `badRequest`, `notFound`, `parseQuery`, `getPathParam`
- `lib/hooks/useDeviceStaleness.ts`: Reuse for camera staleness indicators
- `app/components/devices/camera/HlsPlayer.tsx`: Existing HLS player — extend for quality tiers
- `app/components/devices/camera/EventPreviewModal.tsx`: Event detail modal — update field references

### Established Patterns
- Phase 75/76 migration pattern: swap `requireNetatmoToken()` + `NETATMO_API.*` with proxy client call
- `export const dynamic = 'force-dynamic'` on all API routes
- Double assertion `as unknown as Record<string, unknown>` for typed bodies in proxy POST wrappers
- Failure-only logging: `adminDbPush('log', logEntry)` in catch blocks

### Integration Points
- `app/api/netatmo/camera/route.ts`: Replace combined endpoint → split into status + events routes
- `app/api/netatmo/camera/snapshot/route.ts`: Swap to proxy `/camera/{id}/snapshot`
- `app/api/netatmo/camera/events/route.ts`: Swap to proxy `/camera/events`
- `app/api/netatmo/camera/[cameraId]/events/route.ts`: May be removed if events are fetched via `/camera/events` with filtering
- `app/components/devices/camera/CameraCard.tsx`: Update fetches, remove OAuth, add staleness
- `app/(pages)/camera/CameraDashboard.tsx`: Split fetches, update field names, remove OAuth
- `app/(pages)/camera/events/CameraEventsPage.tsx`: Update event field references
- `lib/routes.ts`: Update CAMERA_ROUTES to match new route structure
- Proxy API docs: `docs/api/netatmo.md` — authoritative reference for all 6 camera endpoints

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 77-camera-migration*
*Context gathered: 2026-03-15*
