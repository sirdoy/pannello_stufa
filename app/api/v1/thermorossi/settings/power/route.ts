import { withAuthAndErrorHandler, withIdempotency, success, parseJsonOrThrow, HTTP_STATUS, badRequest } from '@/lib/core';
import { setPower } from '@/lib/stove/thermorossiProxy';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/thermorossi/settings/power
 * Sets the power level via HA proxy.
 * Body: { value: number }
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

    const data = await setPower(value);

    return success(data as unknown as Record<string, unknown>, null, HTTP_STATUS.ACCEPTED);
  }),
  'Stove/SetPower'
);
