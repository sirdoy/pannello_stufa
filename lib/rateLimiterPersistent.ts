/**
 * Persistent Rate Limiter for Notifications (Firebase RTDB)
 *
 * Firebase RTDB-backed rate limiting that persists across serverless cold starts
 * Uses Firebase transactions for atomic read-modify-write operations
 *
 * Design:
 * - Per-type rate limits (scheduler_success, ERROR, CRITICAL, etc.)
 * - Firebase RTDB storage: rateLimits/{userId}/{notifType} -> RateLimitWindow
 * - Automatic cleanup via sliding window (filters on every transaction)
 * - Max retention: 2 hours (prevents unbounded array growth)
 * - Pure transaction callbacks (no side effects)
 *
 * Differences from rateLimiter.ts:
 * - Async operations (Firebase I/O)
 * - Persists across deployments/cold starts
 * - Uses transactions for concurrency safety
 * - Independent module (no shared state with in-memory limiter)
 */

import { adminDbTransaction, adminDbGet, adminDbRemove } from '@/lib/firebaseAdmin';

/** Rate limit configuration */
export interface RateLimitConfig {
  windowMinutes: number;
  maxPerWindow: number;
}

/** Rate limit check result */
export interface RateLimitResult {
  allowed: boolean;
  suppressedCount: number;
  nextAllowedIn: number;
}

/** Rate limit status for debugging/UI */
export interface RateLimitStatus {
  currentCount: number;
  maxAllowed: number;
  windowMinutes: number;
  nextResetIn: number;
}

/** Firebase RTDB data structure for rate limit window */
interface RateLimitWindow {
  timestamps: number[];
  windowStart: number;
}

// Max retention: 2 hours (7200000ms)
// Prevents unbounded array growth - any timestamp older than this is cleaned up
const MAX_RETENTION_MS = 2 * 60 * 60 * 1000;

/**
 * Default rate limits per notification type
 * Copied from rateLimiter.ts to keep modules independent
 *
 * Format:
 * - windowMinutes: Time window for rate limiting
 * - maxPerWindow: Maximum notifications allowed in window
 */
const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  // CRITICAL: Higher limit (allow rapid alerts for critical issues)
  CRITICAL: { windowMinutes: 1, maxPerWindow: 5 },

  // Errors: Moderate limit
  ERROR: { windowMinutes: 1, maxPerWindow: 3 },

  // Maintenance notifications
  maintenance: { windowMinutes: 5, maxPerWindow: 1 },

  // System updates
  updates: { windowMinutes: 60, maxPerWindow: 1 }, // Max 1 per hour

  // Scheduler success
  scheduler_success: { windowMinutes: 5, maxPerWindow: 1 },

  // Status updates
  status: { windowMinutes: 5, maxPerWindow: 1 },

  // Test notifications (permissive for testing)
  test: { windowMinutes: 1, maxPerWindow: 10 }, // Allow 10 tests per minute

  // Default for unrecognized types
  default: { windowMinutes: 5, maxPerWindow: 1 },
};

/**
 * Check if notification is allowed by persistent rate limit
 *
 * Uses Firebase transaction for atomic read-modify-write
 * Filters expired timestamps on every check (sliding window + max retention)
 *
 * @param userId - User ID (Auth0 sub)
 * @param notifType - Notification type (e.g., 'scheduler_success', 'CRITICAL')
 * @param customLimits - Optional custom limits { windowMinutes, maxPerWindow }
 * @returns Result object with allowed status and timing info
 */
export async function checkRateLimitPersistent(
  userId: string,
  notifType: string,
  customLimits: RateLimitConfig | null = null
): Promise<RateLimitResult> {
  const path = `rateLimits/${userId}/${notifType}`;
  const now = Date.now();

  // Get limits (priority: customLimits > defaults for type > default)
  const limits = customLimits ?? DEFAULT_RATE_LIMITS[notifType] ?? DEFAULT_RATE_LIMITS.default!;
  const windowMs = limits.windowMinutes * 60 * 1000;

  // Track if we'll allow this request (determined before transaction)
  let willAllow = false;

  // Run transaction to atomically check and update rate limit
  const result = await adminDbTransaction(path, (currentData) => {
    const window = currentData as RateLimitWindow | null;

    // Handle first time (Firebase returns null for non-existent path)
    if (!window || !window.timestamps) {
      willAllow = true;
      return {
        timestamps: [now],
        windowStart: now,
      };
    }

    // Filter timestamps to:
    // 1. Current window (sliding window algorithm)
    // 2. Max retention period (prevent unbounded growth)
    const recentInWindow = window.timestamps.filter(
      (ts) => now - ts < windowMs && now - ts < MAX_RETENTION_MS
    );

    // Check if limit exceeded
    if (recentInWindow.length >= limits.maxPerWindow) {
      willAllow = false;
      // Return cleaned data (without adding new timestamp)
      return {
        timestamps: recentInWindow,
        windowStart: window.windowStart,
      };
    }

    // Allowed - add new timestamp
    willAllow = true;
    return {
      timestamps: [...recentInWindow, now],
      windowStart: window.windowStart,
    };
  });

  // Return based on whether we allowed this request
  if (willAllow) {
    return {
      allowed: true,
      suppressedCount: 0,
      nextAllowedIn: 0,
    };
  }

  // Blocked - calculate when next allowed
  const window = result as RateLimitWindow;
  const recentInWindow = window.timestamps.filter(
    (ts) => now - ts < windowMs && now - ts < MAX_RETENTION_MS
  );
  const oldestInWindow = Math.min(...recentInWindow);
  const nextAllowedIn = oldestInWindow + windowMs - now;

  return {
    allowed: false,
    suppressedCount: recentInWindow.length,
    nextAllowedIn: Math.ceil(nextAllowedIn / 1000), // Convert to seconds
  };
}

/**
 * Clear all rate limit entries for a user
 * Useful for testing and user-requested reset
 *
 * @param userId - User ID to clear
 */
export async function clearRateLimitPersistentForUser(userId: string): Promise<void> {
  const path = `rateLimits/${userId}`;
  await adminDbRemove(path);
}

/**
 * Get current rate limit status for a user+type
 * Useful for debugging and UI display
 *
 * @param userId - User ID
 * @param notifType - Notification type
 * @returns Status object with counts and timing
 */
export async function getRateLimitPersistentStatus(
  userId: string,
  notifType: string
): Promise<RateLimitStatus> {
  const path = `rateLimits/${userId}/${notifType}`;
  const now = Date.now();

  const limits = DEFAULT_RATE_LIMITS[notifType] ?? DEFAULT_RATE_LIMITS.default!;
  const windowMs = limits.windowMinutes * 60 * 1000;

  const data = (await adminDbGet(path)) as RateLimitWindow | null;

  if (!data || !data.timestamps) {
    return {
      currentCount: 0,
      maxAllowed: limits.maxPerWindow,
      windowMinutes: limits.windowMinutes,
      nextResetIn: 0,
    };
  }

  // Filter to current window
  const recentInWindow = data.timestamps.filter((ts) => now - ts < windowMs);

  let nextResetIn = 0;
  if (recentInWindow.length > 0) {
    const oldestInWindow = Math.min(...recentInWindow);
    nextResetIn = Math.ceil((oldestInWindow + windowMs - now) / 1000);
  }

  return {
    currentCount: recentInWindow.length,
    maxAllowed: limits.maxPerWindow,
    windowMinutes: limits.windowMinutes,
    nextResetIn,
  };
}
