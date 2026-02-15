import { withAuthAndErrorHandler, success } from '@/lib/core';
import { fritzboxClient } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

/**
 * GET /api/fritzbox/health
 * Checks HomeAssistant Network API connectivity
 * Protected: Requires Auth0 authentication
 *
 * Success: { status: 'connected', providers: {...} }
 * Errors:
 *   - 504 FRITZBOX_TIMEOUT: API unreachable
 *   - 500 FRITZBOX_NOT_CONFIGURED: Missing environment variables
 */
export const GET = withAuthAndErrorHandler(async () => {
  // No rate limit check on health (lightweight, no data fetch)
  // No cache (always check real connectivity)
  const healthData = (await fritzboxClient.ping()) as {
    status: string;
    cache_age_seconds: number | null;
    providers: Record<string, string>;
  };

  return success({
    status: healthData.status === 'ok' ? 'connected' : 'degraded',
    providers: healthData.providers,
    cacheAge: healthData.cache_age_seconds,
  });
}, 'FritzBox/Health');
