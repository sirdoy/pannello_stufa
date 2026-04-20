/**
 * API Route: Sonos Devices List
 *
 * GET /api/v1/sonos/devices
 *
 * Returns the list of known Sonos devices from the HA proxy.
 * Response envelope: { success: true, data: { devices: SonosDeviceResponse[] } }
 *
 * Protected: Requires Auth0 authentication
 */

import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getDevices } from '@/lib/sonos/sonosProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await getDevices();
  return success({ devices: data });
}, 'Sonos/Devices');
