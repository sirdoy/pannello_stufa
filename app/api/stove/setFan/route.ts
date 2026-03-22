import { withAuthAndErrorHandler, withIdempotency, success, parseJsonOrThrow, HTTP_STATUS } from '@/lib/core';
import { setFan } from '@/lib/stove/thermorossiProxy';

export const dynamic = 'force-dynamic';

/**
 * POST /api/stove/setFan
 * Sets the fan level via HA proxy.
 * Body: { value: number }
 * Protected: Requires Auth0 authentication
 * Idempotent: Returns cached response for duplicate Idempotency-Key
 */
export const POST = withAuthAndErrorHandler(
  withIdempotency(async (request) => {
    const body = await parseJsonOrThrow(request);
    const value = body['value'] as number;

    const data = await setFan(value);

    return success(data as unknown as Record<string, unknown>, null, HTTP_STATUS.ACCEPTED);
  }),
  'Stove/SetFan'
);
