/**
 * Persistent Netatmo API Rate Limiter (Firebase RTDB-backed)
 *
 * Dual-window rate limiting for Netatmo API:
 * - 10-second burst limit: 50 requests per 10 seconds
 * - 1-hour conservative limit: 400 requests per hour
 *
 * Design:
 * - Firebase RTDB transaction-based tracking (survives cold starts)
 * - Separate windows: rateLimits/{userId}/netatmo_api_10s and netatmo_api_1h
 * - Sliding window for burst (timestamp array), counter for hourly
 * - Automatic cleanup: expired timestamps filtered on every transaction
 *
 * Rate Limiting Strategy:
 * - Netatmo limit: 50 req/10s (burst) + 500 req/hour (sustained)
 * - Conservative buffer: 100 req/hour (20%)
 * - Effective limits: 50 req/10s + 400 req/hour enforced
 */

import { adminDbTransaction, adminDbGet } from '@/lib/firebaseAdmin';

// Constants
export const NETATMO_RATE_LIMIT = 500; // Actual Netatmo hourly limit
export const NETATMO_CONSERVATIVE_LIMIT = 400; // Enforced hourly limit with buffer

const NETATMO_BURST_LIMIT = 50; // 10-second burst limit
const NETATMO_BURST_WINDOW_MS = 10_000; // 10 seconds

const NETATMO_HOURLY_LIMIT = NETATMO_CONSERVATIVE_LIMIT; // 400 calls/hour
const NETATMO_HOURLY_WINDOW_MS = 3_600_000; // 1 hour

/** 10-second burst window state (sliding window with timestamps) */
interface BurstWindow {
  timestamps: number[]; // Array of API call timestamps (ms)
}

