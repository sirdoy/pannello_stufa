import { withAuthAndErrorHandler, success, ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core';
import { fritzboxClient, getCachedData, checkRateLimitFritzBox } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

/**
 * GET /api/fritzbox/wifi/clients
 * Returns paginated list of WiFi clients connected to Fritz!Box.
 * Forwards optional band, limit, offset query params to the HA proxy.
 * Protected: Requires Auth0 authentication
 * Rate limited: 10 requests per minute per user
 * Cached: 60-second TTL
 *
 * Query params:
 *   band   - Filter by frequency band (e.g. "2.4GHz", "5GHz")
 *   limit  - Max items per page (default: proxy default)
 *   offset - Pagination offset (default: 0)
 *
 * Success: { clients: { items, total_count, limit, offset } }
 * Errors:
 *   - 429 RATE_LIMITED: Too many requests
 *   - Plus all health endpoint errors (403, 504, 500)
 */
export const GET = withAuthAndErrorHandler(async (request, _context, session) => {
  const rateLimitResult = await checkRateLimitFritzBox(session.user.sub, 'wifi-clients');
  if (!rateLimitResult.allowed) {
    throw new ApiError(
      ERROR_CODES.RATE_LIMITED,
      `Troppe richieste. Riprova tra ${rateLimitResult.nextAllowedIn}s`,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      { retryAfter: rateLimitResult.nextAllowedIn }
    );
  }

  const { searchParams } = new URL(request.url);
  const params = new URLSearchParams();
  const band = searchParams.get('band');
  const limit = searchParams.get('limit');
  const offset = searchParams.get('offset');
  if (band) params.set('band', band);
  if (limit) params.set('limit', limit);
  if (offset) params.set('offset', offset);

  const clients = await getCachedData('wifi-clients', () => fritzboxClient.getWifiClients(params));
  return success({ clients });
}, 'FritzBox/WiFiClients');
