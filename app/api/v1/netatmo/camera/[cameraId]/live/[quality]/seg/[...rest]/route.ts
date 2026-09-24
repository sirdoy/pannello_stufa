import { withAuthAndErrorHandler, getPathParam, badRequest } from '@/lib/core';
import { getProxyCameraLive } from '@/lib/netatmo/netatmoProxy';
import { isCameraStreamQuality, passthroughResponse } from '@/lib/netatmo/cameraLiveResponse';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/netatmo/camera/[cameraId]/live/[quality]/seg/[...rest]
 *
 * HLS segment (.ts) or sub-playlist (.m3u8) relayed from the backend. Sub-playlists
 * arrive already rewritten by the backend, so nested URIs keep hitting this route.
 */
export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const cameraId = await getPathParam(context, 'cameraId');
  const quality = await getPathParam(context, 'quality');
  // Catch-all segments arrive as string[] at runtime (RouteContext types them as string).
  const rest = ((await context.params) as Record<string, unknown>)['rest'];
  const parts: string[] = Array.isArray(rest)
    ? rest.map(String)
    : typeof rest === 'string'
      ? [rest]
      : [];

  if (!isCameraStreamQuality(quality)) return badRequest('Invalid stream quality');
  if (parts.length === 0 || parts.some((p) => p === '' || p === '.' || p === '..')) {
    return badRequest('Invalid segment path');
  }

  const subpath = parts.map(encodeURIComponent).join('/');
  const upstream = await getProxyCameraLive(cameraId, `${quality}/seg/${subpath}`);
  return passthroughResponse(upstream, { fallbackContentType: 'video/MP2T' });
}, 'Netatmo/Camera/LiveSegment');
