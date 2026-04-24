import { withAuthAndErrorHandler, success, ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core';
import { fritzboxClient, getCachedData, checkRateLimitFritzBox } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/fritzbox/history/devices/daily
 * Returns paginated daily device count history (24 rows per day, one per hour_bucket 0-23).
 * Raw pass-through from HA proxy — no field transformation.
 * Protected: Requires Auth0 authentication
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
  const params = new URLSearchParams();
  const days = searchParams.get('days');
  const limit = searchParams.get('limit');
  const offset = searchParams.get('offset');
  if (days) params.set('days', days);
  if (limit) params.set('limit', limit);
  if (offset) params.set('offset', offset);

  const deviceCounts = await getCachedData('history-devices-daily', () => fritzboxClient.getDevicesDaily(params));
  return success({ deviceCounts });
}, 'FritzBox/HistoryDevicesDaily');
