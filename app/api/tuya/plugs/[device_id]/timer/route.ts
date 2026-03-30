import { withAuthAndErrorHandler, success, getPathParam, parseJson } from '@/lib/core';
import { setTimer } from '@/lib/tuya/tuyaProxy';
import type { TuyaSetTimerRequest } from '@/types/tuyaProxy';

export const dynamic = 'force-dynamic';

/**
 * POST /api/tuya/plugs/[device_id]/timer
 * Sets countdown timer. seconds=0 cancels. Returns 200 with data_confirmed (D-01).
 * Protected: Requires Auth0 authentication.
 */
export const POST = withAuthAndErrorHandler(async (request, context) => {
  const deviceId = await getPathParam(context, 'device_id');
  const body = await parseJson(request) as TuyaSetTimerRequest;
  const data = await setTimer(deviceId, body);
  return success(data as unknown as Record<string, unknown>);
}, 'Tuya/Plugs/SetTimer');
