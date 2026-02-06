/**
 * Notification Filter Chain
 *
 * Filters notifications based on user preferences before sending
 * Implements three-stage filtering (per 03-CONTEXT.md):
 * 1. Type enabled check (fastest - bail early)
 * 2. Rate limit check (in-memory - fast)
 * 3. DND window check (per-device - more complex)
 *
 * Integration:
 * - Called by server-side notification send logic
 * - Returns { allowed, allowedTokens, reason, stats }
 * - Respects user preferences from Firebase
 *
 * Filtering Order Rationale:
 * - Type check first: Fastest, eliminates notifications early
 * - Rate limit second: In-memory lookup, prevents spam
 * - DND last: More complex (per-device timezone checks)
 */

import { checkRateLimit } from './rateLimiter';

/**
 * Filter notification based on user preferences
 *
 * @param {string} userId - User ID (Auth0 sub)
 * @param {string} notifType - Notification type (e.g., 'scheduler_success', 'CRITICAL')
 * @param {Object} preferences - User notification preferences from Firebase
 * @param {Array<Object>} tokens - Array of FCM tokens with device info
 *   Each token: { token: string, deviceId: string, ... }
 * @returns {Object} Filter result:
 *   - allowed: boolean - Whether notification should be sent
 *   - allowedTokens: Array<string> - Filtered FCM tokens (after DND)
 *   - reason: string - Why filtered (if not allowed)
 *   - stats: Object - Filter statistics
 */
export function filterNotificationByPreferences(userId, notifType, preferences, tokens) {
  // Safety check
  if (!userId || !notifType || !tokens || tokens.length === 0) {
    return {
      allowed: false,
      allowedTokens: [],
      reason: 'invalid_input',
      stats: {
        totalTokens: tokens?.length || 0,
        filteredByType: false,
        rateLimited: false,
        filteredByDND: 0,
      },
    };
  }

  // STAGE 1: Type enabled check
  // Fastest check - if type disabled globally, bail immediately
  const typeEnabled = preferences?.enabledTypes?.[notifType] ?? true; // Default to enabled

  if (!typeEnabled) {
    console.log(`🚫 Type disabled: ${userId}:${notifType}`);
    return {
      allowed: false,
      allowedTokens: [],
      reason: 'type_disabled',
      stats: {
        totalTokens: tokens.length,
        filteredByType: true,
        rateLimited: false,
        filteredByDND: 0,
      },
    };
  }

  // STAGE 2: Rate limit check
  // Check if this notification type is being sent too frequently
  const userRateLimits = preferences?.rateLimits?.[notifType]; // User custom limits
  const rateLimitResult = checkRateLimit(userId, notifType, userRateLimits);

  if (!rateLimitResult.allowed) {
    console.log(
      `⏱️ Rate limit hit for ${userId}:${notifType}, suppressed ${rateLimitResult.suppressedCount} in window`
    );
    return {
      allowed: false,
      allowedTokens: [],
      reason: 'rate_limited',
      stats: {
        totalTokens: tokens.length,
        filteredByType: false,
        rateLimited: true,
        suppressedCount: rateLimitResult.suppressedCount,
        nextAllowedIn: rateLimitResult.nextAllowedIn,
        filteredByDND: 0,
      },
    };
  }

  // STAGE 3: DND window check (per-device)
  // Filter tokens based on per-device DND windows
  const allowedTokens = filterTokensByDND(userId, notifType, preferences, tokens);

  const filteredCount = tokens.length - allowedTokens.length;

  if (allowedTokens.length === 0) {
    console.log(`🌙 All devices in DND: ${userId}:${notifType} (${filteredCount} filtered)`);
    return {
      allowed: false,
      allowedTokens: [],
      reason: 'all_devices_dnd',
      stats: {
        totalTokens: tokens.length,
        filteredByType: false,
        rateLimited: false,
        filteredByDND: filteredCount,
      },
    };
  }

  // Notification allowed
  console.log(
    `✅ Notification allowed: ${userId}:${notifType} - ${allowedTokens.length}/${tokens.length} devices (${filteredCount} in DND)`
  );

  return {
    allowed: true,
    allowedTokens,
    reason: null,
    stats: {
      totalTokens: tokens.length,
      filteredByType: false,
      rateLimited: false,
      filteredByDND: filteredCount,
    },
  };
}

