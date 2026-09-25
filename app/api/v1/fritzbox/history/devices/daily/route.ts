import { withAuthAndErrorHandler, success, ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core';
import { fritzboxClient, getCachedData, checkRateLimitFritzBox } from '@/lib/fritzbox';
import { buildCacheKey, pickQueryParams, NUMERIC_PARAM } from '@/lib/fritzbox/fritzboxQuery';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/fritzbox/history/devices/daily
 * Returns paginated daily device count history (24 rows per day, one per hour_bucket 0-23).
 * Raw pass-through from HA proxy — no field transformation.
 * Protected: Requires an authenticated session
 * Rate limited: 10 requests per minute per user
 * Cached: 60-second TTL
 *
 * Query params:
 *   days   - Number of days (1-3650, default: 30)
 *   limit  - Max items per page (default: proxy default)
 *   offset - Pagination offset (default: 0)
 *
 * Success: { deviceCounts: { items, total_count, limit, offset } }
 */
export const GET = withAuthAndErrorHandler(async (request, _context, session) => {
  const rateLimitResult = await checkRateLimitFritzBox(session.user.sub, 'history-devices-daily');
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
  const params = pickQueryParams(searchParams, { days: NUMERIC_PARAM, limit: NUMERIC_PARAM, offset: NUMERIC_PARAM });

  const deviceCounts = await getCachedData(buildCacheKey('history-devices-daily', params), () => fritzboxClient.getDevicesDaily(params));
  return success({ deviceCounts });
}, 'FritzBox/HistoryDevicesDaily');
