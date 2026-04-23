---
status: resolved
resolved: 2026-03-18
trigger: "camera-snapshot-live-broken"
created: 2026-03-16T12:00:00Z
updated: 2026-03-16T14:30:00Z
---

## Current Focus

hypothesis: All identified code bugs fixed. Root cause was multi-layered: (1) snapshot route fetched binary server-side which fails if CDN unreachable from Next.js server; (2) CameraDashboard had no onError handlers on snapshot imgs; (3) no stream loading/error states in either component. Fix: redirect approach for snapshot + complete error states for both components.
test: All 72 camera tests pass after fixes
expecting: Snapshot loads via redirect to CDN; stream shows loading/error state clearly; errors are visible not silent
next_action: User verifies in browser

## Symptoms

expected: Camera snapshot and live stream should work through the new proxy API system
actual: Both snapshot and live are broken
errors: Unknown — need to investigate the camera API routes and frontend components
reproduction: Go to the camera page, try to view snapshot or live stream
started: Since v10.0 Netatmo API Migration to proxy system

## Eliminated

- hypothesis: Route structure is wrong (snapshot/stream routes missing)
  evidence: All routes exist: /api/netatmo/camera/snapshot, /api/netatmo/camera/stream, /api/netatmo/camera/status
  timestamp: 2026-03-16T12:05:00Z

- hypothesis: CAMERA_ROUTES constants are wrong
  evidence: CAMERA_ROUTES.snapshot and CAMERA_ROUTES.stream use encodeURIComponent(cameraId) as query param — correct, matches routes which use parseQuery
  timestamp: 2026-03-16T12:08:00Z

- hypothesis: Type mismatch in proxy response handling
  evidence: success() spreads CameraSnapshotUrlResponse correctly; data.snapshot_url is at top level; same for vpn_streams
  timestamp: 2026-03-16T12:10:00Z

- hypothesis: Tests are failing
  evidence: All 72 camera tests pass (9 test suites)
  timestamp: 2026-03-16T12:12:00Z

- hypothesis: MAC address colons cause URL encoding issues
  evidence: Node.js URL class preserves raw colons in paths; curl examples in docs use raw colons; fetch() passes them through correctly
  timestamp: 2026-03-16T14:00:00Z

- hypothesis: Auth/CORS issues with img src loading from API route
  evidence: img tags don't have CORS restrictions; cookies are sent for same-origin img src loads; auth works for status route
  timestamp: 2026-03-16T14:00:00Z

## Evidence

- timestamp: 2026-03-16T12:05:00Z
  checked: All camera API routes
  found: Routes exist for status, snapshot, stream, events, monitoring, eventSnapshot
  implication: Route infrastructure is correct

- timestamp: 2026-03-16T12:08:00Z
  checked: lib/netatmoProxy.ts camera wrappers
  found: getProxyCameraSnapshot returns CameraSnapshotUrlResponse{camera_id, snapshot_url}; getProxyCameraStream returns CameraStreamResponse{camera_id, vpn_streams, is_local, local_streams?}
  implication: Proxy wrappers are correct

- timestamp: 2026-03-16T12:10:00Z
  checked: CameraCard.fetchSnapshot and fetchStreamUrl
  found: fetchSnapshot reads data.snapshot_url (correct); fetchStreamUrl reads data.vpn_streams?.high (correct). BUT neither checks response.ok before parsing.
  implication: If API returns error, silently falls to error state; no debug info

- timestamp: 2026-03-16T12:15:00Z
  checked: How snapshot_url is loaded in the browser
  found: The previous debug session changed the snapshot route to fetch binary JPEG server-side from Netatmo CDN. However, if the Next.js server cannot reach v.netatmo.com (due to network topology), this fails with 502 even though the browser could have loaded the URL directly.
  implication: Server-side CDN proxying is fragile; redirect approach is more resilient

- timestamp: 2026-03-16T14:00:00Z
  checked: CameraDashboard snapshot img elements
  found: Camera list thumbnail <img> and selected camera <img> had NO onError handlers. If snapshot fails (e.g., proxy returns 503 because VPN URL not available), the browser shows a broken image icon with no graceful error UI.
  implication: Bug confirmed — silent failure in CameraDashboard snapshots

- timestamp: 2026-03-16T14:00:00Z
  checked: CameraCard and CameraDashboard live stream state
  found: When user clicks "Live": (a) isLiveMode=true immediately, no loading indicator while fetchStreamUrl runs; (b) if fetchStreamUrl fails, streamUrl stays null with no error shown; (c) user sees snapshot still (looks like nothing happened or like live works but shows old image).
  implication: Bug confirmed — no loading state for stream fetch, no visible error when stream fetch fails

- timestamp: 2026-03-16T14:30:00Z
  checked: All 72 camera tests after fix
  found: All pass (9 suites: status, events, snapshot, stream, monitoring, CameraDashboard, netatmoCameraApi, netatmoProxy-camera, CameraMonitoringToggle)
  implication: Fixes are correct and don't break existing behavior

## Resolution

root_cause: |
  Four bugs found:

  1. **Snapshot route: server-side CDN fetch breaks in some network topologies**
     The previous fix changed the route to fetch binary JPEG from v.netatmo.com server-side. If the Next.js server cannot reach the Netatmo CDN (different network from the camera proxy), this fails with 502. The original approach (browser loads URL directly via img src) was more robust. The fix: use a 302 redirect instead — auth-gated at the route level, but the browser follows the redirect and loads the CDN URL directly.

  2. **CameraDashboard: no onError handlers on snapshot <img> elements**
     The camera list thumbnails and selected camera preview had no onError handlers. When snapshots failed, the browser showed broken image icons instead of graceful "N/D" or error UI. Fix: added onError handlers that set snapshotErrors state per camera_id; images gracefully degrade.

  3. **CameraCard: no stream loading/error state**
     When user clicked "Live", isLiveMode was set to true immediately with no loading indicator. If fetchStreamUrl failed, streamUrl stayed null with no error shown — user saw the snapshot still and couldn't tell if live was loading or broken. Fix: added streamLoading and streamError states with appropriate UI.

  4. **CameraDashboard: same stream loading/error gap**
     Same issue as CameraCard. Fix: added streamLoading and streamError states with same UI patterns.

fix: |
  Files changed:
  - app/api/netatmo/camera/snapshot/route.ts: Changed from server-side binary proxy to 302 redirect (auth-gated). Browser follows redirect to Netatmo CDN URL directly. Simpler and more resilient.
  - app/components/devices/camera/CameraCard.tsx: Added streamLoading + streamError states; fetchStreamUrl sets error on failure; handleEnterLiveMode resets stream state; video area shows loading spinner and error message.
  - app/(pages)/camera/CameraDashboard.tsx: Added snapshotErrors + streamLoading + streamError states; thumbnail and main <img> elements have onError handlers; stream loading/error states in video area; snapshotErrors reset on data refresh.
  - __tests__/app/api/netatmo/camera/snapshot.test.ts: Rewritten to test redirect behavior (302, Location header, no-cache) instead of binary streaming.

verification: |
  All 72 camera tests pass (9 test suites). No TypeScript errors in changed files.
  Tests cover: badRequest on missing cameraId, redirect to proxy snapshot_url, no-cache header, proxy error propagation, MAC address cameraId with colons.

files_changed:
  - app/api/netatmo/camera/snapshot/route.ts
  - app/components/devices/camera/CameraCard.tsx
  - app/(pages)/camera/CameraDashboard.tsx
  - __tests__/app/api/netatmo/camera/snapshot.test.ts
