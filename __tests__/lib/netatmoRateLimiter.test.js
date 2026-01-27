/**
 * Unit tests for Netatmo Rate Limiter
 * Tests per-user API rate limiting with hourly windows
 */

import {
  checkNetatmoRateLimit,
  trackNetatmoApiCall,
  getNetatmoRateLimitStatus,
  NETATMO_RATE_LIMIT,
  NETATMO_CONSERVATIVE_LIMIT,
  _internals,
} from '@/lib/netatmoRateLimiter';

describe('netatmoRateLimiter', () => {
  beforeEach(() => {
    // Clear all rate limit data before each test
    _internals.userApiCalls.clear();
    jest.clearAllMocks();

    // Use fake timers for time-based tests
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Constants', () => {
    it('should export correct rate limit constants', () => {
      expect(NETATMO_RATE_LIMIT).toBe(500);
      expect(NETATMO_CONSERVATIVE_LIMIT).toBe(400);
    });
  });

  describe('checkNetatmoRateLimit', () => {
    const testUserId = 'test-user-123';

    it('should allow request when under limit', () => {
      const result = checkNetatmoRateLimit(testUserId);

      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(0);
      expect(result.remaining).toBe(400);
      expect(result.limit).toBe(400);
      expect(result.resetInSeconds).toBeUndefined();
    });

    it('should block request when limit reached', () => {
      // Simulate user reaching limit
      const userData = {
        count: 400,
        windowStart: Date.now(),
      };
      _internals.userApiCalls.set(testUserId, userData);

      const result = checkNetatmoRateLimit(testUserId);

      expect(result.allowed).toBe(false);
      expect(result.currentCount).toBe(400);
      expect(result.limit).toBe(400);
      expect(result.resetInSeconds).toBeGreaterThan(0);
      expect(result.resetInSeconds).toBeLessThanOrEqual(3600); // Max 1 hour
    });

    it('should reset counter after window expires', () => {
      // Set user at limit
      const pastTime = Date.now() - (61 * 60 * 1000); // 61 minutes ago
      const userData = {
        count: 400,
        windowStart: pastTime,
      };
      _internals.userApiCalls.set(testUserId, userData);

      // Advance time by 61 minutes
      jest.advanceTimersByTime(61 * 60 * 1000);

      const result = checkNetatmoRateLimit(testUserId);

      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(0); // Counter reset
      expect(result.remaining).toBe(400);
    });

    it('should return correct remaining count', () => {
      // User has made 100 calls
      const userData = {
        count: 100,
        windowStart: Date.now(),
      };
      _internals.userApiCalls.set(testUserId, userData);

      const result = checkNetatmoRateLimit(testUserId);

      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(100);
      expect(result.remaining).toBe(300); // 400 - 100
      expect(result.limit).toBe(400);
    });

    it('should handle multiple users independently', () => {
      const user1 = 'user-1';
      const user2 = 'user-2';

      // User 1 at limit
      _internals.userApiCalls.set(user1, {
        count: 400,
        windowStart: Date.now(),
      });

      // User 2 has no calls
      const result1 = checkNetatmoRateLimit(user1);
      const result2 = checkNetatmoRateLimit(user2);

      expect(result1.allowed).toBe(false);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(400);
    });
  });

  describe('trackNetatmoApiCall', () => {
    const testUserId = 'test-user-456';

    it('should increment counter for user', () => {
      // Track first call
      const result1 = trackNetatmoApiCall(testUserId);
      expect(result1.count).toBe(1);
      expect(result1.remaining).toBe(399);

      // Track second call
      const result2 = trackNetatmoApiCall(testUserId);
      expect(result2.count).toBe(2);
      expect(result2.remaining).toBe(398);
    });

    it('should create new entry for new user', () => {
      expect(_internals.userApiCalls.has(testUserId)).toBe(false);

      const result = trackNetatmoApiCall(testUserId);

      expect(_internals.userApiCalls.has(testUserId)).toBe(true);
      expect(result.count).toBe(1);
      expect(result.limit).toBe(400);
    });

    it('should reset count when window expires', () => {
      // Set user with old window
      const pastTime = Date.now() - (70 * 60 * 1000); // 70 minutes ago
      _internals.userApiCalls.set(testUserId, {
        count: 50,
        windowStart: pastTime,
      });

      // Advance time
      jest.advanceTimersByTime(70 * 60 * 1000);

      // Track new call - should reset to 1
      const result = trackNetatmoApiCall(testUserId);

      expect(result.count).toBe(1);
      expect(result.remaining).toBe(399);
    });

    it('should return zero remaining when at limit', () => {
      // Set user just below limit
      _internals.userApiCalls.set(testUserId, {
        count: 399,
        windowStart: Date.now(),
      });

      // Track call that reaches limit
      const result = trackNetatmoApiCall(testUserId);

      expect(result.count).toBe(400);
      expect(result.remaining).toBe(0);
    });
  });

  describe('getNetatmoRateLimitStatus', () => {
    const testUserId = 'test-user-789';

    it('should return correct status for tracked user', () => {
      const now = Date.now();
      const userData = {
        count: 150,
        windowStart: now,
      };
      _internals.userApiCalls.set(testUserId, userData);

      const status = getNetatmoRateLimitStatus(testUserId);

      expect(status.currentCount).toBe(150);
      expect(status.limit).toBe(400);
      expect(status.remaining).toBe(250);
      expect(status.windowStart).toBe(now);
      expect(status.nextResetIn).toBeGreaterThan(0);
      expect(status.nextResetIn).toBeLessThanOrEqual(3600);
    });

    it('should return zero count for untracked user', () => {
      const status = getNetatmoRateLimitStatus('untracked-user');

      expect(status.currentCount).toBe(0);
      expect(status.limit).toBe(400);
      expect(status.remaining).toBe(400);
      expect(status.nextResetIn).toBe(0);
    });

    it('should return zero count for expired window', () => {
      const pastTime = Date.now() - (65 * 60 * 1000); // 65 minutes ago
      _internals.userApiCalls.set(testUserId, {
        count: 200,
        windowStart: pastTime,
      });

      // Advance time
      jest.advanceTimersByTime(65 * 60 * 1000);

      const status = getNetatmoRateLimitStatus(testUserId);

      expect(status.currentCount).toBe(0);
      expect(status.remaining).toBe(400);
      expect(status.nextResetIn).toBe(0);
    });

    it('should calculate nextResetIn correctly', () => {
      const now = Date.now();
      const halfHourAgo = now - (30 * 60 * 1000);

      _internals.userApiCalls.set(testUserId, {
        count: 100,
        windowStart: halfHourAgo,
      });

      const status = getNetatmoRateLimitStatus(testUserId);

      // Should reset in ~30 minutes (1800 seconds)
      expect(status.nextResetIn).toBeGreaterThan(1790);
      expect(status.nextResetIn).toBeLessThanOrEqual(1800);
    });
  });

  describe('cleanupOldEntries', () => {
    it('should remove expired entries', () => {
      const now = Date.now();

      // Add user with expired window (3 hours old)
      const oldTime = now - (3 * 60 * 60 * 1000);
      _internals.userApiCalls.set('old-user', {
        count: 100,
        windowStart: oldTime,
      });

      // Add user with recent window
      _internals.userApiCalls.set('recent-user', {
        count: 50,
        windowStart: now - (30 * 60 * 1000), // 30 minutes ago
      });

      expect(_internals.userApiCalls.size).toBe(2);

      // Run cleanup (old-user's window is already 3 hours old)
      _internals.cleanupOldEntries();

      // Old user should be removed, recent user should remain
      expect(_internals.userApiCalls.has('old-user')).toBe(false);
      expect(_internals.userApiCalls.has('recent-user')).toBe(true);
      expect(_internals.userApiCalls.size).toBe(1);
    });

    it('should not remove entries within retention period', () => {
      const now = Date.now();

      // Add user with window 1.5 hours old (within 2 hour retention)
      const recentTime = now - (1.5 * 60 * 60 * 1000);
      _internals.userApiCalls.set('user-1', {
        count: 100,
        windowStart: recentTime,
      });

      // Run cleanup (user-1's window is 1.5 hours old, under 2 hour retention)
      _internals.cleanupOldEntries();

      // User should still exist
      expect(_internals.userApiCalls.has('user-1')).toBe(true);
    });

    it('should handle empty Map gracefully', () => {
      expect(_internals.userApiCalls.size).toBe(0);

      // Should not throw
      expect(() => _internals.cleanupOldEntries()).not.toThrow();
    });
  });

  describe('Integration: check and track flow', () => {
    const testUserId = 'integration-user';

    it('should allow tracking after check passes', () => {
      const checkResult = checkNetatmoRateLimit(testUserId);
      expect(checkResult.allowed).toBe(true);

      const trackResult = trackNetatmoApiCall(testUserId);
      expect(trackResult.count).toBe(1);

      // Check again - should show updated count
      const checkResult2 = checkNetatmoRateLimit(testUserId);
      expect(checkResult2.currentCount).toBe(1);
      expect(checkResult2.remaining).toBe(399);
    });

    it('should enforce limit across check-track cycles', () => {
      // Simulate 400 API calls
      for (let i = 0; i < 400; i++) {
        trackNetatmoApiCall(testUserId);
      }

      // 401st check should block
      const checkResult = checkNetatmoRateLimit(testUserId);
      expect(checkResult.allowed).toBe(false);
      expect(checkResult.currentCount).toBe(400);
    });
  });
});
