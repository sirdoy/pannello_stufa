import { withAuthAndErrorHandler, success, ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core';
import { fritzboxClient, getCachedData, checkRateLimitFritzBox } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

/**
 * GET /api/fritzbox/wan
 * Retrieves WAN connection status from Fritz!Box
 * Protected: Requires Auth0 authentication
 * Rate limited: 10 requests per minute
 * Cached: 60-second TTL
 *
 * Success: { wan: {...} }
 * Errors:
 *   - 429 RATE_LIMITED: Too many requests
 *   - Plus all health endpoint errors (403, 504, 500)
 */
export const GET = withAuthAndErrorHandler(async (request, context, session) => {
  // 1. Rate limit check
  const rateLimitResult = await checkRateLimitFritzBox(session.user.sub, 'wan');
  if (!rateLimitResult.allowed) {
    throw new ApiError(
      ERROR_CODES.RATE_LIMITED,
      `Troppe richieste. Riprova tra ${rateLimitResult.nextAllowedIn}s`,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      { retryAfter: rateLimitResult.nextAllowedIn }
    );
  }

  // 2. Fetch with cache (60s TTL)
  const wan = await getCachedData('wan', () => fritzboxClient.getWanStatus());

  // 3. Return data
  return success({ wan });
}, 'FritzBox/WAN');
