/**
 * Notification Triggers Server-Side Helper
 *
 * Helper per triggerare notifiche da API routes e server components.
 * Verifica automaticamente le preferenze utente prima dell'invio.
 *
 * Usage in API routes:
 *   import { triggerNotificationServer } from '@/lib/notificationTriggersServer';
 *
 *   // In your API route handler:
 *   await triggerNotificationServer(userId, 'stove_error_critical', {
 *     errorCode: 'E01',
 *     description: 'Errore critico',
 *   });
 */

import { adminDbGet } from '@/lib/firebaseAdmin';
import { sendNotificationToUser } from '@/lib/firebaseAdmin';
import {
  NOTIFICATION_TYPES,
  buildNotificationPayload,
} from '@/lib/notificationTriggers';

/**
 * Default preferences (matches client-side defaults)
 */
const DEFAULT_PREFERENCES = {
  stove: {
    enabled: true,
    statusWork: true,
    unexpectedOff: true,
  },
  errors: {
    enabled: true,
    severityLevels: {
      info: false,
      warning: true,
      error: true,
      critical: true,
    },
  },
  scheduler: {
    enabled: true,
    ignition: true,
    shutdown: true,
  },
  maintenance: {
    enabled: true,
    threshold80: true,
    threshold90: true,
    threshold100: true,
  },
  netatmo: {
    enabled: false, // Default disabled - user must enable
    temperatureLow: false,
    temperatureHigh: false,
    setpointReached: false,
    connectionLost: true, // Except connection issues
  },
  hue: {
    enabled: false, // Default disabled
    sceneActivated: false,
    connectionLost: true,
  },
  system: {
    enabled: true,
    updates: true,
    offlineSync: true,
  },
};

/**
 * Get user notification preferences from Firebase
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User preferences merged with defaults
 */
