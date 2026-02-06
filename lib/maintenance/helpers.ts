/**
 * Shared Maintenance Helpers
 *
 * Utility functions used by both client-side and server-side maintenance services.
 */

/**
 * Maintenance notification data
 */
export interface MaintenanceNotificationData {
  notificationLevel: number;
  percentage: number;
  currentHours: number;
  targetHours: number;
  remainingHours: number;
}

/**
 * Check if maintenance notification should be sent
 * Returns notification data if threshold reached, null otherwise
 *
 * @param {number} percentage - Current percentage of target hours used
 * @param {number} currentHours - Current hours worked
 * @param {number} targetHours - Target hours threshold
 * @param {number} lastNotificationLevel - Last notification level sent (0, 80, 90, or 100)
 * @returns {Object|null} Notification data if threshold reached, null otherwise
 */
export function shouldSendMaintenanceNotification(
  percentage: number,
  currentHours: number,
  targetHours: number,
  lastNotificationLevel: number = 0
): MaintenanceNotificationData | null {
  // Determine notification level
  let notificationLevel = 0;
  if (percentage >= 100) notificationLevel = 100;
  else if (percentage >= 90) notificationLevel = 90;
  else if (percentage >= 80) notificationLevel = 80;

  // Only send if we reached a new level
  if (notificationLevel === 0 || notificationLevel <= (lastNotificationLevel || 0)) {
    return null;
  }

  // Calculate remaining hours
  const remainingHours = Math.max(0, targetHours - currentHours);

  // Return notification data
  return {
    notificationLevel,
    percentage,
    currentHours,
    targetHours,
    remainingHours,
  };
}
