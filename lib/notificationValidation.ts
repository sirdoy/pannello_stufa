/**
 * Notification Validation Utilities
 *
 * Pure utility functions for validating notification types and statuses.
 * Extracted from notificationHistoryService.js to avoid 'use server' directive conflicts.
 *
 * Note: These are NOT Server Actions - they're synchronous validators.
 */

/**
 * Validate notification type
 *
 * @param {string} type - Type to validate
 * @returns {boolean} True if valid
 */
export function isValidNotificationType(type) {
  const validTypes = ['scheduler', 'error', 'maintenance', 'test', 'generic'];
  return validTypes.includes(type);
}

/**
 * Validate notification status
 *
 * @param {string} status - Status to validate
 * @returns {boolean} True if valid
 */
export function isValidNotificationStatus(status) {
  const validStatuses = ['sent', 'delivered', 'failed'];
  return validStatuses.includes(status);
}
