/**
 * API Route: Sonos Speaker Mute
 *
 * PUT /api/v1/sonos/speakers/{uid}/mute — toggle mute, returns 202
 * Body: { mute: boolean }
 *
 * Protected: Requires Auth0 authentication
 */

import { withAuthAndErrorHandler, success, getPathParam, parseJson, HTTP_STATUS } from '@/lib/core';
import { setSpeakerMute } from '@/lib/sonos/sonosProxy';
import type { SetMuteRequest } from '@/types/sonosProxy';

export const dynamic = 'force-dynamic';

export const PUT = withAuthAndErrorHandler(async (request, context) => {
  const uid = await getPathParam(context, 'uid');
  const body = await parseJson(request) as SetMuteRequest;
  const data = await setSpeakerMute(uid, body.mute);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Sonos/Speakers/Mute/Set');
