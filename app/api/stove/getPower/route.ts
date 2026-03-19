import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getPower } from '@/lib/thermorossiProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stove/getPower
 * Returns current power level from the HA proxy.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getPower();
  return success(data as unknown as Record<string, unknown>);
}, 'Stove/GetPower');
