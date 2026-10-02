import { withAuthAndErrorHandler, success } from '@/lib/core';
import { fritzboxClient } from '@/lib/fritzbox';
import { pickQueryParams, NUMERIC_PARAM } from '@/lib/fritzbox/fritzboxQuery';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/fritzbox/history/devices
 * Returns raw device presence history from Fritz!Box (untransformed pass-through).
 * Per D-05: This endpoint may not exist on the HA proxy. If proxy returns 404, that is expected.
 * Protected: Requires an authenticated session
 *
 * Query params:
 *   hours  - Hours of history (1-168, default: backend 24)
 *   limit  - Max items per page (default: proxy default)
 *   offset - Pagination offset (default: 0)
 *
 * Success: { devices: { items, total_count, limit, offset } }
 * Errors:
 *   - All health endpoint errors (403, 504, 500)
 */
export const GET = withAuthAndErrorHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  // Whitelisted + validated params.
  const params = pickQueryParams(searchParams, { hours: NUMERIC_PARAM, limit: NUMERIC_PARAM, offset: NUMERIC_PARAM });

  const devices = await fritzboxClient.getDevicePresenceHistory(params);
  return success({ devices });
}, 'FritzBox/HistoryDevicesRaw');