async function getUserPreferencesServer(userId) {
  try {
    const prefs = await adminDbGet(`users/${userId}/notificationPreferences`);

    if (!prefs) {
      return DEFAULT_PREFERENCES;
    }

    // Deep merge with defaults to ensure all keys exist
    return deepMerge(DEFAULT_PREFERENCES, prefs);

  } catch (error) {
    console.error('Error getting user preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Deep merge two objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

/**
 * Check if notification should be sent based on user preferences
 * @param {Object} preferences - User preferences
 * @param {Object} notificationType - Notification type definition
 * @returns {Object} { shouldSend: boolean, reason?: string }
 */
function checkPreferences(preferences, notificationType) {
  // Generic notifications always send (no preference key)
  if (!notificationType.preferenceKey) {
    return { shouldSend: true };
  }

  const { category, preferenceKey } = notificationType;

  // Check category master toggle
  const categoryPrefs = preferences[category];
  if (!categoryPrefs?.enabled) {
    return {
      shouldSend: false,
      reason: `Category '${category}' disabled`,
    };
  }

  // Check specific preference
  // preferenceKey format: "category.subKey" or "category.nested.key"
  const keys = preferenceKey.split('.');
  let value = preferences;

  for (const key of keys) {
    if (value === undefined || value === null) {
      // Key not found, use default from notification type
      return { shouldSend: notificationType.defaultEnabled };
    }
    value = value[key];
  }

  if (typeof value !== 'boolean') {
    // Not a boolean, use default
    return { shouldSend: notificationType.defaultEnabled };
  }

  return {
    shouldSend: value,
    reason: value ? undefined : `Preference '${preferenceKey}' disabled`,
  };
}

/**
 * Trigger notification (server-side)
 *
 * Use this in API routes, cron jobs, and server components.
 * Automatically checks user preferences before sending.
 *
 * @param {string} userId - Target user ID
 * @param {string} typeId - Notification type ID (from NOTIFICATION_TYPES)
 * @param {Object} data - Dynamic data for the notification
 * @param {Object} options - Additional options
 * @param {boolean} options.skipPreferenceCheck - Skip preference checking (emergency notifications)
 * @returns {Promise<Object>} Result with success/skipped/error
 */
export async function triggerNotificationServer(userId, typeId, data = {}, options = {}) {
  try {
    // Get notification type
    const notificationType = NOTIFICATION_TYPES[typeId];

    if (!notificationType) {
      console.warn(`Unknown notification type: ${typeId}`);
      return {
        success: false,
        error: `Unknown notification type: ${typeId}`,
      };
    }

    // Check preferences (unless skipped)
    if (!options.skipPreferenceCheck) {
      const preferences = await getUserPreferencesServer(userId);
      const prefCheck = checkPreferences(preferences, notificationType);

      if (!prefCheck.shouldSend) {
        console.log(`[Notification] Skipped ${typeId} for ${userId}: ${prefCheck.reason}`);
        return {
          success: true,
          skipped: true,
          reason: prefCheck.reason,
        };
      }
    }

    // Build notification payload
    const payload = buildNotificationPayload(typeId, data);

    if (!payload) {
      return {
        success: false,
        error: 'Failed to build notification payload',
      };
    }

    // Prepare notification for sending
    const notification = {
      title: payload.notification.title,
      body: payload.notification.body,
      icon: payload.notification.icon,
      priority: payload.data.priority,
      data: payload.data,
    };

    // Send notification
    const result = await sendNotificationToUser(userId, notification);

    console.log(`[Notification] Sent ${typeId} to ${userId}: ${result.successCount} success, ${result.failureCount} failed`);

    return {
      success: result.success,
      successCount: result.successCount,
      failureCount: result.failureCount,
    };

  } catch (error) {
    console.error(`[Notification] Error triggering ${typeId}:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Trigger notification to admin user
 *
 * Useful for system notifications that should go to the admin.
 *
 * @param {string} typeId - Notification type ID
 * @param {Object} data - Dynamic data
 * @param {Object} options - Additional options
 */
export async function triggerNotificationToAdmin(typeId, data = {}, options = {}) {
  const adminUserId = process.env.ADMIN_USER_ID;

  if (!adminUserId) {
    console.warn('[Notification] ADMIN_USER_ID not configured');
    return {
      success: false,
      error: 'ADMIN_USER_ID not configured',
    };
  }

  return triggerNotificationServer(adminUserId, typeId, data, options);
}

// =============================================================================
// HELPER FUNCTIONS (shortcuts for common notification types)
// =============================================================================

/**
 * Trigger stove status notification (entering WORK state)
 * @param {string} userId - User ID
 * @param {Object} data - { message }
 */
export async function triggerStoveStatusWorkServer(userId, data = {}) {
  return triggerNotificationServer(userId, 'stove_status_work', data);
}

/**
 * Trigger stove unexpected off notification
 * @param {string} userId - User ID
 * @param {Object} data - { message, schedulerName }
 */
export async function triggerStoveUnexpectedOffServer(userId, data = {}) {
  return triggerNotificationServer(userId, 'stove_unexpected_off', data);
}

/**
 * Trigger stove error notification
 * @param {string} userId - User ID
 * @param {string} severity - 'info' | 'warning' | 'error' | 'critical'
 * @param {Object} data - { errorCode, description, message }
 */
export async function triggerStoveErrorServer(userId, severity, data) {
  const typeId = `stove_error_${severity.toLowerCase()}`;
  return triggerNotificationServer(userId, typeId, data);
}

/**
 * Trigger scheduler notification
 * @param {string} userId - User ID
 * @param {string} action - 'ignition' | 'shutdown'
 * @param {Object} data - { message }
 */
export async function triggerSchedulerActionServer(userId, action, data = {}) {
  const typeId = `scheduler_${action.toLowerCase()}`;
  return triggerNotificationServer(userId, typeId, data);
}

/**
 * Trigger maintenance notification
 * @param {string} userId - User ID (or use triggerNotificationToAdmin)
 * @param {number} threshold - 80 | 90 | 100
 * @param {Object} data - { remainingHours, message }
 */
export async function triggerMaintenanceAlertServer(userId, threshold, data = {}) {
  const typeId = `maintenance_${threshold}`;
  return triggerNotificationServer(userId, typeId, data);
}

/**
 * Trigger Netatmo notification
 * @param {string} userId - User ID
 * @param {string} type - 'temperature_low' | 'temperature_high' | 'setpoint_reached' | 'connection_lost'
 * @param {Object} data - { temperature, room, setpoint, message }
 */
export async function triggerNetatmoAlertServer(userId, type, data = {}) {
  const typeId = `netatmo_${type}`;
  return triggerNotificationServer(userId, typeId, data);
}

/**
 * Trigger Hue notification
 * @param {string} userId - User ID
 * @param {string} type - 'scene_activated' | 'connection_lost'
 * @param {Object} data - { sceneName, message }
 */
export async function triggerHueAlertServer(userId, type, data = {}) {
  const typeId = `hue_${type}`;
  return triggerNotificationServer(userId, typeId, data);
}

/**
 * Trigger system notification
 * @param {string} userId - User ID
 * @param {string} type - 'update' | 'offline_commands_synced'
 * @param {Object} data - { version, count, message }
 */
export async function triggerSystemNotificationServer(userId, type, data = {}) {
  const typeId = `system_${type}`;
  return triggerNotificationServer(userId, typeId, data);
}

/**
 * Trigger generic notification (bypasses preference check)
 * @param {string} userId - User ID
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} options - { url, priority }
 */
export async function triggerGenericNotificationServer(userId, title, body, options = {}) {
  return triggerNotificationServer(userId, 'generic', {
    title,
    body,
    ...options,
  });
}
