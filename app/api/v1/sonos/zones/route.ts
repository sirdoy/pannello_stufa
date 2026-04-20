/**
 * API Route: Sonos Zones List
 *
 * GET /api/v1/sonos/zones
 *
 * Returns the list of zones (speaker groups) from the HA proxy.
 * Response envelope: { success: true, data: { zones: SonosZoneResponse[] } }
 *
 * Protected: Requires Auth0 authentication
 */

import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getZones } from '@/lib/sonos/sonosProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await getZones();
  return success({ zones: data });
}, 'Sonos/Zones');
