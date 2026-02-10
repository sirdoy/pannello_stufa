/**
 * Netatmo API Rate Limiter
 *
 * Feature-flagged rate limiting with persistent fallback.
 * When USE_PERSISTENT_RATE_LIMITER=true, uses Firebase RTDB.
 * When false or Firebase fails, falls back to in-memory limiter.
 *
 * Design:
 * - Per-user tracking with hourly windows
 * - Conservative limit: 400 calls/hour (500 actual limit, 100 buffer)
 * - Feature flag controls implementation (persistent vs in-memory)
 * - Graceful fallback on Firebase errors
 *
 * Rate Limiting Strategy (per 06-RESEARCH.md):
 * - Netatmo limit: 500 calls per hour per account
 * - Conservative buffer: 100 calls (20%)
 * - Effective limit: 400 calls/hour enforced by this limiter
 * - Window: 1 hour rolling
 */

// Feature flag: enables Firebase RTDB-backed persistent rate limiting
const USE_PERSISTENT = process.env.USE_PERSISTENT_RATE_LIMITER === 'true';

// Constants
export const NETATMO_RATE_LIMIT = 500; // Actual Netatmo limit (calls per hour)
export const NETATMO_CONSERVATIVE_LIMIT = 400; // Enforced limit with buffer
const WINDOW_MS = 60 * 60 * 1000; // 1 hour window

/** Rate limit state per user */
interface RateLimitState {
  count: number;
  windowStart: number;
}

/** Rate limit check result (allowed) */
interface RateLimitAllowed {
  allowed: true;
  currentCount: number;
  remaining: number;
  limit: number;
}

/** Rate limit check result (blocked) */
interface RateLimitBlocked {
  allowed: false;
  currentCount: number;
  limit: number;
  resetInSeconds: number;
}

/** Rate limit check result */
export type RateLimitCheckResult = RateLimitAllowed | RateLimitBlocked;

/** Rate limit tracking result */
export interface RateLimitTrackResult {
  count: number;
  limit: number;
  remaining: number;
}

/** Rate limit status result */
export interface RateLimitStatusResult {
  currentCount: number;
  limit: number;
  remaining: number;
  windowStart: number;
  nextResetIn: number;
}

// In-memory storage: Map<string, RateLimitState>
// Key: userId (Auth0 sub)
// Value: { count: number, windowStart: number (timestamp) }
const userApiCalls = new Map<string, RateLimitState>();

/**
 * Check if Netatmo API call is allowed for user (in-memory implementation)
 */
function checkNetatmoRateLimitInMemory(userId: string): RateLimitCheckResult {
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

    return {
      allowed: false,
      currentCount: userData.count,
      limit: NETATMO_CONSERVATIVE_LIMIT,
      resetInSeconds,
    };
  }

  // Allowed
  const remaining = NETATMO_CONSERVATIVE_LIMIT - userData.count;

  return {
    allowed: true,
    currentCount: userData.count,
    remaining,
    limit: NETATMO_CONSERVATIVE_LIMIT,
  };
}

/**
 * Track a Netatmo API call for a user (in-memory implementation)
 * Call this AFTER successful API call (not before)
 */
function trackNetatmoApiCallInMemory(userId: string): RateLimitTrackResult {
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

  return {
    count: userData.count,
    limit: NETATMO_CONSERVATIVE_LIMIT,
    remaining,
  };
}

/**
 * Get current Netatmo rate limit status for a user (in-memory implementation)
 * Useful for debugging and UI display
 */
function getNetatmoRateLimitStatusInMemory(userId: string): RateLimitStatusResult {
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
function cleanupOldEntries(): void {
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
 * Check if Netatmo API call is allowed for user (feature-flagged)
 *
 * Uses Firebase RTDB-backed persistent limiter when USE_PERSISTENT_RATE_LIMITER=true,
 * otherwise falls back to in-memory limiter.
 */
export async function checkNetatmoRateLimit(userId: string): Promise<RateLimitCheckResult> {
  if (!USE_PERSISTENT) {
    return checkNetatmoRateLimitInMemory(userId);
  }

  try {
    const { checkNetatmoRateLimitPersistent } = await import('./netatmoRateLimiterPersistent');
    return await checkNetatmoRateLimitPersistent(userId);
  } catch (error) {
    console.warn('Persistent Netatmo rate limiter failed, falling back to in-memory:', error);
    return checkNetatmoRateLimitInMemory(userId);
  }
}

/**
 * Track a Netatmo API call for a user (feature-flagged)
 * Call this AFTER successful API call (not before)
 */
export async function trackNetatmoApiCall(userId: string): Promise<RateLimitTrackResult> {
  if (!USE_PERSISTENT) {
    return trackNetatmoApiCallInMemory(userId);
  }

  try {
    const { trackNetatmoApiCallPersistent } = await import('./netatmoRateLimiterPersistent');
    return await trackNetatmoApiCallPersistent(userId);
  } catch (error) {
    console.warn('Persistent Netatmo rate limiter failed, falling back to in-memory:', error);
    return trackNetatmoApiCallInMemory(userId);
  }
}

/**
 * Get current Netatmo rate limit status for a user (feature-flagged)
 * Useful for debugging and UI display
 */
export async function getNetatmoRateLimitStatus(userId: string): Promise<RateLimitStatusResult> {
  if (!USE_PERSISTENT) {
    return getNetatmoRateLimitStatusInMemory(userId);
  }

  try {
    const { getNetatmoRateLimitPersistentStatus } = await import('./netatmoRateLimiterPersistent');
    return await getNetatmoRateLimitPersistentStatus(userId);
  } catch (error) {
    console.warn('Persistent Netatmo rate limiter failed, falling back to in-memory:', error);
    return getNetatmoRateLimitStatusInMemory(userId);
  }
}

/**
 * Export internals for testing/debugging
 */
export const _internals = {
  userApiCalls,
  cleanupOldEntries,
  WINDOW_MS,
};
