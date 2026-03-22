/**
 * Notification Actions Module
 *
 * Shared constants and feature detection for interactive push notifications.
 * Used by both server-side FCM payload construction and service worker action handlers.
 *
 * Features:
 * - Action ID constants (prevents typos between server and client)
 * - Action category constants (for iOS aps.category and Android clickAction)
 * - Action definition factory functions
 * - Feature detection for notification action support
 * - Notification type to action mapping
 */

/**
 * Action ID constants
 * Used in webpush.notification.actions array and service worker notificationclick handler
 */
export const NOTIFICATION_ACTIONS = {
  STOVE_SHUTDOWN: 'stove-shutdown',
  STOVE_VIEW_DETAILS: 'view-details',
  THERMOSTAT_MANUAL: 'thermostat-manual',
  THERMOSTAT_VIEW: 'thermostat-view',
} as const;

/**
 * Action category constants
 * Used for iOS aps.category (native app action categories) and Android clickAction (intent filtering)
 */
export const ACTION_CATEGORIES = {
  STOVE_ERROR: 'STOVE_ERROR_ACTIONS',
  STOVE_STATUS: 'STOVE_STATUS_ACTIONS',
  THERMOSTAT_ALERT: 'THERMOSTAT_ALERT_ACTIONS',
  MAINTENANCE: 'MAINTENANCE_ACTIONS',
} as const;

/**
 * Notification action definition
 * Matches Web Push Notification Action API shape
 */
export interface NotificationActionDef {
  action: string;
  title: string;
  icon?: string;
}

/**
 * Get stove-related notification actions
 * Used for error notifications and unexpected off alerts
 */
export function getStoveActions(): NotificationActionDef[] {
  return [
    { action: NOTIFICATION_ACTIONS.STOVE_SHUTDOWN, title: 'Spegni stufa' },
    { action: NOTIFICATION_ACTIONS.STOVE_VIEW_DETAILS, title: 'Dettagli' },
  ];
}

/**
 * Get thermostat-related notification actions
 * Used for Netatmo alerts and temperature-related notifications
 */
export function getThermostatActions(): NotificationActionDef[] {
  return [
    { action: NOTIFICATION_ACTIONS.THERMOSTAT_MANUAL, title: 'Imposta manuale' },
    { action: NOTIFICATION_ACTIONS.THERMOSTAT_VIEW, title: 'Dettagli' },
  ];
}

/**
 * Feature detection: check if browser supports notification actions
 * Guards against SSR and browsers without notification action support
 *
 * @returns {boolean} True if browser supports notification actions
 */
export function supportsNotificationActions(): boolean {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;
  try {
    return 'maxActions' in Notification && (Notification as any).maxActions > 0;
  } catch {
    return false;
  }
}

/**
 * Get comprehensive notification capabilities
 * Useful for feature detection UI and debugging
 *
 * @returns {object} Capability details
 */
export function getNotificationCapabilities() {
  if (typeof window === 'undefined') {
    return { supported: false, actions: false, maxActions: 0, platform: 'server' as const };
  }
  const supported = 'Notification' in window && 'serviceWorker' in navigator;
  let maxActions = 0;
  try {
    if ('Notification' in window && 'maxActions' in Notification) {
      maxActions = (Notification as any).maxActions;
    }
  } catch {
    /* ignore */
  }
  return {
    supported,
    actions: maxActions > 0,
    maxActions,
    platform: (/iphone|ipad|ipod/i.test(navigator.userAgent) ? 'ios' : 'other') as 'ios' | 'other',
  };
}

/**
 * Map notification type ID to appropriate action definitions
 * Returns null for notification types that don't have actions
 *
 * @param {string} typeId - Notification type ID (e.g., 'stove_error_AL03', 'netatmo_unreachable')
 * @returns {NotificationActionDef[] | null} Action definitions or null
 */
export function getActionsForNotificationType(typeId: string): NotificationActionDef[] | null {
  // Stove error/critical notifications get shutdown action
  if (typeId.startsWith('stove_error') || typeId === 'monitoring_stove_error') {
    return getStoveActions();
  }
  // Stove unexpected off gets shutdown action
  if (typeId === 'stove_unexpected_off') {
    return getStoveActions();
  }
  // Thermostat/Netatmo alerts get manual mode action
  if (typeId.startsWith('netatmo_')) {
    return getThermostatActions();
  }
  // No actions for other types (scheduler, maintenance, system)
  return null;
}
