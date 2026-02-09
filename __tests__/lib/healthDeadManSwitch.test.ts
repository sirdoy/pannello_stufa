/**
 * Tests for Health Monitoring Dead Man's Switch
 */

import {
  updateDeadManSwitch,
  checkDeadManSwitch,
  alertDeadManSwitch,
} from '../../lib/healthDeadManSwitch';

// Mock dependencies
jest.mock('../../lib/firebaseAdmin');
jest.mock('../../lib/notificationTriggersServer');

import { adminDbSet, adminDbGet } from '../../lib/firebaseAdmin';
import { triggerMaintenanceAlertServer } from '../../lib/notificationTriggersServer';

// Use jest.mocked() for type-safe mocking
const mockedAdminDbSet = jest.mocked(adminDbSet);
const mockedAdminDbGet = jest.mocked(adminDbGet);
const mockedTriggerMaintenanceAlertServer = jest.mocked(triggerMaintenanceAlertServer);

describe('healthDeadManSwitch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console to avoid test output noise
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.log as any).mockRestore();
    (console.error as any).mockRestore();
  });

  describe('updateDeadManSwitch', () => {
    it('should write timestamp to RTDB and return true', async () => {
      mockedAdminDbSet.mockResolvedValue();

      const result = await updateDeadManSwitch();

      expect(result).toBe(true);
      expect(mockedAdminDbSet).toHaveBeenCalledWith(
        'healthMonitoring/lastCheck',
        expect.any(String) // ISO timestamp
      );

      // Verify timestamp format (ISO 8601)
      const timestamp = mockedAdminDbSet.mock.calls[0]![1];
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should return false on RTDB error', async () => {
      mockedAdminDbSet.mockRejectedValue(new Error('RTDB connection failed'));

      const result = await updateDeadManSwitch();

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to update dead man\'s switch'),
        expect.any(Error)
      );
    });
  });

  describe('checkDeadManSwitch', () => {
    it('should return stale: true with reason: never_run when no timestamp exists', async () => {
      mockedAdminDbGet.mockResolvedValue(null);

      const result = await checkDeadManSwitch();

      expect(result).toEqual({
        stale: true,
        reason: 'never_run',
      });
      expect(adminDbGet).toHaveBeenCalledWith('healthMonitoring/lastCheck');
    });

    it('should return stale: true when elapsed > 10 minutes', async () => {
      // Timestamp from 15 minutes ago
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      mockedAdminDbGet.mockResolvedValue(fifteenMinutesAgo);

      const result = await checkDeadManSwitch();

      expect(result.stale).toBe(true);
      expect(result.reason).toBe('timeout');
      expect(result.elapsed).toBeGreaterThan(10 * 60 * 1000); // > 10 min
      expect(result.lastCheck).toBe(fifteenMinutesAgo);
    });

    it('should return stale: false when elapsed < 10 minutes', async () => {
      // Timestamp from 5 minutes ago
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      mockedAdminDbGet.mockResolvedValue(fiveMinutesAgo);

      const result = await checkDeadManSwitch();

      expect(result.stale).toBe(false);
      expect(result.elapsed).toBeLessThan(10 * 60 * 1000); // < 10 min
      expect(result.lastCheck).toBe(fiveMinutesAgo);
    });

    it('should return stale: true with reason: timeout exactly at 10 minutes', async () => {
      // Timestamp from exactly 10 minutes + 1ms ago (boundary test)
      const threshold = new Date(Date.now() - (10 * 60 * 1000 + 1)).toISOString();
      mockedAdminDbGet.mockResolvedValue(threshold);

      const result = await checkDeadManSwitch();

      expect(result.stale).toBe(true);
      expect(result.reason).toBe('timeout');
    });

    it('should return stale: true with reason: error on RTDB error', async () => {
      mockedAdminDbGet.mockRejectedValue(new Error('RTDB read failed'));

      const result = await checkDeadManSwitch();

      expect(result.stale).toBe(true);
      // Type narrowing for discriminated union
      if (result.stale && 'reason' in result) {
        expect(result.reason).toBe('error');
      }
      if ('error' in result) {
        expect(result.error).toBe('RTDB read failed');
      }
    });
  });

  describe('alertDeadManSwitch', () => {
    const ADMIN_USER_ID = 'auth0|admin123';

    beforeEach(() => {
      process.env.ADMIN_USER_ID = ADMIN_USER_ID;
    });

    afterEach(() => {
      delete process.env.ADMIN_USER_ID;
    });

    it('should send maintenance alert with never_run message', async () => {
      mockedTriggerMaintenanceAlertServer.mockResolvedValue({ success: true } as any);

      await alertDeadManSwitch('never_run');

      expect(mockedTriggerMaintenanceAlertServer).toHaveBeenCalledWith(
        ADMIN_USER_ID,
        100, // Critical threshold
        {
          message: 'Health monitoring cron has never executed',
          remainingHours: 0,
        }
      );
    });

    it('should send maintenance alert with timeout message and elapsed minutes', async () => {
      mockedTriggerMaintenanceAlertServer.mockResolvedValue({ success: true } as any);

      const elapsed = 15 * 60 * 1000; // 15 minutes
      await alertDeadManSwitch('timeout', { elapsed });

      expect(mockedTriggerMaintenanceAlertServer).toHaveBeenCalledWith(
        ADMIN_USER_ID,
        100,
        {
          message: 'Health monitoring cron hasn\'t run in 15 minutes',
          remainingHours: 0,
        }
      );
    });

    it('should not throw if notification fails', async () => {
      mockedTriggerMaintenanceAlertServer.mockResolvedValue({
        success: false,
        error: 'No FCM tokens',
      });

      await expect(alertDeadManSwitch('timeout', { elapsed: 600000 }))
        .resolves
        .not.toThrow();

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send dead man\'s switch alert')
      );
    });

    it('should not throw if notification throws exception', async () => {
      mockedTriggerMaintenanceAlertServer.mockRejectedValue(new Error('Network error'));

      await expect(alertDeadManSwitch('never_run'))
        .resolves
        .not.toThrow();

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error alerting dead man\'s switch'),
        expect.any(Error)
      );
    });

    it('should skip alert if ADMIN_USER_ID not configured', async () => {
      delete process.env.ADMIN_USER_ID;

      await alertDeadManSwitch('timeout', { elapsed: 600000 });

      expect(triggerMaintenanceAlertServer).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('ADMIN_USER_ID not configured')
      );
    });
  });
});
