import { withAuthAndErrorHandler, success, parseJsonOrThrow } from '@/lib/core';
import { validateSetPowerInput } from '@/lib/validators';
import { getStoveService } from '@/lib/services/StoveService';
import { logAnalyticsEvent } from '@/lib/analyticsEventLogger';

/**
 * POST /api/stove/setPower
 * Sets the power level
 * Supports sandbox mode in localhost
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request) => {
  const body = await parseJsonOrThrow(request);
  const { level, source } = validateSetPowerInput(body);

  const stoveService = getStoveService();
  const result = await stoveService.setPower(level, source);

  // Analytics: log power change event (fire-and-forget, consent-gated)
  const consent = request.headers.get('x-analytics-consent');
  if (consent === 'granted') {
    logAnalyticsEvent({
      eventType: 'power_change',
      powerLevel: level,
      source: source ?? 'manual',
    }).catch(() => {}); // Fire-and-forget
  }

  // Maintain backward-compatible response format
  if (result.modeChanged) {
    return success({
      ...result,
      newMode: 'semi-manual',
    });
  }

  return success(result);
}, 'Stove/SetPower');
