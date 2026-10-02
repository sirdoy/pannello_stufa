import { withAuthAndErrorHandler, success } from '@/lib/core';
import { fritzboxClient } from '@/lib/fritzbox';
import { pickQueryParams, NUMERIC_PARAM } from '@/lib/fritzbox/fritzboxQuery';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/fritzbox/history/devices/daily
 * Returns paginated daily device count history (24 rows per day, one per hour_bucket 0-23).
 * Raw pass-through from HA proxy — no field transformation.
 * Protected: Requires an authenticated session
 *
 * Query params:
 *   days   - Number of days (1-3650, default: 30)
 *   limit  - Max items per page (default: proxy default)
 *   offset - Pagination offset (default: 0)
 *
 * Success: { deviceCounts: { items, total_count, limit, offset } }
 */
export const GET = withAuthAndErrorHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  // Whitelisted + validated params.
  const params = pickQueryParams(searchParams, { days: NUMERIC_PARAM, limit: NUMERIC_PARAM, offset: NUMERIC_PARAM });

  const deviceCounts = await fritzboxClient.getDevicesDaily(params);
  return success({ deviceCounts });
}, 'FritzBox/HistoryDevicesDaily');
