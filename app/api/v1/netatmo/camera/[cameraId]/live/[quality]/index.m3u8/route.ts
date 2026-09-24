import { withAuthAndErrorHandler, getPathParam, badRequest } from '@/lib/core';
import { getProxyCameraLive } from '@/lib/netatmo/netatmoProxy';
import { isCameraStreamQuality, passthroughResponse } from '@/lib/netatmo/cameraLiveResponse';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/netatmo/camera/[cameraId]/live/[quality]/index.m3u8
 *
 * HLS playlist relayed from the backend (`proxy_streams.{quality}`). The backend
 * rewrites segment URIs to /api/v1/netatmo/camera/{id}/live/{quality}/seg/..., which
 * resolve to the sibling Next route below — so every fetch stays same-origin and
 * Auth0-authenticated (Netatmo VPN URLs are not playable from a browser).
 */
export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const cameraId = await getPathParam(context, 'cameraId');
  const quality = await getPathParam(context, 'quality');
  if (!isCameraStreamQuality(quality)) return badRequest('Invalid stream quality');

  const upstream = await getProxyCameraLive(cameraId, `${quality}/index.m3u8`);
  return passthroughResponse(upstream, { fallbackContentType: 'application/vnd.apple.mpegurl' });
}, 'Netatmo/Camera/LivePlaylist');
