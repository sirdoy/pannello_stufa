import { withAuthAndErrorHandler, success, getPathParam, parseJson, HTTP_STATUS } from '@/lib/core';
import { join } from '@/lib/sonos/sonosProxy';
import type { JoinRequest } from '@/types/sonosProxy';

export const dynamic = 'force-dynamic';

/**
 * POST /api/sonos/speakers/[uid]/join
 * Joins a speaker to another speaker's group.
 * Body: JoinRequest — { target_uid: string }
 * Returns: 202 Accepted with suggested_poll_delay_s
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request, context) => {
  const uid = await getPathParam(context, 'uid');
  const body = await parseJson(request) as JoinRequest;
  const data = await join(uid, body.target_uid);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Sonos/Speakers/Join');
