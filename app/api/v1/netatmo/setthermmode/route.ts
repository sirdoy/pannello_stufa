/**
 * API Route: Netatmo SetThermMode
 *
 * POST /api/v1/netatmo/setthermmode
 *
 * Sets the home thermostat mode (schedule, away, or hg/frost-guard) via the HA proxy.
 * Returns 202 Accepted with suggested_poll_delay_s.
 *
 * Protected: Requires Auth0 authentication
 */

import { withAuthAndErrorHandler, success, parseJson, HTTP_STATUS } from '@/lib/core';
import { proxySetThermMode } from '@/lib/netatmo/netatmoProxy';
import type { SetThermmodeRequest } from '@/types/netatmoProxy';

export const dynamic = 'force-dynamic';

export const POST = withAuthAndErrorHandler(async (request) => {
  const body = await parseJson(request) as SetThermmodeRequest;
  const data = await proxySetThermMode(body);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Netatmo/SetThermMode');
