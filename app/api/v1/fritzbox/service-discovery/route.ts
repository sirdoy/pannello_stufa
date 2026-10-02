import { withAuthAndErrorHandler, success } from '@/lib/core';
import { fritzboxClient } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/fritzbox/service-discovery
 * Returns TR-064 service discovery data from Fritz!Box, parsed as JSON.
 * The HA proxy may return XML or JSON; the client function handles both.
 * Protected: Requires an authenticated session
 *
 * Success: { discovery: { services: [{ name, type, url }] } }
 * Errors:
 *   - All health endpoint errors (403, 504, 500)
 */
export const GET = withAuthAndErrorHandler(async () => {
  const discovery = await fritzboxClient.getServiceDiscovery();
  return success({ discovery });
}, 'FritzBox/ServiceDiscovery');
