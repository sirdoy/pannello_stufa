/**
 * Tests for PID Tuning Log Service
 */

import { logPidTuningEntry, cleanupOldLogs } from '@/lib/services/pidTuningLogService';
import { adminDbSet, adminDbGet, adminDbRemove } from '@/lib/firebaseAdmin';

// Mock Firebase Admin
jest.mock('@/lib/firebaseAdmin', () => ({
  adminDbSet: jest.fn(),
  adminDbGet: jest.fn(),
  adminDbRemove: jest.fn(),
}));

describe('pidTuningLogService', () => {
  const mockUserId = 'auth0|test123';
  const mockEntry = {
    roomTemp: 19.5,
    powerLevel: 3,
    setpoint: 20,
    pidOutput: 4,
    error: 0.5,
    integral: 2.3,
    derivative: 0.1,
    roomId: '1234567890',
    roomName: 'Living Room',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logPidTuningEntry', () => {
    it('should log entry with auto-generated timestamp', async () => {
      const beforeTime = Date.now();

      await logPidTuningEntry(mockUserId, mockEntry);

      const afterTime = Date.now();

      expect(adminDbSet).toHaveBeenCalledTimes(1);
      const [path, entry] = jest.mocked(adminDbSet).mock.calls[0]!;

      expect(path).toMatch(/^users\/auth0\|test123\/pidAutomation\/tuningLog\/\d+$/);
      expect(entry.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(entry.timestamp).toBeLessThanOrEqual(afterTime);
      expect(entry.roomTemp).toBe(19.5);
      expect(entry.powerLevel).toBe(3);
      expect(entry.setpoint).toBe(20);
      expect(entry.pidOutput).toBe(4);
      expect(entry.roomId).toBe('1234567890');
      expect(entry.roomName).toBe('Living Room');
    });

    it('should use provided timestamp if given', async () => {
      const customTimestamp = 1234567890000;

      await logPidTuningEntry(mockUserId, { ...mockEntry, timestamp: customTimestamp });

      const [path, entry] = jest.mocked(adminDbSet).mock.calls[0]!;
      expect(path).toBe(`users/${mockUserId}/pidAutomation/tuningLog/${customTimestamp}`);
      expect(entry.timestamp).toBe(customTimestamp);
    });

    it('should include all required fields in log entry', async () => {
      await logPidTuningEntry(mockUserId, mockEntry);

      const [, entry] = jest.mocked(adminDbSet).mock.calls[0]!;

      // Check all required fields from PIDTuningLogEntry interface
      expect(entry).toHaveProperty('timestamp');
      expect(entry).toHaveProperty('roomTemp');
      expect(entry).toHaveProperty('powerLevel');
      expect(entry).toHaveProperty('setpoint');
      expect(entry).toHaveProperty('pidOutput');
      expect(entry).toHaveProperty('error');
      expect(entry).toHaveProperty('integral');
      expect(entry).toHaveProperty('derivative');
      expect(entry).toHaveProperty('roomId');
      expect(entry).toHaveProperty('roomName');
    });
  });

  describe('cleanupOldLogs', () => {
    it('should delete logs older than retention period', async () => {
      const now = Date.now();
      const fifteenDaysAgo = now - (15 * 24 * 60 * 60 * 1000);
      const tenDaysAgo = now - (10 * 24 * 60 * 60 * 1000);

      const mockLogs = {
        [fifteenDaysAgo]: { ...mockEntry, timestamp: fifteenDaysAgo },
        [tenDaysAgo]: { ...mockEntry, timestamp: tenDaysAgo },
        [now]: { ...mockEntry, timestamp: now },
      };

      jest.mocked(adminDbGet).mockResolvedValue(mockLogs);

      const deleted = await cleanupOldLogs(mockUserId, 14);

      expect(deleted).toBe(1); // Only 15-day-old log deleted
      expect(adminDbRemove).toHaveBeenCalledTimes(1);
      expect(adminDbRemove).toHaveBeenCalledWith(
        `users/${mockUserId}/pidAutomation/tuningLog/${fifteenDaysAgo}`
      );
    });

    it('should use default 14-day retention if not specified', async () => {
      const now = Date.now();
      const twentyDaysAgo = now - (20 * 24 * 60 * 60 * 1000);

      const mockLogs = {
        [twentyDaysAgo]: { ...mockEntry, timestamp: twentyDaysAgo },
      };

      jest.mocked(adminDbGet).mockResolvedValue(mockLogs);

      await cleanupOldLogs(mockUserId);

      expect(adminDbRemove).toHaveBeenCalledWith(
        `users/${mockUserId}/pidAutomation/tuningLog/${twentyDaysAgo}`
      );
    });

    it('should return 0 if no logs exist', async () => {
      jest.mocked(adminDbGet).mockResolvedValue(null);

      const deleted = await cleanupOldLogs(mockUserId);

      expect(deleted).toBe(0);
      expect(adminDbRemove).not.toHaveBeenCalled();
    });

    it('should return 0 if all logs are within retention period', async () => {
      const now = Date.now();
      const fiveDaysAgo = now - (5 * 24 * 60 * 60 * 1000);

      const mockLogs = {
        [fiveDaysAgo]: { ...mockEntry, timestamp: fiveDaysAgo },
        [now]: { ...mockEntry, timestamp: now },
      };

      jest.mocked(adminDbGet).mockResolvedValue(mockLogs);

      const deleted = await cleanupOldLogs(mockUserId, 14);

      expect(deleted).toBe(0);
      expect(adminDbRemove).not.toHaveBeenCalled();
    });

    it('should handle custom retention periods', async () => {
      const now = Date.now();
      const eightDaysAgo = now - (8 * 24 * 60 * 60 * 1000);

      const mockLogs = {
        [eightDaysAgo]: { ...mockEntry, timestamp: eightDaysAgo },
      };

      jest.mocked(adminDbGet).mockResolvedValue(mockLogs);

      // 7-day retention should delete 8-day-old log
      const deleted = await cleanupOldLogs(mockUserId, 7);

      expect(deleted).toBe(1);
      expect(adminDbRemove).toHaveBeenCalledWith(
        `users/${mockUserId}/pidAutomation/tuningLog/${eightDaysAgo}`
      );
    });

    it('should delete multiple old logs in parallel', async () => {
      const now = Date.now();
      const twentyDaysAgo = now - (20 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

      const mockLogs = {
        [thirtyDaysAgo]: { ...mockEntry, timestamp: thirtyDaysAgo },
        [twentyDaysAgo]: { ...mockEntry, timestamp: twentyDaysAgo },
      };

      jest.mocked(adminDbGet).mockResolvedValue(mockLogs);

      const deleted = await cleanupOldLogs(mockUserId, 14);

      expect(deleted).toBe(2);
      expect(adminDbRemove).toHaveBeenCalledTimes(2);
    });
  });
});
