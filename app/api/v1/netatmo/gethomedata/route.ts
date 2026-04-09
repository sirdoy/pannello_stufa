/**
 * API Route: Netatmo GetHomeData
 *
 * GET /api/v1/netatmo/gethomedata
 *
 * Returns home security data (cameras, smoke detectors, persons) from the HA proxy.
 *
 * Protected: Requires Auth0 authentication
 */

import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getProxyHomeData } from '@/lib/netatmo/netatmoProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await getProxyHomeData();
  return success(data as unknown as Record<string, unknown>);
}, 'Netatmo/GetHomeData');
