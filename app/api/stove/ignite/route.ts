import { withAuthAndErrorHandler, withIdempotency, success, parseJson } from '@/lib/core';
import { sendIgnit } from '@/lib/stove/thermorossiProxy';

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
    void (body?.['source'] as string | undefined); // source param reserved for future use

    const data = await sendIgnit();

    return success(data as unknown as Record<string, unknown>, null, 202);
  }),
  'Stove/Ignite'
);
