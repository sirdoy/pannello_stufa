/**
 * API Route: Sonos Speaker Home Theater
 *
 * GET  /api/v1/sonos/speakers/{uid}/home-theater — read home-theater settings
 * PUT  /api/v1/sonos/speakers/{uid}/home-theater — update home-theater (partial), returns 202
 *
 * Protected: Requires Auth0 authentication
 */

import { withAuthAndErrorHandler, success, getPathParam, parseJson, HTTP_STATUS } from '@/lib/core';
import { getHomeTheater, setHomeTheater } from '@/lib/sonos/sonosProxy';
import type { SetHomeTheaterRequest } from '@/types/sonosProxy';

export const dynamic = 'force-dynamic';

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
