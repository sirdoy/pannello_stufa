/**
 * API Route: Netatmo SetRoomThermpoint
 *
 * POST /api/v1/netatmo/setroomthermpoint
 *
 * Sets room thermostat setpoint (manual or home mode) via the HA proxy.
 * Returns 202 Accepted with suggested_poll_delay_s.
 *
 * Protected: Requires Auth0 authentication
 */

import { withAuthAndErrorHandler, success, parseJson, HTTP_STATUS } from '@/lib/core';
import { proxySetRoomThermpoint } from '@/lib/netatmo/netatmoProxy';
import type { SetRoomThermpointRequest } from '@/types/netatmoProxy';

export const dynamic = 'force-dynamic';

export const POST = withAuthAndErrorHandler(async (request) => {
  const body = await parseJson(request) as SetRoomThermpointRequest;
  const data = await proxySetRoomThermpoint(body);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Netatmo/SetRoomThermpoint');
