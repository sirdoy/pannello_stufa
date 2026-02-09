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
import { ref, get } from 'firebase/database';
import { saveToken, loadToken, updateLastUsed, getTokenAge } from './tokenStorage';
import { generateDeviceFingerprint } from './deviceFingerprint';
import { initializeTokenManagement, checkAndRefreshToken } from './tokenRefresh';

/**
 * Ottiene la VAPID key al momento dell'uso (non a livello modulo)
 * Questo evita problemi di timing con Next.js/Turbopack hot reload
 */
function getVapidKey() {
  return process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
}

/**
 * Debug logger - salva log su Firebase per troubleshooting remoto
 */
async function debugLog(message: string, data: Record<string, unknown> = {}) {
  try {
    await fetch('/api/debug/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'notifications',
        message,
        data: {
          ...data,
          timestamp: new Date().toISOString(),
          url: typeof window !== 'undefined' ? window.location.href : 'SSR',
        },
      }),
    });
  } catch (e) {
    console.error('[debugLog] Failed to send:', e);
  }
}

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
  const isIOSStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;

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
 * e lo salva su Firebase tramite API
 *
 * Enhanced with:
 * - Local persistence (IndexedDB + localStorage)
 * - Device fingerprinting for multi-device support
 * - Token refresh awareness (see tokenRefresh.js)
 */
export async function getFCMToken(userId: string) {
  // Ottieni VAPID key al momento dell'uso
  const vapidKey = getVapidKey();

  // Generate device fingerprint first
  const fingerprint = generateDeviceFingerprint(navigator.userAgent);
  const { deviceId, displayName, deviceInfo } = fingerprint;

  // Raccogli info ambiente per debug
  const envInfo = {
    NODE_ENV: process.env.NODE_ENV || 'unknown',
    NEXT_PUBLIC_vars: typeof window !== 'undefined'
      ? Object.keys(process.env || {}).filter(k => k.startsWith('NEXT_PUBLIC_'))
      : 'SSR',
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'SSR',
    protocol: typeof window !== 'undefined' ? window.location.protocol : 'SSR',
  };

  // Log diagnostico iniziale
  await debugLog('getFCMToken chiamato', {
    userId: userId ? 'presente' : 'mancante',
    VAPID_KEY_exists: !!vapidKey,
    VAPID_KEY_length: vapidKey?.length || 0,
    VAPID_KEY_preview: vapidKey ? `${vapidKey.substring(0, 10)}...` : 'undefined',
    deviceId,
    displayName,
    environment: envInfo,
    browser: {
      isIOS: isIOS(),
      isPWA: isPWA(),
      notificationSupported: isNotificationSupported(),
      permission: typeof Notification !== 'undefined' ? Notification.permission : 'N/A',
    },
  });

  if (!userId) {
    await debugLog('Errore: userId mancante');
    throw new Error('User ID richiesto per ottenere FCM token');
  }

  if (!vapidKey) {
    await debugLog('Errore: VAPID_KEY mancante - CONFIGURAZIONE AMBIENTE', {
      environment: envInfo,
      expectedVar: 'NEXT_PUBLIC_FIREBASE_VAPID_KEY',
      message: 'La variabile ambiente non è configurata nel deployment. Controlla Vercel/hosting env vars.',
    });
    console.error('VAPID key non configurata. Aggiungi NEXT_PUBLIC_FIREBASE_VAPID_KEY al .env');
    throw new Error('Configurazione notifiche mancante');
  }

  try {
    // Verifica permesso
    await debugLog('Richiesta permesso notifiche...');
    const permission = await requestNotificationPermission();
    await debugLog('Permesso ottenuto', { permission });

    if (permission !== 'granted') {
      throw new Error('Permesso notifiche non concesso');
    }

    // Ottieni messaging instance
    await debugLog('Getting messaging instance...');
    const messaging = getMessaging();

    // Ottieni registration service worker con timeout
    await debugLog('Waiting for service worker...');

    // In development mode con Turbopack, il SW spesso fallisce per precache mismatch
    const isDev = process.env.NODE_ENV === 'development';

    // Helper: attendi SW ready con timeout
    const waitForServiceWorker = async (timeoutMs = 10000) => {
      // Check se SW è già pronto e ATTIVO
      const existingReg = await navigator.serviceWorker.getRegistration();
      if (existingReg?.active) {
        await debugLog('SW esistente trovato e attivo');
        return existingReg;
      }

      // In dev mode, se il SW non è pronto, proviamo comunque senza
      if (isDev) {
        await debugLog('Dev mode: SW non pronto, provo senza SW registration');
        // Restituisci un oggetto fittizio - getToken proverà comunque
        return null;
      }

      // In production, prova a registrare il SW manualmente
      await debugLog('Nessun SW attivo, tentativo registrazione...');
      try {
        const newReg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        await debugLog('SW registrato', { scope: newReg.scope });

        // Attendi che diventi attivo
        if (newReg.installing || newReg.waiting) {
          await new Promise((resolve, reject) => {
            const sw = newReg.installing || newReg.waiting;
            const timeout = setTimeout(() => reject(new Error('SW activation timeout')), timeoutMs);

            if (sw) {
              sw.addEventListener('statechange', () => {
                if (sw && sw.state === 'activated') {
                  clearTimeout(timeout);
                  resolve(undefined);
                }
              });
            }
          });
        }

        return newReg;
      } catch (regError: unknown) {
        const errorMessage = regError instanceof Error ? regError.message : String(regError);
        await debugLog('Errore registrazione SW', { error: errorMessage });
        throw regError;
      }
    };

    // Timeout Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Service Worker non disponibile (timeout 15s). Ricarica la pagina.')), 15000);
    });

    const registration = await Promise.race([
      waitForServiceWorker(),
      timeoutPromise,
    ]);

    if (registration) {
      const regData = registration as ServiceWorkerRegistration;
      await debugLog('Service worker ready', {
        scope: regData.scope,
        active: !!regData.active,
      });
    } else {
      await debugLog('Proceeding without SW registration (dev mode)');
    }

    // Ottieni token FCM
    await debugLog('Getting FCM token...', { vapidKeyLength: vapidKey.length, hasRegistration: !!registration });

    // Build options - serviceWorkerRegistration è opzionale in dev mode
    const getTokenOptions: { vapidKey: string; serviceWorkerRegistration?: ServiceWorkerRegistration } = { vapidKey };
    if (registration) {
      getTokenOptions.serviceWorkerRegistration = registration as ServiceWorkerRegistration;
    }

    const token = await getToken(messaging, getTokenOptions);

    if (!token) {
      await debugLog('Errore: token FCM nullo');
      throw new Error('Impossibile ottenere FCM token');
    }

    await debugLog('Token FCM ottenuto', { tokenPreview: token.substring(0, 20) + '...' });

    // Salva token su Firebase tramite API (con deviceId per deduplicazione)
    const response = await fetch('/api/notifications/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        deviceId,
        displayName,
        deviceInfo,
        userAgent: navigator.userAgent,
        platform: isIOS() ? 'ios' : 'other',
        isPWA: isPWA(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      await debugLog('Errore registrazione token', { error });
      throw new Error(error.message || 'Impossibile registrare token');
    }

    const result = await response.json();
    await debugLog('FCM token salvato con successo', { action: result.action });

    // Save token locally for persistence across browser restarts
    await saveToken(token, {
      deviceId,
      deviceInfo,
      createdAt: new Date().toISOString(),
    });
    await debugLog('Token salvato in local storage');

    console.log('✅ FCM token salvato:', token);
    return token;

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack?.substring(0, 500) : undefined;
    await debugLog('Errore getFCMToken', {
      error: errorMessage,
      stack: errorStack,
    });
    console.error('❌ Errore ottenimento FCM token:', error);
    throw error;
  }
}

