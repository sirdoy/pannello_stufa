import { withAuthAndErrorHandler, success, parseJson } from '@/lib/core';
import { validateShutdownInput } from '@/lib/validators';
import { getStoveService } from '@/lib/services/StoveService';
import { logAnalyticsEvent } from '@/lib/analyticsEventLogger';

/**
 * POST /api/stove/shutdown
 * Shuts down the stove
 * Supports sandbox mode in localhost
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request) => {
  const body = await parseJson(request);
  const { source } = validateShutdownInput(body);

  const stoveService = getStoveService();
  const result = await stoveService.shutdown(source);

  // Analytics: log stove shutdown event (fire-and-forget, consent-gated)
  const consent = request.headers.get('x-analytics-consent');
  if (consent === 'granted') {
    logAnalyticsEvent({
      eventType: 'stove_shutdown',
      source: source ?? 'manual',
    }).catch(() => {}); // Fire-and-forget
  }

  return success(result as Record<string, unknown>);
}, 'Stove/Shutdown');
