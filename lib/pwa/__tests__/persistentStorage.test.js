/**
 * Persistent Storage Service Tests
 */

import {
  isStorageSupported,
  isPersisted,
  requestPersistentStorage,
  getStorageEstimate,
} from '../persistentStorage';

describe('persistentStorage', () => {
  describe('isStorageSupported', () => {
    it('returns boolean', () => {
      const result = isStorageSupported();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('isPersisted', () => {
    it('returns boolean', async () => {
      const result = await isPersisted();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('requestPersistentStorage', () => {
    beforeEach(() => {
      // Mock navigator.storage
      if (!navigator.storage) {
        Object.defineProperty(navigator, 'storage', {
          value: {},
          writable: true,
          configurable: true,
        });
      }
      navigator.storage.persist = jest.fn().mockResolvedValue(true);
      navigator.storage.persisted = jest.fn().mockResolvedValue(false);
    });

    it('requests persistence', async () => {
      const result = await requestPersistentStorage();
      expect(navigator.storage.persist).toHaveBeenCalled();
    });

    it('returns true when granted', async () => {
      const result = await requestPersistentStorage();
      expect(result).toBe(true);
    });

    it('returns true if already persisted', async () => {
      navigator.storage.persisted = jest.fn().mockResolvedValue(true);
      const result = await requestPersistentStorage();
      expect(result).toBe(true);
    });
  });

  describe('getStorageEstimate', () => {
    beforeEach(() => {
      if (!navigator.storage) {
        Object.defineProperty(navigator, 'storage', {
          value: {},
          writable: true,
          configurable: true,
        });
      }
      navigator.storage.estimate = jest.fn().mockResolvedValue({
        usage: 1024 * 1024, // 1 MB
        quota: 100 * 1024 * 1024, // 100 MB
      });
    });

    it('returns storage estimate', async () => {
      const estimate = await getStorageEstimate();

      expect(estimate.supported).toBe(true);
      expect(estimate.usage).toBe(1024 * 1024);
      expect(estimate.quota).toBe(100 * 1024 * 1024);
      expect(estimate.usageFormatted).toBe('1 MB');
      expect(estimate.quotaFormatted).toBe('100 MB');
    });

    it('calculates usage percentage', async () => {
      const estimate = await getStorageEstimate();
      expect(parseFloat(estimate.usagePercent)).toBeCloseTo(1, 1);
    });
  });
});
