import { withAuthAndErrorHandler, success } from '@/lib/core';
import { fritzboxClient } from '@/lib/fritzbox';
import { pickQueryParams, NUMERIC_PARAM } from '@/lib/fritzbox/fritzboxQuery';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/fritzbox/history/bandwidth/hourly
 * Returns paginated hourly bandwidth aggregation from Fritz!Box.
 * Forwards optional days, limit and offset query params to the HA proxy.
 * Protected: Requires an authenticated session
 *
 * Query params:
 *   days   - Number of days to retrieve (1-365, default 7)
 *   limit  - Max items per page (default: proxy default)
 *   offset - Pagination offset (default: 0)
 *
 * Success: { hourly: { items, total_count, limit, offset } }
 * Errors:
 *   - All health endpoint errors (403, 504, 500)
 */
export const GET = withAuthAndErrorHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  // Whitelisted + validated params.
  const params = pickQueryParams(searchParams, { days: NUMERIC_PARAM, limit: NUMERIC_PARAM, offset: NUMERIC_PARAM });

  const hourly = await fritzboxClient.getBandwidthHourly(params);
  return success({ hourly });
}, 'FritzBox/HistoryBandwidthHourly');
