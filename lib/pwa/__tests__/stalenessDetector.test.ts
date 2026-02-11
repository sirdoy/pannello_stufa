/**
 * Tests for staleness detection and command expiration
 *
 * @jest-environment jsdom
 */

import { getDeviceStaleness, isCommandExpired, STALENESS_THRESHOLD } from '../stalenessDetector';
import * as indexedDB from '../indexedDB';

// Mock IndexedDB
jest.mock('../indexedDB');

describe('stalenessDetector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDeviceStaleness', () => {
    it('returns stale info when no cached data exists', async () => {
      jest.mocked(indexedDB.get).mockResolvedValue(undefined);

      const result = await getDeviceStaleness('stove');

      expect(result).toEqual({
        isStale: true,
        cachedAt: null,
        ageSeconds: Infinity,
      });
      expect(indexedDB.get).toHaveBeenCalledWith(indexedDB.STORES.DEVICE_STATE, 'stove');
    });

    it('returns stale info when cached data has no timestamp', async () => {
      jest.mocked(indexedDB.get).mockResolvedValue({
        deviceId: 'stove',
        state: { status: 'on' },
        // No timestamp
      });

      const result = await getDeviceStaleness('stove');

      expect(result).toEqual({
        isStale: true,
        cachedAt: null,
        ageSeconds: Infinity,
      });
    });

    it('returns fresh info when cached data is under 30 seconds old', async () => {
      const now = Date.now();
      const cachedAt = new Date(now - 5000); // 5 seconds ago

      jest.mocked(indexedDB.get).mockResolvedValue({
        deviceId: 'stove',
        state: { status: 'on' },
        timestamp: cachedAt.toISOString(),
      });

      const result = await getDeviceStaleness('stove');

      expect(result.isStale).toBe(false);
      expect(result.cachedAt).toEqual(cachedAt);
      expect(result.ageSeconds).toBeGreaterThanOrEqual(5);
      expect(result.ageSeconds).toBeLessThan(6);
    });

    it('returns stale info when cached data is over 30 seconds old', async () => {
      const now = Date.now();
      const cachedAt = new Date(now - 60000); // 60 seconds ago

      jest.mocked(indexedDB.get).mockResolvedValue({
        deviceId: 'stove',
        state: { status: 'on' },
        timestamp: cachedAt.toISOString(),
      });

      const result = await getDeviceStaleness('stove');

      expect(result.isStale).toBe(true);
      expect(result.cachedAt).toEqual(cachedAt);
      expect(result.ageSeconds).toBeGreaterThanOrEqual(60);
      expect(result.ageSeconds).toBeLessThan(61);
    });

    it('returns stale info exactly at 30 second threshold', async () => {
      const now = Date.now();
      const cachedAt = new Date(now - STALENESS_THRESHOLD);

      jest.mocked(indexedDB.get).mockResolvedValue({
        deviceId: 'stove',
        state: { status: 'on' },
        timestamp: cachedAt.toISOString(),
      });

      const result = await getDeviceStaleness('stove');

      expect(result.isStale).toBe(true); // At threshold = stale
    });
  });

  describe('isCommandExpired', () => {
    it('returns true for safety-critical command over 1 hour old', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

      const result = isCommandExpired({
        endpoint: 'stove/ignite',
        timestamp: twoHoursAgo,
      });

      expect(result).toBe(true);
    });

    it('returns false for safety-critical command under 1 hour old', () => {
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

      const result = isCommandExpired({
        endpoint: 'stove/shutdown',
        timestamp: thirtyMinsAgo,
      });

      expect(result).toBe(false);
    });

    it('returns false for read-only command regardless of age', () => {
      const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();

      const result = isCommandExpired({
        endpoint: 'status/get',
        timestamp: fiveHoursAgo,
      });

      expect(result).toBe(false);
    });

    it('recognizes all safety-critical endpoints', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

      expect(isCommandExpired({ endpoint: 'stove/ignite', timestamp: twoHoursAgo })).toBe(true);
      expect(isCommandExpired({ endpoint: 'stove/shutdown', timestamp: twoHoursAgo })).toBe(true);
      expect(isCommandExpired({ endpoint: 'stove/set-power', timestamp: twoHoursAgo })).toBe(true);
    });

    it('returns false for non-safety-critical write commands when old', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

      const result = isCommandExpired({
        endpoint: 'thermostat/set-temperature',
        timestamp: twoHoursAgo,
      });

      expect(result).toBe(false);
    });

    it('returns false at exactly 1 hour threshold for safety-critical', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const result = isCommandExpired({
        endpoint: 'stove/ignite',
        timestamp: oneHourAgo,
      });

      expect(result).toBe(false); // At threshold = not expired
    });
  });
});
