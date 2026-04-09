/**
 * API Route: Sonos Zone Next Track Command
 *
 * POST /api/v1/sonos/zones/{groupId}/next
 *
 * Skips to the next track in the queue for a zone.
 *
 * Protected: Requires Auth0 authentication
 * Returns: 202 Accepted with suggested_poll_delay_s
 */

import { withAuthAndErrorHandler, success, getPathParam, HTTP_STATUS } from '@/lib/core';
import { next } from '@/lib/sonos/sonosProxy';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/sonos/zones/{groupId}/next
 * Skips to next track for the given zone via HA proxy.
 */
export const POST = withAuthAndErrorHandler(async (_request, context) => {
  const groupId = await getPathParam(context, 'groupId');
  const data = await next(groupId);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Sonos/Zones/Next');
