import { withAuthAndErrorHandler, success } from '@/lib/core';
import { fritzboxClient } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/fritzbox/network/upnp
 * Returns UPnP status from Fritz!Box as a flat object.
 * NOT paginated — returns { enabled, upnp_ports[], is_stale, fetched_at }.
 * Protected: Requires an authenticated session
 *
 * Success: { upnp: { enabled, upnp_ports, is_stale, fetched_at } }
 * Errors:
 *   - All health endpoint errors (403, 504, 500)
 */
export const GET = withAuthAndErrorHandler(async () => {
  const upnp = await fritzboxClient.getUpnpStatus();
  return success({ upnp });
}, 'FritzBox/UPnP');
