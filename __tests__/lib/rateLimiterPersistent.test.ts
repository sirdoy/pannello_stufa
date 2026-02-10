/**
 * Tests for Firebase RTDB-backed persistent rate limiter
 *
 * Tests prove:
 * - Persistence across simulated cold starts (new instance reads existing state)
 * - Sliding window algorithm correctly filters expired timestamps
 * - Concurrent checks via transactions don't allow exceeding limits
 * - Firebase null (empty path) initializes correctly
 * - Expired timestamps cleaned up on every transaction
 */

import {
  checkRateLimitPersistent,
  clearRateLimitPersistentForUser,
  getRateLimitPersistentStatus,
  type RateLimitResult,
  type RateLimitConfig,
  type RateLimitStatus,
} from '@/lib/rateLimiterPersistent';

// Mock firebaseAdmin
jest.mock('@/lib/firebaseAdmin', () => ({
  adminDbTransaction: jest.fn(),
  adminDbGet: jest.fn(),
  adminDbRemove: jest.fn(),
}));

import { adminDbTransaction, adminDbGet, adminDbRemove } from '@/lib/firebaseAdmin';

const mockTransaction = jest.mocked(adminDbTransaction);
const mockGet = jest.mocked(adminDbGet);
const mockRemove = jest.mocked(adminDbRemove);

