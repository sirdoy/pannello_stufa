import { withAuthAndErrorHandler, success, getPathParam, parseJson, HTTP_STATUS } from '@/lib/core';
import { seek } from '@/lib/sonos/sonosProxy';
import type { SetSeekRequest } from '@/types/sonosProxy';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/v1/sonos/zones/[groupId]/seek
 * Seeks to a position in the current track for a zone.
 * Body: { position: string } — "HH:MM:SS" format
 * Protected: Requires Auth0 authentication
 * Returns: 202 Accepted with suggested_poll_delay_s
 */
export const PUT = withAuthAndErrorHandler(async (request, context) => {
  const groupId = await getPathParam(context, 'groupId');
  const body = await parseJson(request) as SetSeekRequest;
  const data = await seek(groupId, body.position);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Sonos/Zones/Seek');
