import { withAuthAndErrorHandler, success, getPathParam, parseJson, HTTP_STATUS } from '@/lib/core';
import { switchSource } from '@/lib/sonos/sonosProxy';
import type { SwitchSourceRequest } from '@/types/sonosProxy';

export const dynamic = 'force-dynamic';

/**
 * POST /api/sonos/speakers/[uid]/source
 * Switches the audio source for a speaker (TV input or line-in).
 * Body: SwitchSourceRequest — { source: 'tv' | 'line_in' }
 * Returns: 202 Accepted with suggested_poll_delay_s
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request, context) => {
  const uid = await getPathParam(context, 'uid');
  const body = await parseJson(request) as SwitchSourceRequest;
  const data = await switchSource(uid, body.source);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Sonos/Speakers/Source/Switch');
