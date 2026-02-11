import { withAuthAndErrorHandler, success, parseJson } from '@/lib/core';
import { validateIgniteInput } from '@/lib/validators';
import { getStoveService } from '@/lib/services/StoveService';
import { logAnalyticsEvent } from '@/lib/analyticsEventLogger';

/**
 * POST /api/stove/ignite
 * Ignites the stove
 * Supports sandbox mode in localhost
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request) => {
  const body = await parseJson(request);
  const { power, source } = validateIgniteInput(body);

  const stoveService = getStoveService();
  const result = await stoveService.ignite(power, source);

  // Analytics: log stove ignite event (fire-and-forget, consent-gated)
  const consent = request.headers.get('x-analytics-consent');
  if (consent === 'granted') {
    logAnalyticsEvent({
      eventType: 'stove_ignite',
      powerLevel: power,
      source: source ?? 'manual',
    }).catch(() => {}); // Fire-and-forget
  }

  return success(result as Record<string, unknown>);
}, 'Stove/Ignite');
