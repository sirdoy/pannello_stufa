/**
 * Coordination Notification Throttle Service
 *
 * Feature-flagged throttle with persistent fallback.
 * When USE_PERSISTENT_RATE_LIMITER=true, uses Firebase RTDB.
 * When false or Firebase fails, falls back to in-memory throttle.
 *
 * Design:
 * - DIFFERENT from rateLimiter.js which is per-notification-type
 * - This service is GLOBAL per user (one window for all coordination events)
 * - Feature flag controls implementation (persistent vs in-memory)
 * - Graceful fallback on Firebase errors
 * - Does NOT send notifications - only decides if sending is allowed
 *
 * Usage Pattern:
 * 1. Check shouldSendCoordinationNotification(userId)
 * 2. If allowed: send notification, then recordNotificationSent(userId)
 * 3. If not allowed: skip notification but ALWAYS log event to Firestore
 *
 * Per 08-CONTEXT.md:
 * "Global throttle - max 1 notification total every 30 minutes across all coordination events"
 */

// Feature flag: enables Firebase RTDB-backed persistent rate limiting
const USE_PERSISTENT = process.env.USE_PERSISTENT_RATE_LIMITER === 'true';

/**
 * Throttle check result
 */
interface ThrottleResult {
  allowed: boolean;
  waitSeconds: number;
  reason: 'global_throttle' | null;
}

// In-memory storage: Map<userId, timestamp>
// Key: userId (Auth0 sub)
// Value: Timestamp (ms) when last coordination notification was sent
const lastNotificationSent = new Map<string, number>();

// Global throttle window: 30 minutes
const GLOBAL_THROTTLE_MS = 30 * 60 * 1000;

/**
 * Check if coordination notification is allowed for user (in-memory implementation)
 */
function shouldSendCoordinationNotificationInMemory(userId: string): ThrottleResult {
  const lastSent = lastNotificationSent.get(userId);
  const now = Date.now();

  // No previous notification → allowed
  if (!lastSent) {
    console.log(`✅ Coordination notification allowed for ${userId} (first notification)`);
    return {
      allowed: true,
      waitSeconds: 0,
      reason: null,
    };
  }

  // Calculate time since last notification
  const timeSinceLastMs = now - lastSent;
  const remainingMs = GLOBAL_THROTTLE_MS - timeSinceLastMs;

  // Still within throttle window → blocked
  if (timeSinceLastMs < GLOBAL_THROTTLE_MS) {
    const waitSeconds = Math.ceil(remainingMs / 1000);
    console.log(
      `⏱️ Coordination notification throttled for ${userId} (wait ${waitSeconds}s, global window)`
    );
    return {
      allowed: false,
      waitSeconds,
      reason: 'global_throttle',
    };
  }

  // Window expired → allowed
  console.log(`✅ Coordination notification allowed for ${userId} (window expired)`);
  return {
    allowed: true,
    waitSeconds: 0,
    reason: null,
  };
}

/**
 * Throttle status
 */
interface ThrottleStatus {
  lastSentAt: number | null;
  nextAllowedAt: number | null;
  waitSeconds: number;
}

/**
 * Record that a coordination notification was sent (in-memory implementation)
 *
 * MUST be called after successfully sending notification
 * Updates the timestamp to start new 30-minute window
 */
function recordNotificationSentInMemory(userId: string): void {
  const now = Date.now();
  lastNotificationSent.set(userId, now);
  console.log(`📝 Coordination notification recorded for ${userId} (next allowed in 30 min)`);
}

/**
 * Get throttle status for a user (in-memory implementation)
 *
 * Useful for debugging and UI display
 */
function getThrottleStatusInMemory(userId: string): ThrottleStatus {
  const lastSent = lastNotificationSent.get(userId);
  const now = Date.now();

  if (!lastSent) {
    return {
      lastSentAt: null,
      nextAllowedAt: null,
      waitSeconds: 0,
    };
  }

  const nextAllowedAt = lastSent + GLOBAL_THROTTLE_MS;
  const waitMs = Math.max(0, nextAllowedAt - now);
  const waitSeconds = Math.ceil(waitMs / 1000);

  return {
    lastSentAt: lastSent,
    nextAllowedAt,
    waitSeconds,
  };
}

