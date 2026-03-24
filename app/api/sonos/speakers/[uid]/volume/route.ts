import { withAuthAndErrorHandler, success, getPathParam, parseJson, HTTP_STATUS } from '@/lib/core';
import { getSpeakerVolume, setSpeakerVolume } from '@/lib/sonos/sonosProxy';
import type { SetVolumeRequest } from '@/types/sonosProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sonos/speakers/[uid]/volume
 * Returns volume and mute state for a specific speaker.
 * Protected: Requires Auth0 authentication
 *
 * PUT /api/sonos/speakers/[uid]/volume
 * Sets the volume for a specific speaker.
 * Body: { volume: number } — 0-100
 * Returns: 202 Accepted with suggested_poll_delay_s
 */
export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const uid = await getPathParam(context, 'uid');
  const data = await getSpeakerVolume(uid);
  return success(data as unknown as Record<string, unknown>);
}, 'Sonos/Speakers/Volume/Get');

export const PUT = withAuthAndErrorHandler(async (request, context) => {
  const uid = await getPathParam(context, 'uid');
  const body = await parseJson(request) as SetVolumeRequest;
  const data = await setSpeakerVolume(uid, body.volume);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Sonos/Speakers/Volume/Set');
