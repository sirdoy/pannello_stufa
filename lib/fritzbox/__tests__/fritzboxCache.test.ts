/**
 * Tests for fritzboxCache
 */

import { getCachedData, invalidateCache, CACHE_TTL_MS } from '../fritzboxCache';
import * as firebaseAdmin from '@/lib/firebaseAdmin';
import * as environmentHelper from '@/lib/environmentHelper';

// Mock dependencies
jest.mock('@/lib/firebaseAdmin');
jest.mock('@/lib/environmentHelper');

const mockAdminDbGet = jest.mocked(firebaseAdmin.adminDbGet);
const mockAdminDbSet = jest.mocked(firebaseAdmin.adminDbSet);
const mockAdminDbRemove = jest.mocked(firebaseAdmin.adminDbRemove);
const mockGetEnvironmentPath = jest.mocked(environmentHelper.getEnvironmentPath);

describe('fritzboxCache', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock getEnvironmentPath to return path as-is
    mockGetEnvironmentPath.mockImplementation((path) => path);
  });

  describe('getCachedData', () => {
    it('cache miss: calls fetchFn, stores result, returns data', async () => {
      const fetchFn = jest.fn().mockResolvedValue({ result: 'fresh data' });
      const now = 1000000;

      jest.spyOn(Date, 'now').mockReturnValue(now);
      mockAdminDbGet.mockResolvedValue(null);

      const result = await getCachedData('test-key', fetchFn);

      expect(result).toEqual({ result: 'fresh data' });
      expect(fetchFn).toHaveBeenCalledTimes(1);
      expect(mockAdminDbSet).toHaveBeenCalledWith('fritzbox/cache/test-key', {
        data: { result: 'fresh data' },
        timestamp: now,
      });
    });

    it('cache hit (within TTL): returns cached data, does NOT call fetchFn', async () => {
      const fetchFn = jest.fn();
      const now = 1000000;
      const cachedTimestamp = now - 30000; // 30s ago (within 60s TTL)

      jest.spyOn(Date, 'now').mockReturnValue(now);
      mockAdminDbGet.mockResolvedValue({
        data: { result: 'cached data' },
        timestamp: cachedTimestamp,
      });

      const result = await getCachedData('test-key', fetchFn);

      expect(result).toEqual({ result: 'cached data' });
      expect(fetchFn).not.toHaveBeenCalled();
      expect(mockAdminDbSet).not.toHaveBeenCalled();
    });

    it('cache expired (beyond TTL): calls fetchFn, updates cache', async () => {
      const fetchFn = jest.fn().mockResolvedValue({ result: 'fresh data' });
      const now = 1000000;
      const cachedTimestamp = now - 90000; // 90s ago (beyond 60s TTL)

      jest.spyOn(Date, 'now').mockReturnValue(now);
      mockAdminDbGet.mockResolvedValue({
        data: { result: 'stale data' },
        timestamp: cachedTimestamp,
      });

      const result = await getCachedData('test-key', fetchFn);

      expect(result).toEqual({ result: 'fresh data' });
      expect(fetchFn).toHaveBeenCalledTimes(1);
      expect(mockAdminDbSet).toHaveBeenCalledWith('fritzbox/cache/test-key', {
        data: { result: 'fresh data' },
        timestamp: now,
      });
    });

    it('cache at exact TTL boundary (60s): refreshes cache', async () => {
      const fetchFn = jest.fn().mockResolvedValue({ result: 'fresh data' });
      const now = 1000000;
      const cachedTimestamp = now - CACHE_TTL_MS; // Exactly 60s ago

      jest.spyOn(Date, 'now').mockReturnValue(now);
      mockAdminDbGet.mockResolvedValue({
        data: { result: 'stale data' },
        timestamp: cachedTimestamp,
      });

      const result = await getCachedData('test-key', fetchFn);

      expect(result).toEqual({ result: 'fresh data' });
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('invalidateCache', () => {
    it('calls adminDbRemove with correct path', async () => {
      await invalidateCache('test-key');

      expect(mockAdminDbRemove).toHaveBeenCalledWith('fritzbox/cache/test-key');
    });
  });
});
