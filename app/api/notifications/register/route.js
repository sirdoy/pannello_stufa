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
 * Sanitize FCM token for use as Firebase key
 * Firebase paths cannot contain: . $ # [ ] /
 * FCM tokens often contain colons and other special characters
 */
function sanitizeFirebaseKey(token) {
  return token
    .replace(/\./g, '_DOT_')
    .replace(/\$/g, '_DOL_')
    .replace(/#/g, '_HSH_')
    .replace(/\[/g, '_LBR_')
    .replace(/\]/g, '_RBR_')
    .replace(/\//g, '_SLS_');
}

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

  const tokenKey = sanitizeFirebaseKey(token);
  await adminDbSet(`users/${userId}/fcmTokens/${tokenKey}`, tokenData);

  console.log(`FCM token registrato per user ${userId}`);

  return success({
    message: 'Token FCM registrato con successo',
    token,
  });
}, 'Notifications/Register');
