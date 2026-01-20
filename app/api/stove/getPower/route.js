import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getPowerLevel } from '@/lib/stoveApi';

/**
 * GET /api/stove/getPower
 * Returns the current power level
 * Supports sandbox mode in localhost
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getPowerLevel();
  return success(data);
}, 'Stove/GetPower');
