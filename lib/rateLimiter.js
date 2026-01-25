/**
 * Rate Limiter for Notifications
 *
 * In-memory rate limiting scoped to notification TYPE (not category)
 * Prevents notification spam by enforcing configurable time windows per type
 *
 * Design:
 * - Per-type rate limits (scheduler_success, ERROR, CRITICAL, etc.)
 * - In-memory Map storage: userId:notifType -> [timestamps]
 * - Automatic cleanup to prevent memory leaks
 * - Respects user custom limits from preferences
 *
 * Rate Limiting Strategy (per 03-CONTEXT.md):
 * - Different types have different default limits
 * - CRITICAL has higher limit (max 5 per minute)
 * - Routine notifications more conservative (max 1 per 5 min)
 * - User preferences can override defaults
 */

// In-memory storage: Map<string, number[]>
// Key format: "userId:notificationType"
// Value: Array of timestamps (ms) when notifications were sent
const recentSends = new Map();

/**
 * Default rate limits per notification type
 * Per CONTEXT.md: Different types have different windows
 *
 * Format:
 * - windowMinutes: Time window for rate limiting
 * - maxPerWindow: Maximum notifications allowed in window
 */
const DEFAULT_RATE_LIMITS = {
  // CRITICAL: Higher limit (allow rapid alerts for critical issues)
  CRITICAL: { windowMinutes: 1, maxPerWindow: 5 },

  // Errors: Moderate limit
  ERROR: { windowMinutes: 1, maxPerWindow: 3 },

  // Maintenance notifications
  maintenance: { windowMinutes: 5, maxPerWindow: 1 },

  // System updates
  updates: { windowMinutes: 60, maxPerWindow: 1 }, // Max 1 per hour

  // Scheduler success (per success criteria #3: 3 events in 4 min → 1 notification)
  scheduler_success: { windowMinutes: 5, maxPerWindow: 1 },

  // Status updates
  status: { windowMinutes: 5, maxPerWindow: 1 },

  // Default for unrecognized types
  default: { windowMinutes: 5, maxPerWindow: 1 },
};

/**
 * Check if notification is allowed by rate limit
 *
 * @param {string} userId - User ID (Auth0 sub)
 * @param {string} notifType - Notification type (e.g., 'scheduler_success', 'CRITICAL')
 * @param {Object|null} customLimits - Optional custom limits { windowMinutes, maxPerWindow }
 * @returns {Object} Result object:
 *   - allowed: boolean - Whether notification is allowed
 *   - suppressedCount: number - How many notifications in current window
 *   - nextAllowedIn: number - Seconds until next notification allowed (0 if allowed)
 */
export function checkRateLimit(userId, notifType, customLimits = null) {
  const key = `${userId}:${notifType}`;
  const now = Date.now();

  // Get limits (priority: customLimits > defaults for type > default)
  const limits = customLimits || DEFAULT_RATE_LIMITS[notifType] || DEFAULT_RATE_LIMITS.default;
  const windowMs = limits.windowMinutes * 60 * 1000;

  // Get recent sends for this key
  const sends = recentSends.get(key) || [];

  // Filter to current window (remove timestamps outside window)
  const recentInWindow = sends.filter(ts => now - ts < windowMs);

  // Check if limit exceeded
  if (recentInWindow.length >= limits.maxPerWindow) {
    // Calculate when next send is allowed
    // Next allowed = oldest timestamp in window + window duration
    const oldestInWindow = Math.min(...recentInWindow);
    const nextAllowedIn = (oldestInWindow + windowMs) - now;

    console.log(
      `⏱️ Rate limit hit: ${userId}:${notifType} - ${recentInWindow.length}/${limits.maxPerWindow} in ${limits.windowMinutes}min window`
    );

    return {
      allowed: false,
      suppressedCount: recentInWindow.length,
      nextAllowedIn: Math.ceil(nextAllowedIn / 1000), // Convert to seconds
    };
  }

  // Allowed - track this send
  recentInWindow.push(now);
  recentSends.set(key, recentInWindow);

  console.log(
    `✅ Rate limit OK: ${userId}:${notifType} - ${recentInWindow.length}/${limits.maxPerWindow} in window`
  );

  return {
    allowed: true,
    suppressedCount: 0,
    nextAllowedIn: 0,
  };
}

/**
 * Clear all rate limit entries for a user
 * Useful for testing and user-requested reset
 *
 * @param {string} userId - User ID to clear
 * @returns {number} Number of entries cleared
 */
export function clearRateLimitForUser(userId) {
  let clearedCount = 0;

  for (const key of recentSends.keys()) {
    if (key.startsWith(`${userId}:`)) {
      recentSends.delete(key);
      clearedCount++;
    }
  }

  console.log(`🧹 Cleared ${clearedCount} rate limit entries for user ${userId}`);
  return clearedCount;
}

/**
 * Get current rate limit status for a user+type
 * Useful for debugging and UI display
 *
 * @param {string} userId - User ID
 * @param {string} notifType - Notification type
 * @returns {Object} Status object:
 *   - currentCount: number - Current notifications in window
 *   - maxAllowed: number - Max allowed in window
 *   - windowMinutes: number - Window duration
 *   - nextResetIn: number - Seconds until window resets (0 if empty)
 */
export function getRateLimitStatus(userId, notifType) {
  const key = `${userId}:${notifType}`;
  const now = Date.now();

  const limits = DEFAULT_RATE_LIMITS[notifType] || DEFAULT_RATE_LIMITS.default;
  const windowMs = limits.windowMinutes * 60 * 1000;

  const sends = recentSends.get(key) || [];
  const recentInWindow = sends.filter(ts => now - ts < windowMs);

  let nextResetIn = 0;
  if (recentInWindow.length > 0) {
    const oldestInWindow = Math.min(...recentInWindow);
    nextResetIn = Math.ceil(((oldestInWindow + windowMs) - now) / 1000);
  }

  return {
    currentCount: recentInWindow.length,
    maxAllowed: limits.maxPerWindow,
    windowMinutes: limits.windowMinutes,
    nextResetIn,
  };
}

/**
 * Periodic cleanup to prevent memory leaks
 * Removes entries older than max retention period (1 hour)
 * Runs every 5 minutes
 */
function cleanupOldEntries() {
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 hour max retention
  let totalCleaned = 0;

  for (const [key, sends] of recentSends) {
    // Filter out timestamps older than maxAge
    const filtered = sends.filter(ts => now - ts < maxAge);

    if (filtered.length === 0) {
      // No recent sends - remove key entirely
      recentSends.delete(key);
      totalCleaned++;
    } else if (filtered.length < sends.length) {
      // Some sends removed - update array
      recentSends.set(key, filtered);
    }
  }

  if (totalCleaned > 0) {
    console.log(`🧹 Rate limiter cleanup: removed ${totalCleaned} expired entries`);
  }
}

// Start cleanup interval (runs every 5 minutes)
const cleanupInterval = setInterval(cleanupOldEntries, 5 * 60 * 1000);

// Cleanup on process exit (prevent dangling interval in tests)
if (typeof process !== 'undefined') {
  process.on('exit', () => {
    clearInterval(cleanupInterval);
  });
}

/**
 * Export defaults for testing/debugging
 */
export const _internals = {
  DEFAULT_RATE_LIMITS,
  recentSends,
  cleanupOldEntries,
};
