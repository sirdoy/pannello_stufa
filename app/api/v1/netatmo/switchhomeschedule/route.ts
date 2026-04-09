/**
 * API Route: Netatmo SwitchHomeSchedule
 *
 * POST /api/v1/netatmo/switchhomeschedule
 *
 * Switches the active heating schedule for a home via the HA proxy.
 * Returns 202 Accepted with suggested_poll_delay_s.
 *
 * Protected: Requires Auth0 authentication
 */

import { withAuthAndErrorHandler, success, parseJson, HTTP_STATUS } from '@/lib/core';
import { proxySwitchHomeSchedule } from '@/lib/netatmo/netatmoProxy';
import type { SwitchHomeScheduleRequest } from '@/types/netatmoProxy';

export const dynamic = 'force-dynamic';

export const POST = withAuthAndErrorHandler(async (request) => {
  const body = await parseJson(request) as SwitchHomeScheduleRequest;
  const data = await proxySwitchHomeSchedule(body);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Netatmo/SwitchHomeSchedule');
