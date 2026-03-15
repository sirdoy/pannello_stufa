import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getProxyCameraStatus } from '@/lib/netatmoProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/netatmo/camera/status
 * Returns camera status from proxy (no direct Netatmo API calls).
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const result = await getProxyCameraStatus();
  return success(result as unknown as Record<string, unknown>);
}, 'Netatmo/CameraStatus');
