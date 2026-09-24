import { withAuthAndErrorHandler, success, ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core';
import { fritzboxClient, getCachedData, checkRateLimitFritzBox } from '@/lib/fritzbox';
import { buildCacheKey, pickQueryParams, MAC_PARAM, NUMERIC_PARAM } from '@/lib/fritzbox/fritzboxQuery';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/fritzbox/history/device-events
 * Returns raw device event log from Fritz!Box (untransformed pass-through).
 * Protected: Requires Auth0 authentication
 * Rate limited: 10 requests per minute per user
 * Cached: 60-second TTL
 *
 * Query params:
 *   hours  - Number of hours to retrieve (default: proxy default)
 *   limit  - Max items per page (default: proxy default)
 *   offset - Pagination offset (default: 0)
 *   mac    - Filter by MAC address (optional)
 *
 * Success: { events: { items, total_count, limit, offset } }
 * Errors:
 *   - 429 RATE_LIMITED: Too many requests
 *   - Plus all health endpoint errors (403, 504, 500)
 */
export const GET = withAuthAndErrorHandler(async (request, _context, session) => {
  const rateLimitResult = await checkRateLimitFritzBox(session.user.sub, 'history-device-events-raw');
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
  const params = pickQueryParams(searchParams, { hours: NUMERIC_PARAM, limit: NUMERIC_PARAM, offset: NUMERIC_PARAM, mac: MAC_PARAM });

  const events = await getCachedData(buildCacheKey('history-device-events-raw', params), () => fritzboxClient.getDeviceEventsRaw(params));
  return success({ events });
}, 'FritzBox/HistoryDeviceEventsRaw');
