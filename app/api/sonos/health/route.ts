import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getHealth } from '@/lib/sonos/sonosProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sonos/health
 * Returns Sonos proxy health status and data freshness.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getHealth();
  return success(data as unknown as Record<string, unknown>);
}, 'Sonos/Health');
