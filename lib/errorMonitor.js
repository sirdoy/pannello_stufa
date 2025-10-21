/**
 * Error Monitoring Service for Stove
 * Monitors and tracks stove errors, alarms, and pellet status
 */

import { ref, push, set, get, query, orderByChild, limitToLast } from 'firebase/database';
import { database } from './firebase';

/**
 * Error severity levels
 */
export const ERROR_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
};

/**
 * Known error codes and their descriptions
 * Based on Thermorossi stove error codes
 */
export const ERROR_CODES = {
  0: {
    description: 'Nessun errore',
    severity: ERROR_SEVERITY.INFO,
    suggestion: 'La stufa funziona correttamente'
  },

  // Errori di accensione
  1: {
    description: 'Mancata accensione',
    severity: ERROR_SEVERITY.ERROR,
    suggestion: 'Verificare: pellet nel serbatoio, pulizia braciere, candeletta funzionante'
  },
  2: {
    description: 'Errore candeletta',
    severity: ERROR_SEVERITY.ERROR,
    suggestion: 'Controllare il corretto funzionamento della candeletta di accensione'
  },
  3: {
    description: 'Pellet esaurito',
    severity: ERROR_SEVERITY.CRITICAL,
    suggestion: 'Ricaricare il serbatoio pellet e riprovare'
  },

  // Errori di temperatura
  4: {
    description: 'Temperatura fumi eccessiva',
    severity: ERROR_SEVERITY.CRITICAL,
    suggestion: 'SPEGNERE LA STUFA. Controllare ventilatore fumi e pulizia scambiatore'
  },
  5: {
    description: 'Errore sonda temperatura fumi',
    severity: ERROR_SEVERITY.ERROR,
    suggestion: 'Verificare il collegamento della sonda temperatura fumi'
  },
  6: {
    description: 'Errore termocoppia',
    severity: ERROR_SEVERITY.ERROR,
    suggestion: 'Controllare il collegamento della termocoppia'
  },
  7: {
    description: 'Temperatura ambiente non raggiunta',
    severity: ERROR_SEVERITY.WARNING,
    suggestion: 'Aumentare la potenza o verificare dimensionamento stufa per ambiente'
  },

  // Errori di pressione e tiraggio
  8: {
    description: 'Errore depressione',
    severity: ERROR_SEVERITY.CRITICAL,
    suggestion: 'Controllare tiraggio camino, pulizia canna fumaria e pressostato'
  },
  9: {
    description: 'Mancanza tiraggio',
    severity: ERROR_SEVERITY.ERROR,
    suggestion: 'Verificare pulizia canna fumaria e apertura uscita fumi'
  },
  10: {
    description: 'Errore ventilatore fumi',
    severity: ERROR_SEVERITY.CRITICAL,
    suggestion: 'Verificare funzionamento ventilatore estrattore fumi'
  },

  // Errori meccanici
  11: {
    description: 'Errore motoriduttore carico pellet',
    severity: ERROR_SEVERITY.ERROR,
    suggestion: 'Controllare coclea carico pellet e motoriduttore'
  },
  12: {
    description: 'Errore ventilatore ambiente',
    severity: ERROR_SEVERITY.WARNING,
    suggestion: 'Verificare funzionamento ventilatore ambiente'
  },

  // Errori di sicurezza
  13: {
    description: 'Allarme sicurezza termica',
    severity: ERROR_SEVERITY.CRITICAL,
    suggestion: 'SPEGNERE LA STUFA. Temperatura eccessiva, attendere raffreddamento'
  },
  14: {
    description: 'Errore porta aperta',
    severity: ERROR_SEVERITY.WARNING,
    suggestion: 'Chiudere correttamente lo sportello della stufa'
  },
  15: {
    description: 'Black-out durante funzionamento',
    severity: ERROR_SEVERITY.ERROR,
    suggestion: 'Interruzione alimentazione elettrica. Verificare impianto'
  },

  // Altri errori
  20: {
    description: 'Errore comunicazione scheda',
    severity: ERROR_SEVERITY.ERROR,
    suggestion: 'Problema comunicazione con scheda elettronica, contattare assistenza'
  },
  30: {
    description: 'Errore sensore temperatura ambiente',
    severity: ERROR_SEVERITY.WARNING,
    suggestion: 'Verificare sensore temperatura ambiente'
  },
  40: {
    description: 'Surriscaldamento H2O (idro)',
    severity: ERROR_SEVERITY.CRITICAL,
    suggestion: 'SPEGNERE LA STUFA. Solo per modelli idro: verificare circolazione acqua'
  },
};

/**
 * Get error information from error code
 */
export function getErrorInfo(errorCode) {
  if (errorCode === 0) {
    return ERROR_CODES[0];
  }

  // If error code is not known, return generic error
  return ERROR_CODES[errorCode] || {
    description: `Errore sconosciuto (codice ${errorCode})`,
    severity: ERROR_SEVERITY.ERROR,
  };
}

/**
 * Check if error is critical (requires immediate attention)
 */
