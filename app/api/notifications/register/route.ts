/**
 * API Route: Register FCM Token
 *
 * POST /api/notifications/register
 *
 * Registra un FCM token per l'utente autenticato.
 * Supporta multi-device con deduplicazione per deviceId.
 *
 * Body:
 * {
 *   token: "FCM_TOKEN_STRING",
 *   deviceId: "abc123...",              // Stable device identifier
 *   displayName: "Chrome on Windows",   // Human-readable name
 *   deviceInfo: { browser, os, ... },   // Full device metadata
 *   userAgent: "Mozilla/5.0...",        // Raw UA string
 *   platform: "ios|other",
 *   isPWA: true|false
 * }
 */

import {
  withAuthAndErrorHandler,
  success,
  parseJsonOrThrow,
  validateRequired,
} from '@/lib/core';
import { getAdminDatabase } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * Sanitize FCM token for use as Firebase key
 * Firebase paths cannot contain: . $ # [ ] /
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
 * Register FCM token for user with device deduplication
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request, context, session) => {
  const userId = session.user.sub;
  const body = await parseJsonOrThrow(request);
  const { token, deviceId, displayName, deviceInfo, userAgent, platform, isPWA } = body;

  // Validate required field
  validateRequired(token, 'token');

  const db = getAdminDatabase();
  const tokensRef = db.ref(`users/${userId}/fcmTokens`);
  const now = new Date().toISOString();

  // If deviceId provided, check for existing device and replace
  if (deviceId) {
    // Query for existing token with same deviceId
    const snapshot = await tokensRef
      .orderByChild('deviceId')
      .equalTo(deviceId)
      .once('value');

    if (snapshot.exists()) {
      // Device exists - update the existing entry
      const existingData = snapshot.val();
      const existingKey = Object.keys(existingData)[0];

      await tokensRef.child(existingKey).update({
        token,
        lastUsed: now,
        userAgent: userAgent || 'unknown',
        platform: platform || 'other',
        isPWA: isPWA || false,
        // Preserve createdAt from original registration
        // Update deviceInfo in case browser version changed
        deviceInfo: deviceInfo || existingData[existingKey].deviceInfo,
        displayName: displayName || existingData[existingKey].displayName,
      });

      console.log(`FCM token updated for device ${deviceId} (user ${userId})`);

      return success({
        message: 'Token FCM aggiornato con successo',
        token,
        deviceId,
        action: 'updated',
      });
    }
  }

  // New device or no deviceId provided - create new entry
  const tokenData = {
    token,
    createdAt: now,
    lastUsed: now,
    deviceId: deviceId || null,
    displayName: displayName || 'Unknown device',
    deviceInfo: deviceInfo || null,
    userAgent: userAgent || 'unknown',
    platform: platform || 'other',
    isPWA: isPWA || false,
  };

  // Use token hash as key (sanitized)
  const tokenKey = sanitizeFirebaseKey(token);
  await tokensRef.child(tokenKey).set(tokenData);

  console.log(`FCM token registrato per nuovo device ${deviceId || 'unknown'} (user ${userId})`);

  return success({
    message: 'Token FCM registrato con successo',
    token,
    deviceId,
    action: 'created',
  });
}, 'Notifications/Register');
