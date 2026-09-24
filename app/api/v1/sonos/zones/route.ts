/**
 * API Route: Sonos Zones List
 *
 * GET /api/v1/sonos/zones
 *
 * Returns the list of zones (speaker groups) from the HA proxy.
 * Response envelope: { success: true, zones: SonosZoneResponse[], count, is_stale, fetched_at, data_freshness }
 *
 * Protected: Requires Auth0 authentication
 */

import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getZones } from '@/lib/sonos/sonosProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  // HA proxy returns `{ zones, count, is_stale, fetched_at, data_freshness }`: spread it
  // so clients read `body.zones` as the array (wrapping it again nested the object).
  const { zones, ...rest } = await getZones();
  return success({ zones, ...rest });
}, 'Sonos/Zones');
