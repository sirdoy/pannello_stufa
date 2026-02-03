/**
 * Tests for weatherCacheService
 * Validates cache key generation, read/write operations, and environment path prefixing
 */

import { getWeatherFromCache, saveWeatherToCache, invalidateWeatherCache } from '../weatherCacheService';

// Mock Firebase Admin
jest.mock('../firebaseAdmin', () => ({
  adminDbGet: jest.fn(),
  adminDbSet: jest.fn(),
  adminDbRemove: jest.fn(),
}));

// Mock environment helper (default to production for tests)
jest.mock('../environmentHelper', () => ({
  getEnvironmentPath: jest.fn((path) => path), // Production: no prefix
}));

import { adminDbGet, adminDbSet, adminDbRemove } from '../firebaseAdmin';
import { getEnvironmentPath } from '../environmentHelper';

describe('weatherCacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Cache key generation', () => {
    it('should generate cache key with 4 decimal precision', async () => {
      const lat = 45.464203;
      const lon = 9.189982;

      adminDbGet.mockResolvedValue(null);

      await getWeatherFromCache(lat, lon);

      // Verify cache key uses 4 decimals
      expect(adminDbGet).toHaveBeenCalledWith('weather/cache/45.4642,9.1900');
    });

    it('should round coordinates correctly', async () => {
      adminDbGet.mockResolvedValue(null);

      // Test rounding (toFixed uses standard rounding)
      await getWeatherFromCache(45.46425, 9.18995);
      expect(adminDbGet).toHaveBeenCalledWith('weather/cache/45.4642,9.1899');

      // Test another coordinate
      await getWeatherFromCache(45.46424, 9.18994);
      expect(adminDbGet).toHaveBeenCalledWith('weather/cache/45.4642,9.1899');
    });

    it('should handle negative coordinates', async () => {
      adminDbGet.mockResolvedValue(null);

      await getWeatherFromCache(-45.4642, -9.19);
      expect(adminDbGet).toHaveBeenCalledWith('weather/cache/-45.4642,-9.1900');
    });
  });

  describe('Environment path prefixing', () => {
    it('should use environment path prefix for cache key', async () => {
      // Mock development environment (returns 'dev/' prefix)
      getEnvironmentPath.mockImplementation((path) => `dev/${path}`);

      adminDbGet.mockResolvedValue(null);

      await getWeatherFromCache(45.4642, 9.19);

      expect(getEnvironmentPath).toHaveBeenCalledWith('weather/cache/45.4642,9.1900');
      expect(adminDbGet).toHaveBeenCalledWith('dev/weather/cache/45.4642,9.1900');
    });

    it('should work without prefix in production', async () => {
      // Mock production environment (returns no prefix)
      getEnvironmentPath.mockImplementation((path) => path);

      adminDbGet.mockResolvedValue(null);

      await getWeatherFromCache(45.4642, 9.19);

      expect(adminDbGet).toHaveBeenCalledWith('weather/cache/45.4642,9.1900');
    });
  });

  describe('getWeatherFromCache', () => {
    it('should return cached data if exists', async () => {
      const mockCachedData = {
        data: {
          current: { temperature_2m: 20 },
          daily: { time: ['2024-01-01'] },
        },
        timestamp: Date.now(),
      };

      adminDbGet.mockResolvedValue(mockCachedData);

      const result = await getWeatherFromCache(45.4642, 9.19);

      expect(result).toEqual(mockCachedData);
      expect(adminDbGet).toHaveBeenCalledWith('weather/cache/45.4642,9.1900');
    });

    it('should return null if cache does not exist', async () => {
      adminDbGet.mockResolvedValue(null);

      const result = await getWeatherFromCache(45.4642, 9.19);

      expect(result).toBeNull();
    });

    it('should return null if cache is invalid (missing data)', async () => {
      adminDbGet.mockResolvedValue({ timestamp: Date.now() }); // Missing 'data'

      const result = await getWeatherFromCache(45.4642, 9.19);

      expect(result).toBeNull();
    });

    it('should return null if cache is invalid (missing timestamp)', async () => {
      adminDbGet.mockResolvedValue({ data: {} }); // Missing 'timestamp'

      const result = await getWeatherFromCache(45.4642, 9.19);

      expect(result).toBeNull();
    });

    it('should handle Firebase errors gracefully', async () => {
      adminDbGet.mockRejectedValue(new Error('Firebase error'));

      const result = await getWeatherFromCache(45.4642, 9.19);

      expect(result).toBeNull();
    });
  });

  describe('saveWeatherToCache', () => {
    it('should save weather data with timestamp', async () => {
      const mockWeatherData = {
        current: { temperature_2m: 22 },
        daily: { time: ['2024-01-01', '2024-01-02'] },
      };

      await saveWeatherToCache(45.4642, 9.19, mockWeatherData);

      expect(adminDbSet).toHaveBeenCalledWith(
        'weather/cache/45.4642,9.1900',
        expect.objectContaining({
          data: mockWeatherData,
          timestamp: expect.any(Number),
        })
      );
    });

    it('should throw error if Firebase save fails', async () => {
      adminDbSet.mockRejectedValue(new Error('Firebase error'));

      await expect(
        saveWeatherToCache(45.4642, 9.19, {})
      ).rejects.toThrow('Firebase error');
    });
  });

  describe('invalidateWeatherCache', () => {
    it('should remove cache entry', async () => {
      await invalidateWeatherCache(45.4642, 9.19);

      expect(adminDbRemove).toHaveBeenCalledWith('weather/cache/45.4642,9.1900');
    });

    it('should throw error if Firebase remove fails', async () => {
      adminDbRemove.mockRejectedValue(new Error('Firebase error'));

      await expect(
        invalidateWeatherCache(45.4642, 9.19)
      ).rejects.toThrow('Firebase error');
    });
  });
});
