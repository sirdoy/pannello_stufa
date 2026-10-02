import { withAuthAndErrorHandler, success, badRequest } from '@/lib/core';
import { getPushHistory } from '@/lib/push/notificationsProxy';
import { historyQuery } from '@/lib/push/notificationsRequestSchemas';
import { zodMessage } from '@/lib/stove/schedulerRequestSchemas';

export const dynamic = 'force-dynamic';

/** GET /api/v1/notifications/history — notifications sent in the last 90 days. */
export const GET = withAuthAndErrorHandler(async (request) => {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = historyQuery.safeParse(params);
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  const data = await getPushHistory(parsed.data.limit, parsed.data.offset);
  return success(data as unknown as Record<string, unknown>);
}, 'Notifications/History');
