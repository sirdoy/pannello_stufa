/**
 * API Route: Sonos Health
 *
 * GET /api/v1/sonos/health
 *
 * Returns Sonos proxy health status and data freshness.
 *
 * Protected: Requires an authenticated session
 */

import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getHealth } from '@/lib/sonos/sonosProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await getHealth();
  return success(data as unknown as Record<string, unknown>);
}, 'Sonos/Health');
