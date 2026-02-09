/**
 * Firebase Admin SDK Helper (Server-side only)
 *
 * Gestisce inizializzazione Firebase Admin, database operations e notifiche push
 *
 * IMPORTANTE:
 * - Usa SOLO in API routes e server components
 * - NON importare in client components
 * - Richiede credenziali Admin SDK in .env
 * - Admin SDK BYPASSA Firebase Security Rules
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';
import { getDatabase, Database } from 'firebase-admin/database';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { logNotification } from './notificationLogger';
import { filterNotificationByPreferences, getFilterMessage } from './notificationFilter';
import { getDefaultPreferences } from './schemas/notificationPreferences';

// Error codes that indicate token is permanently invalid
const INVALID_TOKEN_ERRORS = [
  'messaging/registration-token-not-registered',
  'messaging/invalid-argument',
  'messaging/invalid-registration-token',
];

/**
 * Inizializza Firebase Admin SDK (singleton)
 */
function initializeFirebaseAdmin(): App {
  // Se già inizializzato, return existing app
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Verifica credenziali
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin credentials mancanti. ' +
      'Configura FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, ' +
      'e FIREBASE_ADMIN_PRIVATE_KEY nel .env'
    );
  }

  // Fix newlines in private key (common issue when stored in env)
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

  // Inizializza app
  const app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: formattedPrivateKey,
    }),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });

  console.log('✅ Firebase Admin SDK inizializzato');
  return app;
}

/**
 * Get Admin Database instance
 */
export function getAdminDatabase(): Database {
  initializeFirebaseAdmin();
  return getDatabase();
}

/**
 * Get Admin Firestore instance
 */
export function getAdminFirestore(): Firestore {
  initializeFirebaseAdmin();
  return getFirestore();
}

// ============================================
// DATABASE OPERATIONS (Admin SDK)
// ============================================

/**
 * Read data from Firebase (Admin SDK)
 * @param path - Database path (es. 'maintenance' o 'users/123/fcmTokens')
 * @returns Data at path or null if not exists
 */
export async function adminDbGet(path: string): Promise<unknown> {
  const db = getAdminDatabase();
  const snapshot = await db.ref(path).once('value');
  return snapshot.val();
}

/**
 * Write data to Firebase (Admin SDK) - OVERWRITES existing data
 * @param path - Database path
 * @param data - Data to write
 */
export async function adminDbSet(path: string, data: unknown): Promise<void> {
  const db = getAdminDatabase();
  await db.ref(path).set(data);
}

/**
 * Update data in Firebase (Admin SDK) - MERGES with existing data
 * @param path - Database path
 * @param updates - Object with fields to update
 */
export async function adminDbUpdate(path: string, updates: Record<string, unknown>): Promise<void> {
  const db = getAdminDatabase();
  await db.ref(path).update(updates);
}

/**
 * Push new data to Firebase list (Admin SDK)
 * @param path - Database path
 * @param data - Data to push
 * @returns Generated key
 */
export async function adminDbPush(path: string, data: unknown): Promise<string | null> {
  const db = getAdminDatabase();
  const ref = db.ref(path).push();
  await ref.set(data);
  return ref.key;
}

/**
 * Delete data from Firebase (Admin SDK)
 * @param path - Database path
 */
export async function adminDbRemove(path: string): Promise<void> {
  const db = getAdminDatabase();
  await db.ref(path).remove();
}

/**
 * Token record from Firebase
 */
interface TokenRecord {
  token: string;
  deviceId: string;
  [key: string]: unknown;
}

/**
 * Look up deviceId for a given FCM token
 * Used to enrich error logs with device context
 *
 * @param {string} token - FCM token to look up
 * @returns {Promise<{userId: string, deviceId: string} | null>}
 */
