import { withAuthAndErrorHandler, success, ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core';
import { fritzboxClient, getCachedData, checkRateLimitFritzBox } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

/**
 * GET /api/fritzbox/network/mesh
 * Returns mesh topology from Fritz!Box as a flat object.
 * NOT paginated — returns { schema_version, node_count, link_count, nodes[], links[], is_stale, fetched_at }.
 * Protected: Requires Auth0 authentication
 * Rate limited: 10 requests per minute per user
 * Cached: 60-second TTL
 *
 * Success: { mesh: { schema_version, node_count, link_count, nodes, links, is_stale, fetched_at } }
 * Errors:
 *   - 429 RATE_LIMITED: Too many requests
 *   - Plus all health endpoint errors (403, 504, 500)
 */
export const GET = withAuthAndErrorHandler(async (_request, _context, session) => {
  const rateLimitResult = await checkRateLimitFritzBox(session.user.sub, 'mesh');
  if (!rateLimitResult.allowed) {
    throw new ApiError(
      ERROR_CODES.RATE_LIMITED,
      `Troppe richieste. Riprova tra ${rateLimitResult.nextAllowedIn}s`,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      { retryAfter: rateLimitResult.nextAllowedIn }
    );
  }

  const mesh = await getCachedData('mesh-topology', () => fritzboxClient.getMeshTopology());
  return success({ mesh });
}, 'FritzBox/Mesh');
