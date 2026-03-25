import { withAuthAndErrorHandler, success, ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core';
import { fritzboxClient, getCachedData, checkRateLimitFritzBox } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

/**
 * GET /api/fritzbox/history/bandwidth/daily
 * Returns paginated daily bandwidth aggregation from Fritz!Box.
 * Forwards optional days, limit and offset query params to the HA proxy.
 * Protected: Requires Auth0 authentication
 * Rate limited: 10 requests per minute per user
 * Cached: 60-second TTL
 *
 * Query params:
 *   days   - Number of days to retrieve (1-3650, default 30)
 *   limit  - Max items per page (default: proxy default)
 *   offset - Pagination offset (default: 0)
 *
 * Success: { daily: { items, total_count, limit, offset } }
 * Errors:
 *   - 429 RATE_LIMITED: Too many requests
 *   - Plus all health endpoint errors (403, 504, 500)
 */
export const GET = withAuthAndErrorHandler(async (request, _context, session) => {
  const rateLimitResult = await checkRateLimitFritzBox(session.user.sub, 'history-bandwidth-daily');
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
  const days = searchParams.get('days');
  const limit = searchParams.get('limit');
  const offset = searchParams.get('offset');
  if (days) params.set('days', days);
  if (limit) params.set('limit', limit);
  if (offset) params.set('offset', offset);

  const daily = await getCachedData('history-bandwidth-daily', () => fritzboxClient.getBandwidthDaily(params));
  return success({ daily });
}, 'FritzBox/HistoryBandwidthDaily');
