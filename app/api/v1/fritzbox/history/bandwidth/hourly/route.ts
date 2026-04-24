import { withAuthAndErrorHandler, success, ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core';
import { fritzboxClient, getCachedData, checkRateLimitFritzBox } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/fritzbox/history/bandwidth/hourly
 * Returns paginated hourly bandwidth aggregation from Fritz!Box.
 * Forwards optional days, limit and offset query params to the HA proxy.
 * Protected: Requires Auth0 authentication
 * Rate limited: 10 requests per minute per user
 * Cached: 60-second TTL
 *
 * Query params:
 *   days   - Number of days to retrieve (1-365, default 7)
 *   limit  - Max items per page (default: proxy default)
 *   offset - Pagination offset (default: 0)
 *
 * Success: { hourly: { items, total_count, limit, offset } }
 * Errors:
 *   - 429 RATE_LIMITED: Too many requests
 *   - Plus all health endpoint errors (403, 504, 500)
 */
export const GET = withAuthAndErrorHandler(async (request, _context, session) => {
  const rateLimitResult = await checkRateLimitFritzBox(session.user.sub, 'history-bandwidth-hourly');
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

  const hourly = await getCachedData('history-bandwidth-hourly', () => fritzboxClient.getBandwidthHourly(params));
  return success({ hourly });
}, 'FritzBox/HistoryBandwidthHourly');
