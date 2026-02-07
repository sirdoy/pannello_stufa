import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getFanLevel } from '@/lib/stoveApi';

/**
 * GET /api/stove/getFan
 * Returns the current fan level
 * Supports sandbox mode in localhost
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getFanLevel();
  return success(data as unknown as Record<string, unknown>);
}, 'Stove/GetFan');
