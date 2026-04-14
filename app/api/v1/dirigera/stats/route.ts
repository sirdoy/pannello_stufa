import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getStats } from '@/lib/dirigera/dirigeraProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/dirigera/stats
 * Returns DIRIGERA aggregation and retention statistics from the HA proxy.
 * Protected: Requires Auth0 authentication.
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getStats();
  return success(data as unknown as Record<string, unknown>);
}, 'Dirigera/Stats');