/** 1-hour window state (counter-based) */
interface HourlyWindow {
  count: number; // Number of API calls in current window
  windowStart: number; // Window start timestamp (ms)
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

/**
 * Check if Netatmo API call is allowed for user
 * Checks BOTH 10s burst limit AND 1h conservative limit
 *
 * @param userId - User ID (Auth0 sub)
 * @returns RateLimitCheckResult with allowed flag and remaining count
 */
export async function checkNetatmoRateLimitPersistent(userId: string): Promise<RateLimitCheckResult> {
  const now = Date.now();

  try {
    // Check 10-second burst window
    const burstPath = `rateLimits/${userId}/netatmo_api_10s`;
    const burstData = await adminDbGet(burstPath) as BurstWindow | null;

    const burstTimestamps = burstData?.timestamps ?? [];
    const recentBurstCalls = burstTimestamps.filter(ts => now - ts < NETATMO_BURST_WINDOW_MS);

    if (recentBurstCalls.length >= NETATMO_BURST_LIMIT) {
      // Burst limit exceeded
      const oldestInWindow = Math.min(...recentBurstCalls);
      const resetInSeconds = Math.ceil((oldestInWindow + NETATMO_BURST_WINDOW_MS - now) / 1000);

      return {
        allowed: false,
        currentCount: recentBurstCalls.length,
        limit: NETATMO_BURST_LIMIT,
        resetInSeconds,
      };
    }

    // Check 1-hour window
    const hourlyPath = `rateLimits/${userId}/netatmo_api_1h`;
    const hourlyData = await adminDbGet(hourlyPath) as HourlyWindow | null;

    // Reset if window expired
    let currentCount = 0;
    let windowStart = now;

    if (hourlyData && (now - hourlyData.windowStart < NETATMO_HOURLY_WINDOW_MS)) {
      // Window still active
      currentCount = hourlyData.count;
      windowStart = hourlyData.windowStart;
    }

    if (currentCount >= NETATMO_HOURLY_LIMIT) {
      // Hourly limit exceeded
      const windowEnd = windowStart + NETATMO_HOURLY_WINDOW_MS;
      const resetInSeconds = Math.ceil((windowEnd - now) / 1000);

      return {
        allowed: false,
        currentCount,
        limit: NETATMO_HOURLY_LIMIT,
        resetInSeconds,
      };
    }

    // Both limits OK - calculate remaining (minimum of both windows)
    const burstRemaining = NETATMO_BURST_LIMIT - recentBurstCalls.length;
    const hourlyRemaining = NETATMO_HOURLY_LIMIT - currentCount;
    const remaining = Math.min(burstRemaining, hourlyRemaining);

    // Determine which limit is more restrictive for reporting
    const isHourlyMoreRestrictive = hourlyRemaining < burstRemaining;
    const reportCount = isHourlyMoreRestrictive ? currentCount : recentBurstCalls.length;
    const reportLimit = isHourlyMoreRestrictive ? NETATMO_HOURLY_LIMIT : NETATMO_BURST_LIMIT;

    return {
      allowed: true,
      currentCount: reportCount,
      remaining,
      limit: reportLimit,
    };

  } catch (error) {
    console.error('❌ Error checking Netatmo rate limit:', error);
    throw error;
  }
}

/**
 * Track a Netatmo API call for a user
 * Updates BOTH 10s burst window AND 1h hourly window atomically
 *
 * Call this AFTER successful API call (not before)
 *
 * @param userId - User ID (Auth0 sub)
 * @returns RateLimitTrackResult with current count and remaining
 */
export async function trackNetatmoApiCallPersistent(userId: string): Promise<RateLimitTrackResult> {
  const now = Date.now();

  try {
    // Update 10-second burst window (atomic transaction)
    const burstPath = `rateLimits/${userId}/netatmo_api_10s`;
    const burstResult = await adminDbTransaction(burstPath, (current) => {
      const data = current as BurstWindow | null;

      // Get existing timestamps, filter to current window, add new timestamp
      const timestamps = data?.timestamps ?? [];
      const recentTimestamps = timestamps.filter(ts => now - ts < NETATMO_BURST_WINDOW_MS);
      recentTimestamps.push(now);

      return {
        timestamps: recentTimestamps,
      };
    }) as BurstWindow;

    // Update 1-hour window (atomic transaction)
    const hourlyPath = `rateLimits/${userId}/netatmo_api_1h`;
    const hourlyResult = await adminDbTransaction(hourlyPath, (current) => {
      const data = current as HourlyWindow | null;

      // Reset if window expired or no data
      if (!data || (now - data.windowStart >= NETATMO_HOURLY_WINDOW_MS)) {
        return {
          count: 1,
          windowStart: now,
        };
      }

      // Increment in existing window
      return {
        count: data.count + 1,
        windowStart: data.windowStart,
      };
    }) as HourlyWindow;

    // Calculate remaining (minimum of both windows)
    const burstCount = burstResult.timestamps.length;
    const burstRemaining = NETATMO_BURST_LIMIT - burstCount;
    const hourlyRemaining = NETATMO_HOURLY_LIMIT - hourlyResult.count;
    const remaining = Math.max(0, Math.min(burstRemaining, hourlyRemaining));

    return {
      count: burstCount, // Report burst count
      limit: NETATMO_BURST_LIMIT, // Report burst limit
      remaining,
    };

  } catch (error) {
    console.error('❌ Error tracking Netatmo API call:', error);
    throw error;
  }
}

/**
 * Get current Netatmo rate limit status for a user
 * Useful for debugging and UI display
 *
 * @param userId - User ID (Auth0 sub)
 * @returns RateLimitStatusResult with current count and reset time
 */
export async function getNetatmoRateLimitPersistentStatus(userId: string): Promise<RateLimitStatusResult> {
  const now = Date.now();

  try {
    const hourlyPath = `rateLimits/${userId}/netatmo_api_1h`;
    const hourlyData = await adminDbGet(hourlyPath) as HourlyWindow | null;

    if (!hourlyData || (now - hourlyData.windowStart >= NETATMO_HOURLY_WINDOW_MS)) {
      // No data or expired window
      return {
        currentCount: 0,
        limit: NETATMO_HOURLY_LIMIT,
        remaining: NETATMO_HOURLY_LIMIT,
        windowStart: now,
        nextResetIn: 0,
      };
    }

    const windowEnd = hourlyData.windowStart + NETATMO_HOURLY_WINDOW_MS;
    const nextResetIn = Math.ceil((windowEnd - now) / 1000);
    const remaining = Math.max(0, NETATMO_HOURLY_LIMIT - hourlyData.count);

    return {
      currentCount: hourlyData.count,
      limit: NETATMO_HOURLY_LIMIT,
      remaining,
      windowStart: hourlyData.windowStart,
      nextResetIn,
    };

  } catch (error) {
    console.error('❌ Error getting Netatmo rate limit status:', error);
    throw error;
  }
}
