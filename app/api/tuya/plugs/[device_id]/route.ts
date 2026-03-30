import { withAuthAndErrorHandler, success, getPathParam } from '@/lib/core';
import { getPlug } from '@/lib/tuya/tuyaProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tuya/plugs/[device_id]
 * Returns current state of a single Tuya plug.
 * Protected: Requires Auth0 authentication.
 */
export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const deviceId = await getPathParam(context, 'device_id');
  const data = await getPlug(deviceId);
  return success(data as unknown as Record<string, unknown>);
}, 'Tuya/Plugs/GetOne');
