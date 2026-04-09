/**
 * API Route: Netatmo Homesdata
 *
 * GET /api/v1/netatmo/homesdata
 *
 * Returns home structure (rooms, modules, schedules) from the HA proxy.
 *
 * Protected: Requires Auth0 authentication
 */

import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getProxyHomesdata } from '@/lib/netatmo/netatmoProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await getProxyHomesdata();
  return success(data as unknown as Record<string, unknown>);
}, 'Netatmo/Homesdata');
