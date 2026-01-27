/**
 * Tests for Coordination Event Logger Service
 *
 * Tests fire-and-forget logging, query filtering, and stats calculation
 */

import {
  logCoordinationEvent,
  getRecentCoordinationEvents,
  getCoordinationStats,
} from '@/lib/coordinationEventLogger';
import { getAdminFirestore } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';
import { subDays } from 'date-fns';

// Mock Firebase Admin
jest.mock('@/lib/firebaseAdmin');
jest.mock('firebase-admin/firestore');

describe('coordinationEventLogger', () => {
  let mockCollection;
  let mockAdd;
  let mockWhere;
  let mockOrderBy;
  let mockLimit;
  let mockGet;
  let mockDb;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock Firestore methods
    mockGet = jest.fn();
    mockLimit = jest.fn(() => ({ get: mockGet }));
    mockOrderBy = jest.fn(() => ({ limit: mockLimit }));
    mockWhere = jest.fn(() => ({
      where: mockWhere,
      orderBy: mockOrderBy,
      get: mockGet,
    }));
    mockAdd = jest.fn();
    mockCollection = jest.fn(() => ({
      add: mockAdd,
      where: mockWhere,
    }));

    mockDb = {
      collection: mockCollection,
    };

    getAdminFirestore.mockReturnValue(mockDb);

    // Mock Timestamp.now()
    Timestamp.now = jest.fn(() => ({
      toDate: () => new Date('2026-01-27T14:00:00Z'),
    }));

    // Mock Timestamp.fromDate()
    Timestamp.fromDate = jest.fn((date) => ({
      toDate: () => date,
    }));
  });

  describe('logCoordinationEvent', () => {
    it('should write event to Firestore with timestamp', async () => {
      const mockDocRef = { id: 'event123' };
      mockAdd.mockResolvedValue(mockDocRef);

      const event = {
        userId: 'user123',
        eventType: 'boost_applied',
        stoveStatus: 'WORK',
        action: 'applied',
        details: {
          rooms: [{ roomId: 'room1', roomName: 'Living', setpoint: 22 }],
        },
        notificationSent: true,
      };

      const result = await logCoordinationEvent(event);

      expect(mockCollection).toHaveBeenCalledWith('coordinationEvents');
      expect(mockAdd).toHaveBeenCalledWith({
        timestamp: expect.any(Object),
        userId: 'user123',
        eventType: 'boost_applied',
        stoveStatus: 'WORK',
        action: 'applied',
        details: {
          rooms: [{ roomId: 'room1', roomName: 'Living', setpoint: 22 }],
        },
        notificationSent: true,
        cronRunId: null,
      });
      expect(result).toBe('event123');
    });

    it('should add timestamp automatically', async () => {
      const mockDocRef = { id: 'event456' };
      mockAdd.mockResolvedValue(mockDocRef);

      const event = {
        userId: 'user123',
        eventType: 'setpoints_restored',
        stoveStatus: 'STANDBY',
        action: 'restored',
      };

      await logCoordinationEvent(event);

      expect(Timestamp.now).toHaveBeenCalled();
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(Object),
        })
      );
    });

    it('should return null on error (fire-and-forget)', async () => {
      mockAdd.mockRejectedValue(new Error('Firestore error'));

      const event = {
        userId: 'user123',
        eventType: 'boost_applied',
        stoveStatus: 'WORK',
        action: 'applied',
      };

      const result = await logCoordinationEvent(event);

      expect(result).toBeNull();
    });

    it('should return null if required fields missing', async () => {
      const event = {
        userId: 'user123',
        // Missing eventType, stoveStatus, action
      };

      const result = await logCoordinationEvent(event);

      expect(result).toBeNull();
      expect(mockAdd).not.toHaveBeenCalled();
    });

    it('should use default values for optional fields', async () => {
      const mockDocRef = { id: 'event789' };
      mockAdd.mockResolvedValue(mockDocRef);

      const event = {
        userId: 'user123',
        eventType: 'automation_paused',
        stoveStatus: 'WORK',
        action: 'paused',
        // No details, notificationSent, or cronRunId
      };

      await logCoordinationEvent(event);

      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          details: {},
          notificationSent: false,
          cronRunId: null,
        })
      );
    });

    it('should accept cronRunId for correlation', async () => {
      const mockDocRef = { id: 'event999' };
      mockAdd.mockResolvedValue(mockDocRef);

      const event = {
        userId: 'user123',
        eventType: 'boost_applied',
        stoveStatus: 'WORK',
        action: 'applied',
        cronRunId: 'cron-run-123',
      };

      await logCoordinationEvent(event);

      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          cronRunId: 'cron-run-123',
        })
      );
    });
  });

  describe('getRecentCoordinationEvents', () => {
    it('should filter by userId', async () => {
      const mockSnapshot = {
        forEach: jest.fn((callback) => {
          callback({
            id: 'event1',
            data: () => ({
              userId: 'user123',
              eventType: 'boost_applied',
              timestamp: { toDate: () => new Date('2026-01-27T14:00:00Z') },
            }),
          });
        }),
      };
      mockGet.mockResolvedValue(mockSnapshot);

      await getRecentCoordinationEvents({ userId: 'user123' });

      expect(mockWhere).toHaveBeenCalledWith('userId', '==', 'user123');
    });

    it('should filter by eventType', async () => {
      const mockSnapshot = {
        forEach: jest.fn(),
      };
      mockGet.mockResolvedValue(mockSnapshot);

      await getRecentCoordinationEvents({ eventType: 'boost_applied' });

      expect(mockWhere).toHaveBeenCalledWith('eventType', '==', 'boost_applied');
    });

    it('should filter by date range', async () => {
      const mockSnapshot = {
        forEach: jest.fn(),
      };
      mockGet.mockResolvedValue(mockSnapshot);

      const startDate = new Date('2026-01-20T00:00:00Z');
      const endDate = new Date('2026-01-27T23:59:59Z');

      await getRecentCoordinationEvents({ startDate, endDate });

      expect(mockWhere).toHaveBeenCalledWith('timestamp', '>=', expect.any(Object));
      expect(mockWhere).toHaveBeenCalledWith('timestamp', '<=', expect.any(Object));
    });

    it('should use default date range (7 days)', async () => {
      const mockSnapshot = {
        forEach: jest.fn(),
      };
      mockGet.mockResolvedValue(mockSnapshot);

      await getRecentCoordinationEvents();

      // Should call where with timestamp filters (exact dates depend on current time)
      expect(mockWhere).toHaveBeenCalledWith('timestamp', '>=', expect.any(Object));
      expect(mockWhere).toHaveBeenCalledWith('timestamp', '<=', expect.any(Object));
    });

    it('should order by timestamp descending', async () => {
      const mockSnapshot = {
        forEach: jest.fn(),
      };
      mockGet.mockResolvedValue(mockSnapshot);

      await getRecentCoordinationEvents();

      expect(mockOrderBy).toHaveBeenCalledWith('timestamp', 'desc');
    });

    it('should respect limit parameter', async () => {
      const mockSnapshot = {
        forEach: jest.fn(),
      };
      mockGet.mockResolvedValue(mockSnapshot);

      await getRecentCoordinationEvents({ limit: 50 });

      expect(mockLimit).toHaveBeenCalledWith(50);
    });

    it('should use default limit of 100', async () => {
      const mockSnapshot = {
        forEach: jest.fn(),
      };
      mockGet.mockResolvedValue(mockSnapshot);

      await getRecentCoordinationEvents();

      expect(mockLimit).toHaveBeenCalledWith(100);
    });

    it('should convert Firestore timestamps to ISO strings', async () => {
      const mockSnapshot = {
        forEach: jest.fn((callback) => {
          callback({
            id: 'event1',
            data: () => ({
              userId: 'user123',
              eventType: 'boost_applied',
              timestamp: { toDate: () => new Date('2026-01-27T14:00:00Z') },
            }),
          });
        }),
      };
      mockGet.mockResolvedValue(mockSnapshot);

      const events = await getRecentCoordinationEvents();

      expect(events[0].timestamp).toBe('2026-01-27T14:00:00.000Z');
    });
  });

  describe('getCoordinationStats', () => {
    it('should calculate correct aggregates', async () => {
      const mockSnapshot = {
        forEach: jest.fn((callback) => {
          // Event 1: boost_applied with notification
          callback({
            id: 'event1',
            data: () => ({
              eventType: 'boost_applied',
              notificationSent: true,
              timestamp: { toDate: () => new Date('2026-01-27T14:00:00Z') },
              details: {},
            }),
          });

          // Event 2: setpoints_restored with notification
          callback({
            id: 'event2',
            data: () => ({
              eventType: 'setpoints_restored',
              notificationSent: true,
              timestamp: { toDate: () => new Date('2026-01-27T14:05:00Z') },
              details: {},
            }),
          });

          // Event 3: notification_throttled
          callback({
            id: 'event3',
            data: () => ({
              eventType: 'notification_throttled',
              notificationSent: false,
              timestamp: { toDate: () => new Date('2026-01-27T14:10:00Z') },
              details: {},
            }),
          });

          // Event 4: automation_paused (60 minutes)
          callback({
            id: 'event4',
            data: () => ({
              eventType: 'automation_paused',
              notificationSent: true,
              timestamp: { toDate: () => new Date('2026-01-27T14:15:00Z') },
              details: {
                pausedUntil: new Date('2026-01-27T15:15:00Z').getTime(),
              },
            }),
          });

          // Event 5: automation_paused (30 minutes)
          callback({
            id: 'event5',
            data: () => ({
              eventType: 'automation_paused',
              notificationSent: true,
              timestamp: { toDate: () => new Date('2026-01-27T14:20:00Z') },
              details: {
                pausedUntil: new Date('2026-01-27T14:50:00Z').getTime(),
              },
            }),
          });
        }),
      };

      mockGet.mockResolvedValue(mockSnapshot);

      const stats = await getCoordinationStats('user123', 7);

      expect(stats).toEqual({
        totalEvents: 5,
        byEventType: {
          boost_applied: 1,
          setpoints_restored: 1,
          notification_throttled: 1,
          automation_paused: 2,
        },
        notificationsSent: 4,
        notificationsThrottled: 1,
        pauseCount: 2,
        totalPauseDurationMinutes: 90, // 60 + 30
        averagePauseDurationMinutes: 45, // (60 + 30) / 2
      });
    });

    it('should handle zero pause events', async () => {
      const mockSnapshot = {
        forEach: jest.fn((callback) => {
          callback({
            id: 'event1',
            data: () => ({
              eventType: 'boost_applied',
              notificationSent: true,
              timestamp: { toDate: () => new Date('2026-01-27T14:00:00Z') },
              details: {},
            }),
          });
        }),
      };

      mockGet.mockResolvedValue(mockSnapshot);

      const stats = await getCoordinationStats('user123', 7);

      expect(stats.pauseCount).toBe(0);
      expect(stats.averagePauseDurationMinutes).toBe(0);
    });

    it('should filter by userId and date range', async () => {
      const mockSnapshot = {
        forEach: jest.fn(),
      };
      mockGet.mockResolvedValue(mockSnapshot);

      await getCoordinationStats('user123', 7);

      expect(mockWhere).toHaveBeenCalledWith('userId', '==', 'user123');
      expect(mockWhere).toHaveBeenCalledWith('timestamp', '>=', expect.any(Object));
    });
  });
});
