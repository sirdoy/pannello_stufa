import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getProxyCameraStatus } from '@/lib/netatmo/netatmoProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/netatmo/camera/status
 * Returns camera status from proxy.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getProxyCameraStatus();
  return success(data as unknown as Record<string, unknown>);
}, 'Netatmo/Camera/Status');
