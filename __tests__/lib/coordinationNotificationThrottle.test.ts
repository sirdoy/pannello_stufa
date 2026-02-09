/**
 * Tests for Coordination Notification Throttle Service
 */

import {
  shouldSendCoordinationNotification,
  recordNotificationSent,
  getThrottleStatus,
  clearThrottle,
  _internals,
} from '@/lib/coordinationNotificationThrottle';

describe('coordinationNotificationThrottle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    _internals.lastNotificationSent.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('shouldSendCoordinationNotification', () => {
    it('allows first notification', () => {
      const userId = 'user123';

      const result = shouldSendCoordinationNotification(userId);

      expect(result).toEqual({
        allowed: true,
        waitSeconds: 0,
        reason: null,
      });
    });

    it('blocks within 30-min window', () => {
      const userId = 'user123';

      // Record first notification
      recordNotificationSent(userId);

      // Try to send another notification immediately
      const result = shouldSendCoordinationNotification(userId);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('global_throttle');
      expect(result.waitSeconds).toBeGreaterThan(0);
    });

    it('allows after 30-min window expires', () => {
      const userId = 'user123';

      // Record first notification
      recordNotificationSent(userId);

      // Advance time by 30 minutes + 1 second
      jest.advanceTimersByTime(30 * 60 * 1000 + 1000);

      // Try to send another notification
      const result = shouldSendCoordinationNotification(userId);

      expect(result).toEqual({
        allowed: true,
        waitSeconds: 0,
        reason: null,
      });
    });

    it('calculates correct wait time', () => {
      const userId = 'user123';

      // Record first notification
      recordNotificationSent(userId);

      // Advance 10 minutes
      jest.advanceTimersByTime(10 * 60 * 1000);

      // Check wait time
      const result = shouldSendCoordinationNotification(userId);

      expect(result.allowed).toBe(false);
      expect(result.waitSeconds).toBeCloseTo(20 * 60, -1); // ~20 minutes remaining
    });
  });

  describe('recordNotificationSent', () => {
    it('updates timestamp', () => {
      const userId = 'user123';
      const now = Date.now();

      recordNotificationSent(userId);

      const timestamp = _internals.lastNotificationSent.get(userId);
      expect(timestamp).toBeGreaterThanOrEqual(now);
    });

    it('overwrites previous timestamp', () => {
      const userId = 'user123';

      // Record first notification
      recordNotificationSent(userId);
      const first = _internals.lastNotificationSent.get(userId);

      // Advance time
      jest.advanceTimersByTime(5 * 60 * 1000);

      // Record second notification
      recordNotificationSent(userId);
      const second = _internals.lastNotificationSent.get(userId);

      expect(second).toBeGreaterThan(first!);
    });
  });

  describe('getThrottleStatus', () => {
    it('returns null status when no notifications sent', () => {
      const status = getThrottleStatus('user123');

      expect(status).toEqual({
        lastSentAt: null,
        nextAllowedAt: null,
        waitSeconds: 0,
      });
    });

    it('returns correct wait time after notification', () => {
      const userId = 'user123';

      recordNotificationSent(userId);
      const lastSent = _internals.lastNotificationSent.get(userId);

      const status = getThrottleStatus(userId);

      expect(status.lastSentAt).toBe(lastSent);
      expect(status.nextAllowedAt).toBe(lastSent! + _internals.GLOBAL_THROTTLE_MS);
      expect(status.waitSeconds).toBeCloseTo(30 * 60, -1); // ~30 minutes
    });

    it('returns zero wait time after window expires', () => {
      const userId = 'user123';

      recordNotificationSent(userId);

      // Advance 31 minutes
      jest.advanceTimersByTime(31 * 60 * 1000);

      const status = getThrottleStatus(userId);

      expect(status.waitSeconds).toBe(0);
    });
  });

  describe('clearThrottle', () => {
    it('removes user entry', () => {
      const userId = 'user123';

      recordNotificationSent(userId);
      expect(_internals.lastNotificationSent.has(userId)).toBe(true);

      const result = clearThrottle(userId);

      expect(result).toBe(true);
      expect(_internals.lastNotificationSent.has(userId)).toBe(false);
    });

    it('returns false if no entry exists', () => {
      const result = clearThrottle('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('global throttle behavior', () => {
    it('throttle is global across all coordination event types', () => {
      const userId = 'user123';

      // Record notification for event type A (e.g., coordinationApplied)
      recordNotificationSent(userId);

      // Try to send notification for event type B (e.g., coordinationRestored)
      // Should be blocked because throttle is GLOBAL, not per-type
      const result = shouldSendCoordinationNotification(userId);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('global_throttle');
    });

    it('different users have independent throttles', () => {
      const user1 = 'user1';
      const user2 = 'user2';

      // Record notification for user1
      recordNotificationSent(user1);

      // User2 should still be allowed (independent throttle)
      const result = shouldSendCoordinationNotification(user2);

      expect(result.allowed).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('removes expired entries', () => {
      const userId1 = 'user1';
      const userId2 = 'user2';

      // Record notifications for two users
      recordNotificationSent(userId1);
      recordNotificationSent(userId2);
      expect(_internals.lastNotificationSent.size).toBe(2);

      // Advance 31 minutes (beyond 30-min window)
      jest.advanceTimersByTime(31 * 60 * 1000);

      // Run cleanup
      _internals.cleanupOldEntries();

      expect(_internals.lastNotificationSent.size).toBe(0);
    });

    it('does not remove recent entries', () => {
      const userId = 'user123';

      recordNotificationSent(userId);
      expect(_internals.lastNotificationSent.size).toBe(1);

      // Advance 15 minutes (within 30-min window)
      jest.advanceTimersByTime(15 * 60 * 1000);

      // Run cleanup
      _internals.cleanupOldEntries();

      expect(_internals.lastNotificationSent.size).toBe(1);
    });

    it('removes some but not all entries', () => {
      const user1 = 'user1';
      const user2 = 'user2';

      // Record notification for user1
      recordNotificationSent(user1);

      // Advance 31 minutes
      jest.advanceTimersByTime(31 * 60 * 1000);

      // Record notification for user2 (recent)
      recordNotificationSent(user2);

      expect(_internals.lastNotificationSent.size).toBe(2);

      // Run cleanup
      _internals.cleanupOldEntries();

      // user1 should be removed (expired), user2 should remain
      expect(_internals.lastNotificationSent.size).toBe(1);
      expect(_internals.lastNotificationSent.has(user1)).toBe(false);
      expect(_internals.lastNotificationSent.has(user2)).toBe(true);
    });
  });
});
