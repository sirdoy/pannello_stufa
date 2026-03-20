import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getHistory } from '@/lib/hue/hueProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/hue/history
 * Returns paginated Hue light state history from the HA proxy.
 * Query params forwarded: from, to, light_id, page, page_size
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async (request) => {
  const { searchParams } = request.nextUrl;
  const params = searchParams.size > 0
    ? new URLSearchParams(searchParams.toString())
    : undefined;
  const data = await getHistory(params);
  return success(data as unknown as Record<string, unknown>);
}, 'Hue/History');
