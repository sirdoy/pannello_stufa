# Camera Proxy Requirements

Status: **proxy supports vpn_url caching — verify Next.js integration**
Date: 2026-03-18 (updated)

## Current State

The HA proxy API docs confirm that camera endpoints are fully implemented:

- `GET /api/v1/netatmo/camera/{camera_id}/snapshot` → returns `{ camera_id, snapshot_url }` (VPN-based URL)
- `GET /api/v1/netatmo/camera/{camera_id}/stream` → returns `{ camera_id, vpn_streams, is_local, local_streams? }`
- VPN URLs are refreshed automatically by the background poller every 3 hours
- 503 is returned only when: provider not initialized, DOWN, homedata not cached, or VPN URL missing

## Known Issues

1. **Live snapshot/stream**: If the proxy returns 503 "Camera VPN URL not available", the camera may be offline or the background poller hasn't completed its first cycle yet.
2. **Event snapshots**: `GET /camera/events/{event_id}/snapshot` serves binary JPEG from SQLite cache. SAS token expiry is handled by caching the binary at detection time.

### Root Cause (Turbopack routing — FIXED in v10.0)

A backward-compat alias `app/api/netatmo/camera/route.ts` was blocking all child routes. Deleted — all API routes now respond correctly.

---

## Next.js Side (verified correct)

- Snapshot route: 302 redirect to proxy's `snapshot_url`
- Stream route: returns JSON with VPN/local stream URLs
- Event snapshot: binary proxy pass-through
- UI: graceful fallback "Snapshot non disponibile" / "Live non disponibile" on 503
- `onError` handlers on all `<img>` elements

## Troubleshooting

If snapshot/stream still don't work:
1. Check proxy health: `curl $HA_API_URL/api/v1/netatmo/health -H "X-API-Key: $HA_API_KEY"`
2. Check camera status: `curl $HA_API_URL/api/v1/netatmo/camera/status -H "X-API-Key: $HA_API_KEY"`
3. Verify `vpn_url` is present in camera status response
4. If 503: camera may be offline, or proxy hasn't polled homedata yet (wait for first 3h cycle)
