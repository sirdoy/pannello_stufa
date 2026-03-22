/**
 * API Route: Netatmo Proxy Health
 *
 * GET /api/netatmo/health
 *
 * Returns current health data from the Netatmo proxy, including:
 * - Token status and expiry
 * - Provider status (ok/degraded/down)
 * - Data freshness
 * - Rate limit usage
 * - Consecutive failure count
 *
 * Protected: Requires Auth0 authentication
 */

import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getProxyHealth } from '@/lib/netatmo/netatmoProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/netatmo/health
 * Returns proxy health data for dashboard and diagnostics.
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getProxyHealth();
  return success(data as unknown as Record<string, unknown>);
}, 'Netatmo/Health');