export function isCriticalError(errorCode) {
  const errorInfo = getErrorInfo(errorCode);
  return errorInfo.severity === ERROR_SEVERITY.CRITICAL;
}

/**
 * Log error to Firebase for historical tracking
 */
export async function logError(errorCode, errorDescription, additionalData = {}) {
  try {
    const errorInfo = getErrorInfo(errorCode);
    const errorLog = {
      errorCode,
      errorDescription,
      severity: errorInfo.severity,
      timestamp: Date.now(),
      resolved: false,
      ...additionalData,
    };

    const errorRef = ref(database, 'errors');
    await push(errorRef, errorLog);

    return errorLog;
  } catch (error) {
    console.error('Failed to log error to Firebase:', error);
    return null;
  }
}

/**
 * Get recent errors from Firebase
 */
export async function getRecentErrors(limit = 50) {
  try {
    const errorsRef = ref(database, 'errors');
    const recentQuery = query(errorsRef, orderByChild('timestamp'), limitToLast(limit));
    const snapshot = await get(recentQuery);

    if (!snapshot.exists()) {
      return [];
    }

    const errors = [];
    snapshot.forEach((child) => {
      errors.push({
        id: child.key,
        ...child.val(),
      });
    });

    // Reverse to get newest first
    return errors.reverse();
  } catch (error) {
    console.error('Failed to fetch recent errors:', error);
    return [];
  }
}

/**
 * Get active (unresolved) errors
 */
export async function getActiveErrors() {
  try {
    const errors = await getRecentErrors(100);
    return errors.filter(error => !error.resolved);
  } catch (error) {
    console.error('Failed to fetch active errors:', error);
    return [];
  }
}

/**
 * Mark error as resolved
 */
export async function resolveError(errorId) {
  try {
    const errorRef = ref(database, `errors/${errorId}`);
    await set(errorRef, {
      ...await get(errorRef).then(s => s.val()),
      resolved: true,
      resolvedAt: Date.now(),
    });
    return true;
  } catch (error) {
    console.error('Failed to resolve error:', error);
    return false;
  }
}

/**
 * Check if error should trigger notification
 */
export function shouldNotify(errorCode, previousErrorCode) {
  // Don't notify if error hasn't changed
  if (errorCode === previousErrorCode) {
    return false;
  }

  // Don't notify if error is cleared (0)
  if (errorCode === 0) {
    return false;
  }

  // Notify for any new error
  return true;
}

/**
 * Send browser notification for critical errors
 */
export async function sendErrorNotification(errorCode, errorDescription) {
  // Check if browser supports notifications
  if (!('Notification' in window)) {
    return false;
  }

  // Request permission if not granted
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }

  // Send notification if permitted
  if (Notification.permission === 'granted') {
    const errorInfo = getErrorInfo(errorCode);
    const icon = errorInfo.severity === ERROR_SEVERITY.CRITICAL ? '🚨' : '⚠️';

    new Notification(`${icon} Allarme Stufa`, {
      body: errorDescription || `Errore ${errorCode} rilevato`,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: `stove-error-${errorCode}`,
      requireInteraction: errorInfo.severity === ERROR_SEVERITY.CRITICAL,
    });

    return true;
  }

  return false;
}

/**
 * Send push notification for errors (server-side + client-side)
 * Invia notifica push a tutti i dispositivi dell'utente registrati
 * Controlla preferenze utente prima di inviare
 */
export async function sendErrorPushNotification(errorCode, errorDescription, userId) {
  try {
    const errorInfo = getErrorInfo(errorCode);

    // Check user preferences (dynamic import to avoid issues)
    try {
      const { shouldSendErrorNotification } = await import('./notificationPreferencesService');
      const shouldSend = await shouldSendErrorNotification(userId, errorInfo.severity);

      if (!shouldSend) {
        console.log(`⏭️ Error notification skipped (user preferences): ${errorCode} - ${errorInfo.severity}`);
        return false;
      }
    } catch (prefError) {
      console.warn('Could not check preferences, sending anyway:', prefError);
      // Fail-safe: invia comunque se non riesce a controllare preferenze
    }

    const emoji = errorInfo.severity === ERROR_SEVERITY.CRITICAL ? '🚨' :
                  errorInfo.severity === ERROR_SEVERITY.ERROR ? '⚠️' : 'ℹ️';

    const notification = {
      title: `${emoji} Errore Stufa`,
      body: errorDescription || `Errore ${errorCode}: ${errorInfo.description}`,
      icon: '/icons/icon-192.png',
      priority: errorInfo.severity === ERROR_SEVERITY.CRITICAL ? 'high' : 'normal',
      data: {
        type: 'stove_error',
        errorCode: String(errorCode),
        severity: errorInfo.severity,
        url: '/stove/errors',
      },
    };

    // Call API to send push notification
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        notification,
      }),
    });

    if (!response.ok) {
      console.error('Failed to send push notification:', await response.text());
      return false;
    }

    console.log('✅ Push notification sent for error', errorCode);
    return true;

  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}
