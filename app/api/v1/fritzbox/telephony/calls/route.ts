import { withAuthAndErrorHandler, success, ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core';
import { fritzboxClient, getCachedData, checkRateLimitFritzBox } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/fritzbox/telephony/calls
 * Returns paginated call history from Fritz!Box.
 * Forwards optional call_type, limit and offset query params to the HA proxy.
 * Protected: Requires an authenticated session
 * Rate limited: 10 requests per minute per user
 * Cached: 60-second TTL
 *
 * Query params:
 *   call_type - Filter: received | missed | outgoing | rejected | active_received | active_outgoing
 *   limit     - Max items per page (default: backend default 100, max 1000)
 *   offset    - Pagination offset (default: 0)
 *
 * The cache key includes the forwarded params, otherwise every page/filter
 * would be served the first cached page for 60s.
 *
 * Success: { calls: { items: CallRecord[], total_count, limit, offset } }
 *   (backend PaginatedResponse[CallRecordModel], see docs/api/fritzbox.md)
 * Errors:
 *   - 429 RATE_LIMITED: Too many requests
 *   - Plus all health endpoint errors (403, 504, 500)
 */
export const GET = withAuthAndErrorHandler(async (request, _context, session) => {
  const rateLimitResult = await checkRateLimitFritzBox(session.user.sub, 'telephony-calls');
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
  // Only forward well-formed values (they also end up in the Firebase cache key).
  const callType = searchParams.get('call_type');
  const limit = searchParams.get('limit');
  const offset = searchParams.get('offset');
  if (callType && /^[a-z_]+$/.test(callType)) params.set('call_type', callType);
  if (limit && /^\d+$/.test(limit)) params.set('limit', limit);
  if (offset && /^\d+$/.test(offset)) params.set('offset', offset);

  const cacheKey = `telephony-calls-${params.get('call_type') ?? 'all'}-${params.get('limit') ?? 'default'}-${params.get('offset') ?? '0'}`;
  const calls = await getCachedData(cacheKey, () => fritzboxClient.getCallHistory(params));
  return success({ calls });
}, 'FritzBox/TelephonyCalls');
