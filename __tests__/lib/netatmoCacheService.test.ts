/**
 * @jest-environment node
 */

import { getCached, invalidateCache, CACHE_TTL_MS } from '@/lib/netatmoCacheService';
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';

// Mock dependencies
jest.mock('@/lib/firebaseAdmin');
jest.mock('@/lib/environmentHelper');

const mockAdminDbGet = adminDbGet as jest.MockedFunction<typeof adminDbGet>;
const mockAdminDbSet = adminDbSet as jest.MockedFunction<typeof adminDbSet>;
const mockGetEnvironmentPath = getEnvironmentPath as jest.MockedFunction<typeof getEnvironmentPath>;

describe('netatmoCacheService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Default mock implementation
    mockGetEnvironmentPath.mockImplementation((path) => `dev/${path}`);
  });

  describe('CACHE_TTL_MS', () => {
    it('should export 5-minute TTL constant', () => {
      expect(CACHE_TTL_MS).toBe(5 * 60 * 1000);
      expect(CACHE_TTL_MS).toBe(300000);
    });
  });

  describe('getCached', () => {
    it('should return cached data when cache is valid (< 5 min old)', async () => {
      const cacheKey = 'schedule/12345';
      const cachedData = { schedule: 'test data' };
      const now = Date.now();

      // Mock valid cache (2 minutes old)
      mockAdminDbGet.mockResolvedValue({
        data: cachedData,
        cached_at: now - (2 * 60 * 1000), // 2 minutes ago
      });

      const fetchFn = jest.fn();

      const result = await getCached(cacheKey, fetchFn);

      // Should return cached data
      expect(result.data).toEqual(cachedData);
      expect(result.source).toBe('cache');
      expect((result as any).age_seconds).toBeGreaterThanOrEqual(119);
      expect((result as any).age_seconds).toBeLessThanOrEqual(121);

      // Should NOT call fetch function
      expect(fetchFn).not.toHaveBeenCalled();

      // Should call Firebase with correct path
      expect(adminDbGet).toHaveBeenCalledWith('dev/netatmo/cache/schedule/12345');
    });

    it('should fetch fresh data when cache is expired (> 5 min old)', async () => {
      const cacheKey = 'schedule/12345';
      const freshData = { schedule: 'fresh data' };
      const now = Date.now();

      // Mock expired cache (10 minutes old)
      mockAdminDbGet.mockResolvedValue({
        data: { schedule: 'old data' },
        cached_at: now - (10 * 60 * 1000), // 10 minutes ago
      });

      const fetchFn = jest.fn().mockResolvedValue(freshData);

      const result = await getCached(cacheKey, fetchFn);

      // Should return fresh data
      expect(result.data).toEqual(freshData);
      expect(result.source).toBe('api');
      expect((result as any).age_seconds).toBeUndefined();

      // Should call fetch function
      expect(fetchFn).toHaveBeenCalledTimes(1);

      // Should store fresh data in cache
      expect(adminDbSet).toHaveBeenCalledWith(
        'dev/netatmo/cache/schedule/12345',
        expect.objectContaining({
          data: freshData,
          cached_at: expect.any(Number),
        })
      );
    });

    it('should fetch fresh data when cache is empty', async () => {
      const cacheKey = 'schedule/67890';
      const freshData = { schedule: 'brand new data' };

      // Mock empty cache
      mockAdminDbGet.mockResolvedValue(null);

      const fetchFn = jest.fn().mockResolvedValue(freshData);

      const result = await getCached(cacheKey, fetchFn);

      // Should return fresh data
      expect(result.data).toEqual(freshData);
      expect(result.source).toBe('api');

      // Should call fetch function
      expect(fetchFn).toHaveBeenCalledTimes(1);

      // Should store fresh data in cache
      expect(adminDbSet).toHaveBeenCalledWith(
        'dev/netatmo/cache/schedule/67890',
        expect.objectContaining({
          data: freshData,
          cached_at: expect.any(Number),
        })
      );
    });

    it('should store fresh data in cache after fetch', async () => {
      const cacheKey = 'schedule/99999';
      const freshData = { temperature: 21 };
      const mockTimestamp = 1609459200000;

      // Mock Date.now() for predictable timestamp
      const originalNow = Date.now;
      Date.now = jest.fn(() => mockTimestamp);

      // Mock empty cache
      mockAdminDbGet.mockResolvedValue(null);

      const fetchFn = jest.fn().mockResolvedValue(freshData);

      await getCached(cacheKey, fetchFn);

      // Should store with exact timestamp
      expect(adminDbSet).toHaveBeenCalledWith(
        'dev/netatmo/cache/schedule/99999',
        {
          data: freshData,
          cached_at: mockTimestamp,
        }
      );

      // Restore Date.now
      Date.now = originalNow;
    });

    it('should handle fetch errors properly', async () => {
      const cacheKey = 'schedule/error';
      const fetchError = new Error('Netatmo API error');

      // Mock empty cache
      mockAdminDbGet.mockResolvedValue(null);

      const fetchFn = jest.fn().mockRejectedValue(fetchError);

      // Should propagate the error
      await expect(getCached(cacheKey, fetchFn)).rejects.toThrow('Netatmo API error');

      // Should NOT store anything in cache
      expect(adminDbSet).not.toHaveBeenCalled();
    });

    it('should handle invalid cache entries (missing data field)', async () => {
      const cacheKey = 'schedule/invalid';
      const freshData = { schedule: 'recovered data' };

      // Mock invalid cache (missing data field)
      mockAdminDbGet.mockResolvedValue({
        cached_at: Date.now() - 60000,
        // data field missing
      });

      const fetchFn = jest.fn().mockResolvedValue(freshData);

      const result = await getCached(cacheKey, fetchFn);

      // Should fetch fresh data
      expect(result.data).toEqual(freshData);
      expect(result.source).toBe('api');
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('should handle invalid cache entries (missing cached_at field)', async () => {
      const cacheKey = 'schedule/invalid2';
      const freshData = { schedule: 'recovered data' };

      // Mock invalid cache (missing cached_at field)
      mockAdminDbGet.mockResolvedValue({
        data: { schedule: 'old data' },
        // cached_at field missing
      });

      const fetchFn = jest.fn().mockResolvedValue(freshData);

      const result = await getCached(cacheKey, fetchFn);

      // Should fetch fresh data
      expect(result.data).toEqual(freshData);
      expect(result.source).toBe('api');
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('invalidateCache', () => {
    it('should remove cache entry from Firebase', async () => {
      const cacheKey = 'schedule/12345';

      mockAdminDbSet.mockResolvedValue(undefined);

      const result = await invalidateCache(cacheKey);

      // Should return true
      expect(result).toBe(true);

      // Should delete cache entry
      expect(adminDbSet).toHaveBeenCalledWith('dev/netatmo/cache/schedule/12345', null);
    });

    it('should handle errors during invalidation', async () => {
      const cacheKey = 'schedule/error';
      const deleteError = new Error('Firebase error');

      mockAdminDbSet.mockRejectedValue(deleteError);

      // Should propagate the error
      await expect(invalidateCache(cacheKey)).rejects.toThrow('Firebase error');
    });

    it('should work with nested cache keys', async () => {
      const cacheKey = 'schedule/home/12345/room/67890';

      mockAdminDbSet.mockResolvedValue(undefined);

      await invalidateCache(cacheKey);

      // Should construct correct path
      expect(adminDbSet).toHaveBeenCalledWith(
        'dev/netatmo/cache/schedule/home/12345/room/67890',
        null
      );
    });
  });
});
