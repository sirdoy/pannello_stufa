import { withAuthAndErrorHandler, success, ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core';
import { fritzboxClient, getCachedData, checkRateLimitFritzBox } from '@/lib/fritzbox';
import { buildCacheKey, pickQueryParams, NUMERIC_PARAM } from '@/lib/fritzbox/fritzboxQuery';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/fritzbox/network/dhcp/reservations
 * Returns paginated list of static DHCP reservations from Fritz!Box.
 * Forwards optional limit and offset query params to the HA proxy.
 * Protected: Requires an authenticated session
 * Rate limited: 10 requests per minute per user
 * Cached: 60-second TTL
 *
 * Query params:
 *   limit  - Max items per page (default: proxy default)
 *   offset - Pagination offset (default: 0)
 *
 * Success: { reservations: { items, total_count, limit, offset } }
 * Errors:
 *   - 429 RATE_LIMITED: Too many requests
 *   - Plus all health endpoint errors (403, 504, 500)
 */
export const GET = withAuthAndErrorHandler(async (request, _context, session) => {
  const rateLimitResult = await checkRateLimitFritzBox(session.user.sub, 'dhcp-reservations');
  if (!rateLimitResult.allowed) {
    throw new ApiError(
      ERROR_CODES.RATE_LIMITED,
      `Troppe richieste. Riprova tra ${rateLimitResult.nextAllowedIn}s`,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      { retryAfter: rateLimitResult.nextAllowedIn }
    );
  }

  const { searchParams } = new URL(request.url);
  // Whitelisted + validated params; they are also part of the cache key.
  const params = pickQueryParams(searchParams, { limit: NUMERIC_PARAM, offset: NUMERIC_PARAM });

  const reservations = await getCachedData(buildCacheKey('dhcp-reservations', params), () => fritzboxClient.getDhcpReservations(params));
  return success({ reservations });
}, 'FritzBox/DhcpReservations');
