import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getProxyValves } from '@/lib/netatmoProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/netatmo/valves
 * Returns valve status (battery, signal, reachability, calibrating) from proxy.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getProxyValves();
  return success(data as unknown as Record<string, unknown>);
}, 'Netatmo/Valves');
