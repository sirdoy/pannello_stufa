/**
 * Tests for Persistent Netatmo API Rate Limiter
 *
 * Tests Firebase RTDB-backed rate limiting with dual enforcement:
 * - 10-second burst limit (50 requests)
 * - 1-hour conservative limit (400 requests)
 */

import {
  checkNetatmoRateLimitPersistent,
  trackNetatmoApiCallPersistent,
  getNetatmoRateLimitPersistentStatus,
  NETATMO_RATE_LIMIT,
  NETATMO_CONSERVATIVE_LIMIT,
} from '@/lib/netatmoRateLimiterPersistent';
import { adminDbTransaction, adminDbGet } from '@/lib/firebaseAdmin';

// Mock Firebase Admin functions
jest.mock('@/lib/firebaseAdmin', () => ({
  adminDbTransaction: jest.fn(),
  adminDbGet: jest.fn(),
}));

describe('netatmoRateLimiterPersistent', () => {
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('checkNetatmoRateLimitPersistent', () => {
    it('should allow request when under both limits (fresh user)', async () => {
      // Mock empty state (no previous calls)
      (adminDbGet as jest.Mock).mockResolvedValue(null);

      const result = await checkNetatmoRateLimitPersistent(mockUserId);

      expect(result.allowed).toBe(true);
      if (result.allowed) {
        expect(result.remaining).toBe(50); // Burst limit remaining
      }
      expect(adminDbGet).toHaveBeenCalledWith(`rateLimits/${mockUserId}/netatmo_api_10s`);
      expect(adminDbGet).toHaveBeenCalledWith(`rateLimits/${mockUserId}/netatmo_api_1h`);
    });

    it('should block when 10s burst limit reached (50 calls)', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      // Mock burst window with 50 timestamps (all within 10s)
      const burstTimestamps = Array(50).fill(null).map((_, i) => now - i * 100);
      (adminDbGet as jest.Mock)
        .mockResolvedValueOnce({ timestamps: burstTimestamps }) // 10s window
        .mockResolvedValueOnce({ count: 45, windowStart: now - 5000 }); // 1h window (under limit)

      const result = await checkNetatmoRateLimitPersistent(mockUserId);

      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.currentCount).toBe(50);
        expect(result.limit).toBe(50);
        expect(result.resetInSeconds).toBeGreaterThan(0);
        expect(result.resetInSeconds).toBeLessThanOrEqual(10);
      }
    });

    it('should block when hourly limit reached (400 calls)', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      // Mock: burst window OK (5 calls), hourly window maxed (400 calls)
      (adminDbGet as jest.Mock)
        .mockResolvedValueOnce({ timestamps: Array(5).fill(now - 1000) }) // 10s window
        .mockResolvedValueOnce({ count: 400, windowStart: now - 60000 }); // 1h window (at limit)

      const result = await checkNetatmoRateLimitPersistent(mockUserId);

      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.currentCount).toBe(400);
        expect(result.limit).toBe(400);
        expect(result.resetInSeconds).toBeGreaterThan(0);
      }
    });

    it('should return correct remaining count', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      // Mock: 10 calls in burst window, 50 calls in hourly window
      (adminDbGet as jest.Mock)
        .mockResolvedValueOnce({ timestamps: Array(10).fill(now - 1000) }) // 10s window
        .mockResolvedValueOnce({ count: 50, windowStart: now - 60000 }); // 1h window

      const result = await checkNetatmoRateLimitPersistent(mockUserId);

      expect(result.allowed).toBe(true);
      if (result.allowed) {
        expect(result.remaining).toBe(40); // Min of (50-10, 400-50) = 40
        expect(result.currentCount).toBe(10); // Reports burst count (burst is more restrictive)
        expect(result.limit).toBe(50); // Reports burst limit
      }
    });

    it('should reset 10s window after 10 seconds pass', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      // Mock: 50 calls 11 seconds ago (expired)
      const oldTimestamps = Array(50).fill(now - 11000);
      (adminDbGet as jest.Mock)
        .mockResolvedValueOnce({ timestamps: oldTimestamps }) // 10s window (expired)
        .mockResolvedValueOnce({ count: 50, windowStart: now - 11000 }); // 1h window

      const result = await checkNetatmoRateLimitPersistent(mockUserId);

      expect(result.allowed).toBe(true); // Burst window expired, should allow
      if (result.allowed) {
        expect(result.remaining).toBe(50); // Full burst window available
      }
    });

    it('should reset hourly window after 1 hour passes', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      // Mock: 400 calls over 1 hour ago (expired)
      (adminDbGet as jest.Mock)
        .mockResolvedValueOnce({ timestamps: [] }) // 10s window (empty)
        .mockResolvedValueOnce({ count: 400, windowStart: now - 3601000 }); // 1h window (expired)

      const result = await checkNetatmoRateLimitPersistent(mockUserId);

      expect(result.allowed).toBe(true); // Hourly window expired
    });
  });

  describe('trackNetatmoApiCallPersistent', () => {
    it('should increment counter atomically via transaction', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      // Mock transaction for burst window
      (adminDbTransaction as jest.Mock).mockImplementation(async (path, updateFn) => {
        const current = { timestamps: Array(5).fill(now - 1000) };
        const updated = updateFn(current);
        return updated;
      });

      // Mock transaction for hourly window
      (adminDbTransaction as jest.Mock).mockImplementation(async (path, updateFn) => {
        if (path.includes('netatmo_api_1h')) {
          const current = { count: 10, windowStart: now - 60000 };
          const updated = updateFn(current);
          return updated;
        }
        const current = { timestamps: Array(5).fill(now - 1000) };
        const updated = updateFn(current);
        return updated;
      });

      const result = await trackNetatmoApiCallPersistent(mockUserId);

      expect(adminDbTransaction).toHaveBeenCalledTimes(2); // Both windows
      expect(result.count).toBeGreaterThan(0);
      expect(result.limit).toBe(50); // Reports burst limit
      expect(result.remaining).toBeLessThan(50);
    });

    it('should create new entry for new user', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      // Mock transaction with null current data (new user)
      (adminDbTransaction as jest.Mock).mockImplementation(async (path, updateFn) => {
        const updated = updateFn(null);
        return updated;
      });

      const result = await trackNetatmoApiCallPersistent(mockUserId);

      expect(result.count).toBe(1);
      expect(result.remaining).toBe(49);
    });

    it('should return correct count, limit, remaining', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      // Mock existing data
      (adminDbTransaction as jest.Mock).mockImplementation(async (path, updateFn) => {
        if (path.includes('netatmo_api_1h')) {
          const current = { count: 15, windowStart: now - 60000 };
          return updateFn(current);
        }
        const current = { timestamps: Array(15).fill(now - 1000) };
        return updateFn(current);
      });

      const result = await trackNetatmoApiCallPersistent(mockUserId);

      expect(result.count).toBeGreaterThan(0);
      expect(result.limit).toBe(50);
      expect(result.remaining).toBeGreaterThan(0);
    });

    it('should reset count when window expires', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      // Mock expired window
      (adminDbTransaction as jest.Mock).mockImplementation(async (path, updateFn) => {
        if (path.includes('netatmo_api_1h')) {
          const current = { count: 100, windowStart: now - 3601000 }; // Expired
          return updateFn(current);
        }
        const current = { timestamps: [] }; // Empty burst window
        return updateFn(current);
      });

      const result = await trackNetatmoApiCallPersistent(mockUserId);

      expect(result.count).toBe(1); // Reset to 1 (new window)
    });
  });

  describe('getNetatmoRateLimitPersistentStatus', () => {
    it('should return zero count for untracked user', async () => {
      (adminDbGet as jest.Mock).mockResolvedValue(null);

      const result = await getNetatmoRateLimitPersistentStatus(mockUserId);

      expect(result.currentCount).toBe(0);
      expect(result.limit).toBe(400); // Reports hourly limit
      expect(result.remaining).toBe(400);
    });

    it('should return correct status for tracked user', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      // Mock existing hourly data
      (adminDbGet as jest.Mock).mockResolvedValue({
        count: 50,
        windowStart: now - 60000,
      });

      const result = await getNetatmoRateLimitPersistentStatus(mockUserId);

      expect(result.currentCount).toBe(50);
      expect(result.limit).toBe(400); // Reports hourly limit
      expect(result.remaining).toBe(350);
      expect(result.windowStart).toBe(now - 60000);
      expect(result.nextResetIn).toBeGreaterThan(0);
    });

    it('should return zero count for expired window', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      // Mock expired window
      (adminDbGet as jest.Mock).mockResolvedValue({
        count: 100,
        windowStart: now - 3601000, // Over 1 hour ago
      });

      const result = await getNetatmoRateLimitPersistentStatus(mockUserId);

      expect(result.currentCount).toBe(0);
      expect(result.remaining).toBe(400);
    });
  });

  describe('cleanup logic', () => {
    it('should filter expired timestamps on every transaction', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      // Mock transaction: verify that old timestamps are filtered
      (adminDbTransaction as jest.Mock).mockImplementation(async (path, updateFn) => {
        if (path.includes('netatmo_api_10s')) {
          // Burst window - simulate mixed recent/expired timestamps
          const current = {
            timestamps: [
              now - 100, // Recent (within 10s)
              now - 5000, // Recent (within 10s)
              now - 11000, // Expired (> 10s)
              now - 15000, // Expired (> 10s)
            ],
          };
          const updated = updateFn(current);
          // After cleanup, should only have recent timestamps + new one
          return updated;
        }
        // Hourly window
        const current = { count: 10, windowStart: now - 60000 };
        return updateFn(current);
      });

      const result = await trackNetatmoApiCallPersistent(mockUserId);

      // Verify transaction was called for burst window
      expect(adminDbTransaction).toHaveBeenCalledWith(
        `rateLimits/${mockUserId}/netatmo_api_10s`,
        expect.any(Function)
      );

      // Count should reflect filtered timestamps (2 recent) + 1 new = 3
      expect(result.count).toBe(3);
    });
  });

  describe('constants', () => {
    it('should export correct rate limit constants', () => {
      expect(NETATMO_RATE_LIMIT).toBe(500); // Actual Netatmo limit
      expect(NETATMO_CONSERVATIVE_LIMIT).toBe(400); // Enforced limit with buffer
    });
  });
});
