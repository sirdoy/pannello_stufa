/**
 * Persistent Coordination Notification Throttle Service
 *
 * Firebase RTDB-backed coordination throttle that persists across cold starts.
 * Mirrors coordinationNotificationThrottle.ts API but stores state in Firebase.
 *
 * Design:
 * - GLOBAL throttle per user (one window for all coordination events)
 * - Firebase RTDB storage: rateLimits/{userId}/coordination_throttle -> { lastSentAt: number }
 * - Simple read/write pattern (no transaction needed - last-writer-wins acceptable for timestamps)
 * - 30-minute global window enforced across all serverless instances
 *
 * Usage Pattern:
 * 1. Check shouldSendCoordinationNotificationPersistent(userId)
 * 2. If allowed: send notification, then recordNotificationSentPersistent(userId)
 * 3. If not allowed: skip notification but ALWAYS log event to Firestore
 *
 * Purpose: The in-memory throttle resets on cold starts, allowing spam after deployments.
 * Firebase persistence ensures the 30-minute window is maintained across all instances.
 */

import { adminDbGet, adminDbSet, adminDbRemove } from '@/lib/firebaseAdmin';

/**
 * Throttle check result
 */
export interface ThrottleResult {
  allowed: boolean;
  waitSeconds: number;
  reason: 'global_throttle' | null;
}

/**
 * Throttle status
 */
export interface ThrottleStatus {
  lastSentAt: number | null;
  nextAllowedAt: number | null;
  waitSeconds: number;
}

/**
 * Throttle data stored in Firebase
 */
interface ThrottleData {
  lastSentAt: number;
}

/**
 * Global throttle window: 30 minutes
 */
export const GLOBAL_THROTTLE_MS = 30 * 60 * 1000;

/**
 * Check if coordination notification is allowed for user
 *
 * Reads from Firebase RTDB to check last notification timestamp.
 * Enforces 30-minute global window across all coordination event types.
 *
 * @param userId - User ID (Auth0 sub)
 * @returns Promise<ThrottleResult> - Allowed status with wait time if blocked
 */
export async function shouldSendCoordinationNotificationPersistent(
  userId: string
): Promise<ThrottleResult> {
  const path = `rateLimits/${userId}/coordination_throttle`;
  const data = await adminDbGet(path) as ThrottleData | null;
  const now = Date.now();

  // No previous notification → allowed
  if (!data || !data.lastSentAt) {
    console.log(`✅ Coordination notification allowed for ${userId} (first notification)`);
    return {
      allowed: true,
      waitSeconds: 0,
      reason: null,
    };
  }

  // Calculate time since last notification
  const timeSinceLastMs = now - data.lastSentAt;
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
 * Record that a coordination notification was sent
 *
 * Writes current timestamp to Firebase RTDB.
 * Simple overwrite (no transaction needed - last-writer-wins is correct for timestamps).
 *
 * MUST be called after successfully sending notification.
 * Updates the timestamp to start new 30-minute window.
 *
 * @param userId - User ID (Auth0 sub)
 * @returns Promise<void>
 */
export async function recordNotificationSentPersistent(userId: string): Promise<void> {
  const path = `rateLimits/${userId}/coordination_throttle`;
  const now = Date.now();

  await adminDbSet(path, { lastSentAt: now });

  console.log(`📝 Coordination notification recorded for ${userId} (next allowed in 30 min)`);
}

/**
 * Get throttle status for a user
 *
 * Reads from Firebase RTDB and calculates remaining wait time.
 * Useful for debugging and UI display.
 *
 * @param userId - User ID (Auth0 sub)
 * @returns Promise<ThrottleStatus> - Current throttle status
 */
export async function getThrottlePersistentStatus(userId: string): Promise<ThrottleStatus> {
  const path = `rateLimits/${userId}/coordination_throttle`;
  const data = await adminDbGet(path) as ThrottleData | null;
  const now = Date.now();

  if (!data || !data.lastSentAt) {
    return {
      lastSentAt: null,
      nextAllowedAt: null,
      waitSeconds: 0,
    };
  }

  const nextAllowedAt = data.lastSentAt + GLOBAL_THROTTLE_MS;
  const waitMs = Math.max(0, nextAllowedAt - now);
  const waitSeconds = Math.ceil(waitMs / 1000);

  return {
    lastSentAt: data.lastSentAt,
    nextAllowedAt,
    waitSeconds,
  };
}

/**
 * Clear throttle for a user
 *
 * Removes user entry from Firebase RTDB.
 * Useful for testing and admin overrides.
 *
 * @param userId - User ID (Auth0 sub)
 * @returns Promise<boolean> - True if entry existed and was removed, false otherwise
 */
export async function clearThrottlePersistent(userId: string): Promise<boolean> {
  const path = `rateLimits/${userId}/coordination_throttle`;
  const data = await adminDbGet(path);

  if (!data) {
    return false;
  }

  await adminDbRemove(path);
  console.log(`🧹 Cleared persistent throttle for ${userId}`);

  return true;
}
