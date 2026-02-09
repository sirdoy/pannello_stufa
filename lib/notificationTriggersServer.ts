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
import { getDefaultPreferences } from '@/lib/schemas/notificationPreferences';

/**
 * Notification preferences data from Firebase
 */
interface NotificationPreferencesData {
  enabledTypes?: Record<string, boolean>;
  dndWindows?: unknown[];
  rateLimits?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Trigger notification options
 */
interface TriggerNotificationOptions {
  skipPreferenceCheck?: boolean;
}

/**
 * Type ID Mapping (Legacy → Phase 3 Schema)
 *
 * Maps old notification type IDs to new type names in Phase 3 schema.
 * This allows existing code to use old IDs while new filtering uses new names.
 */
const LEGACY_TYPE_MAPPING = {
  // Errors
  'stove_error_critical': 'CRITICAL',
  'stove_error_error': 'ERROR',
  'stove_error_warning': 'ERROR',
  'stove_error_info': 'ERROR',

  // Scheduler
  'scheduler_ignition': 'scheduler_success',
  'scheduler_shutdown': 'scheduler_success',

  // Maintenance
  'maintenance_80': 'maintenance',
  'maintenance_90': 'maintenance',
  'maintenance_100': 'maintenance',

  // Stove status
  'stove_status_work': 'status',
  'stove_unexpected_off': 'ERROR',

  // Netatmo
  'netatmo_temperature_low': 'status',
  'netatmo_temperature_high': 'status',
  'netatmo_setpoint_reached': 'status',
  'netatmo_connection_lost': 'ERROR',

  // Hue
  'hue_scene_activated': 'status',
  'hue_connection_lost': 'ERROR',

  // System
  'system_update': 'updates',
  'system_offline_commands_synced': 'status',

  // Monitoring
  'monitoring_connection_lost': 'ERROR',
  'monitoring_state_mismatch': 'ERROR',
  'monitoring_stove_error': 'CRITICAL',
};

/**
 * Get new type name from legacy type ID
 * @param {string} legacyTypeId - Old notification type ID
 * @returns {string} New type name for Phase 3 schema
 */
function getNewTypeName(legacyTypeId: string): string {
  return LEGACY_TYPE_MAPPING[legacyTypeId as keyof typeof LEGACY_TYPE_MAPPING] || legacyTypeId;
}

/**
 * Get user notification preferences from Firebase (Phase 3 schema)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User preferences merged with defaults
 */
async function getUserPreferencesServer(userId: string) {
  try {
    // NEW PATH: Phase 3 uses users/{userId}/settings/notifications
    const prefsData = await adminDbGet(`users/${userId}/settings/notifications`) as NotificationPreferencesData | null;

    if (!prefsData) {
      // Return defaults from Phase 3 schema
      return getDefaultPreferences();
    }

    // Merge with defaults to ensure all keys exist
    const defaults = getDefaultPreferences();
    return {
      ...defaults,
      ...prefsData,
      enabledTypes: { ...defaults.enabledTypes, ...prefsData.enabledTypes },
      dndWindows: prefsData.dndWindows || defaults.dndWindows,
      rateLimits: { ...defaults.rateLimits, ...prefsData.rateLimits },
    };

  } catch (error) {
    console.error('[getUserPreferencesServer] Error:', error);
    return getDefaultPreferences();
  }
}

/**
 * Check if notification type is enabled in Phase 3 preferences
 * @param {Object} preferences - User preferences (Phase 3 schema)
 * @param {string} newTypeName - New type name (e.g., 'CRITICAL', 'scheduler_success')
 * @returns {Object} { shouldSend: boolean, reason?: string }
 */
function checkTypeEnabled(preferences: unknown, newTypeName: string) {
  // Type guard for preferences object
  const prefs = preferences as NotificationPreferencesData | null;

  // Check enabledTypes map from Phase 3 schema
  const enabled = prefs?.enabledTypes?.[newTypeName];

  // If type not found in preferences, default to enabled (safe default)
  if (enabled === undefined) {
    return { shouldSend: true };
  }

  return {
    shouldSend: enabled,
    reason: enabled ? undefined : `Type '${newTypeName}' disabled by user`,
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
export async function triggerNotificationServer(
  userId: string,
  typeId: string,
  data: Record<string, unknown> = {},
  options: TriggerNotificationOptions = {}
) {
  try {
    // Get notification type
    const notificationType = NOTIFICATION_TYPES[typeId as keyof typeof NOTIFICATION_TYPES];

    if (!notificationType) {
      console.warn(`Unknown notification type: ${typeId}`);
      return {
        success: false,
        error: `Unknown notification type: ${typeId}`,
      };
    }

    // Check preferences (unless skipped)
    if (!options.skipPreferenceCheck) {
      // Map legacy type ID to new type name (Phase 3 schema)
      const newTypeName = getNewTypeName(typeId);

      const preferences = await getUserPreferencesServer(userId);
      const prefCheck = checkTypeEnabled(preferences, newTypeName);

      if (!prefCheck.shouldSend) {
        console.log(`[Notification] Skipped ${typeId} (${newTypeName}) for ${userId}: ${prefCheck.reason}`);
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

    // Map legacy type ID to new type name for filtering
    const newTypeName = getNewTypeName(typeId);

    // Convert all data values to strings for NotificationPayload
    const dataEntries = Object.entries(payload.data);
    const stringData: Record<string, string> = {};
    for (const [key, value] of dataEntries) {
      stringData[key] = String(value);
    }

    // Prepare notification for sending
    const notification = {
      title: payload.notification.title,
      body: payload.notification.body,
      icon: payload.notification.icon,
      priority: payload.data.priority as 'high' | 'normal',
      data: {
        ...stringData,
        // Override type with new type name for Phase 3 filtering
        type: newTypeName,
        // Keep legacy typeId for backward compatibility
        legacyTypeId: typeId,
      },
    };

    // Send notification (will pass through Phase 3 filter chain)
    const result = await sendNotificationToUser(userId, notification);

    // Extract success/failure counts from multi-device result
    const successCount = 'successCount' in result ? result.successCount : 0;
    const failureCount = 'failureCount' in result ? result.failureCount : 0;

    console.log(`[Notification] Sent ${typeId} to ${userId}: ${successCount} success, ${failureCount} failed`);

    return {
      success: result.success,
      successCount,
      failureCount,
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Notification] Error triggering ${typeId}:`, error);
    return {
      success: false,
      error: errorMessage,
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
export async function triggerNotificationToAdmin(
  typeId: string,
  data: Record<string, unknown> = {},
  options: TriggerNotificationOptions = {}
) {
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
export async function triggerStoveStatusWorkServer(userId: string, data: Record<string, unknown> = {}) {
  return triggerNotificationServer(userId, 'stove_status_work', data);
}

/**
 * Trigger stove unexpected off notification
 * @param {string} userId - User ID
 * @param {Object} data - { message, schedulerName }
 */
export async function triggerStoveUnexpectedOffServer(userId: string, data: Record<string, unknown> = {}) {
  return triggerNotificationServer(userId, 'stove_unexpected_off', data);
}

/**
 * Trigger stove error notification
 * @param {string} userId - User ID
 * @param {string} severity - 'info' | 'warning' | 'error' | 'critical'
 * @param {Object} data - { errorCode, description, message }
 */
export async function triggerStoveErrorServer(userId: string, severity: string, data: Record<string, unknown>) {
  const typeId = `stove_error_${severity.toLowerCase()}`;
  return triggerNotificationServer(userId, typeId, data);
}

/**
 * Trigger scheduler notification
 * @param {string} userId - User ID
 * @param {string} action - 'ignition' | 'shutdown'
 * @param {Object} data - { message }
 */
export async function triggerSchedulerActionServer(userId: string, action: string, data: Record<string, unknown> = {}) {
  const typeId = `scheduler_${action.toLowerCase()}`;
  return triggerNotificationServer(userId, typeId, data);
}

/**
 * Trigger maintenance notification
 * @param {string} userId - User ID (or use triggerNotificationToAdmin)
 * @param {number} threshold - 80 | 90 | 100
 * @param {Object} data - { remainingHours, message }
 */
export async function triggerMaintenanceAlertServer(userId: string, threshold: number, data: Record<string, unknown> = {}) {
  const typeId = `maintenance_${threshold}`;
  return triggerNotificationServer(userId, typeId, data);
}

/**
 * Trigger Netatmo notification
 * @param {string} userId - User ID
 * @param {string} type - 'temperature_low' | 'temperature_high' | 'setpoint_reached' | 'connection_lost'
 * @param {Object} data - { temperature, room, setpoint, message }
 */
export async function triggerNetatmoAlertServer(userId: string, type: string, data: Record<string, unknown> = {}) {
  const typeId = `netatmo_${type}`;
  return triggerNotificationServer(userId, typeId, data);
}

/**
 * Trigger Hue notification
 * @param {string} userId - User ID
 * @param {string} type - 'scene_activated' | 'connection_lost'
 * @param {Object} data - { sceneName, message }
 */
export async function triggerHueAlertServer(userId: string, type: string, data: Record<string, unknown> = {}) {
  const typeId = `hue_${type}`;
  return triggerNotificationServer(userId, typeId, data);
}

/**
 * Trigger system notification
 * @param {string} userId - User ID
 * @param {string} type - 'update' | 'offline_commands_synced'
 * @param {Object} data - { version, count, message }
 */
export async function triggerSystemNotificationServer(userId: string, type: string, data: Record<string, unknown> = {}) {
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
export async function triggerGenericNotificationServer(userId: string, title: string, body: string, options: Record<string, unknown> = {}) {
  return triggerNotificationServer(userId, 'generic', {
    title,
    body,
    ...options,
  });
}

/**
 * Trigger health monitoring alert
 * @param {string} userId - User ID
 * @param {string} alertType - 'connection_lost' | 'state_mismatch' | 'stove_error'
 * @param {Object} data - Alert data (expected, actual, errorCode, errorDescription, message)
 */
export async function triggerHealthMonitoringAlertServer(userId: string, alertType: string, data: Record<string, unknown> = {}) {
  const typeId = `monitoring_${alertType}`;
  return triggerNotificationServer(userId, typeId, data);
}
