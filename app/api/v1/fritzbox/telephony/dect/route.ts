import { withAuthAndErrorHandler, success, ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core';
import { fritzboxClient, getCachedData, checkRateLimitFritzBox } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/fritzbox/telephony/dect
 * Returns paginated list of registered DECT handsets from Fritz!Box.
 * Protected: Requires Auth0 authentication
 * Rate limited: 10 requests per minute per user
 * Cached: 60-second TTL
 *
 * Success: { dect: { items, total_count, limit, offset } }
 * Errors:
 *   - 429 RATE_LIMITED: Too many requests
 *   - Plus all health endpoint errors (403, 504, 500)
 */
export const GET = withAuthAndErrorHandler(async (_request, _context, session) => {
  const rateLimitResult = await checkRateLimitFritzBox(session.user.sub, 'telephony-dect');
  if (!rateLimitResult.allowed) {
    throw new ApiError(
      ERROR_CODES.RATE_LIMITED,
      `Troppe richieste. Riprova tra ${rateLimitResult.nextAllowedIn}s`,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      { retryAfter: rateLimitResult.nextAllowedIn }
    );
  }
  const dect = await getCachedData('telephony-dect', () => fritzboxClient.getDectHandsets());
  return success({ dect });
}, 'FritzBox/TelephonyDect');
