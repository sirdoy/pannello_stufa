/**
 * Vibration Service
 *
 * Provides haptic feedback for critical alerts and notifications.
 * Useful for stove errors, maintenance alerts, and important events.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API
 */

/**
 * Predefined vibration patterns
 * Each pattern is an array of [vibrate, pause, vibrate, pause, ...]
 */
export const VIBRATION_PATTERNS = {
  // Short single vibration - for confirmations
  SHORT: [100],

  // Medium single vibration - for general notifications
  MEDIUM: [200],

  // Long single vibration - for important notifications
  LONG: [500],

  // Double tap - for success
  SUCCESS: [100, 50, 100],

  // Triple tap - for warnings
  WARNING: [100, 50, 100, 50, 100],

  // SOS pattern - for critical errors
  ERROR: [200, 100, 200, 100, 200],

  // Urgent alert - for critical stove errors
  CRITICAL: [300, 100, 300, 100, 300, 100, 300],

  // Heartbeat - for connection restored
  HEARTBEAT: [100, 200, 100],

  // Notification - standard notification pattern
  NOTIFICATION: [200, 100, 200],
};

/**
 * Check if Vibration API is supported
 * @returns {boolean}
 */
export function isVibrationSupported() {
  return 'vibrate' in navigator;
}

/**
 * Vibrate with a pattern or duration
 * @param {number|number[]} pattern - Duration in ms or pattern array
 * @returns {boolean} True if vibration started
 */
export function vibrate(pattern = VIBRATION_PATTERNS.SHORT) {
  if (!isVibrationSupported()) {
    console.warn('[Vibration] API not supported');
    return false;
  }

  try {
    return navigator.vibrate(pattern);
  } catch (error) {
    console.error('[Vibration] Error:', error);
    return false;
  }
}

/**
 * Stop any ongoing vibration
 * @returns {boolean}
 */
export function stopVibration() {
  if (!isVibrationSupported()) {
    return false;
  }

  return navigator.vibrate(0);
}

/**
 * Vibrate for a short confirmation
 */
export function vibrateShort() {
  return vibrate(VIBRATION_PATTERNS.SHORT);
}

/**
 * Vibrate for success feedback
 */
export function vibrateSuccess() {
  return vibrate(VIBRATION_PATTERNS.SUCCESS);
}

/**
 * Vibrate for warning
 */
export function vibrateWarning() {
  return vibrate(VIBRATION_PATTERNS.WARNING);
}

/**
 * Vibrate for error alert
 */
export function vibrateError() {
  return vibrate(VIBRATION_PATTERNS.ERROR);
}

/**
 * Vibrate for critical alert (stove error, etc.)
 */
export function vibrateCritical() {
  return vibrate(VIBRATION_PATTERNS.CRITICAL);
}

/**
 * Vibrate for notification
 */
export function vibrateNotification() {
  return vibrate(VIBRATION_PATTERNS.NOTIFICATION);
}

/**
 * Vibrate for heartbeat (connection restored)
 */
export function vibrateHeartbeat() {
  return vibrate(VIBRATION_PATTERNS.HEARTBEAT);
}

export default {
  isSupported: isVibrationSupported,
  vibrate,
  stop: stopVibration,
  short: vibrateShort,
  success: vibrateSuccess,
  warning: vibrateWarning,
  error: vibrateError,
  critical: vibrateCritical,
  notification: vibrateNotification,
  heartbeat: vibrateHeartbeat,
  patterns: VIBRATION_PATTERNS,
};
