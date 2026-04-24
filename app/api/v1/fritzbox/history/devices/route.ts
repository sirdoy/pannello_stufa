import { withAuthAndErrorHandler, success, ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core';
import { fritzboxClient, getCachedData, checkRateLimitFritzBox } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/fritzbox/history/devices
 * Returns raw device presence history from Fritz!Box (untransformed pass-through).
 * Per D-05: This endpoint may not exist on the HA proxy. If proxy returns 404, that is expected.
 * Protected: Requires Auth0 authentication
 * Rate limited: 10 requests per minute per user
 * Cached: 60-second TTL
 *
 * Query params:
 *   limit  - Max items per page (default: proxy default)
 *   offset - Pagination offset (default: 0)
 *
 * Success: { devices: { items, total_count, limit, offset } }
 * Errors:
 *   - 429 RATE_LIMITED: Too many requests
 *   - Plus all health endpoint errors (403, 504, 500)
 */
export const GET = withAuthAndErrorHandler(async (request, _context, session) => {
  const rateLimitResult = await checkRateLimitFritzBox(session.user.sub, 'history-devices-raw');
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
  const limit = searchParams.get('limit');
  const offset = searchParams.get('offset');
  if (limit) params.set('limit', limit);
  if (offset) params.set('offset', offset);

  const devices = await getCachedData('history-devices-raw', () => fritzboxClient.getDevicePresenceHistory(params));
  return success({ devices });
}, 'FritzBox/HistoryDevicesRaw');
