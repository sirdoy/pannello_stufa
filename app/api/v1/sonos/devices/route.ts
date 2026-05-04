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
  // HA proxy returns `{ speakers, count, is_stale, fetched_at }`. Surface a
  // flat `{ success, devices, count, is_stale, fetched_at }` envelope so client
  // code can read `data.devices` as the speaker array (renamed from upstream
  // `speakers` to keep the existing client contract intact).
  const { speakers, ...rest } = await getDevices();
  return success({ devices: speakers, ...rest });
}, 'Sonos/Devices');
