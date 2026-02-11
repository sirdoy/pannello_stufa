/**
 * Tests for analyticsEventLogger
 *
 * Verifies fire-and-forget event logging:
 * - Events written to Firebase with timestamp key
 * - Date filtering works correctly
 * - Cleanup removes old entries
 * - Errors caught and logged (never thrown)
 */

import {
  logAnalyticsEvent,
  getAnalyticsEventsForDate,
  cleanupOldAnalyticsEvents,
} from '../analyticsEventLogger';
import * as firebaseAdmin from '../firebaseAdmin';
import * as environmentHelper from '../environmentHelper';

// Mock Firebase Admin
jest.mock('../firebaseAdmin');
const mockedAdminDbSet = jest.mocked(firebaseAdmin.adminDbSet);
const mockedAdminDbGet = jest.mocked(firebaseAdmin.adminDbGet);

// Mock environment helper
jest.mock('../environmentHelper');
const mockedGetEnvironmentPath = jest.mocked(environmentHelper.getEnvironmentPath);

describe('analyticsEventLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default: getEnvironmentPath returns identity (no prefix)
    mockedGetEnvironmentPath.mockImplementation((path: string) => path);

    // Silence console.error in tests
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('logAnalyticsEvent', () => {
    it('writes event to Firebase with timestamp key', async () => {
      const event = {
        eventType: 'stove_ignite' as const,
        source: 'manual' as const,
        userId: 'user123',
      };

      await logAnalyticsEvent(event);

      expect(mockedAdminDbSet).toHaveBeenCalledTimes(1);
      const [path, data] = mockedAdminDbSet.mock.calls[0]!;

      // Path should be analyticsEvents/{timestamp-key}
      expect(path).toMatch(/^analyticsEvents\/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/);

      // Data should include original event plus timestamp
      expect(data).toMatchObject({
        eventType: 'stove_ignite',
        source: 'manual',
        userId: 'user123',
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
      });
    });

    it('includes optional powerLevel when provided', async () => {
      const event = {
        eventType: 'power_change' as const,
        source: 'manual' as const,
        powerLevel: 3,
      };

      await logAnalyticsEvent(event);

      const [, data] = mockedAdminDbSet.mock.calls[0]!;
      expect(data).toMatchObject({
        eventType: 'power_change',
        source: 'manual',
        powerLevel: 3,
      });
    });

    it('omits userId when not provided', async () => {
      const event = {
        eventType: 'stove_shutdown' as const,
        source: 'scheduler' as const,
      };

      await logAnalyticsEvent(event);

      const [, data] = mockedAdminDbSet.mock.calls[0]!;
      expect(data).toMatchObject({
        eventType: 'stove_shutdown',
        source: 'scheduler',
      });
      expect((data as any).userId).toBeUndefined();
    });

    it('catches and logs errors without throwing', async () => {
      mockedAdminDbSet.mockRejectedValueOnce(new Error('Firebase write failed'));

      const event = {
        eventType: 'stove_ignite' as const,
        source: 'manual' as const,
      };

      // Should not throw
      await expect(logAnalyticsEvent(event)).resolves.toBeUndefined();

      // Console.error should be called
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to log analytics event'),
        expect.any(Error)
      );
    });

    it('uses environment-specific path', async () => {
      mockedGetEnvironmentPath.mockImplementation((path: string) => `dev/${path}`);

      const event = {
        eventType: 'stove_ignite' as const,
        source: 'manual' as const,
      };

      await logAnalyticsEvent(event);

      const [path] = mockedAdminDbSet.mock.calls[0]!;
      expect(path).toMatch(/^dev\/analyticsEvents\/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/);
    });

    it('replaces colons and periods in timestamp key', async () => {
      const event = {
        eventType: 'stove_ignite' as const,
        source: 'manual' as const,
      };

      await logAnalyticsEvent(event);

      const [path] = mockedAdminDbSet.mock.calls[0]!;

      // Path should not contain : or .
      expect(path).not.toContain(':');
      expect(path).not.toContain('.');
      // Should contain dashes instead
      expect(path).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z/);
    });
  });

  describe('getAnalyticsEventsForDate', () => {
    it('returns events matching date prefix', async () => {
      const mockData = {
        '2026-02-11T10-00-00-000Z': {
          timestamp: '2026-02-11T10:00:00.000Z',
          eventType: 'stove_ignite',
          source: 'manual',
        },
        '2026-02-11T11-00-00-000Z': {
          timestamp: '2026-02-11T11:00:00.000Z',
          eventType: 'stove_shutdown',
          source: 'manual',
        },
        '2026-02-12T10-00-00-000Z': {
          timestamp: '2026-02-12T10:00:00.000Z',
          eventType: 'stove_ignite',
          source: 'scheduler',
        },
      };

      mockedAdminDbGet.mockResolvedValueOnce(mockData);

      const events = await getAnalyticsEventsForDate('2026-02-11');

      expect(events).toHaveLength(2);
      expect(events[0]?.timestamp).toContain('2026-02-11');
      expect(events[1]?.timestamp).toContain('2026-02-11');
    });

    it('returns empty array when no data exists', async () => {
      mockedAdminDbGet.mockResolvedValueOnce(null);

      const events = await getAnalyticsEventsForDate('2026-02-11');

      expect(events).toEqual([]);
    });

    it('returns empty array when no events match date', async () => {
      const mockData = {
        '2026-02-12T10-00-00-000Z': {
          timestamp: '2026-02-12T10:00:00.000Z',
          eventType: 'stove_ignite',
          source: 'manual',
        },
      };

      mockedAdminDbGet.mockResolvedValueOnce(mockData);

      const events = await getAnalyticsEventsForDate('2026-02-11');

      expect(events).toEqual([]);
    });

    it('catches and logs errors, returns empty array', async () => {
      mockedAdminDbGet.mockRejectedValueOnce(new Error('Firebase read failed'));

      const events = await getAnalyticsEventsForDate('2026-02-11');

      expect(events).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to get analytics events'),
        expect.any(Error)
      );
    });

    it('uses environment-specific path', async () => {
      mockedGetEnvironmentPath.mockImplementation((path: string) => `dev/${path}`);
      mockedAdminDbGet.mockResolvedValueOnce({});

      await getAnalyticsEventsForDate('2026-02-11');

      expect(mockedGetEnvironmentPath).toHaveBeenCalledWith('analyticsEvents');
      expect(mockedAdminDbGet).toHaveBeenCalledWith('dev/analyticsEvents');
    });
  });

  describe('cleanupOldAnalyticsEvents', () => {
    it('removes entries older than retention period', async () => {
      const now = Date.now();
      const eightDaysAgo = new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString();
      const sixDaysAgo = new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString();

      const mockData = {
        'old-key': {
          timestamp: eightDaysAgo,
          eventType: 'stove_ignite',
          source: 'manual',
        },
        'new-key': {
          timestamp: sixDaysAgo,
          eventType: 'stove_shutdown',
          source: 'manual',
        },
      };

      mockedAdminDbGet.mockResolvedValueOnce(mockData);

      await cleanupOldAnalyticsEvents(7);

      // Should delete old entry but not new entry
      expect(mockedAdminDbSet).toHaveBeenCalledTimes(1);
      expect(mockedAdminDbSet).toHaveBeenCalledWith('analyticsEvents/old-key', null);
    });

    it('uses custom retention period', async () => {
      const now = Date.now();
      const fifteenDaysAgo = new Date(now - 15 * 24 * 60 * 60 * 1000).toISOString();
      const tenDaysAgo = new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString();

      const mockData = {
        'very-old': {
          timestamp: fifteenDaysAgo,
          eventType: 'stove_ignite',
          source: 'manual',
        },
        'old': {
          timestamp: tenDaysAgo,
          eventType: 'stove_shutdown',
          source: 'manual',
        },
      };

      mockedAdminDbGet.mockResolvedValueOnce(mockData);

      // 30-day retention: both should be kept
      await cleanupOldAnalyticsEvents(30);
      expect(mockedAdminDbSet).not.toHaveBeenCalled();
    });

    it('does nothing when no data exists', async () => {
      mockedAdminDbGet.mockResolvedValueOnce(null);

      await cleanupOldAnalyticsEvents(7);

      expect(mockedAdminDbSet).not.toHaveBeenCalled();
    });

    it('does nothing when no entries are old enough', async () => {
      const now = Date.now();
      const yesterday = new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString();

      const mockData = {
        'recent-key': {
          timestamp: yesterday,
          eventType: 'stove_ignite',
          source: 'manual',
        },
      };

      mockedAdminDbGet.mockResolvedValueOnce(mockData);

      await cleanupOldAnalyticsEvents(7);

      expect(mockedAdminDbSet).not.toHaveBeenCalled();
    });

    it('catches and logs errors without throwing', async () => {
      mockedAdminDbGet.mockRejectedValueOnce(new Error('Firebase read failed'));

      // Should not throw
      await expect(cleanupOldAnalyticsEvents(7)).resolves.toBeUndefined();

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Cleanup old analytics events failed'),
        expect.any(Error)
      );
    });

    it('uses environment-specific paths', async () => {
      mockedGetEnvironmentPath.mockImplementation((path: string) => `dev/${path}`);

      const now = Date.now();
      const eightDaysAgo = new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString();

      const mockData = {
        'old-key': {
          timestamp: eightDaysAgo,
          eventType: 'stove_ignite',
          source: 'manual',
        },
      };

      mockedAdminDbGet.mockResolvedValueOnce(mockData);

      await cleanupOldAnalyticsEvents(7);

      // Both read and delete should use environment path
      expect(mockedGetEnvironmentPath).toHaveBeenCalledWith('analyticsEvents');
      expect(mockedGetEnvironmentPath).toHaveBeenCalledWith('analyticsEvents/old-key');
      expect(mockedAdminDbSet).toHaveBeenCalledWith('dev/analyticsEvents/old-key', null);
    });
  });
});
