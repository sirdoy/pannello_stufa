/**
 * Notification Service - Sistema centralizzato per gestione notifiche push
 *
 * Features:
 * - Richiesta permessi notifiche (iOS Safari 16.4+, Android Chrome)
 * - Gestione FCM token e salvataggio Firebase
 * - Notifiche foreground e background
 * - Helper functions per tipi specifici (errori, scheduler, manutenzione)
 *
 * iOS Requirements:
 * - Safari 16.4+ (iOS 16.4+)
 * - App installata come PWA (Add to Home Screen)
 * - HTTPS connection (production)
 */

import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { db } from './firebase';
import { ref, set, get, serverTimestamp } from 'firebase/database';

// VAPID key (verrà generato in Firebase Console)
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

/**
 * Verifica se le notifiche sono supportate dal browser/device
 */
export function isNotificationSupported() {
  if (typeof window === 'undefined') return false;

  // Check se Notification API è disponibile
  if (!('Notification' in window)) return false;

  // Check se service worker è supportato
  if (!('serviceWorker' in navigator)) return false;

  return true;
}

/**
 * Verifica se siamo su iOS
 */
export function isIOS() {
  if (typeof window === 'undefined') return false;

  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}

/**
 * Verifica se l'app è installata come PWA
 */
export function isPWA() {
  if (typeof window === 'undefined') return false;

  // Check se app è in standalone mode (iOS)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  // Check se app è stata aggiunta a home screen (iOS Safari)
  const isIOSStandalone = window.navigator.standalone === true;

  return isStandalone || isIOSStandalone;
}

/**
 * Ottiene il permesso attuale per le notifiche
 */
export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Richiede permesso per le notifiche
 *
 * iOS Notes:
 * - Funziona SOLO se app è installata come PWA
 * - Il permesso deve essere richiesto dopo un'azione utente (click)
 * - Una volta negato, l'utente deve abilitare manualmente nelle impostazioni iOS
 */
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) {
    throw new Error('Notifiche non supportate su questo dispositivo');
  }

  // Check se già abbiamo il permesso
  if (Notification.permission === 'granted') {
    return 'granted';
  }

  // iOS PWA check
  if (isIOS() && !isPWA()) {
    throw new Error('Su iPhone, devi prima aggiungere l\'app alla schermata Home');
  }

  // Richiedi permesso
  const permission = await Notification.requestPermission();

  if (permission === 'denied') {
    throw new Error('Permesso notifiche negato. Abilita dalle impostazioni del browser.');
  }

  return permission;
}

/**
 * Ottiene il FCM token per questo dispositivo
 * e lo salva su Firebase
 */
export async function getFCMToken(userId) {
  if (!userId) {
    throw new Error('User ID richiesto per ottenere FCM token');
  }

  if (!VAPID_KEY) {
    console.error('VAPID key non configurata. Aggiungi NEXT_PUBLIC_FIREBASE_VAPID_KEY al .env');
    throw new Error('Configurazione notifiche mancante');
  }

  try {
    // Verifica permesso
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Permesso notifiche non concesso');
    }

    // Ottieni messaging instance
    const messaging = getMessaging();

    // Ottieni registration service worker
    const registration = await navigator.serviceWorker.ready;

    // Ottieni token FCM
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      throw new Error('Impossibile ottenere FCM token');
    }

    // Salva token su Firebase con metadata
    const tokenRef = ref(db, `users/${userId}/fcmTokens/${token}`);
    await set(tokenRef, {
      token,
      createdAt: serverTimestamp(),
      lastUsed: serverTimestamp(),
      userAgent: navigator.userAgent,
      platform: isIOS() ? 'ios' : 'other',
      isPWA: isPWA(),
    });

    console.log('✅ FCM token salvato:', token);
    return token;

  } catch (error) {
    console.error('❌ Errore ottenimento FCM token:', error);
    throw error;
  }
}

/**
 * Setup listener per notifiche in foreground
 * (quando l'app è aperta)
 */
export function onForegroundMessage(callback) {
  if (!isNotificationSupported()) return () => {};

  const messaging = getMessaging();

  const unsubscribe = onMessage(messaging, (payload) => {
    console.log('📬 Notifica ricevuta (foreground):', payload);

    // Mostra notifica anche in foreground
    if (payload.notification) {
      const { title, body, icon } = payload.notification;

      // Crea notifica nativa
      if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body,
          icon: icon || '/icons/icon-192.png',
          badge: '/icons/icon-72.png',
          tag: payload.data?.type || 'default',
          requireInteraction: payload.data?.priority === 'high',
          data: payload.data,
        });

        // Click handler
        notification.onclick = () => {
          window.focus();
          notification.close();

          // Naviga a URL specifico se presente
          if (payload.data?.url) {
            window.location.href = payload.data.url;
          }
        };
      }
    }

    // Callback custom
    if (callback) callback(payload);
  });

  return unsubscribe;
}

