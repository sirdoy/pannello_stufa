/**
 * Server-Side Notification Filter
 *
 * Filters notifications based on user preferences before sending.
 * Enforces type toggles and DND (Do Not Disturb) windows.
 *
 * CRITICAL notifications bypass DND hours (per CONTEXT.md decision).
 */

import { getAdminFirestore } from './firebaseAdmin.js';
import { getDefaultPreferences } from './schemas/notificationPreferences.js';

/**
 * Get user preferences from Firestore (server-side)
 * Uses Admin SDK to bypass security rules
 *
 * @param {string} userId - User ID (Auth0 sub)
 * @returns {Promise<Object>} User preferences or defaults
 */
async function getUserPreferencesServer(userId) {
  try {
    const firestore = getAdminFirestore();
    const docRef = firestore
      .collection('users')
      .doc(userId)
      .collection('settings')
      .doc('notifications');

    const doc = await docRef.get();

    if (!doc.exists) {
      console.log(`📋 No preferences found for user ${userId}, using defaults`);
      return getDefaultPreferences();
    }

    const data = doc.data();

    // Merge with defaults to ensure all fields exist
    const defaults = getDefaultPreferences();
    return {
      enabledTypes: { ...defaults.enabledTypes, ...data.enabledTypes },
      dndWindows: data.dndWindows || defaults.dndWindows,
      rateLimits: { ...defaults.rateLimits, ...data.rateLimits },
      timezone: data.timezone || defaults.timezone,
      version: data.version || defaults.version,
      updatedAt: data.updatedAt || defaults.updatedAt,
    };

  } catch (error) {
    console.error('❌ Error fetching user preferences from Firestore:', error);
    // Fail-safe: return defaults if Firestore read fails
    return getDefaultPreferences();
  }
}

/**
 * Check if current time is within a DND window
 *
 * @param {Object} dndWindow - DND window configuration
 * @param {string} dndWindow.startTime - Start time in HH:mm format
 * @param {string} dndWindow.endTime - End time in HH:mm format
 * @param {boolean} dndWindow.enabled - Whether window is active
 * @param {string} timezone - User's timezone (e.g., "Europe/Rome")
 * @returns {boolean} True if currently in DND window
 */
export function isInDNDWindow(dndWindow, timezone = 'UTC') {
  if (!dndWindow.enabled) {
    return false;
  }

  try {
    // Get current time in user's timezone
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const currentTime = formatter.format(now); // Format: "HH:mm"

    // Parse time strings to minutes since midnight
    const parseTime = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const currentMinutes = parseTime(currentTime);
    const startMinutes = parseTime(dndWindow.startTime);
    const endMinutes = parseTime(dndWindow.endTime);

    // Handle overnight periods (e.g., 22:00-08:00)
    if (endMinutes < startMinutes) {
      // Window spans midnight
      // In DND if: currentTime >= startTime OR currentTime < endTime
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    } else {
      // Normal same-day window
      // In DND if: startTime <= currentTime < endTime
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }

  } catch (error) {
    console.error('❌ Error checking DND window:', error);
    // Fail-safe: assume NOT in DND if error
    return false;
  }
}

/**
 * Filter tokens that are currently in DND mode
 * Per-device DND: Each device can have its own DND schedule
 *
 * @param {Array<Object>} tokens - Token objects with deviceId
 * @param {Object} preferences - User preferences
 * @returns {Array<string>} Tokens NOT in DND (allowed)
 */
export function getTokensNotInDND(tokens, preferences) {
  const { dndWindows, timezone } = preferences;

  if (!dndWindows || dndWindows.length === 0) {
    // No DND windows configured, all tokens allowed
    return tokens.map(t => t.token);
  }

  const allowedTokens = [];

  for (const tokenData of tokens) {
    let inDND = false;

    // Check each DND window
    for (const window of dndWindows) {
      // If window has deviceId, apply only to that device
      if (window.deviceId && window.deviceId !== tokenData.deviceId) {
        continue; // Skip this window for this device
      }

      // Check if currently in this DND window
      if (isInDNDWindow(window, timezone)) {
        inDND = true;
        break; // Device is in DND, no need to check other windows
      }
    }

    if (!inDND) {
      allowedTokens.push(tokenData.token);
    }
  }

  return allowedTokens;
}

