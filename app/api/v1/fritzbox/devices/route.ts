import { withAuthAndErrorHandler, success } from '@/lib/core';
import { fritzboxClient } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/fritzbox/devices
 * Retrieves network device list from Fritz!Box
 * Protected: Requires an authenticated session
 *
 * Device event tracking (connected/disconnected) is now handled by the HA proxy,
 * not by Firebase-based state comparison. See /api/v1/fritzbox/history for events.
 *
 * Success: { devices: [...] }
 * Errors:
 *   - All health endpoint errors (403, 504, 500)
 */
export const GET = withAuthAndErrorHandler(async () => {
  const devices = await fritzboxClient.getDevices();
  return success({ devices });
}, 'FritzBox/Devices');
