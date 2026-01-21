/**
 * API Route: Unregister FCM Token
 *
 * DELETE /api/notifications/unregister
 *
 * Rimuove tutti i token FCM dell'utente autenticato (disattiva notifiche)
 */

import {
  withAuthAndErrorHandler,
  success,
} from '@/lib/core';
import { adminDbRemove, adminDbGet } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/notifications/unregister
 * Remove all FCM tokens for authenticated user
 * Protected: Requires Auth0 authentication
 */
export const DELETE = withAuthAndErrorHandler(async (request, context, session) => {
  const userId = session.user.sub;

  // Rimuovi tutti i token dell'utente
  await adminDbRemove(`users/${userId}/fcmTokens`);

  console.log(`FCM tokens rimossi per user ${userId}`);

  return success({
    message: 'Notifiche disattivate con successo',
  });
}, 'Notifications/Unregister');
