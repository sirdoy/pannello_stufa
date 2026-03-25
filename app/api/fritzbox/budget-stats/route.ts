import { withAuthAndErrorHandler, success, ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core';
import { fritzboxClient, getCachedData, checkRateLimitFritzBox } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

/**
 * GET /api/fritzbox/budget-stats
 * Returns data budget consumption statistics from Fritz!Box.
 * Raw pass-through from HA proxy — no field transformation.
 * Protected: Requires Auth0 authentication
 * Rate limited: 10 requests per minute per user
 * Cached: 60-second TTL
 *
 * No query params (per D-08).
 *
 * Success: { stats: { window_seconds, utilization_percent, status, ... } }
 */
export const GET = withAuthAndErrorHandler(async (_request, _context, session) => {
  const rateLimitResult = await checkRateLimitFritzBox(session.user.sub, 'budget-stats');
  if (!rateLimitResult.allowed) {
    throw new ApiError(
      ERROR_CODES.RATE_LIMITED,
      `Troppe richieste. Riprova tra ${rateLimitResult.nextAllowedIn}s`,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      { retryAfter: rateLimitResult.nextAllowedIn }
    );
  }

  const stats = await getCachedData('budget-stats', () => fritzboxClient.getBudgetStats());
  return success({ stats });
}, 'FritzBox/BudgetStats');
