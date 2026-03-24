import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getMotionSensors } from '@/lib/dirigera/dirigeraProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dirigera/sensors/motion
 * Returns motion/occupancy sensors only, with light_level and data_freshness.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getMotionSensors();
  return success({ sensors: data.sensors, count: data.count, is_stale: data.is_stale });
}, 'Dirigera/SensorsMotion');
