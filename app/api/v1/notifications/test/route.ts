import { withAuthAndErrorHandler, success, badRequest, parseJson } from '@/lib/core';
import { sendTestPush } from '@/lib/push/notificationsProxy';
import { testBody } from '@/lib/push/notificationsRequestSchemas';
import { zodMessage } from '@/lib/stove/schedulerRequestSchemas';

export const dynamic = 'force-dynamic';

/** POST /api/v1/notifications/test — test push to one device (`subscription_id`) or all. */
export const POST = withAuthAndErrorHandler(async (request) => {
  const parsed = testBody.safeParse((await parseJson(request)) ?? {});
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  const data = await sendTestPush(parsed.data.subscription_id);
  return success(data as unknown as Record<string, unknown>);
}, 'Notifications/Test');
