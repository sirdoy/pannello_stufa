import { withAuthAndErrorHandler, success } from '@/lib/core';
import { fritzboxClient } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/fritzbox/telephony/dect
 * Returns the list of registered DECT handsets from Fritz!Box (not paginated).
 * Protected: Requires an authenticated session
 *
 * Success: { dect: { handsets, handset_count, is_stale, fetched_at } }
 *   (backend DectListResponse, see docs/api/fritzbox.md)
 * Errors:
 *   - All health endpoint errors (403, 504, 500)
 */
export const GET = withAuthAndErrorHandler(async () => {
  const dect = await fritzboxClient.getDectHandsets();
  return success({ dect });
}, 'FritzBox/TelephonyDect');
