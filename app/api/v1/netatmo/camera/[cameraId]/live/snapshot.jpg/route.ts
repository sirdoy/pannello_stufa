import { withAuthAndErrorHandler, getPathParam } from '@/lib/core';
import { getProxyCameraLive } from '@/lib/netatmo/netatmoProxy';
import { passthroughResponse } from '@/lib/netatmo/cameraLiveResponse';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/netatmo/camera/[cameraId]/live/snapshot.jpg
 *
 * Proxies the JPEG bytes from the HA proxy's browser-safe live-snapshot
 * endpoint (same path on the backend, `/api/v1/netatmo/camera/{camera_id}/live/snapshot.jpg`).
 * Until ROADMAP T6 this lived at `/camera/[cameraId]/snapshot`, a path that on the
 * backend returns JSON (snapshot URLs), not the image.
 *
 * The previous implementation 302-redirected to Netatmo's raw VPN URL —
 * which doesn't work in browsers (no session, no CORS, mixed-content under
 * reverse proxies). Per the proxy docs (see docs/api/netatmo.md §
 * "GET /camera/{camera_id}/live/snapshot.jpg") the live-snapshot endpoint
 * fetches the VPN snapshot server-side and streams the JPEG bytes back, which
 * is what `<img src>` actually needs.
 *
 * Protected: Requires an authenticated session.
 */
export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const cameraId = await getPathParam(context, 'cameraId');
  const upstream = await getProxyCameraLive(cameraId, 'snapshot.jpg');
  // Streams the JPEG straight back; backend errors (404/503) keep their status so
  // <img onError> falls back. No caching: the `?t=` param busts on each poll anyway.
  return passthroughResponse(upstream, {
    fallbackContentType: 'image/jpeg',
    cacheControl: 'no-cache, no-store, must-revalidate',
  });
}, 'Netatmo/Camera/Snapshot');
