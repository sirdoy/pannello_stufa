import { withAuthAndErrorHandler, success, ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core';
import { fritzboxClient, getCachedData, checkRateLimitFritzBox } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

/**
 * GET /api/fritzbox/history/bandwidth
 * Returns raw bandwidth history from Fritz!Box (untransformed pass-through).
 * Distinct from hourly/daily/auto sub-routes which return aggregated data.
 * Protected: Requires Auth0 authentication
 * Rate limited: 10 requests per minute per user
 * Cached: 60-second TTL
 *
 * Query params:
 *   hours  - Number of hours to retrieve (default: proxy default)
 *   limit  - Max items per page (default: proxy default)
 *   offset - Pagination offset (default: 0)
 *
 * Success: { bandwidth: { items, total_count, limit, offset } }
 * Errors:
 *   - 429 RATE_LIMITED: Too many requests
 *   - Plus all health endpoint errors (403, 504, 500)
 */
export const GET = withAuthAndErrorHandler(async (request, _context, session) => {
  const rateLimitResult = await checkRateLimitFritzBox(session.user.sub, 'history-bandwidth-raw');
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
  const hours = searchParams.get('hours');
  const limit = searchParams.get('limit');
  const offset = searchParams.get('offset');
  if (hours) params.set('hours', hours);
  if (limit) params.set('limit', limit);
  if (offset) params.set('offset', offset);

  const bandwidth = await getCachedData('history-bandwidth-raw', () => fritzboxClient.getBandwidthHistoryRaw(params));
  return success({ bandwidth });
}, 'FritzBox/HistoryBandwidthRaw');
