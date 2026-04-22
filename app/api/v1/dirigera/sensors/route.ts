import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getSensors } from '@/lib/dirigera/dirigeraProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/dirigera/sensors
 * Returns all DIRIGERA sensors (contact + motion) with metadata.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getSensors();
  return success({ sensors: data.sensors, count: data.count, is_stale: data.is_stale });
}, 'Dirigera/Sensors');
