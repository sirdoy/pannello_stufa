/**
 * API Route: Netatmo CreateNewHomeSchedule
 *
 * POST /api/v1/netatmo/createnewhomeschedule
 *
 * Creates a new home schedule on Netatmo via the HA proxy.
 * Returns 202 Accepted with suggested_poll_delay_s.
 *
 * Protected: Requires Auth0 authentication
 */

import { withAuthAndErrorHandler, success, parseJson, HTTP_STATUS } from '@/lib/core';
import { proxyCreateNewHomeSchedule } from '@/lib/netatmo/netatmoProxy';

export const dynamic = 'force-dynamic';

export const POST = withAuthAndErrorHandler(async (request) => {
  const body = await parseJson(request) as Record<string, unknown>;
  const data = await proxyCreateNewHomeSchedule(body);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Netatmo/CreateNewHomeSchedule');
