import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getContactSensors } from '@/lib/dirigera/dirigeraProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dirigera/sensors/contact
 * Returns contact (open/close) sensors only, with per-sensor data_freshness.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getContactSensors();
  return success({ sensors: data.sensors, count: data.count, is_stale: data.is_stale });
}, 'Dirigera/SensorsContact');
