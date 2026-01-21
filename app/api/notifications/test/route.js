/**
 * API Route: Test Notifica Push
 *
 * POST /api/notifications/test
 *
 * Invia una notifica di test all'utente autenticato
 *
 * Body (optional):
 * {
 *   deviceToken: "FCM_TOKEN_STRING"  // Se fornito, invia solo a questo dispositivo
 * }
 */

import {
  withAuthAndErrorHandler,
  success,
  badRequest,
  parseJson,
} from '@/lib/core';
import { sendNotificationToUser, sendPushNotification } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/notifications/test
 * Send a test notification to authenticated user
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request, context, session) => {
  const user = session.user;

  // Parse optional body (empty object if no body)
  const body = await parseJson(request, {});
  const deviceToken = body?.deviceToken;

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

  // Send notification - to specific device if token provided, otherwise to all user devices
  let result;
  if (deviceToken) {
    // Send only to the specified device
    result = await sendPushNotification(deviceToken, notification);
  } else {
    // Fallback: send to all user devices
    result = await sendNotificationToUser(user.sub, notification);
  }

  if (result.success) {
    return success({
      message: 'Notifica di test inviata',
      sentTo: result.successCount,
      failed: result.failureCount,
    });
  } else {
    // Restituisci errore strutturato per gestione UI
    return badRequest(result.message || 'Impossibile inviare notifica', {
      errorCode: result.error || 'SEND_FAILED',
    });
  }
}, 'Notifications/Test');
