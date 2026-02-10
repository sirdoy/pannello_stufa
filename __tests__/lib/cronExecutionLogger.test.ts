/**
 * Tests for Cron Execution Logger
 *
 * TDD RED phase - tests written first, implementation follows
 */

import { logCronExecution, getRecentCronExecutions } from '@/lib/cronExecutionLogger';
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';

// Mock Firebase Admin
jest.mock('@/lib/firebaseAdmin', () => ({
  adminDbGet: jest.fn(),
  adminDbSet: jest.fn(),
}));

describe('cronExecutionLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('logCronExecution', () => {
    it('writes execution log to Firebase RTDB with timestamp', async () => {
      jest.mocked(adminDbSet).mockResolvedValue(undefined);
      jest.mocked(adminDbGet).mockResolvedValue(null); // No old entries to clean

      await logCronExecution({
        status: 'ACCESA',
        mode: 'auto',
        duration: 1234,
      });

      // Verify write was called with correct structure
      const calls = jest.mocked(adminDbSet).mock.calls;
      expect(calls.length).toBeGreaterThan(0);

      const [path, data] = calls[0]!;
      expect(path).toMatch(/^cronExecutions\//);
      expect(data).toMatchObject({
        status: 'ACCESA',
        mode: 'auto',
        duration: 1234,
      });
      expect(data).toHaveProperty('timestamp');
      expect(typeof (data as any).timestamp).toBe('string');
    });

    it('includes optional details field in log entry', async () => {
      jest.mocked(adminDbSet).mockResolvedValue(undefined);
      jest.mocked(adminDbGet).mockResolvedValue(null);

      await logCronExecution({
        status: 'SPENTA',
        mode: 'manual',
        duration: 500,
        details: { giorno: 'Lunedì', ora: '08:00' },
      });

      const [_path, data] = jest.mocked(adminDbSet).mock.calls[0]!;
      expect((data as any).details).toEqual({ giorno: 'Lunedì', ora: '08:00' });
    });

    it('never throws on Firebase error (fire-and-forget)', async () => {
      jest.mocked(adminDbSet).mockRejectedValue(new Error('Firebase write failed'));
      jest.mocked(adminDbGet).mockResolvedValue(null);

      // Should not throw
      await expect(
        logCronExecution({
          status: 'ACCESA',
          mode: 'auto',
          duration: 1000,
        })
      ).resolves.toBeUndefined();

      // Should log error to console
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('❌'),
        expect.any(Error)
      );
    });

    it('cleans up entries older than 24 hours', async () => {
      const now = Date.now();
      const twentyFiveHoursAgo = now - 25 * 60 * 60 * 1000;
      const twelveHoursAgo = now - 12 * 60 * 60 * 1000;

      // Mock existing entries
      const mockEntries = {
        [new Date(twentyFiveHoursAgo).toISOString().replace(/[:.]/g, '-')]: {
          timestamp: new Date(twentyFiveHoursAgo).toISOString(),
          status: 'ACCESA',
          mode: 'auto',
          duration: 1000,
        },
        [new Date(twelveHoursAgo).toISOString().replace(/[:.]/g, '-')]: {
          timestamp: new Date(twelveHoursAgo).toISOString(),
          status: 'SPENTA',
          mode: 'manual',
          duration: 500,
        },
      };

      jest.mocked(adminDbGet).mockResolvedValue(mockEntries);
      jest.mocked(adminDbSet).mockResolvedValue(undefined);

      await logCronExecution({
        status: 'ACCESA',
        mode: 'auto',
        duration: 1234,
      });

      // Verify old entry was deleted (set to null)
      const deleteCalls = jest.mocked(adminDbSet).mock.calls.filter(
        ([path, data]) => data === null
      );
      expect(deleteCalls.length).toBeGreaterThan(0);

      // Old entry should be deleted
      const oldEntryDeleted = deleteCalls.some(([path]) =>
        path.includes(new Date(twentyFiveHoursAgo).toISOString().replace(/[:.]/g, '-'))
      );
      expect(oldEntryDeleted).toBe(true);

      // Recent entry should NOT be deleted
      const recentEntryDeleted = deleteCalls.some(([path]) =>
        path.includes(new Date(twelveHoursAgo).toISOString().replace(/[:.]/g, '-'))
      );
      expect(recentEntryDeleted).toBe(false);
    });

    it('handles cleanup errors gracefully (fire-and-forget)', async () => {
      jest.mocked(adminDbGet).mockRejectedValue(new Error('Cleanup read failed'));
      jest.mocked(adminDbSet).mockResolvedValue(undefined);

      // Should still write the new entry even if cleanup fails
      await expect(
        logCronExecution({
          status: 'ACCESA',
          mode: 'auto',
          duration: 1000,
        })
      ).resolves.toBeUndefined();

      // Should have written new entry
      const writeCalls = jest.mocked(adminDbSet).mock.calls.filter(
        ([_path, data]) => data !== null
      );
      expect(writeCalls.length).toBeGreaterThan(0);
    });
  });

  describe('getRecentCronExecutions', () => {
    it('returns recent execution logs sorted by timestamp desc', async () => {
      const mockEntries = {
        '2026-02-10T10-00-00-000Z': {
          timestamp: '2026-02-10T10:00:00.000Z',
          status: 'ACCESA',
          mode: 'auto',
          duration: 1000,
        },
        '2026-02-10T11-00-00-000Z': {
          timestamp: '2026-02-10T11:00:00.000Z',
          status: 'SPENTA',
          mode: 'manual',
          duration: 500,
        },
      };

      jest.mocked(adminDbGet).mockResolvedValue(mockEntries);

      const result = await getRecentCronExecutions();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        timestamp: '2026-02-10T11:00:00.000Z',
        status: 'SPENTA',
      });
      expect(result[1]).toMatchObject({
        timestamp: '2026-02-10T10:00:00.000Z',
        status: 'ACCESA',
      });
    });

    it('respects limit parameter', async () => {
      const mockEntries = {
        '2026-02-10T10-00-00-000Z': {
          timestamp: '2026-02-10T10:00:00.000Z',
          status: 'ACCESA',
          mode: 'auto',
          duration: 1000,
        },
        '2026-02-10T11-00-00-000Z': {
          timestamp: '2026-02-10T11:00:00.000Z',
          status: 'SPENTA',
          mode: 'manual',
          duration: 500,
        },
        '2026-02-10T12-00-00-000Z': {
          timestamp: '2026-02-10T12:00:00.000Z',
          status: 'ACCESA',
          mode: 'auto',
          duration: 800,
        },
      };

      jest.mocked(adminDbGet).mockResolvedValue(mockEntries);

      const result = await getRecentCronExecutions(2);

      expect(result).toHaveLength(2);
      expect(result[0]?.timestamp).toBe('2026-02-10T12:00:00.000Z');
      expect(result[1]?.timestamp).toBe('2026-02-10T11:00:00.000Z');
    });

    it('returns empty array when no entries exist', async () => {
      jest.mocked(adminDbGet).mockResolvedValue(null);

      const result = await getRecentCronExecutions();

      expect(result).toEqual([]);
    });

    it('returns empty array on Firebase error (never throws)', async () => {
      jest.mocked(adminDbGet).mockRejectedValue(new Error('Firebase read failed'));

      const result = await getRecentCronExecutions();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('❌'),
        expect.any(Error)
      );
    });

    it('uses default limit of 20 when not specified', async () => {
      // Create 25 mock entries
      const mockEntries: Record<string, any> = {};
      for (let i = 0; i < 25; i++) {
        const timestamp = new Date(Date.now() - i * 60000).toISOString();
        const key = timestamp.replace(/[:.]/g, '-');
        mockEntries[key] = {
          timestamp,
          status: 'ACCESA',
          mode: 'auto',
          duration: 1000,
        };
      }

      jest.mocked(adminDbGet).mockResolvedValue(mockEntries);

      const result = await getRecentCronExecutions();

      expect(result).toHaveLength(20);
    });
  });
});
