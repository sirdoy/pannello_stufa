/**
 * Firebase Admin SDK Helper (Server-side only)
 *
 * Gestisce inizializzazione Firebase Admin e invio notifiche push
 *
 * IMPORTANTE:
 * - Usa SOLO in API routes e server components
 * - NON importare in client components
 * - Richiede credenziali Admin SDK in .env
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

/**
 * Inizializza Firebase Admin SDK (singleton)
 */
function initializeFirebaseAdmin() {
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
  });

  console.log('✅ Firebase Admin SDK inizializzato');
  return app;
}

/**
 * Invia notifica push a uno o più dispositivi
 *
 * @param {string|string[]} tokens - FCM token(s) destinatario
 * @param {Object} notification - Dati notifica
 * @param {string} notification.title - Titolo notifica
 * @param {string} notification.body - Corpo notifica
 * @param {Object} [notification.data] - Dati custom aggiuntivi
 * @param {string} [notification.icon] - URL icona
 * @param {string} [notification.priority] - Priorità (high|normal)
 */
export async function sendPushNotification(tokens, notification) {
  try {
    // Inizializza Admin SDK
    initializeFirebaseAdmin();

    // Normalizza tokens in array
    const tokenArray = Array.isArray(tokens) ? tokens : [tokens];

    if (tokenArray.length === 0) {
      throw new Error('Nessun token FCM fornito');
    }

    // Costruisci messaggio
    const message = {
      notification: {
        title: notification.title || 'Pannello Stufa',
        body: notification.body || '',
        ...(notification.icon && { imageUrl: notification.icon }),
      },
      data: notification.data || {},
      // Android config
      android: {
        priority: notification.priority === 'high' ? 'high' : 'normal',
        notification: {
          channelId: 'default',
          priority: notification.priority === 'high' ? 'high' : 'default',
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
      // iOS config
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
      // Web push config
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

    // Invia a singolo token
    if (tokenArray.length === 1) {
      const response = await getMessaging().send({
        ...message,
        token: tokenArray[0],
      });

      console.log('✅ Notifica inviata:', response);
      return {
        success: true,
        successCount: 1,
        failureCount: 0,
        responses: [{ success: true, messageId: response }],
      };
    }

    // Invia a multipli token (batch)
    const response = await getMessaging().sendEachForMulticast({
      ...message,
      tokens: tokenArray,
    });

    console.log(`✅ Notifiche inviate: ${response.successCount}/${tokenArray.length}`);

    // Log errori se presenti
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`❌ Errore token ${tokenArray[idx]}:`, resp.error);
        }
      });
    }

    return {
      success: response.successCount > 0,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses,
    };

  } catch (error) {
    console.error('❌ Errore invio notifica push:', error);
    throw error;
  }
}

/**
 * Invia notifica a tutti i dispositivi di un utente
 *
 * @param {string} userId - User ID (Auth0 sub)
 * @param {Object} notification - Dati notifica
 */
export async function sendNotificationToUser(userId, notification) {
  try {
    // Import Firebase client SDK per query database
    const { ref, get } = await import('firebase/database');
    const { db } = await import('./firebase');

    // Recupera tutti i token dell'utente
    const tokensRef = ref(db, `users/${userId}/fcmTokens`);
    const snapshot = await get(tokensRef);

    if (!snapshot.exists()) {
      console.warn(`⚠️ Nessun token FCM trovato per utente ${userId}`);
      return {
        success: false,
        error: 'NO_TOKENS',
        message: 'Utente non ha dispositivi registrati',
      };
    }

    const tokensData = snapshot.val();
    const tokens = Object.values(tokensData).map(t => t.token);

    // Invia notifica a tutti i token
    return await sendPushNotification(tokens, notification);

  } catch (error) {
    console.error('❌ Errore invio notifica a utente:', error);
    throw error;
  }
}

/**
 * Helper: Verifica se un token è valido
 * (Utile per cleanup token obsoleti/invalidi)
 */
export async function verifyFCMToken(token) {
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
  } catch (error) {
    console.error('❌ Token invalido:', error.code);
    return false;
  }
}
