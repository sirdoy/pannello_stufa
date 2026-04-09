/**
 * API Route: Netatmo SyncHomeSchedule
 *
 * POST /api/v1/netatmo/synchomeschedule
 *
 * Syncs a home schedule definition to Netatmo via the HA proxy.
 * Returns 202 Accepted with suggested_poll_delay_s.
 *
 * Protected: Requires Auth0 authentication
 */

import { withAuthAndErrorHandler, success, parseJson, HTTP_STATUS } from '@/lib/core';
import { proxySyncHomeSchedule } from '@/lib/netatmo/netatmoProxy';

export const dynamic = 'force-dynamic';

export const POST = withAuthAndErrorHandler(async (request) => {
  const body = await parseJson(request) as Record<string, unknown>;
  const data = await proxySyncHomeSchedule(body);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Netatmo/SyncHomeSchedule');
