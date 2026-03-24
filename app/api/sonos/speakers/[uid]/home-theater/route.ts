import { withAuthAndErrorHandler, success, getPathParam, parseJson, HTTP_STATUS } from '@/lib/core';
import { getHomeTheater, setHomeTheater } from '@/lib/sonos/sonosProxy';
import type { SetHomeTheaterRequest } from '@/types/sonosProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sonos/speakers/[uid]/home-theater
 * Returns home theater settings for a soundbar speaker.
 * Protected: Requires Auth0 authentication
 *
 * PUT /api/sonos/speakers/[uid]/home-theater
 * Sets home theater settings (partial update supported).
 * Body: SetHomeTheaterRequest — night_mode, speech_enhance, sub_enabled, surround_enabled, sub_level, surround_level
 * Returns: 202 Accepted with suggested_poll_delay_s
 */
export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const uid = await getPathParam(context, 'uid');
  const data = await getHomeTheater(uid);
  return success(data as unknown as Record<string, unknown>);
}, 'Sonos/Speakers/HomeTheater/Get');

export const PUT = withAuthAndErrorHandler(async (request, context) => {
  const uid = await getPathParam(context, 'uid');
  const body = await parseJson(request) as SetHomeTheaterRequest;
  const data = await setHomeTheater(uid, body);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Sonos/Speakers/HomeTheater/Set');
