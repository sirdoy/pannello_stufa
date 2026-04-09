/**
 * API Route: Hue Bridge Health
 *
 * GET /api/v1/hue/health
 *
 * Returns current health data from the Hue proxy, including:
 * - Provider status (ok/degraded)
 * - Data freshness (LIVE/STALE)
 * - Last poll timestamp
 *
 * Protected: Requires Auth0 authentication
 */

import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getHealth } from '@/lib/hue/hueProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/hue/health
 * Returns proxy health data for dashboard and diagnostics.
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getHealth();
  return success(data as unknown as Record<string, unknown>);
}, 'Hue/Health');
