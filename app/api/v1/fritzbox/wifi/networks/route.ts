import { withAuthAndErrorHandler, success } from '@/lib/core';
import { fritzboxClient } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/fritzbox/wifi/networks
 * Returns configured WiFi networks (SSIDs) with enabled/disabled status.
 * Raw pass-through from HA proxy — no field transformation.
 * Protected: Requires an authenticated session
 *
 * Success: { networks: { networks, is_stale, fetched_at } }
 * Errors:
 *   - All health endpoint errors (403, 504, 500)
 */
export const GET = withAuthAndErrorHandler(async () => {
  const networks = await fritzboxClient.getWifiNetworks();
  return success({ networks });
}, 'FritzBox/WiFiNetworks');
