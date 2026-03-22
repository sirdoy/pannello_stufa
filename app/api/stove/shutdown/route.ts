import { withAuthAndErrorHandler, withIdempotency, success, parseJson, HTTP_STATUS } from '@/lib/core';
import { sendShutdown } from '@/lib/stove/thermorossiProxy';

export const dynamic = 'force-dynamic';

/**
 * POST /api/stove/shutdown
 * Shuts down the stove via HA proxy.
 * Protected: Requires Auth0 authentication
 * Idempotent: Returns cached response for duplicate Idempotency-Key
 */
export const POST = withAuthAndErrorHandler(
  withIdempotency(async (request) => {
    const body = await parseJson(request);
    void (body?.['source'] as string | undefined); // source param reserved for future use

    const data = await sendShutdown();

    return success(data as unknown as Record<string, unknown>, null, HTTP_STATUS.ACCEPTED);
  }),
  'Stove/Shutdown'
);
