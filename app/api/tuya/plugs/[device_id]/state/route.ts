import { withAuthAndErrorHandler, success, getPathParam, parseJson } from '@/lib/core';
import { setState } from '@/lib/tuya/tuyaProxy';
import type { TuyaSetStateRequest } from '@/types/tuyaProxy';

export const dynamic = 'force-dynamic';

/**
 * POST /api/tuya/plugs/[device_id]/state
 * Toggles a plug on or off. Returns 200 with data_confirmed field (D-01).
 * Protected: Requires Auth0 authentication.
 */
export const POST = withAuthAndErrorHandler(async (request, context) => {
  const deviceId = await getPathParam(context, 'device_id');
  const body = await parseJson(request) as TuyaSetStateRequest;
  const data = await setState(deviceId, body);
  return success(data as unknown as Record<string, unknown>);
}, 'Tuya/Plugs/SetState');
