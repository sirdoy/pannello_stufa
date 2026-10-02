import { withAuthAndErrorHandler, success } from '@/lib/core';
import { fritzboxClient } from '@/lib/fritzbox';
import { pickQueryParams, NUMERIC_PARAM } from '@/lib/fritzbox/fritzboxQuery';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/fritzbox/network/dhcp/reservations
 * Returns paginated list of static DHCP reservations from Fritz!Box.
 * Forwards optional limit and offset query params to the HA proxy.
 * Protected: Requires an authenticated session
 *
 * Query params:
 *   limit  - Max items per page (default: proxy default)
 *   offset - Pagination offset (default: 0)
 *
 * Success: { reservations: { items, total_count, limit, offset } }
 * Errors:
 *   - All health endpoint errors (403, 504, 500)
 */
export const GET = withAuthAndErrorHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  // Whitelisted + validated params.
  const params = pickQueryParams(searchParams, { limit: NUMERIC_PARAM, offset: NUMERIC_PARAM });

  const reservations = await fritzboxClient.getDhcpReservations(params);
  return success({ reservations });
}, 'FritzBox/DhcpReservations');
