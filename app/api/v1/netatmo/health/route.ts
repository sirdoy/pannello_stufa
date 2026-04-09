/**
 * API Route: Netatmo Health
 *
 * GET /api/v1/netatmo/health
 *
 * Returns health status of the Netatmo proxy (token lifecycle, rate limits, freshness).
 *
 * Protected: Requires Auth0 authentication
 */

import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getProxyHealth } from '@/lib/netatmo/netatmoProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await getProxyHealth();
  return success(data as unknown as Record<string, unknown>);
}, 'Netatmo/Health');
