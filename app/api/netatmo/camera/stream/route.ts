import { withAuthAndErrorHandler, success, badRequest, parseQuery } from '@/lib/core';
import { getProxyCameraStream } from '@/lib/netatmo/netatmoProxy';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/netatmo/camera/stream?cameraId=<id>
 * Returns stream URLs for a specific camera from proxy.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async (request: NextRequest) => {
  const cameraId = parseQuery(request).get('cameraId');

  if (!cameraId) {
    return badRequest('Parametro cameraId mancante');
  }

  const result = await getProxyCameraStream(cameraId);
  return success(result as unknown as Record<string, unknown>);
}, 'Netatmo/CameraStream');
