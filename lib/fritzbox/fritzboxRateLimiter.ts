/**
 * Fritz!Box Rate Limiter
 *
 * Fritz!Box-specific rate limiting wrapper
 * - 10 requests per minute (per user, per endpoint)
 * - Uses Phase 49 persistent rate limiter (Firebase RTDB)
 * - Independent rate limits per endpoint (devices, bandwidth, wan)
 */

import {
  checkRateLimitPersistent,
  type RateLimitConfig,
  type RateLimitResult,
} from '@/lib/rateLimiterPersistent';

/**
 * Fritz!Box rate limit configuration
 * 10 requests per minute to avoid overwhelming the router
 */
export const FRITZBOX_RATE_LIMIT: RateLimitConfig = {
  windowMinutes: 1,
  maxPerWindow: 10,
};

/**
 * Check rate limit for Fritz!Box API calls
 * Wraps persistent rate limiter with Fritz!Box-specific config
 *
 * @param userId - User ID (Auth0 sub)
 * @param endpoint - API endpoint name (e.g., 'devices', 'bandwidth', 'wan')
 * @returns Rate limit result (allowed, suppressedCount, nextAllowedIn)
 */
export async function checkRateLimitFritzBox(
  userId: string,
  endpoint: string
): Promise<RateLimitResult> {
  // Use endpoint-specific key to prevent cross-endpoint rate limit sharing
  const rateLimitKey = `fritzbox_${endpoint}`;

  return checkRateLimitPersistent(userId, rateLimitKey, FRITZBOX_RATE_LIMIT);
}
