/**
 * API Route: Sonos Speaker EQ
 *
 * GET  /api/v1/sonos/speakers/{uid}/eq — read EQ settings (bass/treble/loudness)
 * PUT  /api/v1/sonos/speakers/{uid}/eq — update EQ (partial), returns 202
 *
 * Protected: Requires Auth0 authentication
 */

import { withAuthAndErrorHandler, success, getPathParam, parseJson, HTTP_STATUS } from '@/lib/core';
import { getEq, setEq } from '@/lib/sonos/sonosProxy';
import type { SetEqRequest } from '@/types/sonosProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const uid = await getPathParam(context, 'uid');
  const data = await getEq(uid);
  return success(data as unknown as Record<string, unknown>);
}, 'Sonos/Speakers/Eq/Get');

export const PUT = withAuthAndErrorHandler(async (request, context) => {
  const uid = await getPathParam(context, 'uid');
  const body = await parseJson(request) as SetEqRequest;
  const data = await setEq(uid, body);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Sonos/Speakers/Eq/Set');
