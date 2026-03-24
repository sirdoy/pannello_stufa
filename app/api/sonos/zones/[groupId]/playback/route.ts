import { withAuthAndErrorHandler, success, getPathParam } from '@/lib/core';
import { getPlayback } from '@/lib/sonos/sonosProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sonos/zones/[groupId]/playback
 * Returns current playback state for a zone (transport state, track info, position).
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const groupId = await getPathParam(context, 'groupId');
  const data = await getPlayback(groupId);
  return success(data as unknown as Record<string, unknown>);
}, 'Sonos/Zones/Playback');
