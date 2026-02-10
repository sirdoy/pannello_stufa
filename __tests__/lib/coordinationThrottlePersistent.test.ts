/**
 * Tests for Persistent Coordination Throttle
 *
 * Tests Firebase RTDB-backed coordination notification throttle.
 * Mirrors coordinationNotificationThrottle.ts but persists across cold starts.
 */

import {
  shouldSendCoordinationNotificationPersistent,
  recordNotificationSentPersistent,
  getThrottlePersistentStatus,
  clearThrottlePersistent,
  GLOBAL_THROTTLE_MS,
} from '@/lib/coordinationThrottlePersistent';
import { adminDbGet, adminDbSet, adminDbRemove } from '@/lib/firebaseAdmin';

// Mock Firebase Admin
jest.mock('@/lib/firebaseAdmin', () => ({
  adminDbGet: jest.fn(),
  adminDbSet: jest.fn(),
  adminDbRemove: jest.fn(),
}));

describe('coordinationThrottlePersistent', () => {
  const mockUserId = 'auth0|test123';
  const mockUserId2 = 'auth0|test456';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-10T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('shouldSendCoordinationNotificationPersistent', () => {
    it('should allow first notification when Firebase returns null', async () => {
      // No previous notification in Firebase
      jest.mocked(adminDbGet).mockResolvedValue(null);

      const result = await shouldSendCoordinationNotificationPersistent(mockUserId);

      expect(result).toEqual({
        allowed: true,
        waitSeconds: 0,
        reason: null,
      });
      expect(adminDbGet).toHaveBeenCalledWith(`rateLimits/${mockUserId}/coordination_throttle`);
    });

    it('should block notification within 30-minute window', async () => {
      const now = Date.now();
      const lastSent = now - 15 * 60 * 1000; // 15 minutes ago

      // Firebase returns recent timestamp
      jest.mocked(adminDbGet).mockResolvedValue({ lastSentAt: lastSent });

      const result = await shouldSendCoordinationNotificationPersistent(mockUserId);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('global_throttle');
      // 15 minutes remaining = 900 seconds
      expect(result.waitSeconds).toBe(900);
    });

    it('should allow notification after 30-minute window expires', async () => {
      const now = Date.now();
      const lastSent = now - 31 * 60 * 1000; // 31 minutes ago (expired)

      jest.mocked(adminDbGet).mockResolvedValue({ lastSentAt: lastSent });

      const result = await shouldSendCoordinationNotificationPersistent(mockUserId);

      expect(result).toEqual({
        allowed: true,
        waitSeconds: 0,
        reason: null,
      });
    });

    it('should calculate correct waitSeconds when blocked', async () => {
      const now = Date.now();
      const lastSent = now - 25 * 60 * 1000; // 25 minutes ago

      jest.mocked(adminDbGet).mockResolvedValue({ lastSentAt: lastSent });

      const result = await shouldSendCoordinationNotificationPersistent(mockUserId);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('global_throttle');
      // 5 minutes remaining = 300 seconds
      expect(result.waitSeconds).toBe(300);
    });

    it('should have independent throttle windows for different users', async () => {
      const now = Date.now();
      const lastSent = now - 15 * 60 * 1000; // 15 minutes ago

      // User 1 blocked
      jest.mocked(adminDbGet).mockResolvedValueOnce({ lastSentAt: lastSent });
      const result1 = await shouldSendCoordinationNotificationPersistent(mockUserId);
      expect(result1.allowed).toBe(false);

      // User 2 allowed (no previous notification)
      jest.mocked(adminDbGet).mockResolvedValueOnce(null);
      const result2 = await shouldSendCoordinationNotificationPersistent(mockUserId2);
      expect(result2.allowed).toBe(true);

      // Verify different paths were checked
      expect(adminDbGet).toHaveBeenCalledWith(`rateLimits/${mockUserId}/coordination_throttle`);
      expect(adminDbGet).toHaveBeenCalledWith(`rateLimits/${mockUserId2}/coordination_throttle`);
    });
  });

  describe('recordNotificationSentPersistent', () => {
    it('should write current timestamp to Firebase', async () => {
      const now = Date.now();
      jest.mocked(adminDbSet).mockResolvedValue();

      await recordNotificationSentPersistent(mockUserId);

      expect(adminDbSet).toHaveBeenCalledWith(
        `rateLimits/${mockUserId}/coordination_throttle`,
        { lastSentAt: now }
      );
    });

    it('should overwrite previous timestamp atomically', async () => {
      const firstTime = Date.now();
      jest.mocked(adminDbSet).mockResolvedValue();

      // First record
      await recordNotificationSentPersistent(mockUserId);
      expect(adminDbSet).toHaveBeenCalledWith(
        `rateLimits/${mockUserId}/coordination_throttle`,
        { lastSentAt: firstTime }
      );

      // Advance time
      jest.advanceTimersByTime(5 * 60 * 1000); // 5 minutes
      const secondTime = Date.now();

      // Second record (overwrites)
      await recordNotificationSentPersistent(mockUserId);
      expect(adminDbSet).toHaveBeenCalledWith(
        `rateLimits/${mockUserId}/coordination_throttle`,
        { lastSentAt: secondTime }
      );

      expect(adminDbSet).toHaveBeenCalledTimes(2);
    });
  });

  describe('getThrottlePersistentStatus', () => {
    it('should return null status when no notifications sent', async () => {
      jest.mocked(adminDbGet).mockResolvedValue(null);

      const status = await getThrottlePersistentStatus(mockUserId);

      expect(status).toEqual({
        lastSentAt: null,
        nextAllowedAt: null,
        waitSeconds: 0,
      });
    });

    it('should return correct wait time after notification recorded', async () => {
      const now = Date.now();
      const lastSent = now - 10 * 60 * 1000; // 10 minutes ago

      jest.mocked(adminDbGet).mockResolvedValue({ lastSentAt: lastSent });

      const status = await getThrottlePersistentStatus(mockUserId);

      const expectedNextAllowed = lastSent + GLOBAL_THROTTLE_MS;
      const expectedWaitSeconds = Math.ceil((expectedNextAllowed - now) / 1000);

      expect(status.lastSentAt).toBe(lastSent);
      expect(status.nextAllowedAt).toBe(expectedNextAllowed);
      expect(status.waitSeconds).toBe(expectedWaitSeconds); // 20 minutes = 1200 seconds
    });

    it('should return zero wait time after window expires', async () => {
      const now = Date.now();
      const lastSent = now - 35 * 60 * 1000; // 35 minutes ago (expired)

      jest.mocked(adminDbGet).mockResolvedValue({ lastSentAt: lastSent });

      const status = await getThrottlePersistentStatus(mockUserId);

      expect(status.lastSentAt).toBe(lastSent);
      expect(status.nextAllowedAt).toBe(lastSent + GLOBAL_THROTTLE_MS);
      expect(status.waitSeconds).toBe(0);
    });
  });

  describe('clearThrottlePersistent', () => {
    it('should remove user entry from Firebase when exists', async () => {
      const now = Date.now();
      jest.mocked(adminDbGet).mockResolvedValue({ lastSentAt: now });
      jest.mocked(adminDbRemove).mockResolvedValue();

      const result = await clearThrottlePersistent(mockUserId);

      expect(result).toBe(true);
      expect(adminDbGet).toHaveBeenCalledWith(`rateLimits/${mockUserId}/coordination_throttle`);
      expect(adminDbRemove).toHaveBeenCalledWith(`rateLimits/${mockUserId}/coordination_throttle`);
    });

    it('should return false when no entry exists', async () => {
      jest.mocked(adminDbGet).mockResolvedValue(null);

      const result = await clearThrottlePersistent(mockUserId);

      expect(result).toBe(false);
      expect(adminDbGet).toHaveBeenCalledWith(`rateLimits/${mockUserId}/coordination_throttle`);
      expect(adminDbRemove).not.toHaveBeenCalled();
    });
  });

  describe('GLOBAL_THROTTLE_MS constant', () => {
    it('should be 30 minutes in milliseconds', () => {
      expect(GLOBAL_THROTTLE_MS).toBe(30 * 60 * 1000);
      expect(GLOBAL_THROTTLE_MS).toBe(1800000);
    });
  });
});