async function lookupDeviceIdForToken(token: string): Promise<{ userId: string; deviceId: string } | null> {
  try {
    const db = getAdminDatabase();
    const usersRef = db.ref('users');
    const snapshot = await usersRef.once('value');

    if (!snapshot.exists()) return null;

    let result = null;

    snapshot.forEach(userSnap => {
      const userId = userSnap.key;
      const tokens = userSnap.child('fcmTokens').val() || {};

      Object.entries(tokens).forEach(([tokenKey, tokenData]) => {
        const typedTokenData = tokenData as TokenRecord;
        if (typedTokenData.token === token && typedTokenData.deviceId) {
          result = { userId, deviceId: typedTokenData.deviceId };
        }
      });
    });

    return result;
  } catch (error) {
    console.error('❌ Error looking up deviceId for token:', error);
    return null;
  }
}

interface ErrorData {
  token: string;
  userId?: string;
  deviceId?: string;
  errorCode?: string;
  errorMessage?: string;
  notificationType?: string;
  notificationTitle?: string;
}

/**
 * Track notification error to Firebase for diagnostics
 * Fire-and-forget pattern - does not block main send flow
 *
 * @param {Object} errorData - Error context
 * @param {string} errorData.token - FCM token that failed
 * @param {string} errorData.userId - User ID (if known)
 * @param {string} errorData.deviceId - Device ID (if known)
 * @param {string} errorData.errorCode - FCM error code
 * @param {string} errorData.errorMessage - Error message
 * @param {string} errorData.notificationType - Notification type
 * @param {string} errorData.notificationTitle - Notification title
 * @returns {Promise<string>} Push key of error log entry
 */
async function trackNotificationError(errorData: ErrorData): Promise<string | undefined> {
  try {
    const db = getAdminDatabase();

    const errorLog = {
      timestamp: new Date().toISOString(),
      userId: errorData.userId || 'unknown',
      tokenPrefix: errorData.token ? errorData.token.substring(0, 20) : 'unknown',
      deviceId: errorData.deviceId || null,
      errorCode: errorData.errorCode || 'unknown',
      errorMessage: errorData.errorMessage || '',
      notificationType: errorData.notificationType || 'unknown',
      notificationTitle: errorData.notificationTitle || '',
      resolved: false,
    };

    const pushKey = await adminDbPush('notificationErrors', errorLog);
    console.log(`📝 Tracked notification error: ${errorLog.errorCode} (${pushKey})`);
    return pushKey ?? undefined;
  } catch (error) {
    console.error('❌ Error tracking notification error:', error);
    // Don't throw - this is fire-and-forget
  }
}

/**
 * Remove an invalid FCM token from all users
 * Called when FCM returns UNREGISTERED or INVALID_ARGUMENT error
 *
 * @param {string} invalidToken - The token to remove
 */
async function removeInvalidToken(invalidToken: string): Promise<void> {
  try {
    const db = getAdminDatabase();

    // Find and remove this token from all users
    // Token is stored at users/{userId}/fcmTokens/{tokenKey}
    const usersRef = db.ref('users');
    const snapshot = await usersRef.once('value');

    if (!snapshot.exists()) return;

    const updates: Record<string, null> = {};

    snapshot.forEach(userSnap => {
      const userId = userSnap.key;
      const tokens = userSnap.child('fcmTokens').val() || {};

      Object.entries(tokens).forEach(([tokenKey, tokenData]) => {
        const typedTokenData = tokenData as TokenRecord;
        if (typedTokenData.token === invalidToken) {
          updates[`users/${userId}/fcmTokens/${tokenKey}`] = null;
          console.log(`🗑️ Removing invalid token for user ${userId}`);
        }
      });
    });

    if (Object.keys(updates).length > 0) {
      await db.ref().update(updates);
      console.log(`✅ Removed ${Object.keys(updates).length} invalid token(s)`);
    }
  } catch (error) {
    console.error('❌ Error removing invalid token:', error);
  }
}

