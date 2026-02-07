import { withAuthAndErrorHandler, success, requireNetatmoToken } from '@/lib/core';
import NETATMO_API from '@/lib/netatmoApi';

export const dynamic = 'force-dynamic';

/**
 * GET /api/netatmo/devices
 * Retrieves list of all Netatmo devices
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const accessToken = await requireNetatmoToken();
  const devices = await NETATMO_API.getDeviceList(accessToken);
  return success({ devices });
}, 'Netatmo/Devices');
