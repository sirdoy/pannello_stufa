import { withAuthAndErrorHandler, success } from '@/lib/core';
import { fritzboxClient } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/fritzbox/system
 * Returns Fritz!Box system info: model, firmware version, uptime.
 * Raw pass-through from HA proxy — no field transformation.
 * Protected: Requires an authenticated session
 *
 * Success: { system: { model, firmware_version, update_available, device_uptime_seconds, ... } }
 * Errors:
 *   - All health endpoint errors (403, 504, 500)
 */
export const GET = withAuthAndErrorHandler(async () => {
  const system = await fritzboxClient.getSystemInfo();
  return success({ system });
}, 'FritzBox/System');