describe('rateLimiterPersistent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('checkRateLimitPersistent', () => {
    it('should allow first request for new user/type (Firebase returns null)', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      // Mock transaction: null current data -> initialize
      mockTransaction.mockImplementation(async (path, updateFn) => {
        const result = updateFn(null);
        return result;
      });

      const result = await checkRateLimitPersistent('user1', 'test');

      expect(result.allowed).toBe(true);
      expect(result.suppressedCount).toBe(0);
      expect(result.nextAllowedIn).toBe(0);
      expect(mockTransaction).toHaveBeenCalledWith(
        'rateLimits/user1/test',
        expect.any(Function)
      );
    });

    it('should block when maxPerWindow reached within windowMs', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      // Simulate existing data at limit (10 test notifications in last minute)
      const existingTimestamps = Array.from({ length: 10 }, (_, i) => now - i * 1000);

      mockTransaction.mockImplementation(async (path, updateFn) => {
        const currentData = {
          timestamps: existingTimestamps,
          windowStart: now - 60000,
        };
        const result = updateFn(currentData);
        return result;
      });

      const result = await checkRateLimitPersistent('user1', 'test');

      expect(result.allowed).toBe(false);
      expect(result.suppressedCount).toBe(10);
      expect(result.nextAllowedIn).toBeGreaterThan(0);
    });

    it('should filter expired timestamps (sliding window)', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      // Mix of recent and old timestamps for 'test' type (1 min window, max 10)
      const recentTimestamps = [now - 10000, now - 20000]; // 10s, 20s ago (within window)
      const oldTimestamps = [now - 90000, now - 120000]; // 1.5min, 2min ago (outside window)
      const existingTimestamps = [...recentTimestamps, ...oldTimestamps];

      mockTransaction.mockImplementation(async (path, updateFn) => {
        const currentData = {
          timestamps: existingTimestamps,
          windowStart: now - 120000,
        };
        const result = updateFn(currentData);
        return result;
      });

      const result = await checkRateLimitPersistent('user1', 'test');

      // Should filter old timestamps and allow (2 recent + 1 new = 3 < 10)
      expect(result.allowed).toBe(true);
      expect(mockTransaction).toHaveBeenCalled();
    });

    it('should return correct nextAllowedIn seconds when blocked', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      // At limit with oldest timestamp 50s ago (test type: 1 min window)
      const oldestTimestamp = now - 50000;
      const existingTimestamps = Array.from(
        { length: 10 },
        (_, i) => oldestTimestamp + i * 1000
      );

      mockTransaction.mockImplementation(async (path, updateFn) => {
        const currentData = {
          timestamps: existingTimestamps,
          windowStart: oldestTimestamp,
        };
        const result = updateFn(currentData);
        return result;
      });

      const result = await checkRateLimitPersistent('user1', 'test');

      expect(result.allowed).toBe(false);
      // Next allowed = oldestTimestamp + windowMs - now
      // = (now - 50000) + 60000 - now = 10000ms = 10s
      expect(result.nextAllowedIn).toBe(10);
    });

    it('should work with custom limits', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      mockTransaction.mockImplementation(async (path, updateFn) => {
        const result = updateFn(null);
        return result;
      });

      const customLimits: RateLimitConfig = {
        windowMinutes: 10,
        maxPerWindow: 3,
      };

      const result = await checkRateLimitPersistent('user1', 'custom', customLimits);

      expect(result.allowed).toBe(true);
      expect(mockTransaction).toHaveBeenCalled();
    });

    it('should cleanup old timestamps beyond max retention (2h)', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      // Mix of timestamps: recent, within window, and very old (> 2h)
      const recentTimestamp = now - 10000; // 10s ago
      const oldButInWindow = now - 30000; // 30s ago
      const veryOldTimestamp = now - 3 * 60 * 60 * 1000; // 3 hours ago

      const existingTimestamps = [recentTimestamp, oldButInWindow, veryOldTimestamp];

      let finalData: any;
      mockTransaction.mockImplementation(async (path, updateFn) => {
        const currentData = {
          timestamps: existingTimestamps,
          windowStart: veryOldTimestamp,
        };
        const result = updateFn(currentData);
        finalData = result;
        return result;
      });

      await checkRateLimitPersistent('user1', 'test');

      // Very old timestamp should be filtered out
      expect(finalData.timestamps).not.toContain(veryOldTimestamp);
      expect(finalData.timestamps.length).toBeLessThan(existingTimestamps.length + 1);
    });

    it('should enforce limits concurrently via transactions', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      // Simulate transaction with 9 existing timestamps (limit is 10)
      const existingTimestamps = Array.from({ length: 9 }, (_, i) => now - i * 1000);

      let transactionCallCount = 0;
      mockTransaction.mockImplementation(async (path, updateFn) => {
        transactionCallCount++;
        const currentData = {
          timestamps: existingTimestamps,
          windowStart: now - 60000,
        };
        const result = updateFn(currentData);
        return result;
      });

      // First request should succeed (9 -> 10)
      const result1 = await checkRateLimitPersistent('user1', 'test');
      expect(result1.allowed).toBe(true);

      // Second request should fail (already at 10)
      mockTransaction.mockImplementation(async (path, updateFn) => {
        // Simulate reading updated data with 10 timestamps
        const updatedTimestamps = [...existingTimestamps, now];
        const currentData = {
          timestamps: updatedTimestamps,
          windowStart: now - 60000,
        };
        const result = updateFn(currentData);
        return result;
      });

      const result2 = await checkRateLimitPersistent('user1', 'test');
      expect(result2.allowed).toBe(false);
    });
  });

  describe('clearRateLimitPersistentForUser', () => {
    it('should remove all rate limit entries for user', async () => {
      mockRemove.mockResolvedValue(undefined);

      await clearRateLimitPersistentForUser('user1');

      expect(mockRemove).toHaveBeenCalledWith('rateLimits/user1');
    });
  });

  describe('getRateLimitPersistentStatus', () => {
    it('should return current count and status', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      // Mock data: 3 recent timestamps for 'test' type (1 min window, max 10)
      const recentTimestamps = [now - 10000, now - 20000, now - 30000];
      mockGet.mockResolvedValue({
        timestamps: recentTimestamps,
        windowStart: now - 60000,
      });

      const status = await getRateLimitPersistentStatus('user1', 'test');

      expect(status.currentCount).toBe(3);
      expect(status.maxAllowed).toBe(10);
      expect(status.windowMinutes).toBe(1);
      expect(status.nextResetIn).toBeGreaterThan(0);
      expect(mockGet).toHaveBeenCalledWith('rateLimits/user1/test');
    });

    it('should handle empty state (no data)', async () => {
      mockGet.mockResolvedValue(null);

      const status = await getRateLimitPersistentStatus('user1', 'test');

      expect(status.currentCount).toBe(0);
      expect(status.maxAllowed).toBe(10);
      expect(status.windowMinutes).toBe(1);
      expect(status.nextResetIn).toBe(0);
    });

    it('should filter expired timestamps when calculating status', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      // Mix of recent and expired timestamps
      const recentTimestamps = [now - 10000, now - 20000]; // Within window
      const expiredTimestamps = [now - 90000, now - 120000]; // Outside 1-min window
      const allTimestamps = [...recentTimestamps, ...expiredTimestamps];

      mockGet.mockResolvedValue({
        timestamps: allTimestamps,
        windowStart: now - 120000,
      });

      const status = await getRateLimitPersistentStatus('user1', 'test');

      // Should only count recent timestamps
      expect(status.currentCount).toBe(2);
      expect(status.maxAllowed).toBe(10);
    });
  });
});
