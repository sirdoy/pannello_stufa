import { withAuthAndErrorHandler, success, getPathParam } from '@/lib/core';
import { getProxyCameraSnapshot } from '@/lib/netatmo/netatmoProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/netatmo/camera/[cameraId]/snapshot
 * Returns camera snapshot URL from proxy.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const cameraId = await getPathParam(context, 'cameraId');
  const data = await getProxyCameraSnapshot(cameraId);
  return success(data as unknown as Record<string, unknown>);
}, 'Netatmo/Camera/Snapshot');
