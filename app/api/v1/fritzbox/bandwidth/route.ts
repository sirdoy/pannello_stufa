import { withAuthAndErrorHandler, success } from '@/lib/core';
import { fritzboxClient } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/fritzbox/bandwidth
 * Retrieves bandwidth statistics from Fritz!Box
 * Protected: Requires an authenticated session
 *
 * Success: { bandwidth: {...} }
 * Errors:
 *   - All health endpoint errors (403, 504, 500)
 */
export const GET = withAuthAndErrorHandler(async () => {
  const bandwidth = await fritzboxClient.getBandwidth();
  return success({ bandwidth });
}, 'FritzBox/Bandwidth');
