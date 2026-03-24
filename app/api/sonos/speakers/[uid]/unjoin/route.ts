import { withAuthAndErrorHandler, success, getPathParam, HTTP_STATUS } from '@/lib/core';
import { unjoin } from '@/lib/sonos/sonosProxy';

export const dynamic = 'force-dynamic';

/**
 * POST /api/sonos/speakers/[uid]/unjoin
 * Removes a speaker from its current group (becomes standalone zone).
 * No request body required.
 * Returns: 202 Accepted with suggested_poll_delay_s
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (_request, context) => {
  const uid = await getPathParam(context, 'uid');
  const data = await unjoin(uid);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Sonos/Speakers/Unjoin');
