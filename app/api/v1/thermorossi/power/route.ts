import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getPower } from '@/lib/stove/thermorossiProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/thermorossi/power
 * Returns current power level from the HA proxy.
 * Protected: Requires an authenticated session
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getPower();
  return success(data as unknown as Record<string, unknown>);
}, 'Stove/GetPower');
