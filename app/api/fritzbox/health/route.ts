import { withAuthAndErrorHandler, success } from '@/lib/core';
import { fritzboxClient } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

/**
 * GET /api/fritzbox/health
 * Checks Fritz!Box TR-064 API connectivity
 * Protected: Requires Auth0 authentication
 *
 * Success: { status: 'connected', tr064Enabled: true }
 * Errors:
 *   - 403 TR064_NOT_ENABLED: TR-064 API disabled, returns setup guide
 *   - 504 FRITZBOX_TIMEOUT: Fritz!Box unreachable
 *   - 500 FRITZBOX_NOT_CONFIGURED: Missing environment variables
 */
export const GET = withAuthAndErrorHandler(async () => {
  // No rate limit check on health (lightweight, no data fetch)
  // No cache (always check real connectivity)
  // Call fritzboxClient.ping() (10s timeout)
  await fritzboxClient.ping();

  // On success: return connection status
  return success({ status: 'connected', tr064Enabled: true });
}, 'FritzBox/Health');