/**
 * Filter tokens based on DND windows (per-device)
 * Per 03-CONTEXT.md: CRITICAL notifications bypass DND, all others dropped
 *
 * @param {string} userId - User ID
 * @param {string} notifType - Notification type
 * @param {Object} preferences - User preferences
 * @param {Array<Object>} tokens - FCM tokens with device info
 * @returns {Array<string>} Filtered FCM tokens (only devices not in DND)
 */
function filterTokensByDND(userId, notifType, preferences, tokens) {
  // CRITICAL notifications bypass DND (per CONTEXT.md)
  if (notifType === 'CRITICAL') {
    console.log(`🚨 CRITICAL notification bypasses DND for ${userId}`);
    return tokens.map(t => t.token);
  }

  // Get DND windows from preferences
  const dndWindows = preferences?.dndWindows || [];

  // If no DND windows configured, allow all tokens
  if (dndWindows.length === 0) {
    return tokens.map(t => t.token);
  }

  const now = new Date();
  const allowedTokens = [];

  for (const tokenObj of tokens) {
    const deviceId = tokenObj.deviceId;

    // Check if this device is in any active DND window
    const inDND = isDeviceInDND(deviceId, dndWindows, now, preferences.timezone);

    if (!inDND) {
      allowedTokens.push(tokenObj.token);
    } else {
      console.log(`🌙 Device ${deviceId} in DND, filtering token`);
    }
  }

  return allowedTokens;
}

/**
 * Check if a device is currently in a DND window
 *
 * @param {string} deviceId - Device ID to check
 * @param {Array<Object>} dndWindows - DND window configurations
 * @param {Date} now - Current time
 * @param {string} timezone - User's timezone (e.g., 'Europe/Rome')
 * @returns {boolean} True if device is in DND
 */
function isDeviceInDND(deviceId, dndWindows, now, timezone) {
  // Filter to windows for this device (or global windows without deviceId)
  const relevantWindows = dndWindows.filter(
    w => w.enabled && (!w.deviceId || w.deviceId === deviceId)
  );

  if (relevantWindows.length === 0) {
    return false;
  }

  // Get current time in user's timezone
  // Use Intl.DateTimeFormat to get local time components
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone || 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const currentTime = formatter.format(now); // Format: "HH:mm"

  // Check if current time falls in any DND window
  for (const window of relevantWindows) {
    if (isTimeInWindow(currentTime, window.startTime, window.endTime)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if current time falls within a DND window
 * Handles overnight windows (e.g., 22:00-08:00)
 *
 * @param {string} currentTime - Current time in HH:mm format
 * @param {string} startTime - Window start in HH:mm format
 * @param {string} endTime - Window end in HH:mm format
 * @returns {boolean} True if current time is in window
 */
function isTimeInWindow(currentTime, startTime, endTime) {
  // Convert HH:mm to minutes since midnight for comparison
  const toMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const current = toMinutes(currentTime);
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);

  // Handle overnight windows (e.g., 22:00-08:00)
  if (start > end) {
    // Window spans midnight
    return current >= start || current < end;
  } else {
    // Normal window within same day
    return current >= start && current < end;
  }
}

/**
 * Get human-readable filter reason message
 * Used in notification logs and error responses
 *
 * @param {string} reason - Filter reason code
 * @returns {string} Human-readable message
 */
export function getFilterMessage(reason) {
  const messages = {
    invalid_input: 'Invalid filter input (missing userId, type, or tokens)',
    type_disabled: 'Notification type disabled by user preferences',
    rate_limited: 'Rate limit exceeded, notification suppressed',
    all_devices_dnd: 'All devices in Do Not Disturb mode',
  };

  return messages[reason] || `Unknown filter reason: ${reason}`;
}

/**
 * Export internals for testing
 */
export const _internals = {
  filterTokensByDND,
  isDeviceInDND,
  isTimeInWindow,
};
