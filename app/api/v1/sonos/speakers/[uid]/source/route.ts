/**
 * API Route: Sonos Speaker Source Switch
 *
 * POST /api/v1/sonos/speakers/{uid}/source — switch source (tv | line_in), returns 202
 * Body: { source: 'tv' | 'line_in' }
 *
 * Protected: Requires Auth0 authentication
 */

import { withAuthAndErrorHandler, success, getPathParam, parseJson, HTTP_STATUS } from '@/lib/core';
import { switchSource } from '@/lib/sonos/sonosProxy';
import type { SwitchSourceRequest } from '@/types/sonosProxy';

export const dynamic = 'force-dynamic';

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
