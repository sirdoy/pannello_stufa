import { withAuthAndErrorHandler, success } from '@/lib/core';
import { fritzboxClient } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/fritzbox/budget-stats
 * Returns data budget consumption statistics from Fritz!Box.
 * Raw pass-through from HA proxy — no field transformation.
 * Protected: Requires an authenticated session
 *
 * No query params (per D-08).
 *
 * Success: { stats: { window_seconds, utilization_percent, status, ... } }
 */
export const GET = withAuthAndErrorHandler(async () => {
  const stats = await fritzboxClient.getBudgetStats();
  return success({ stats });
}, 'FritzBox/BudgetStats');
