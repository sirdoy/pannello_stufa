import { withAuthAndErrorHandler, withIdempotency, success, parseJson } from '@/lib/core';
import { sendIgnit } from '@/lib/stove/thermorossiProxy';
import { logAnalyticsEvent } from '@/lib/analytics/analyticsEventLogger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/stove/ignite
 * Ignites the stove via HA proxy.
 * Protected: Requires Auth0 authentication
 * Idempotent: Returns cached response for duplicate Idempotency-Key
 */
export const POST = withAuthAndErrorHandler(
  withIdempotency(async (request) => {
    const body = await parseJson(request);
    const source = (body?.['source'] as string) ?? 'manual';

    const data = await sendIgnit();

    // Analytics: log stove ignite event (fire-and-forget, consent-gated)
    const consent = request.headers.get('x-analytics-consent');
    if (consent === 'granted') {
      logAnalyticsEvent({
        eventType: 'stove_ignite',
        source,
      }).catch(() => {}); // Fire-and-forget
    }

    return success(data as unknown as Record<string, unknown>, null, 202);
  }),
  'Stove/Ignite'
);
