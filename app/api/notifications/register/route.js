/**
 * API Route: Register FCM Token
 *
 * POST /api/notifications/register
 *
 * Registra un FCM token per l'utente autenticato
 * Usato quando l'utente concede permessi notifiche
 *
 * Body:
 * {
 *   token: "FCM_TOKEN_STRING",
 *   userAgent: "Mozilla/5.0...",    // opzionale
 *   platform: "ios|other",           // opzionale
 *   isPWA: true|false                // opzionale
 * }
 */

import {
  withAuthAndErrorHandler,
  success,
  parseJsonOrThrow,
  validateRequired,
} from '@/lib/core';
import { adminDbSet } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/notifications/register
 * Register FCM token for user
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request, context, session) => {
  const userId = session.user.sub;
  const body = await parseJsonOrThrow(request);
  const { token, userAgent, platform, isPWA } = body;

  // Validate required field
  validateRequired(token, 'token');

  // Save token to Firebase with metadata using Admin SDK
  const tokenData = {
    token,
    createdAt: new Date().toISOString(),
    lastUsed: new Date().toISOString(),
    userAgent: userAgent || 'unknown',
    platform: platform || 'other',
    isPWA: isPWA || false,
  };

  await adminDbSet(`users/${userId}/fcmTokens/${token}`, tokenData);

  console.log(`FCM token registrato per user ${userId}`);

  return success({
    message: 'Token FCM registrato con successo',
    token,
  });
}, 'Notifications/Register');
