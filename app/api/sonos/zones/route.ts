import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getZones } from '@/lib/sonos/sonosProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sonos/zones
 * Returns all Sonos zone groups wrapped in { zones: [...] }.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getZones();
  return success({ zones: data });
}, 'Sonos/Zones');
