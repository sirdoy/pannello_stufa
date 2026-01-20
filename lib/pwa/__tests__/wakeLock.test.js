/**
 * Wake Lock Service Tests
 */

import {
  isWakeLockSupported,
  requestWakeLock,
  releaseWakeLock,
  isWakeLockActive,
} from '../wakeLock';

describe('wakeLock', () => {
  describe('isWakeLockSupported', () => {
    it('returns boolean based on navigator.wakeLock', () => {
      const result = isWakeLockSupported();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('requestWakeLock', () => {
    it('returns false if not supported', async () => {
      // In jsdom, wakeLock is not supported
      const originalWakeLock = navigator.wakeLock;
      delete navigator.wakeLock;

      const result = await requestWakeLock();
      expect(result).toBe(false);

      // Restore
      if (originalWakeLock) {
        navigator.wakeLock = originalWakeLock;
      }
    });
  });

  describe('releaseWakeLock', () => {
    it('returns true if no lock active', async () => {
      const result = await releaseWakeLock();
      expect(result).toBe(true);
    });
  });

  describe('isWakeLockActive', () => {
    it('returns false when no lock', () => {
      const result = isWakeLockActive();
      expect(result).toBe(false);
    });
  });
});