/**
 * Run transaction on Firebase data (Admin SDK)
 * @param {string} path - Database path
 * @param {Function} updateFunction - Function(currentData) => newData
 * @returns {Promise<any>} Committed data
 */
export async function adminDbTransaction(
  path: string,
  updateFunction: (currentData: unknown) => unknown
): Promise<unknown> {
  const db = getAdminDatabase();
  const ref = db.ref(path);

  const result = await ref.transaction(updateFunction);

  if (!result.committed) {
    throw new Error('Transaction aborted');
  }

  return result.snapshot.val();
}

interface NotificationPayload {
  title?: string;
  body?: string;
  data?: Record<string, string>;
  icon?: string;
  priority?: 'high' | 'normal';
}

/**
 * Invia notifica push a uno o più dispositivi
 * Enhanced with invalid token detection and removal
 *
 * @param {string|string[]} tokens - FCM token(s) destinatario
 * @param {Object} notification - Dati notifica
 * @param {string} notification.title - Titolo notifica
 * @param {string} notification.body - Corpo notifica
 * @param {Object} [notification.data] - Dati custom aggiuntivi
 * @param {string} [notification.icon] - URL icona
 * @param {string} [notification.priority] - Priorità (high|normal)
 * @param {string} [userId=null] - User ID for logging purposes
 */
