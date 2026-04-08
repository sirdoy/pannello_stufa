import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getFan } from '@/lib/stove/thermorossiProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stove/getFan
 * Returns current fan level from the HA proxy.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getFan();
  return success(data as unknown as Record<string, unknown>);
}, 'Stove/GetFan');