/**
 * Clear throttle for a user (in-memory implementation)
 *
 * Useful for testing and admin overrides
 */
function clearThrottleInMemory(userId: string): boolean {
  const existed = lastNotificationSent.has(userId);
  lastNotificationSent.delete(userId);

  if (existed) {
    console.log(`🧹 Cleared throttle for ${userId}`);
  }

  return existed;
}

/**
 * Periodic cleanup to prevent memory leaks
 * Removes entries older than 30 minutes (expired throttle windows)
 * Runs every 5 minutes
 */
function cleanupOldEntries(): void {
  const now = Date.now();
  let totalCleaned = 0;

  for (const [userId, timestamp] of lastNotificationSent) {
    const age = now - timestamp;
    if (age > GLOBAL_THROTTLE_MS) {
      lastNotificationSent.delete(userId);
      totalCleaned++;
    }
  }

  if (totalCleaned > 0) {
    console.log(`🧹 Throttle cleanup: removed ${totalCleaned} expired entries`);
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
 * Check if coordination notification is allowed for user (feature-flagged)
 *
 * Uses Firebase RTDB-backed persistent throttle when USE_PERSISTENT_RATE_LIMITER=true,
 * otherwise falls back to in-memory throttle.
 */
export async function shouldSendCoordinationNotification(userId: string): Promise<ThrottleResult> {
  if (!USE_PERSISTENT) {
    return shouldSendCoordinationNotificationInMemory(userId);
  }

  try {
    const { shouldSendCoordinationNotificationPersistent } = await import('./coordinationThrottlePersistent');
    return await shouldSendCoordinationNotificationPersistent(userId);
  } catch (error) {
    console.warn('Persistent coordination throttle failed, falling back to in-memory:', error);
    return shouldSendCoordinationNotificationInMemory(userId);
  }
}

/**
 * Record that a coordination notification was sent (feature-flagged)
 *
 * MUST be called after successfully sending notification
 * Updates the timestamp to start new 30-minute window
 */
export async function recordNotificationSent(userId: string): Promise<void> {
  if (!USE_PERSISTENT) {
    return recordNotificationSentInMemory(userId);
  }

  try {
    const { recordNotificationSentPersistent } = await import('./coordinationThrottlePersistent');
    return await recordNotificationSentPersistent(userId);
  } catch (error) {
    console.warn('Persistent coordination throttle failed, falling back to in-memory:', error);
    return recordNotificationSentInMemory(userId);
  }
}

/**
 * Get throttle status for a user (feature-flagged)
 *
 * Useful for debugging and UI display
 */
export async function getThrottleStatus(userId: string): Promise<ThrottleStatus> {
  if (!USE_PERSISTENT) {
    return getThrottleStatusInMemory(userId);
  }

  try {
    const { getThrottlePersistentStatus } = await import('./coordinationThrottlePersistent');
    return await getThrottlePersistentStatus(userId);
  } catch (error) {
    console.warn('Persistent coordination throttle failed, falling back to in-memory:', error);
    return getThrottleStatusInMemory(userId);
  }
}

/**
 * Clear throttle for a user (feature-flagged)
 *
 * Useful for testing and admin overrides
 */
export async function clearThrottle(userId: string): Promise<boolean> {
  if (!USE_PERSISTENT) {
    return clearThrottleInMemory(userId);
  }

  try {
    const { clearThrottlePersistent } = await import('./coordinationThrottlePersistent');
    return await clearThrottlePersistent(userId);
  } catch (error) {
    console.warn('Persistent coordination throttle failed, falling back to in-memory:', error);
    return clearThrottleInMemory(userId);
  }
}

/**
 * Export internals for testing
 */
export const _internals = {
  lastNotificationSent,
  GLOBAL_THROTTLE_MS,
  cleanupOldEntries,
};
