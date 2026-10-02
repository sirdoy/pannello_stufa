import { withAuthAndErrorHandler, success, badRequest, parseJson } from '@/lib/core';
import { listSubscriptions, subscribe } from '@/lib/push/notificationsProxy';
import { subscribeBody } from '@/lib/push/notificationsRequestSchemas';
import { zodMessage } from '@/lib/stove/schedulerRequestSchemas';

export const dynamic = 'force-dynamic';

/** GET /api/v1/notifications/subscriptions — devices receiving pushes. */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await listSubscriptions();
  return success(data as unknown as Record<string, unknown>);
}, 'Notifications/ListSubscriptions');

/** POST /api/v1/notifications/subscriptions — register/refresh this device (upsert by endpoint). */
export const POST = withAuthAndErrorHandler(async (request, _context, session) => {
  const parsed = subscribeBody.safeParse(await parseJson(request));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  const data = await subscribe({ ...parsed.data, user_id: session.user.sub });
  return success(data as unknown as Record<string, unknown>);
}, 'Notifications/Subscribe');
