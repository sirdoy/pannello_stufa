/**
 * Tests for notificationHistoryService
 *
 * Validates notification history querying with filters and pagination.
 */

import { getNotificationHistory } from '@/lib/notificationHistoryService';
import { getAdminFirestore } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

// Mock Firebase Admin
jest.mock('@/lib/firebaseAdmin', () => ({
  getAdminFirestore: jest.fn(),
}));

describe('notificationHistoryService', () => {
  let mockDb: any;
  let mockCollection: any;
  let mockQuery: any;
  let mockSnapshot: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock Firestore query chain
    mockSnapshot = {
      size: 0,
      docs: [],
      forEach: jest.fn(),
    };

    mockQuery = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      startAfter: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue(mockSnapshot),
    };

    mockCollection = jest.fn().mockReturnValue(mockQuery);

    mockDb = {
      collection: mockCollection,
    };

    (getAdminFirestore as jest.Mock).mockReturnValue(mockDb);
  });

  describe('getNotificationHistory', () => {
    const testUserId = 'auth0|123456';

    it('should query with userId and 90-day filter using >= operator', async () => {
      await getNotificationHistory(testUserId);

      // Verify collection called
      expect(mockCollection).toHaveBeenCalledWith('notificationLogs');

      // Verify where clauses
      const whereCalls = mockQuery.where.mock.calls;
      expect(whereCalls).toEqual(
        expect.arrayContaining([
          ['userId', '==', testUserId],
          expect.arrayContaining(['timestamp', '>=', expect.any(Timestamp)]),
        ])
      );
    });

    it('should use >= operator for 90-day filter (not >)', async () => {
      await getNotificationHistory(testUserId);

      // Find the timestamp filter call
      const timestampFilterCall = mockQuery.where.mock.calls.find(
        (call: any) => call[0] === 'timestamp'
      );

      expect(timestampFilterCall).toBeDefined();
      expect(timestampFilterCall[1]).toBe('>='); // Not '>'
    });

    it('should calculate 90-day filter correctly', async () => {
      const beforeQuery = new Date();
      await getNotificationHistory(testUserId);
      const afterQuery = new Date();

      // Find the timestamp filter call
      const timestampFilterCall = mockQuery.where.mock.calls.find(
        (call: any) => call[0] === 'timestamp'
      );

      expect(timestampFilterCall).toBeDefined();
      const filterTimestamp = timestampFilterCall[2].toDate();

      // Should be approximately 90 days ago (within 1 second tolerance)
      const ninetyDaysAgoMin = new Date(beforeQuery);
      ninetyDaysAgoMin.setDate(ninetyDaysAgoMin.getDate() - 90);
      ninetyDaysAgoMin.setSeconds(ninetyDaysAgoMin.getSeconds() - 1);

      const ninetyDaysAgoMax = new Date(afterQuery);
      ninetyDaysAgoMax.setDate(ninetyDaysAgoMax.getDate() - 90);
      ninetyDaysAgoMax.setSeconds(ninetyDaysAgoMax.getSeconds() + 1);

      expect(filterTimestamp.getTime()).toBeGreaterThanOrEqual(ninetyDaysAgoMin.getTime());
      expect(filterTimestamp.getTime()).toBeLessThanOrEqual(ninetyDaysAgoMax.getTime());
    });

    it('should apply optional type filter', async () => {
      await getNotificationHistory(testUserId, { type: 'scheduler' });

      const whereCalls = mockQuery.where.mock.calls;
      expect(whereCalls).toEqual(
        expect.arrayContaining([['type', '==', 'scheduler']])
      );
    });

    it('should apply optional status filter', async () => {
      await getNotificationHistory(testUserId, { status: 'sent' });

      const whereCalls = mockQuery.where.mock.calls;
      expect(whereCalls).toEqual(
        expect.arrayContaining([['status', '==', 'sent']])
      );
    });

    it('should order by timestamp descending', async () => {
      await getNotificationHistory(testUserId);

      expect(mockQuery.orderBy).toHaveBeenCalledWith('timestamp', 'desc');
    });

    it('should respect limit parameter', async () => {
      await getNotificationHistory(testUserId, { limit: 25 });

      // Limit should be +1 for hasMore detection
      expect(mockQuery.limit).toHaveBeenCalledWith(26);
    });

    it('should enforce max limit of 100', async () => {
      await getNotificationHistory(testUserId, { limit: 500 });

      // Should cap at 100 + 1 for hasMore detection
      expect(mockQuery.limit).toHaveBeenCalledWith(101);
    });

    it('should return notifications with correct shape', async () => {
      const mockTimestamp = Timestamp.now();
      const mockDoc = {
        id: 'notif123',
        data: () => ({
          userId: testUserId,
          type: 'scheduler',
          status: 'sent',
          title: 'Test Notification',
          body: 'Test body',
          deviceCount: 2,
          successCount: 2,
          failureCount: 0,
          fcmErrors: [],
          metadata: { source: 'api' },
          timestamp: mockTimestamp,
        }),
      };

      mockSnapshot.size = 1;
      mockSnapshot.docs = [mockDoc];
      mockSnapshot.forEach = jest.fn((callback) => {
        callback(mockDoc, 0);
      });

      const result = await getNotificationHistory(testUserId);

      expect(result.notifications).toHaveLength(1);
      expect(result.notifications[0]).toMatchObject({
        id: 'notif123',
        userId: testUserId,
        type: 'scheduler',
        status: 'sent',
        title: 'Test Notification',
        body: 'Test body',
        deviceCount: 2,
        successCount: 2,
        failureCount: 0,
      });
      expect(result.notifications[0]!.timestamp).toBe(mockTimestamp.toDate().toISOString());
    });

    it('should indicate hasMore when results exceed limit', async () => {
      // Mock 3 docs when limit is 2
      mockSnapshot.size = 3;

      const result = await getNotificationHistory(testUserId, { limit: 2 });

      expect(result.hasMore).toBe(true);
    });

    it('should indicate no more when results equal limit', async () => {
      // Mock 2 docs when limit is 2
      mockSnapshot.size = 2;

      const result = await getNotificationHistory(testUserId, { limit: 2 });

      expect(result.hasMore).toBe(false);
    });

    it('should handle cursor-based pagination', async () => {
      const cursor = Buffer.from(
        JSON.stringify({ docId: 'doc123', timestamp: new Date().toISOString() })
      ).toString('base64');

      const mockCursorDoc = { exists: true };
      mockDb.collection = jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockCursorDoc),
        }),
        where: mockQuery.where,
        orderBy: mockQuery.orderBy,
        limit: mockQuery.limit,
        startAfter: mockQuery.startAfter,
        get: mockQuery.get,
      });

      await getNotificationHistory(testUserId, { cursor });

      expect(mockQuery.startAfter).toHaveBeenCalledWith(mockCursorDoc);
    });

    it('should handle invalid cursor gracefully', async () => {
      const invalidCursor = 'not-base64-json';

      await expect(
        getNotificationHistory(testUserId, { cursor: invalidCursor })
      ).rejects.toThrow('Invalid cursor format');
    });
  });

  describe('regression tests', () => {
    it('should use >= not > for timestamp filter (bug fix)', async () => {
      // This test explicitly validates the fix for the notification-history-empty-results bug
      // where records at exactly 90 days ago were excluded by using > instead of >=

      await getNotificationHistory('auth0|123');

      const timestampFilterCall = mockQuery.where.mock.calls.find(
        (call: any) => call[0] === 'timestamp'
      );

      expect(timestampFilterCall[1]).toBe('>=');
      expect(timestampFilterCall[1]).not.toBe('>');
    });
  });
});