/**
 * Helper: Crea payload notifica per errori stufa
 */
export function createErrorNotification(errorCode, errorDescription, severity) {
  const emoji = severity === 'CRITICAL' ? '🚨' : severity === 'ERROR' ? '⚠️' : 'ℹ️';

  return {
    notification: {
      title: `${emoji} Errore Stufa`,
      body: `Errore ${errorCode}: ${errorDescription}`,
      icon: '/icons/icon-192.png',
    },
    data: {
      type: 'stove_error',
      errorCode: String(errorCode),
      severity,
      url: '/stove/errors',
      priority: severity === 'CRITICAL' ? 'high' : 'normal',
    },
  };
}

/**
 * Helper: Crea payload notifica per scheduler
 */
export function createSchedulerNotification(action, details) {
  const emoji = action === 'IGNITE' ? '🔥' : '🌙';
  const actionText = action === 'IGNITE' ? 'Accensione' : 'Spegnimento';

  return {
    notification: {
      title: `${emoji} ${actionText} Automatica`,
      body: details || `La stufa è stata ${action === 'IGNITE' ? 'accesa' : 'spenta'} automaticamente`,
      icon: '/icons/icon-192.png',
    },
    data: {
      type: 'scheduler_action',
      action,
      url: '/stove/scheduler',
      priority: 'normal',
    },
  };
}

/**
 * Helper: Crea payload notifica per manutenzione
 */
export function createMaintenanceNotification(percentage, remainingHours) {
  const emoji = percentage >= 100 ? '🚨' : percentage >= 80 ? '⚠️' : 'ℹ️';
  const urgency = percentage >= 100 ? 'URGENTE' : percentage >= 80 ? 'Attenzione' : 'Promemoria';

  let body;
  if (percentage >= 100) {
    body = 'Manutenzione richiesta! L\'accensione è bloccata fino alla pulizia.';
  } else if (percentage >= 80) {
    body = `${remainingHours.toFixed(1)}h rimanenti prima della pulizia richiesta`;
  } else {
    body = `Promemoria: ${remainingHours.toFixed(1)}h rimanenti prima della manutenzione`;
  }

  return {
    notification: {
      title: `${emoji} ${urgency} Manutenzione`,
      body,
      icon: '/icons/icon-192.png',
    },
    data: {
      type: 'maintenance',
      percentage: String(percentage),
      remainingHours: String(remainingHours),
      url: '/stove/maintenance',
      priority: percentage >= 100 ? 'high' : 'normal',
    },
  };
}

/**
 * Helper: Crea payload notifica generica
 */
export function createGenericNotification(title, body, data = {}) {
  return {
    notification: {
      title,
      body,
      icon: '/icons/icon-192.png',
    },
    data: {
      type: 'generic',
      ...data,
    },
  };
}

/**
 * Ottiene tutti i token FCM di un utente
 */
export async function getUserFCMTokens(userId) {
  if (!userId) return [];

  try {
    const tokensRef = ref(db, `users/${userId}/fcmTokens`);
    const snapshot = await get(tokensRef);

    if (!snapshot.exists()) return [];

    const tokensData = snapshot.val();
    return Object.values(tokensData).map(t => t.token);

  } catch (error) {
    console.error('❌ Errore recupero FCM tokens:', error);
    return [];
  }
}

/**
 * Cleanup: rimuove token obsoleti (più vecchi di 90 giorni)
 */
export async function cleanupOldTokens(userId) {
  if (!userId) return;

  try {
    const tokensRef = ref(db, `users/${userId}/fcmTokens`);
    const snapshot = await get(tokensRef);

    if (!snapshot.exists()) return;

    const tokensData = snapshot.val();
    const now = Date.now();
    const MAX_AGE = 90 * 24 * 60 * 60 * 1000; // 90 giorni

    for (const [tokenKey, tokenData] of Object.entries(tokensData)) {
      const createdAt = new Date(tokenData.createdAt).getTime();

      if (now - createdAt > MAX_AGE) {
        const tokenRef = ref(db, `users/${userId}/fcmTokens/${tokenKey}`);
        await set(tokenRef, null); // Remove token
        console.log('🗑️ Token obsoleto rimosso:', tokenKey);
      }
    }

  } catch (error) {
    console.error('❌ Errore cleanup tokens:', error);
  }
}
