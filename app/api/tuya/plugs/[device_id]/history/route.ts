import { withAuthAndErrorHandler, success, getPathParam } from '@/lib/core';
import { getHistory } from '@/lib/tuya/tuyaProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tuya/plugs/[device_id]/history
 * Returns paginated energy history with auto-granularity.
 * Query params: period, from, to, page, page_size
 * Protected: Requires Auth0 authentication.
 */
export const GET = withAuthAndErrorHandler(async (request, context) => {
  const deviceId = await getPathParam(context, 'device_id');
  const { searchParams } = request.nextUrl;
  const data = await getHistory(deviceId, {
    period:    searchParams.get('period')    ?? undefined,
    from:      searchParams.get('from')      ?? undefined,
    to:        searchParams.get('to')        ?? undefined,
    page:      searchParams.get('page')      ?? undefined,
    page_size: searchParams.get('page_size') ?? undefined,
  });
  return success(data as unknown as Record<string, unknown>);
}, 'Tuya/Plugs/History');
