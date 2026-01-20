/**
 * API Route: Invia Notifica Push Generica
 *
 * POST /api/notifications/send
 *
 * Endpoint interno per inviare notifiche push a utenti specifici
 * Protetto con ADMIN_SECRET per prevenire abusi
 *
 * Body:
 * {
 *   userId: "auth0|xxx",              // User ID destinatario
 *   notification: {
 *     title: "Titolo",
 *     body: "Messaggio",
 *     icon: "/icons/icon.png",       // opzionale
 *     priority: "high|normal",        // opzionale
 *     data: { ... }                   // opzionale
 *   }
 * }
 */

import {
  withAuthAndErrorHandler,
  success,
  badRequest,
  forbidden,
  parseJsonOrThrow,
  validateRequired,
} from '@/lib/core';
import { sendNotificationToUser } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/notifications/send
 * Send push notification to a user
 * Protected: Requires Auth0 authentication + admin or self
 */
export const POST = withAuthAndErrorHandler(async (request, context, session) => {
  const user = session.user;

  // Check admin secret from header or body
  const adminSecret = request.headers.get('x-admin-secret');
  const body = await parseJsonOrThrow(request);
  const bodySecret = body.adminSecret;

  const isAdmin = adminSecret === process.env.ADMIN_SECRET ||
                  bodySecret === process.env.ADMIN_SECRET;

  // If not admin, verify user is sending notification to themselves
  if (!isAdmin && user.sub !== body.userId) {
    return forbidden('Non autorizzato');
  }

  const { userId, notification } = body;

  // Validate required fields
  validateRequired(userId, 'userId');
  validateRequired(notification, 'notification');
  validateRequired(notification?.title, 'notification.title');
  validateRequired(notification?.body, 'notification.body');

  // Send notification
  const result = await sendNotificationToUser(userId, notification);

  if (result.success) {
    return success({
      message: 'Notifica inviata',
      sentTo: result.successCount,
      failed: result.failureCount,
    });
  } else {
    return badRequest(result.message || 'Impossibile inviare notifica');
  }
}, 'Notifications/Send');
