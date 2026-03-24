import { withAuthAndErrorHandler, success, getPathParam, parseJson, HTTP_STATUS } from '@/lib/core';
import { getPlayMode, setPlayMode } from '@/lib/sonos/sonosProxy';
import type { SetPlayModeRequest } from '@/types/sonosProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sonos/zones/[groupId]/play-mode
 * Returns the current play mode (shuffle, repeat, crossfade) for a zone.
 * Protected: Requires Auth0 authentication
 *
 * PUT /api/sonos/zones/[groupId]/play-mode
 * Sets the play mode for a zone.
 * Body: SetPlayModeRequest — { mode: SonosPlayMode }
 * Returns: 202 Accepted with suggested_poll_delay_s
 */
export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const groupId = await getPathParam(context, 'groupId');
  const data = await getPlayMode(groupId);
  return success(data as unknown as Record<string, unknown>);
}, 'Sonos/Zones/PlayMode/Get');

export const PUT = withAuthAndErrorHandler(async (request, context) => {
  const groupId = await getPathParam(context, 'groupId');
  const body = await parseJson(request) as SetPlayModeRequest;
  const data = await setPlayMode(groupId, body);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Sonos/Zones/PlayMode/Set');
