/**
 * Rate Limiter for Notifications
 *
 * Feature-flagged rate limiting with persistent fallback.
 * When USE_PERSISTENT_RATE_LIMITER=true, uses Firebase RTDB.
 * When false or Firebase fails, falls back to in-memory limiter.
 *
 * Design:
 * - Per-type rate limits (scheduler_success, ERROR, CRITICAL, etc.)
 * - Feature flag controls implementation (persistent vs in-memory)
 * - Graceful fallback on Firebase errors
 * - Respects user custom limits from preferences
 *
 * Rate Limiting Strategy (per 03-CONTEXT.md):
 * - Different types have different default limits
 * - CRITICAL has higher limit (max 5 per minute)
 * - Routine notifications more conservative (max 1 per 5 min)
 * - User preferences can override defaults
 */

// Feature flag: enables Firebase RTDB-backed persistent rate limiting
const USE_PERSISTENT = process.env.USE_PERSISTENT_RATE_LIMITER === 'true';

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

// In-memory storage: Map<string, number[]>
// Key format: "userId:notificationType"
// Value: Array of timestamps (ms) when notifications were sent
const recentSends = new Map<string, number[]>();

/**
 * Default rate limits per notification type
 * Per CONTEXT.md: Different types have different windows
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

  // Scheduler success (per success criteria #3: 3 events in 4 min → 1 notification)
  scheduler_success: { windowMinutes: 5, maxPerWindow: 1 },

  // Status updates
  status: { windowMinutes: 5, maxPerWindow: 1 },

  // Test notifications (permissive for testing)
  test: { windowMinutes: 1, maxPerWindow: 10 }, // Allow 10 tests per minute

  // Default for unrecognized types
  default: { windowMinutes: 5, maxPerWindow: 1 },
};

/**
 * Check if notification is allowed by rate limit (in-memory implementation)
 *
 * @param userId - User ID (session sub)
 * @param notifType - Notification type (e.g., 'scheduler_success', 'CRITICAL')
 * @param customLimits - Optional custom limits { windowMinutes, maxPerWindow }
 * @returns Result object with allowed status and timing info
 */
function checkRateLimitInMemory(
  userId: string,
  notifType: string,
  customLimits: RateLimitConfig | null = null
): RateLimitResult {
  const key = `${userId}:${notifType}`;
  const now = Date.now();

  // Get limits (priority: customLimits > defaults for type > default)
  const limits = customLimits ?? DEFAULT_RATE_LIMITS[notifType] ?? DEFAULT_RATE_LIMITS.default!;
  const windowMs = limits.windowMinutes * 60 * 1000;

  // Get recent sends for this key
  const sends = recentSends.get(key) ?? [];

  // Filter to current window (remove timestamps outside window)
  const recentInWindow = sends.filter(ts => now - ts < windowMs);

  // Check if limit exceeded
  if (recentInWindow.length >= limits.maxPerWindow) {
    // Calculate when next send is allowed
    // Next allowed = oldest timestamp in window + window duration
    const oldestInWindow = Math.min(...recentInWindow);
    const nextAllowedIn = (oldestInWindow + windowMs) - now;

    return {
      allowed: false,
      suppressedCount: recentInWindow.length,
      nextAllowedIn: Math.ceil(nextAllowedIn / 1000), // Convert to seconds
    };
  }

  // Allowed - track this send
  recentInWindow.push(now);
  recentSends.set(key, recentInWindow);

  return {
    allowed: true,
    suppressedCount: 0,
    nextAllowedIn: 0,
  };
}

/**
 * Periodic cleanup to prevent memory leaks
 * Removes entries older than max retention period (1 hour)
 * Runs every 5 minutes
 */
function cleanupOldEntries(): void {
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
 * Check if notification is allowed by rate limit (feature-flagged)
 *
 * Uses Firebase RTDB-backed persistent limiter when USE_PERSISTENT_RATE_LIMITER=true,
 * otherwise falls back to in-memory limiter.
 *
 * @param userId - User ID (session sub)
 * @param notifType - Notification type (e.g., 'scheduler_success', 'CRITICAL')
 * @param customLimits - Optional custom limits { windowMinutes, maxPerWindow }
 * @returns Promise<Result object with allowed status and timing info>
 */
export async function checkRateLimit(
  userId: string,
  notifType: string,
  customLimits: RateLimitConfig | null = null
): Promise<RateLimitResult> {
  if (!USE_PERSISTENT) {
    return checkRateLimitInMemory(userId, notifType, customLimits);
  }

  try {
    const { checkRateLimitPersistent } = await import('./rateLimiterPersistent');
    return await checkRateLimitPersistent(userId, notifType, customLimits);
  } catch (error) {
    console.warn('Persistent rate limiter failed, falling back to in-memory:', error);
    return checkRateLimitInMemory(userId, notifType, customLimits);
  }
}

