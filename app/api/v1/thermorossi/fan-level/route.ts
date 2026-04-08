import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getFan } from '@/lib/stove/thermorossiProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/thermorossi/fan-level
 * Returns current fan level from the HA proxy.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getFan();
  return success(data as unknown as Record<string, unknown>);
}, 'Stove/GetFan');
