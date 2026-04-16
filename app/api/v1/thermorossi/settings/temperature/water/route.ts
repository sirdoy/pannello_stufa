import { withAuthAndErrorHandler, withIdempotency, success, parseJsonOrThrow, HTTP_STATUS, badRequest } from '@/lib/core';
import { setWaterTemp } from '@/lib/stove/thermorossiProxy';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/thermorossi/settings/temperature/water
 * Sets the water temperature setpoint via HA proxy.
 * Body: { value: number } — range 40-80 validated by proxy (422 on out-of-range)
 * Protected: Requires Auth0 authentication
 * Idempotent: Returns cached response for duplicate Idempotency-Key
 */
export const POST = withAuthAndErrorHandler(
  withIdempotency(async (request) => {
    const body = await parseJsonOrThrow(request);
    const value = body['value'];

    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return badRequest('value must be a finite number');
    }

    const data = await setWaterTemp(value);

    return success(data as unknown as Record<string, unknown>, null, HTTP_STATUS.ACCEPTED);
  }),
  'Stove/SetWaterTemperature'
);
