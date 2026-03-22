import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getStatus } from '@/lib/stove/thermorossiProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stove/status
 * Returns combined stove telemetry from the HA proxy.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getStatus();
  return success(data as unknown as Record<string, unknown>);
}, 'Stove/Status');