export async function sendPushNotification(
  tokens: string | string[],
  notification: NotificationPayload,
  userId: string | null = null
): Promise<any> {
  try {
    // Inizializza Admin SDK
    initializeFirebaseAdmin();

    // Normalizza tokens in array
    const tokenArray = Array.isArray(tokens) ? tokens : [tokens];

    if (tokenArray.length === 0) {
      throw new Error('Nessun token FCM fornito');
    }

    // Costruisci messaggio
    const hasAbsoluteIcon = notification.icon?.startsWith('http');

    const message = {
      notification: {
        title: notification.title || 'Pannello Stufa',
        body: notification.body || '',
        ...(hasAbsoluteIcon && { imageUrl: notification.icon }),
      },
      data: notification.data || {},
      android: {
        priority: (notification.priority === 'high' ? 'high' : 'normal') as 'high' | 'normal',
        notification: {
          channelId: 'default',
          priority: (notification.priority === 'high' ? 'high' : 'default') as 'high' | 'default',
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: notification.title || 'Pannello Stufa',
              body: notification.body || '',
            },
            sound: 'default',
            badge: 1,
            ...(notification.priority === 'high' && {
              'content-available': 1,
              priority: 10,
            }),
          },
        },
      },
      webpush: {
        notification: {
          title: notification.title || 'Pannello Stufa',
          body: notification.body || '',
          icon: notification.icon || '/icons/icon-192.png',
          badge: '/icons/icon-72.png',
          requireInteraction: notification.priority === 'high',
          vibrate: notification.priority === 'high' ? [200, 100, 200] : [100],
        },
        fcmOptions: {
          link: notification.data?.url || '/',
        },
      },
    };

    // Track invalid tokens for removal
    const invalidTokens: string[] = [];

    // Invia a singolo token
    if (tokenArray.length === 1) {
      try {
        const response = await getMessaging().send({
          ...message,
          token: tokenArray[0],
        });

        console.log('✅ Notifica inviata:', response);

        // Log notification (non-blocking)
        logNotification({
          userId: userId || 'unknown',
          type: notification.data?.type || 'generic',
          title: notification.title || 'Pannello Stufa',
          body: notification.body || '',
          status: 'sent',
          deviceCount: 1,
          successCount: 1,
          failureCount: 0,
          fcmErrors: [],
          metadata: { source: 'api', isTest: notification.data?.type === 'test' }
        }).catch(err => console.error('Failed to log notification:', err));

        return {
          success: true,
          successCount: 1,
          failureCount: 0,
          responses: [{ success: true, messageId: response }],
        };
      } catch (error: unknown) {
        // Look up device context for error logging
        const deviceContext = await lookupDeviceIdForToken(tokenArray[0]).catch(() => null);

        const errorCode = (error as any).code;
        const errorMessage = (error as any).message;

        // Track error with full context (fire-and-forget)
        trackNotificationError({
          token: tokenArray[0],
          userId: deviceContext?.userId,
          deviceId: deviceContext?.deviceId,
          errorCode,
          errorMessage,
          notificationType: notification.data?.type || 'unknown',
          notificationTitle: notification.title,
        }).catch(console.error);

        // Check if token is invalid
        if (INVALID_TOKEN_ERRORS.includes(errorCode)) {
          console.warn(`⚠️ Invalid token detected: ${errorCode}`);
          invalidTokens.push(tokenArray[0]);

          // Remove invalid token asynchronously (don't block response)
          removeInvalidToken(tokenArray[0]).catch(console.error);
        }

        // Log failed notification (non-blocking)
        logNotification({
          userId: userId || 'unknown',
          type: notification.data?.type || 'generic',
          title: notification.title || 'Pannello Stufa',
          body: notification.body || '',
          status: 'failed',
          deviceCount: 1,
          successCount: 0,
          failureCount: 1,
          fcmErrors: [{
            tokenPrefix: tokenArray[0].substring(0, 20),
            errorCode: errorCode || 'unknown',
            errorMessage: errorMessage || ''
          }],
          metadata: { source: 'api', isTest: notification.data?.type === 'test' }
        }).catch(err => console.error('Failed to log notification:', err));

        return {
          success: false,
          successCount: 0,
          failureCount: 1,
          responses: [{ success: false, error }],
          invalidTokensRemoved: invalidTokens.length,
        };
      }
    }

    // Invia a multipli token (batch)
    const response = await getMessaging().sendEachForMulticast({
      ...message,
      tokens: tokenArray,
    });

    console.log(`✅ Notifiche inviate: ${response.successCount}/${tokenArray.length}`);

    // Check for invalid tokens and remove them
    if (response.failureCount > 0) {
      // Track errors and identify invalid tokens
      const errorTrackingPromises: Promise<void>[] = [];

      response.responses.forEach(async (resp, idx) => {
        if (!resp.success) {
          // Look up device context for this token
          const deviceContext = await lookupDeviceIdForToken(tokenArray[idx]).catch(() => null);

          const errorCode = resp.error?.code;

          // Track error (fire-and-forget)
          errorTrackingPromises.push(
            trackNotificationError({
              token: tokenArray[idx],
              userId: deviceContext?.userId,
              deviceId: deviceContext?.deviceId,
              errorCode,
              errorMessage: resp.error?.message,
              notificationType: notification.data?.type || 'unknown',
              notificationTitle: notification.title,
            }).catch(console.error) as Promise<void>
          );

          if (errorCode && INVALID_TOKEN_ERRORS.includes(errorCode)) {
            console.warn(`⚠️ Invalid token at index ${idx}: ${errorCode}`);
            invalidTokens.push(tokenArray[idx]);
          } else {
            console.error(`❌ Errore token ${tokenArray[idx]}:`, resp.error);
          }
        }
      });

      // Fire-and-forget error tracking
      Promise.all(errorTrackingPromises).catch(console.error);

      // Remove invalid tokens asynchronously
      if (invalidTokens.length > 0) {
        Promise.all(invalidTokens.map(t => removeInvalidToken(t))).catch(console.error);
      }
    }

    // Build FCM errors array for logging
    const fcmErrors: Array<{ tokenPrefix: string; errorCode: string; errorMessage: string }> = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        fcmErrors.push({
          tokenPrefix: tokenArray[idx].substring(0, 20),
          errorCode: resp.error?.code || 'unknown',
          errorMessage: resp.error?.message || ''
        });
      }
    });

    // Log notification (non-blocking)
    logNotification({
      userId: userId || 'unknown',
      type: notification.data?.type || 'generic',
      title: notification.title || 'Pannello Stufa',
      body: notification.body || '',
      status: response.successCount > 0 ? 'sent' : 'failed',
      deviceCount: tokenArray.length,
      successCount: response.successCount,
      failureCount: response.failureCount,
      fcmErrors,
      metadata: { source: 'api', isTest: notification.data?.type === 'test' }
    }).catch(err => console.error('Failed to log notification:', err));

    return {
      success: response.successCount > 0,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses,
      invalidTokensRemoved: invalidTokens.length,
    };

  } catch (error) {
    console.error('❌ Errore invio notifica push:', error);
    throw error;
  }
}

