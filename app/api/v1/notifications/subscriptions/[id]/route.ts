import { withAuthAndErrorHandler, badRequest, noContent } from '@/lib/core';
import { deleteSubscription } from '@/lib/push/notificationsProxy';
import { parseId } from '@/lib/stove/schedulerRequestSchemas';

export const dynamic = 'force-dynamic';

/** DELETE /api/v1/notifications/subscriptions/[id] — remove a device from the list. */
export const DELETE = withAuthAndErrorHandler(async (_request, context) => {
  const id = parseId((await context.params)['id']);
  if (id === null) return badRequest('id non valido');
  await deleteSubscription(id);
  return noContent();
}, 'Notifications/DeleteSubscription');
