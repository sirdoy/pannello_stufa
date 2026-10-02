import { withAuthAndErrorHandler, success } from '@/lib/core';
import { fritzboxClient } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/fritzbox/wan
 * Retrieves WAN connection status from Fritz!Box
 * Protected: Requires an authenticated session
 *
 * Success: { wan: {...} }
 * Errors:
 *   - All health endpoint errors (403, 504, 500)
 */
export const GET = withAuthAndErrorHandler(async () => {
  const wan = await fritzboxClient.getWanStatus();
  return success({ wan });
}, 'FritzBox/WAN');
