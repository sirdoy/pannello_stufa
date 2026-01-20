/**
 * API Route: Test Notifica Push
 *
 * POST /api/notifications/test
 *
 * Invia una notifica di test all'utente autenticato
 */

import {
  withAuthAndErrorHandler,
  success,
  badRequest,
} from '@/lib/core';
import { sendNotificationToUser } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/notifications/test
 * Send a test notification to authenticated user
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request, context, session) => {
  const user = session.user;

  // Build test notification
  const notification = {
    title: 'Notifica di Test',
    body: 'Se vedi questo messaggio, le notifiche funzionano correttamente!',
    icon: '/icons/icon-192.png',
    priority: 'normal',
    data: {
      type: 'test',
      url: '/settings/notifications',
      timestamp: new Date().toISOString(),
    },
  };

  // Send notification
  const result = await sendNotificationToUser(user.sub, notification);

  if (result.success) {
    return success({
      message: 'Notifica di test inviata',
      sentTo: result.successCount,
      failed: result.failureCount,
    });
  } else {
    return badRequest(result.message || 'Impossibile inviare notifica');
  }
}, 'Notifications/Test');
