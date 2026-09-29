import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getProxyCameraStatus } from '@/lib/netatmo/netatmoProxy';
import { stripSignedUrls } from '@/lib/netatmo/stripSignedUrls';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/netatmo/camera/status
 * Returns camera status from proxy.
 * Protected: Requires an authenticated session
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getProxyCameraStatus();
  return success(stripSignedUrls(data) as unknown as Record<string, unknown>);
}, 'Netatmo/Camera/Status');
