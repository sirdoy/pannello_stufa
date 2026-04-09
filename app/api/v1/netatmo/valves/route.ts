/**
 * API Route: Netatmo Valves
 *
 * GET /api/v1/netatmo/valves
 *
 * Returns all valve modules with battery level, RF signal, reachability, and calibration state.
 *
 * Protected: Requires Auth0 authentication
 */

import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getProxyValves } from '@/lib/netatmo/netatmoProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await getProxyValves();
  return success(data as unknown as Record<string, unknown>);
}, 'Netatmo/Valves');
