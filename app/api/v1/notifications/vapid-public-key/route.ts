import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getVapidPublicKey } from '@/lib/push/notificationsProxy';

export const dynamic = 'force-dynamic';

/** GET /api/v1/notifications/vapid-public-key — applicationServerKey for pushManager.subscribe(). */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getVapidPublicKey();
  return success(data);
}, 'Notifications/VapidKey');
