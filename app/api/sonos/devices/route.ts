import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getDevices } from '@/lib/sonos/sonosProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sonos/devices
 * Returns all discovered Sonos devices wrapped in { devices: [...] }.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getDevices();
  return success({ devices: data });
}, 'Sonos/Devices');
