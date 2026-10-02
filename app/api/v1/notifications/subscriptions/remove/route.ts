import { withAuthAndErrorHandler, badRequest, noContent, parseJson } from '@/lib/core';
import { removeSubscriptionByEndpoint } from '@/lib/push/notificationsProxy';
import { endpointBody } from '@/lib/push/notificationsRequestSchemas';
import { zodMessage } from '@/lib/stove/schedulerRequestSchemas';

export const dynamic = 'force-dynamic';

/** POST /api/v1/notifications/subscriptions/remove — stop pushes to this device (idempotent). */
export const POST = withAuthAndErrorHandler(async (request) => {
  const parsed = endpointBody.safeParse(await parseJson(request));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  await removeSubscriptionByEndpoint(parsed.data.endpoint);
  return noContent();
}, 'Notifications/Unsubscribe');
