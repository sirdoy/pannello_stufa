/**
 * Tests for deduplicationManager - Request deduplication with 2-second window
 */

import { deduplicationManager, createRequestKey, DeduplicationManager } from '../deduplicationManager';

describe('deduplicationManager', () => {
  let manager: DeduplicationManager;

  beforeEach(() => {
    jest.useFakeTimers();
    manager = new DeduplicationManager();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('isDuplicate', () => {
    it('returns false for first call with a given key', () => {
      const result = manager.isDuplicate('stove:ignite');

      expect(result).toBe(false);
    });

    it('returns true for second call within 2-second window', () => {
      manager.isDuplicate('stove:ignite'); // First call
      jest.advanceTimersByTime(1000); // Advance 1 second

      const result = manager.isDuplicate('stove:ignite'); // Second call

      expect(result).toBe(true);
    });

    it('returns false after 2-second window expires', () => {
      manager.isDuplicate('stove:ignite'); // First call
      jest.advanceTimersByTime(2001); // Advance past 2-second window

      const result = manager.isDuplicate('stove:ignite'); // After window

      expect(result).toBe(false);
    });

    it('clear removes dedup state, allowing immediate re-request', () => {
      manager.isDuplicate('stove:ignite'); // First call
      manager.clear('stove:ignite'); // Clear state

      const result = manager.isDuplicate('stove:ignite'); // Should be allowed

      expect(result).toBe(false);
    });

    it('different keys do not interfere with each other', () => {
      manager.isDuplicate('stove:ignite'); // Mark stove:ignite as in-flight

      const result1 = manager.isDuplicate('stove:shutdown'); // Different key
      const result2 = manager.isDuplicate('netatmo:sync'); // Different key

      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });
  });

  describe('isInFlight', () => {
    it('returns true during active request', () => {
      manager.isDuplicate('stove:ignite'); // Mark as in-flight

      const result = manager.isInFlight('stove:ignite');

      expect(result).toBe(true);
    });

    it('returns false after clear', () => {
      manager.isDuplicate('stove:ignite'); // Mark as in-flight
      manager.clear('stove:ignite'); // Clear

      const result = manager.isInFlight('stove:ignite');

      expect(result).toBe(false);
    });

    it('returns false after 2-second window expires', () => {
      manager.isDuplicate('stove:ignite'); // Mark as in-flight
      jest.advanceTimersByTime(2001); // Advance past window

      const result = manager.isInFlight('stove:ignite');

      expect(result).toBe(false);
    });

    it('returns false for unknown key', () => {
      const result = manager.isInFlight('unknown:key');

      expect(result).toBe(false);
    });
  });

  describe('createRequestKey', () => {
    it('generates stable key for same device+action combination', () => {
      const key1 = createRequestKey('stove', 'ignite');
      const key2 = createRequestKey('stove', 'ignite');

      expect(key1).toBe(key2);
      expect(key1).toBe('stove:ignite');
    });

    it('generates different keys for different combinations', () => {
      const key1 = createRequestKey('stove', 'ignite');
      const key2 = createRequestKey('stove', 'shutdown');
      const key3 = createRequestKey('netatmo', 'sync');

      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key2).not.toBe(key3);
    });
  });

  describe('singleton', () => {
    it('deduplicationManager singleton works', () => {
      expect(deduplicationManager).toBeInstanceOf(DeduplicationManager);

      // Verify it maintains state across calls
      deduplicationManager.isDuplicate('test:key');
      const result = deduplicationManager.isDuplicate('test:key');

      expect(result).toBe(true);

      // Clean up
      deduplicationManager.clear('test:key');
    });
  });
});
