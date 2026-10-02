import { withAuthAndErrorHandler, success } from '@/lib/core';
import { fritzboxClient } from '@/lib/fritzbox';
import { pickQueryParams, MAC_PARAM, NUMERIC_PARAM } from '@/lib/fritzbox/fritzboxQuery';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/fritzbox/history/device-events
 * Returns raw device event log from Fritz!Box (untransformed pass-through).
 * Protected: Requires an authenticated session
 *
 * Query params:
 *   hours  - Number of hours to retrieve (default: proxy default)
 *   limit  - Max items per page (default: proxy default)
 *   offset - Pagination offset (default: 0)
 *   mac    - Filter by MAC address (optional)
 *
 * Success: { events: { items, total_count, limit, offset } }
 * Errors:
 *   - All health endpoint errors (403, 504, 500)
 */
export const GET = withAuthAndErrorHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  // Whitelisted + validated params.
  const params = pickQueryParams(searchParams, { hours: NUMERIC_PARAM, limit: NUMERIC_PARAM, offset: NUMERIC_PARAM, mac: MAC_PARAM });

  const events = await fritzboxClient.getDeviceEventsRaw(params);
  return success({ events });
}, 'FritzBox/HistoryDeviceEventsRaw');