/**
 * Setup listener per notifiche in foreground
 * (quando l'app è aperta)
 */
export function onForegroundMessage(callback?: (payload: unknown) => void) {
  if (!isNotificationSupported()) return () => {};

  const messaging = getMessaging();

  const unsubscribe = onMessage(messaging, (payload) => {
    console.log('📬 Notifica ricevuta (foreground):', payload);

    // Mostra notifica anche in foreground
    if (payload.notification) {
      const { title, body, icon } = payload.notification;

      // Crea notifica nativa
      if (Notification.permission === 'granted') {
        const notification = new Notification(title || '', {
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

// Removed unused notification helper functions: createErrorNotification, createSchedulerNotification,
// createMaintenanceNotification, createGenericNotification, getUserFCMTokens
// These were not used in the codebase

/**
 * Initialize notification system on app startup
 *
 * Checks for existing token, refreshes if needed (>30 days old),
 * and returns current notification status.
 *
 * Call this once when app loads (e.g., in a useEffect in layout or _app).
 *
 * @param {string} userId - User ID from Auth0
 * @returns {Promise<{
 *   hasToken: boolean,
 *   token: string|null,
 *   wasRefreshed: boolean,
 *   permissionStatus: string
 * }>}
 */
export async function initializeNotifications(userId: string) {
  if (!isNotificationSupported()) {
    return {
      hasToken: false,
      token: null,
      wasRefreshed: false,
      permissionStatus: 'unsupported',
    };
  }

  const permissionStatus = getNotificationPermission();

  // If no permission, can't do much
  if (permissionStatus !== 'granted') {
    return {
      hasToken: false,
      token: null,
      wasRefreshed: false,
      permissionStatus,
    };
  }

  try {
    // Check for existing token and refresh if needed
    const result = await initializeTokenManagement(userId);

    return {
      hasToken: result.hasToken,
      token: result.token,
      wasRefreshed: result.wasRefreshed,
      permissionStatus,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[initializeNotifications] Error:', error);
    return {
      hasToken: false,
      token: null,
      wasRefreshed: false,
      permissionStatus,
      error: errorMessage,
    };
  }
}

/**
 * Check if stored token exists and load it
 * Used for quick check without full initialization
 *
 * @returns {Promise<{hasToken: boolean, token: string|null, age: number|null}>}
 */
export async function checkStoredToken() {
  try {
    const stored = await loadToken();
    const age = await getTokenAge();

    return {
      hasToken: !!stored?.token,
      token: stored?.token || null,
      age,
      deviceId: stored?.deviceId || null,
    };
  } catch (error) {
    console.error('[checkStoredToken] Error:', error);
    return { hasToken: false, token: null, age: null };
  }
}

/**
 * Cleanup: rimuove token obsoleti (più vecchi di 90 giorni)
 *
 * TODO: Migrare a API route /api/notifications/cleanup
 * Questa funzione richiede write access che deve passare tramite Admin SDK
 */
/* DISABLED - Requires Admin SDK migration
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
        // Richiede Admin SDK - chiamare /api/notifications/cleanup
        console.log('🗑️ Token obsoleto trovato:', tokenKey);
      }
    }

  } catch (error) {
    console.error('❌ Errore cleanup tokens:', error);
  }
}
*/
