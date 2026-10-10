import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getErrorEvents } from '@/lib/stove/thermorossiProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/thermorossi/errors
 * Returns the alarm episodes of the stove (newest first) from the HA proxy.
 * Query params forwarded: limit, offset
 * Protected: Requires an authenticated session
 */
export const GET = withAuthAndErrorHandler(async (request) => {
  const { searchParams } = request.nextUrl;
  const params = searchParams.size > 0
    ? new URLSearchParams(searchParams.toString())
    : undefined;

  const data = await getErrorEvents(params);

  return success(data as unknown as Record<string, unknown>);
}, 'Stove/Errors');
