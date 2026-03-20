import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getHealth } from '@/lib/hue/hueProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/hue/status
 * Returns Hue Bridge connectivity status and cache freshness from the HA proxy.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getHealth();
  return success(data as unknown as Record<string, unknown>);
}, 'Hue/Status');
