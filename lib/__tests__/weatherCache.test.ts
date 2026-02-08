/**
 * Weather Cache Unit Tests
 *
 * Tests for stale-while-revalidate caching pattern.
 * Verifies:
 * - First call fetches and caches
 * - Second call returns cached data
 * - Coordinate normalization to 4 decimals
 * - Different locations cached separately
 * - Cache clearing works
 */

import { getCachedWeather, clearWeatherCache } from '../weatherCache';

describe('weatherCache', () => {
  beforeEach(() => {
    // Clear cache before each test for isolation
    clearWeatherCache();
  });

  it('fetches data on first call', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ temperature: 20 });

    const result = await getCachedWeather(45.4642, 9.19, mockFetch);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(45.4642, 9.19);
    expect(result.data).toEqual({ temperature: 20 });
    expect(result.stale).toBe(false);
    expect(result.cachedAt).toBeDefined();
  });

  it('returns cached data on second call within TTL', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ temperature: 20 });

    const result1 = await getCachedWeather(45.4642, 9.19, mockFetch);
    const result2 = await getCachedWeather(45.4642, 9.19, mockFetch);

    // Only called once (cached on second call)
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result2.data).toEqual({ temperature: 20 });
    expect(result2.stale).toBe(false);
    expect(result2.cachedAt).toBe(result1.cachedAt);
  });

  it('normalizes coordinates to 4 decimal places for cache key', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ temperature: 20 });

    // These should hit the same cache entry
    await getCachedWeather(45.46423456, 9.19001234, mockFetch);
    await getCachedWeather(45.4642, 9.19, mockFetch);

    // Only fetched once - coordinates normalized to same key
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('caches different locations separately', async () => {
    const mockFetch = jest.fn()
      .mockResolvedValueOnce({ temperature: 20 })
      .mockResolvedValueOnce({ temperature: 25 });

    const result1 = await getCachedWeather(45.4642, 9.19, mockFetch);
    const result2 = await getCachedWeather(41.9028, 12.4964, mockFetch);

    // Called twice - different locations
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect((result1.data as any).temperature).toBe(20);
    expect((result2.data as any).temperature).toBe(25);
  });

  it('clearWeatherCache removes all cached data', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ temperature: 20 });

    // First call - cache
    await getCachedWeather(45.4642, 9.19, mockFetch);

    // Clear cache
    clearWeatherCache();

    // Second call after clear - should fetch again
    await getCachedWeather(45.4642, 9.19, mockFetch);

    // Called twice - cache was cleared
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
