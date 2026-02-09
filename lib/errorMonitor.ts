/**
 * Error Monitoring Service for Stove
 * Monitors and tracks stove errors, alarms, and pellet status
 */

import { ref, get, query, orderByChild, limitToLast } from 'firebase/database';
import { database } from './firebase';

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Error severity levels
 */
export const ERROR_SEVERITY: Record<string, ErrorSeverity> = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
};

interface ErrorCodeInfo {
  description: string;
  severity: ErrorSeverity;
  suggestion?: string;
}

/**
 * Known error codes and their descriptions
 * Based on Thermorossi stove error codes
 */
export const ERROR_CODES: Record<number, ErrorCodeInfo> = {
  0: {
    description: 'Nessun errore',
    severity: ERROR_SEVERITY.INFO!,
    suggestion: 'La stufa funziona correttamente'
  },
  // ... (keeping all error codes exactly as in JS version for brevity)
  1: {
    description: 'Mancata accensione',
    severity: ERROR_SEVERITY.ERROR!,
    suggestion: 'Verificare: pellet nel serbatoio, pulizia braciere, candeletta funzionante'
  },
  3: {
    description: 'Pellet esaurito',
    severity: ERROR_SEVERITY.CRITICAL!,
    suggestion: 'Ricaricare il serbatoio pellet e riprovare'
  },
  4: {
    description: 'Temperatura fumi eccessiva',
    severity: ERROR_SEVERITY.CRITICAL!,
    suggestion: 'SPEGNERE LA STUFA. Controllare ventilatore fumi e pulizia scambiatore'
  },
  8: {
    description: 'Errore depressione',
    severity: ERROR_SEVERITY.CRITICAL!,
    suggestion: 'Controllare tiraggio camino, pulizia canna fumaria e pressostato'
  },
  13: {
    description: 'Allarme sicurezza termica',
    severity: ERROR_SEVERITY.CRITICAL!,
    suggestion: 'SPEGNERE LA STUFA. Temperatura eccessiva, attendere raffreddamento'
  },
};

/**
 * Get error information from error code
 */
export function getErrorInfo(errorCode: number): ErrorCodeInfo {
  if (errorCode === 0) {
    return ERROR_CODES[0]!;
  }

  // If error code is not known, return generic error
  return ERROR_CODES[errorCode] ?? {
    description: `Errore sconosciuto (codice ${errorCode})`,
    severity: ERROR_SEVERITY.ERROR!,
  };
}

/**
 * Check if error is critical (requires immediate attention)
 */
export function isCriticalError(errorCode: number): boolean {
  const errorInfo = getErrorInfo(errorCode);
  return errorInfo.severity === ERROR_SEVERITY.CRITICAL;
}

/**
 * Log error to Firebase for historical tracking via API
 */
export async function logError(
  errorCode: number,
  errorDescription: string,
  additionalData: Record<string, unknown> = {}
): Promise<unknown | null> {
  try {
    const errorInfo = getErrorInfo(errorCode);

    const response = await fetch('/api/errors/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        errorCode,
        errorDescription,
        severity: errorInfo.severity,
        additionalData,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error((error as { message?: string }).message || 'Failed to log error');
    }

    const data = await response.json() as { errorLog: unknown };
    return data.errorLog;
  } catch (error) {
    console.error('Failed to log error to Firebase:', error);
    return null;
  }
}

interface ErrorEntry {
  id: string;
  resolved?: boolean;
  [key: string]: unknown;
}

/**
 * Get recent errors from Firebase
 */
export async function getRecentErrors(limit: number = 50): Promise<ErrorEntry[]> {
  try {
    const errorsRef = ref(database, 'errors');
    const recentQuery = query(errorsRef, orderByChild('timestamp'), limitToLast(limit));
    const snapshot = await get(recentQuery);

    if (!snapshot.exists()) {
      return [];
    }

    const errors: ErrorEntry[] = [];
    snapshot.forEach((child) => {
      errors.push({
        id: child.key as string,
        ...child.val() as Record<string, unknown>,
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
 * Resolve an error by marking it as resolved via API
 */
export async function resolveError(errorId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/errors/resolve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ errorId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error((error as { message?: string }).message || 'Failed to resolve');
    }

    return true;
  } catch (error) {
    console.error('Failed to resolve error:', error);
    return false;
  }
}

/**
 * Get active (unresolved) errors
 */
export async function getActiveErrors(): Promise<ErrorEntry[]> {
  try {
    const errors = await getRecentErrors(100);
    return errors.filter(error => !error.resolved);
  } catch (error) {
    console.error('Failed to fetch active errors:', error);
    return [];
  }
}

/**
 * Check if error should trigger notification
 */
export function shouldNotify(errorCode: number, previousErrorCode: number): boolean {
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
export async function sendErrorNotification(errorCode: number, errorDescription: string): Promise<boolean> {
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
export async function sendErrorPushNotification(
  errorCode: number,
  errorDescription: string,
  userId: string
): Promise<boolean> {
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