/**
 * Invia notifica a tutti i dispositivi di un utente
 * Enhanced with preference filtering (type toggles + DND windows)
 *
 * @param {string} userId - User ID (Auth0 sub)
 * @param {Object} notification - Dati notifica
 */
export async function sendNotificationToUser(userId: string, notification: NotificationPayload): Promise<any> {
  try {
    // Recupera tutti i token dell'utente usando Admin SDK
    const tokensData = await adminDbGet(`users/${userId}/fcmTokens`);

    if (!tokensData) {
      console.warn(`⚠️ Nessun token FCM trovato per utente ${userId}`);
      return {
        success: false,
        error: 'NO_TOKENS',
        message: 'Utente non ha dispositivi registrati',
      };
    }

    // Convert tokens to array with deviceId for filtering
    const allTokens = Object.values(tokensData as Record<string, TokenRecord>).map(t => ({
      token: t.token,
      deviceId: t.deviceId || 'unknown',
    }));

    // Fetch user notification preferences from RTDB
    // Fail-safe: if preferences unavailable, allow notification (better unwanted than missed critical)
    let preferences: any;
    try {
      const prefs = await adminDbGet(`users/${userId}/settings/notifications`);

      if (prefs) {
        preferences = prefs;
      } else {
        // New user - use defaults
        preferences = getDefaultPreferences();
      }
    } catch (error) {
      console.error('⚠️ Error fetching preferences, allowing notification:', error);
      preferences = getDefaultPreferences(); // Fail-safe to defaults
    }

    // Extract notification type from notification object
    // Type can be in data.type, data.notificationType, or default to 'INFO'
    const notifType = notification.data?.type || notification.data?.notificationType || 'INFO';

    // Apply preference filters (type toggles + rate limits + DND windows)
    const filterResult = filterNotificationByPreferences(
      userId,
      notifType,
      preferences as any,
      allTokens
    );

    if (!filterResult.allowed) {
      console.log(`🚫 Notification filtered: ${filterResult.reason} for user ${userId}`);
      return {
        success: false,
        error: 'FILTERED',
        reason: filterResult.reason,
        message: getFilterMessage(filterResult.reason ?? ''),
        stats: filterResult.stats,
      };
    }

    // Log filter stats if any devices were filtered
    if (filterResult.stats.filteredByDND > 0) {
      console.log(`📊 Filter stats for user ${userId}:`, filterResult.stats);
    }

    // Use filtered tokens (string array)
    const tokens = filterResult.allowedTokens;

    // Invia notifica a tutti i token consentiti
    return await sendPushNotification(tokens, notification, userId);

  } catch (error) {
    console.error('❌ Errore invio notifica a utente:', error);
    throw error;
  }
}

/**
 * Helper: Verifica se un token è valido
 * (Utile per cleanup token obsoleti/invalidi)
 */
export async function verifyFCMToken(token: string): Promise<boolean> {
  try {
    initializeFirebaseAdmin();

    // Prova a inviare messaggio dry-run
    await getMessaging().send({
      token,
      notification: {
        title: 'Test',
        body: 'Test',
      },
    }, true); // dry_run = true

    return true;
  } catch (error: unknown) {
    console.error('❌ Token invalido:', (error as any).code);
    return false;
  }
}
