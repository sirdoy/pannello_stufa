import { withAuthAndErrorHandler, success } from '@/lib/core';
import { automationsProxy } from '@/lib/automations';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/automations/sensors
 * Sensors a condition can read, with device name and current value. Requires authentication.
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await automationsProxy.getSensors();
  return success(data as unknown as Record<string, unknown>);
}, 'Automations/Sensors');
