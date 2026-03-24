import { withAuthAndErrorHandler, success, getPathParam } from '@/lib/core';
import { getQueue } from '@/lib/sonos/sonosProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sonos/zones/[groupId]/queue
 * Returns the paginated playback queue for a zone.
 * Query params: limit (optional), offset (optional)
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async (request, context) => {
  const groupId = await getPathParam(context, 'groupId');
  const { searchParams } = request.nextUrl;
  const limit = searchParams.get('limit');
  const offset = searchParams.get('offset');
  const data = await getQueue(groupId, limit ?? undefined, offset ?? undefined);
  return success(data as unknown as Record<string, unknown>);
}, 'Sonos/Zones/Queue');
