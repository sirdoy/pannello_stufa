/**
 * API Route: Sonos Speaker Unjoin
 *
 * POST /api/v1/sonos/speakers/{uid}/unjoin — remove speaker from its group, returns 202
 * No request body.
 *
 * Protected: Requires Auth0 authentication
 */

import { withAuthAndErrorHandler, success, getPathParam, HTTP_STATUS } from '@/lib/core';
import { unjoin } from '@/lib/sonos/sonosProxy';

export const dynamic = 'force-dynamic';

export const POST = withAuthAndErrorHandler(async (_request, context) => {
  const uid = await getPathParam(context, 'uid');
  const data = await unjoin(uid);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Sonos/Speakers/Unjoin');
