import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getSensorSummary } from '@/lib/dirigera/dirigeraProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/dirigera/sensors/summary
 * Returns fleet-wide sensor summary (total, open, offline, low battery).
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getSensorSummary();
  return success(data as unknown as Record<string, unknown>);
}, 'Dirigera/SensorsSummary');
