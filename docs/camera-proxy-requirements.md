# Camera Proxy Requirements

Status: **pending proxy-side changes**
Date: 2026-03-16

## Current Issues

The Netatmo proxy (`NETATMO_PROXY_URL`) serves camera data but two features are broken:

1. **Live snapshot/stream**: `GET /camera/{camera_id}/snapshot` returns 503 "Camera VPN URL not available"
2. **Event snapshots**: `GET /camera/events` returns `snapshot_url` with Azure Blob SAS tokens that expire after ~5 minutes. The proxy caches these in SQLite at detection time and never refreshes them.

### Root Cause (Turbopack routing — FIXED)

A backward-compat alias `app/api/netatmo/camera/route.ts` was blocking all child routes (`status/`, `events/`, `stream/`, `snapshot/`, `monitoring/`) due to a Turbopack bug in Next.js 16. Deleted the parent route — all API routes now respond correctly.

---

## 1. Live Snapshot and Stream (VPN URL)

The camera's `vpn_url` comes from the Netatmo API `gethomedata`/`homesdata` response (field `vpn_url` on the camera module). The proxy needs to:

- **Extract and cache `vpn_url`** from the homesdata polling cycle
- **Refresh every ~3 hours** (VPN URLs expire periodically)
- Use it to construct:
  - **Snapshot**: `{vpn_url}/live/snapshot_720.jpg`
  - **Stream HLS**: `{vpn_url}/live/index.m3u8`

Once `vpn_url` is available, the existing proxy endpoints will work:
- `GET /camera/{camera_id}/snapshot` → returns `{ snapshot_url: "{vpn_url}/live/snapshot_720.jpg" }`
- `GET /camera/{camera_id}/stream` → returns `{ vpn_streams: { high: "{vpn_url}/live/index.m3u8" } }`

The Next.js app already handles these responses correctly.

## 2. Event Snapshots (SAS Token Expiry)

Events from `GET /camera/events` include `snapshot_url` pointing to `netatmocameraimage.blob.core.windows.net` with SAS tokens (`se=` parameter). These expire ~5 minutes after the proxy caches them.

### Option A: Regenerate SAS URL on-demand

New endpoint: `GET /camera/events/{event_id}/fresh-snapshot-url`
- Calls Netatmo API (`geteventsuntil` or `getlasteventof`) to obtain a fresh SAS URL
- Returns `{ snapshot_url: "https://netatmocameraimage.blob.core.windows.net/...?sv=...&se=<fresh>" }`
- Next.js does a 302 redirect to the fresh URL

### Option B: Binary cache at detection time (recommended)

When the proxy detects a new event:
1. Immediately download the JPEG from the SAS URL (within the 5-min validity window)
2. Store the binary in SQLite as a BLOB or on disk
3. `GET /camera/events/{event_id}/snapshot` serves the cached binary (`image/jpeg`)

This is the most robust option — no dependency on SAS expiry, works offline, and the existing Next.js binary proxy endpoint already handles this response format.

### Option C: Long-lived SAS tokens

If Netatmo allows configuring SAS expiry, set `se` to 24-48 hours instead of 5 minutes. This is the simplest change but may not be configurable.

---

## Summary

| Feature | Current State | Proxy Change Needed |
|---------|--------------|---------------------|
| Camera status | Working (200) | None |
| Camera events | Working (200) | None |
| Camera monitoring | Working (POST) | None |
| Live snapshot | 503 — VPN URL missing | Extract `vpn_url` from homesdata, cache, refresh every 3h |
| Live stream (HLS) | 503 — VPN URL missing | Same as above — depends on `vpn_url` |
| Event snapshot | 502/403 — SAS expired | Option B: download + cache binary at detection time |

### Priority

1. **High**: `vpn_url` extraction — enables both live snapshot and HLS stream
2. **Medium**: Event snapshot binary cache — enables event thumbnail display

---

## Next.js Side (already done)

- Deleted `app/api/netatmo/camera/route.ts` (Turbopack conflict fix)
- Snapshot route redirects to proxy URL (302)
- Stream route returns JSON with VPN/local stream URLs
- UI shows "Snapshot non disponibile" / "Live non disponibile" gracefully when proxy returns 503
- `onError` handlers on all `<img>` elements for graceful fallback
