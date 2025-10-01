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
 * These will be expanded as we discover more error codes
 */
export const ERROR_CODES = {
  0: { description: 'Nessun errore', severity: ERROR_SEVERITY.INFO },
  // Add more error codes as they are discovered
  // Example:
  // 1: { description: 'Pellet esaurito', severity: ERROR_SEVERITY.CRITICAL },
  // 2: { description: 'Errore accensione', severity: ERROR_SEVERITY.ERROR },
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
