/**
 * API Route: Thermorossi Proxy Health
 *
 * GET /api/stove/health
 *
 * Returns current health data from the Thermorossi proxy, including:
 * - Provider status (ok/degraded)
 * - Data freshness (LIVE/STALE)
 * - Last poll timestamp
 *
 * Protected: Requires Auth0 authentication
 */

import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getHealth } from '@/lib/thermorossiProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stove/health
 * Returns proxy health data for dashboard and diagnostics.
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getHealth();
  return success(data as unknown as Record<string, unknown>);
}, 'Stove/Health');
