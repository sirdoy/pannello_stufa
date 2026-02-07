/**
 * Tests for Health Logger Service
 *
 * Covers:
 * - logHealthCheckRun creates parent document with correct aggregates
 * - Subcollection documents include all fields
 * - Fire-and-forget: returns null on Firestore error instead of throwing
 * - getRecentHealthLogs applies filters correctly
 */

import {
  logHealthCheckRun,
  getRecentHealthLogs,
  getHealthCheckDetails,
  getHealthStats,
} from '../../lib/healthLogger.ts';

// Mock dependencies
jest.mock('../../lib/firebaseAdmin.ts');

import { getAdminFirestore } from '../../lib/firebaseAdmin.ts';
import { Timestamp } from 'firebase-admin/firestore';

describe('healthLogger', () => {
  let mockDb;
  let mockCollection;
  let mockDoc;
  let mockBatch;
  let mockQuery;
  let mockSnapshot;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Firestore chain
    mockSnapshot = {
      exists: true,
      forEach: jest.fn(),
      get: jest.fn(),
    };

    // Query mock that chains properly
    mockQuery = {
      where: jest.fn(function() { return this; }),
      orderBy: jest.fn(function() { return this; }),
      limit: jest.fn(function() { return this; }),
      get: jest.fn().mockResolvedValue(mockSnapshot),
    };

    mockDoc = {
      id: 'mock-doc-id',
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({}),
        get: jest.fn().mockResolvedValue(mockSnapshot),
      }),
      data: jest.fn(),
    };

    mockBatch = {
      set: jest.fn(),
      commit: jest.fn().mockResolvedValue({}),
    };

    mockCollection = {
      add: jest.fn().mockResolvedValue(mockDoc),
      doc: jest.fn().mockReturnValue(mockDoc),
      where: jest.fn(function() { return mockQuery; }),
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
      batch: jest.fn().mockReturnValue(mockBatch),
    };

    getAdminFirestore.mockReturnValue(mockDb);
  });

  describe('logHealthCheckRun', () => {
    it('creates parent document with correct aggregated stats', async () => {
      const results = [
        {
          status: 'fulfilled',
          value: {
            userId: 'user1',
            connectionStatus: 'online',
            stateMismatch: null,
          },
        },
        {
          status: 'fulfilled',
          value: {
            userId: 'user2',
            connectionStatus: 'online',
            stateMismatch: { detected: true },
          },
        },
        {
          status: 'rejected',
          reason: new Error('Failed'),
        },
      ];

      await logHealthCheckRun(results, { duration: 1500 });

      expect(mockCollection.add).toHaveBeenCalledWith({
        timestamp: expect.any(Object), // Timestamp.now()
        checkedCount: 3,
        successCount: 2,
        failureCount: 1,
        hasStateMismatch: true,
        duration: 1500,
      });
    });

    it('creates subcollection documents for each result', async () => {
      const results = [
        {
          status: 'fulfilled',
          value: {
            userId: 'user1',
            connectionStatus: 'online',
            stoveStatus: { StatusDescription: 'WORK' },
            expectedState: 'ON',
            netatmoDemand: 'heating',
            stateMismatch: null,
          },
        },
      ];

      await logHealthCheckRun(results);

      // Should create batch writes
      expect(mockBatch.set).toHaveBeenCalledWith(expect.any(Object), {
        userId: 'user1',
        status: 'fulfilled',
        connectionStatus: 'online',
        stoveStatus: 'WORK',
        expectedState: 'ON',
        netatmoDemand: 'heating',
        stateMismatch: null,
        error: null,
      });

      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('handles rejected results in subcollection', async () => {
      const results = [
        {
          status: 'rejected',
          reason: new Error('Network timeout'),
        },
      ];

      await logHealthCheckRun(results);

      expect(mockBatch.set).toHaveBeenCalledWith(expect.any(Object), {
        userId: 'unknown',
        status: 'rejected',
        connectionStatus: null,
        stoveStatus: null,
        expectedState: null,
        netatmoDemand: null,
        stateMismatch: null,
        error: 'Network timeout',
      });
    });

    it('returns parent document ID on success', async () => {
      const results = [
        {
          status: 'fulfilled',
          value: { userId: 'user1', connectionStatus: 'online' },
        },
      ];

      const docId = await logHealthCheckRun(results);

      expect(docId).toBe('mock-doc-id');
    });

    it('returns null on Firestore error (fire-and-forget)', async () => {
      mockCollection.add.mockRejectedValue(new Error('Firestore error'));

      const results = [
        {
          status: 'fulfilled',
          value: { userId: 'user1' },
        },
      ];

      const docId = await logHealthCheckRun(results);

      // Should not throw, returns null instead
      expect(docId).toBeNull();
    });

    it('sets duration to 0 if not provided', async () => {
      const results = [
        {
          status: 'fulfilled',
          value: { userId: 'user1' },
        },
      ];

      await logHealthCheckRun(results);

      expect(mockCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({ duration: 0 })
      );
    });

    it('detects state mismatch flag correctly', async () => {
      const results = [
        {
          status: 'fulfilled',
          value: {
            userId: 'user1',
            stateMismatch: { detected: true, reason: 'should_be_on' },
          },
        },
      ];

      await logHealthCheckRun(results);

      expect(mockCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({ hasStateMismatch: true })
      );
    });

    it('handles empty results array', async () => {
      const results = [];

      const docId = await logHealthCheckRun(results);

      expect(mockCollection.add).toHaveBeenCalledWith({
        timestamp: expect.any(Object),
        checkedCount: 0,
        successCount: 0,
        failureCount: 0,
        hasStateMismatch: false,
        duration: 0,
      });

      // Should not create batch (no checks to log)
      expect(mockBatch.commit).not.toHaveBeenCalled();
      expect(docId).toBe('mock-doc-id');
    });
  });

  describe('getRecentHealthLogs', () => {
    it('applies date filters correctly', async () => {
      const startDate = new Date('2026-01-20');
      const endDate = new Date('2026-01-27');

      await getRecentHealthLogs({ startDate, endDate });

      // First where call is on collection (startDate filter)
      expect(mockCollection.where).toHaveBeenCalledWith(
        'timestamp',
        '>=',
        expect.any(Object)
      );

      // Second where call is on query (endDate filter)
      expect(mockQuery.where).toHaveBeenCalledWith(
        'timestamp',
        '<=',
        expect.any(Object)
      );
    });

    it('applies state mismatch filter if specified', async () => {
      await getRecentHealthLogs({ hasStateMismatch: true });

      expect(mockQuery.where).toHaveBeenCalledWith('hasStateMismatch', '==', true);
    });

    it('orders by timestamp descending', async () => {
      await getRecentHealthLogs();

      expect(mockQuery.orderBy).toHaveBeenCalledWith('timestamp', 'desc');
    });

    it('applies limit correctly', async () => {
      await getRecentHealthLogs({ limit: 50 });

      expect(mockQuery.limit).toHaveBeenCalledWith(50);
    });

    it('uses default limit of 100', async () => {
      await getRecentHealthLogs();

      expect(mockQuery.limit).toHaveBeenCalledWith(100);
    });

    it('converts Firestore timestamps to ISO strings', async () => {
      const mockDate = new Date('2026-01-27T10:00:00Z');
      const mockTimestamp = {
        toDate: jest.fn().mockReturnValue(mockDate),
      };

      mockSnapshot.forEach.mockImplementation(callback => {
        callback({
          id: 'doc1',
          data: jest.fn().mockReturnValue({
            timestamp: mockTimestamp,
            checkedCount: 1,
          }),
        });
      });

      const logs = await getRecentHealthLogs();

      expect(logs[0].timestamp).toBe('2026-01-27T10:00:00.000Z');
    });

    it('throws on query error', async () => {
      mockQuery.get.mockRejectedValue(new Error('Query failed'));

      await expect(getRecentHealthLogs()).rejects.toThrow('Query failed');
    });
  });

  describe('getHealthCheckDetails', () => {
    it('fetches subcollection for specific run', async () => {
      const runId = 'run-123';

      await getHealthCheckDetails(runId);

      expect(mockCollection.doc).toHaveBeenCalledWith(runId);
      expect(mockDoc.collection).toHaveBeenCalledWith('checks');
    });

    it('returns array of check documents', async () => {
      mockSnapshot.forEach.mockImplementation(callback => {
        callback({
          id: 'check1',
          data: jest.fn().mockReturnValue({ userId: 'user1' }),
        });
        callback({
          id: 'check2',
          data: jest.fn().mockReturnValue({ userId: 'user2' }),
        });
      });

      const checks = await getHealthCheckDetails('run-123');

      expect(checks).toHaveLength(2);
      expect(checks[0]).toEqual({ id: 'check1', userId: 'user1' });
      expect(checks[1]).toEqual({ id: 'check2', userId: 'user2' });
    });
  });

  describe('getHealthStats', () => {
    it('calculates stats correctly', async () => {
      mockSnapshot.forEach.mockImplementation(callback => {
        callback({
          data: jest.fn().mockReturnValue({
            checkedCount: 3,
            successCount: 2,
            failureCount: 1,
            hasStateMismatch: false,
          }),
        });
        callback({
          data: jest.fn().mockReturnValue({
            checkedCount: 2,
            successCount: 1,
            failureCount: 1,
            hasStateMismatch: true,
          }),
        });
      });

      const stats = await getHealthStats(7);

      expect(stats).toEqual({
        totalRuns: 2,
        totalChecks: 5,
        successfulChecks: 3,
        failedChecks: 2,
        mismatchCount: 1,
        successRate: '60.0',
      });
    });

    it('handles empty results', async () => {
      mockSnapshot.forEach.mockImplementation(() => {}); // No docs

      const stats = await getHealthStats();

      expect(stats).toEqual({
        totalRuns: 0,
        totalChecks: 0,
        successfulChecks: 0,
        failedChecks: 0,
        mismatchCount: 0,
        successRate: 0,
      });
    });
  });
});
