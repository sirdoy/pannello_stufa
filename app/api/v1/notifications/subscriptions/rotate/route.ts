import { withErrorHandler, success, badRequest, parseJson } from '@/lib/core';
import { rotateSubscription } from '@/lib/push/notificationsProxy';
import { rotateBody } from '@/lib/push/notificationsRequestSchemas';
import { zodMessage } from '@/lib/stove/schedulerRequestSchemas';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/notifications/subscriptions/rotate — subscription renewed by the browser.
 *
 * Public (no session, see middleware PUBLIC_PATHS): the service worker calls it on
 * `pushsubscriptionchange`, also while the user is logged out. The backend only
 * accepts an `old_endpoint` it already knows (secret URL), 404 otherwise.
 */
export const POST = withErrorHandler(async (request) => {
  const parsed = rotateBody.safeParse(await parseJson(request));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  const data = await rotateSubscription(parsed.data);
  return success(data as unknown as Record<string, unknown>);
}, 'Notifications/Rotate');
