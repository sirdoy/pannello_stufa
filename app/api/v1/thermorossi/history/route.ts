import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getHistory } from '@/lib/stove/thermorossiProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/thermorossi/history
 * Returns paginated stove telemetry history from the HA proxy.
 * Query params forwarded: start, end, scale, limit, offset
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async (request) => {
  const { searchParams } = request.nextUrl;
  const params = searchParams.size > 0
    ? new URLSearchParams(searchParams.toString())
    : undefined;

  const data = await getHistory(params);

  return success(data as unknown as Record<string, unknown>);
}, 'Stove/History');
