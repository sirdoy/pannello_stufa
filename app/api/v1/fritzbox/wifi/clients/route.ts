import { withAuthAndErrorHandler, success } from '@/lib/core';
import { fritzboxClient } from '@/lib/fritzbox';
import { pickQueryParams, BAND_PARAM, NUMERIC_PARAM } from '@/lib/fritzbox/fritzboxQuery';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/fritzbox/wifi/clients
 * Returns paginated list of WiFi clients connected to Fritz!Box.
 * Forwards optional band, limit, offset query params to the HA proxy.
 * Protected: Requires an authenticated session
 *
 * Query params:
 *   band   - Filter by frequency band (e.g. "2.4GHz", "5GHz")
 *   limit  - Max items per page (default: proxy default)
 *   offset - Pagination offset (default: 0)
 *
 * Success: { clients: { items, total_count, limit, offset } }
 * Errors:
 *   - All health endpoint errors (403, 504, 500)
 */
export const GET = withAuthAndErrorHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  // Whitelisted + validated params.
  const params = pickQueryParams(searchParams, { band: BAND_PARAM, limit: NUMERIC_PARAM, offset: NUMERIC_PARAM });

  const clients = await fritzboxClient.getWifiClients(params);
  return success({ clients });
}, 'FritzBox/WiFiClients');
