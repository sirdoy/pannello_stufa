/**
 * Netatmo API Rate Limiter
 *
 * Per-user rate limiting for Netatmo Schedule API calls
 * Prevents 429 errors by enforcing conservative limits
 *
 * Design:
 * - Per-user tracking with hourly windows
 * - Conservative limit: 400 calls/hour (500 actual limit, 100 buffer)
 * - In-memory Map storage: userId -> { count, windowStart }
 * - Automatic cleanup to prevent memory leaks
 *
 * Rate Limiting Strategy (per 06-RESEARCH.md):
 * - Netatmo limit: 500 calls per hour per account
 * - Conservative buffer: 100 calls (20%)
 * - Effective limit: 400 calls/hour enforced by this limiter
 * - Window: 1 hour rolling
 */

// Constants
export const NETATMO_RATE_LIMIT = 500; // Actual Netatmo limit (calls per hour)
export const NETATMO_CONSERVATIVE_LIMIT = 400; // Enforced limit with buffer
const WINDOW_MS = 60 * 60 * 1000; // 1 hour window

// In-memory storage: Map<string, Object>
// Key: userId (Auth0 sub)
// Value: { count: number, windowStart: number (timestamp) }
const userApiCalls = new Map();

/**
 * Check if Netatmo API call is allowed for user
 *
 * @param {string} userId - User ID (Auth0 sub)
 * @returns {Object} Result object:
 *   - allowed: boolean - Whether API call is allowed
 *   - currentCount: number - Current API calls in window
 *   - remaining: number - Remaining calls in window (if allowed)
 *   - limit: number - Conservative limit (400)
 *   - resetInSeconds: number - Seconds until window resets (if blocked)
 */
export function checkNetatmoRateLimit(userId) {
  const now = Date.now();

  // Get user data (default: fresh window)
  let userData = userApiCalls.get(userId);

  // Initialize or reset if window expired
  if (!userData || (now - userData.windowStart >= WINDOW_MS)) {
    userData = {
      count: 0,
      windowStart: now,
    };
    userApiCalls.set(userId, userData);
  }

  // Check if limit exceeded
  if (userData.count >= NETATMO_CONSERVATIVE_LIMIT) {
    const windowEnd = userData.windowStart + WINDOW_MS;
    const resetInSeconds = Math.ceil((windowEnd - now) / 1000);

    console.log(
      `⏱️ Netatmo rate limit hit: ${userId} - ${userData.count}/${NETATMO_CONSERVATIVE_LIMIT} in window`
    );

    return {
      allowed: false,
      currentCount: userData.count,
      limit: NETATMO_CONSERVATIVE_LIMIT,
      resetInSeconds,
    };
  }

  // Allowed
  const remaining = NETATMO_CONSERVATIVE_LIMIT - userData.count;

  console.log(
    `✅ Netatmo rate limit OK: ${userId} - ${userData.count}/${NETATMO_CONSERVATIVE_LIMIT} (${remaining} remaining)`
  );

  return {
    allowed: true,
    currentCount: userData.count,
    remaining,
    limit: NETATMO_CONSERVATIVE_LIMIT,
  };
}

/**
 * Track a Netatmo API call for a user
 * Call this AFTER successful API call (not before)
 *
 * @param {string} userId - User ID (Auth0 sub)
 * @returns {Object} Updated count info:
 *   - count: number - New count after tracking
 *   - limit: number - Conservative limit (400)
 *   - remaining: number - Remaining calls
 */
export function trackNetatmoApiCall(userId) {
  const now = Date.now();

  // Get or create user data
  let userData = userApiCalls.get(userId);

  if (!userData || (now - userData.windowStart >= WINDOW_MS)) {
    // New window
    userData = {
      count: 1,
      windowStart: now,
    };
  } else {
    // Increment in existing window
    userData.count++;
  }

  userApiCalls.set(userId, userData);

  const remaining = Math.max(0, NETATMO_CONSERVATIVE_LIMIT - userData.count);

  console.log(
    `📊 Netatmo API call tracked: ${userId} - ${userData.count}/${NETATMO_CONSERVATIVE_LIMIT} (${remaining} remaining)`
  );

  return {
    count: userData.count,
    limit: NETATMO_CONSERVATIVE_LIMIT,
    remaining,
  };
}

/**
 * Get current Netatmo rate limit status for a user
 * Useful for debugging and UI display
 *
 * @param {string} userId - User ID
 * @returns {Object} Status object:
 *   - currentCount: number - Current API calls in window
 *   - limit: number - Conservative limit (400)
 *   - remaining: number - Remaining calls in window
 *   - windowStart: number - Window start timestamp
 *   - nextResetIn: number - Seconds until window resets
 */
export function getNetatmoRateLimitStatus(userId) {
  const now = Date.now();
  const userData = userApiCalls.get(userId);

  if (!userData || (now - userData.windowStart >= WINDOW_MS)) {
    // No data or expired window
    return {
      currentCount: 0,
      limit: NETATMO_CONSERVATIVE_LIMIT,
      remaining: NETATMO_CONSERVATIVE_LIMIT,
      windowStart: now,
      nextResetIn: 0,
    };
  }

  const windowEnd = userData.windowStart + WINDOW_MS;
  const nextResetIn = Math.ceil((windowEnd - now) / 1000);
  const remaining = Math.max(0, NETATMO_CONSERVATIVE_LIMIT - userData.count);

  return {
    currentCount: userData.count,
    limit: NETATMO_CONSERVATIVE_LIMIT,
    remaining,
    windowStart: userData.windowStart,
    nextResetIn,
  };
}

/**
 * Periodic cleanup to prevent memory leaks
 * Removes user entries older than 2 hours
 * Runs every 10 minutes
 */
function cleanupOldEntries() {
  const now = Date.now();
  const maxAge = 2 * 60 * 60 * 1000; // 2 hours max retention
  let totalCleaned = 0;

  for (const [userId, userData] of userApiCalls) {
    const age = now - userData.windowStart;

    if (age >= maxAge) {
      // Window expired over 1 hour ago - safe to remove
      userApiCalls.delete(userId);
      totalCleaned++;
    }
  }

  if (totalCleaned > 0) {
    console.log(`🧹 Netatmo rate limiter cleanup: removed ${totalCleaned} expired entries`);
  }
}

// Start cleanup interval (runs every 10 minutes)
const cleanupInterval = setInterval(cleanupOldEntries, 10 * 60 * 1000);

// Cleanup on process exit (prevent dangling interval in tests)
if (typeof process !== 'undefined') {
  process.on('exit', () => {
    clearInterval(cleanupInterval);
  });
}

/**
 * Export internals for testing/debugging
 */
export const _internals = {
  userApiCalls,
  cleanupOldEntries,
  WINDOW_MS,
};
