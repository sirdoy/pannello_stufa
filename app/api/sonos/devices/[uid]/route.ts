import { withAuthAndErrorHandler, success, getPathParam } from '@/lib/core';
import { getDevice } from '@/lib/sonos/sonosProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sonos/devices/[uid]
 * Returns detailed information for a single Sonos device by UID (RINCON_...).
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const uid = await getPathParam(context, 'uid');
  const data = await getDevice(uid);
  return success(data as unknown as Record<string, unknown>);
}, 'Sonos/Device/Get');