/**
 * Map notification type to enabledTypes key
 * Handles legacy types gracefully
 *
 * @param {string} notificationType - Notification type from notification.data.type
 * @returns {string} Key in enabledTypes record
 */
function mapNotificationTypeToKey(notificationType) {
  // Direct mapping for known types
  const knownTypes = [
    'CRITICAL',
    'ERROR',
    'INFO',
    'maintenance',
    'updates',
    'scheduler_success',
    'status',
  ];

  if (knownTypes.includes(notificationType)) {
    return notificationType;
  }

  // Legacy/unknown types: allow by default (fail-open)
  console.warn(`⚠️ Unknown notification type: ${notificationType}, allowing by default`);
  return notificationType;
}

/**
 * Filter notification by user preferences
 * Main filtering function - checks type toggles and DND windows
 *
 * @param {string} userId - User ID
 * @param {Object} notification - Notification object
 * @param {Array<Object>} tokens - Token objects with { token, deviceId }
 * @returns {Promise<Object>} Filter result
 */
export async function filterNotificationByPreferences(userId, notification, tokens) {
  try {
    // 1. Get user preferences from Firestore
    const preferences = await getUserPreferencesServer(userId);

    // 2. Extract notification type
    const notificationType = notification.data?.type || 'generic';
    const typeKey = mapNotificationTypeToKey(notificationType);

    // 3. Check if notification type is enabled
    const isTypeEnabled = preferences.enabledTypes[typeKey];

    if (isTypeEnabled === false) {
      console.log(`🚫 Notification type "${notificationType}" disabled for user ${userId}`);
      return {
        allowed: false,
        allowedTokens: [],
        reason: 'type_disabled',
        stats: {
          totalTokens: tokens.length,
          filteredByDND: 0,
          filteredByType: true,
        },
      };
    }

    // 4. Filter tokens by DND windows
    // CRITICAL notifications bypass DND (per CONTEXT.md)
    let allowedTokens;
    let filteredByDNDCount = 0;

    if (notificationType === 'CRITICAL') {
      // CRITICAL bypasses DND - allow all tokens
      allowedTokens = tokens.map(t => t.token);
      console.log(`🔥 CRITICAL notification bypasses DND for user ${userId}`);
    } else {
      // Apply DND filtering
      const tokensBeforeDND = tokens.length;
      allowedTokens = getTokensNotInDND(tokens, preferences);
      filteredByDNDCount = tokensBeforeDND - allowedTokens.length;

      if (filteredByDNDCount > 0) {
        console.log(`🌙 Filtered ${filteredByDNDCount}/${tokensBeforeDND} tokens by DND for user ${userId}`);
      }
    }

    // 5. Check if all tokens were filtered
    if (allowedTokens.length === 0) {
      console.log(`🚫 All devices in DND mode for user ${userId}`);
      return {
        allowed: false,
        allowedTokens: [],
        reason: 'all_in_dnd',
        stats: {
          totalTokens: tokens.length,
          filteredByDND: filteredByDNDCount,
          filteredByType: false,
        },
      };
    }

    // 6. Notification allowed
    console.log(`✅ Notification allowed: ${allowedTokens.length}/${tokens.length} devices for user ${userId}`);
    return {
      allowed: true,
      allowedTokens,
      reason: null,
      stats: {
        totalTokens: tokens.length,
        filteredByDND: filteredByDNDCount,
        filteredByType: false,
      },
    };

  } catch (error) {
    console.error('❌ Error filtering notification by preferences:', error);

    // Fail-safe: allow notification if filtering fails
    // Better to send unwanted notification than miss critical alert
    return {
      allowed: true,
      allowedTokens: tokens.map(t => t.token),
      reason: null,
      stats: {
        totalTokens: tokens.length,
        filteredByDND: 0,
        filteredByType: false,
        error: error.message,
      },
    };
  }
}
