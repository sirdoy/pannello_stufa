import {
  getMaintenanceData,
  updateTargetHours,
  incrementUsageHours,
  trackUsageHours,
  confirmCleaning,
  canIgnite,
  getMaintenanceStatus,
} from '../maintenanceService';
import { logUserAction } from '../logService';
import { ref, get, set, update, runTransaction } from 'firebase/database';
import { createMockFetchResponse, createMockDbRef, createMockDataSnapshot } from '@/__tests__/__utils__/mockFactories';

// Mock Firebase module
jest.mock('firebase/database', () => ({
  ref: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
  runTransaction: jest.fn(),
}));
jest.mock('../firebase', () => ({
  db: {},
}));
jest.mock('../logService');

const mockRef = ref as jest.Mock;
const mockGet = get as jest.Mock;
const mockSet = set as jest.Mock;
const mockUpdate = update as jest.Mock;
const mockRunTransaction = runTransaction as jest.Mock;
const mockLogUserAction = logUserAction as jest.Mock;

describe('maintenanceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock global fetch
    global.fetch = jest.fn().mockResolvedValue(
      createMockFetchResponse({ success: true })
    ) as jest.MockedFunction<typeof fetch>;

    // Setup mock functions
    const defaultMockDbRef = createMockDbRef();
    mockRef.mockReturnValue(defaultMockDbRef);
    mockGet.mockResolvedValue(createMockDataSnapshot(null));
    mockSet.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue(undefined);

    // Mock runTransaction with default behavior
    // This mock uses the most recent data from get() to simulate realistic transaction behavior
    mockRunTransaction.mockImplementation(async (refParam, updateFn) => {
      // Get the latest data from the mocked get() call
      const snapshot = await get(refParam);
      let currentData = snapshot.exists() ? snapshot.val() : null;

      // If no data exists, start with defaults
      if (!currentData) {
        currentData = {
          currentHours: 0,
          targetHours: 50,
          lastUpdatedAt: null,
          needsCleaning: false,
          lastNotificationLevel: 0,
        };
      }

      // Run the transaction update function
      const result = updateFn(currentData);

      // If result is undefined, transaction is aborted
      if (result === undefined) {
        return {
          committed: false,
          snapshot: null,
        } as any;
      }

      // Otherwise, transaction succeeds
      return {
        committed: true,
        snapshot: { val: () => result },
      } as any;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getMaintenanceData', () => {
    test('returns existing maintenance data from Firebase', async () => {
      // ARRANGE
      const existingData = {
        currentHours: 25.5,
        targetHours: 50,
        lastCleanedAt: '2025-10-01T10:00:00.000Z',
        needsCleaning: false,
        lastUpdatedAt: '2025-10-15T12:00:00.000Z',
      };
      const mockSnapshot = {
        exists: () => true,
        val: () => existingData,
      };
      const mockDbRef = createMockDbRef();
      mockRef.mockReturnValue(mockDbRef);
      mockGet.mockResolvedValue(createMockDataSnapshot(mockSnapshot.val()));

      // ACT
      const result = await getMaintenanceData();

      // ASSERT
      expect(result).toEqual(existingData);
      expect(ref).toHaveBeenCalledWith({}, 'maintenance');
    });

    test('initializes with default data when not exists', async () => {
      // ARRANGE
      const mockDbRef = createMockDbRef();
      mockRef.mockReturnValue(mockDbRef);
      mockGet.mockResolvedValue(createMockDataSnapshot(null));
      mockSet.mockResolvedValue(undefined);

      // ACT
      const result = await getMaintenanceData();

      // ASSERT
      expect(result).toEqual({
        currentHours: 0,
        targetHours: 50,
        lastCleanedAt: null,
        needsCleaning: false,
        lastUpdatedAt: null, // Will be set on first WORK tracking
      });
      expect(set).toHaveBeenCalledWith(mockDbRef, expect.objectContaining({
        currentHours: 0,
        targetHours: 50,
        lastUpdatedAt: null,
      }));
    });

    test('throws error on Firebase failure', async () => {
      // ARRANGE
      const mockDbRef = createMockDbRef();
      mockRef.mockReturnValue(mockDbRef);
      mockGet.mockRejectedValue(new Error('Firebase error'));

      // ACT & ASSERT
      await expect(getMaintenanceData()).rejects.toThrow('Firebase error');
      expect(console.error).toHaveBeenCalledWith(
        'Error getting maintenance data:',
        expect.any(Error)
      );
    });
  });

  describe('updateTargetHours', () => {
    test('updates target hours successfully via API', async () => {
      // ARRANGE
      global.fetch = jest.fn().mockResolvedValue(
        createMockFetchResponse({ success: true })
      ) as jest.MockedFunction<typeof fetch>;

      // ACT
      const result = await updateTargetHours(100);

      // ASSERT
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/maintenance/update-target', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetHours: 100 }),
      });
    });

    test('throws error on API failure', async () => {
      // ARRANGE
      global.fetch = jest.fn().mockResolvedValue(
        createMockFetchResponse({ message: 'API error' }, { ok: false })
      ) as jest.MockedFunction<typeof fetch>;

      // ACT & ASSERT
      await expect(updateTargetHours(100)).rejects.toThrow('API error');
      expect(console.error).toHaveBeenCalled();
    });

    test('throws error on fetch failure', async () => {
      // ARRANGE
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as jest.MockedFunction<typeof fetch>;

      // ACT & ASSERT
      await expect(updateTargetHours(100)).rejects.toThrow('Network error');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('incrementUsageHours', () => {
    test('increments usage hours by specified minutes', async () => {
      // ARRANGE
      const existingData = {
        currentHours: 25.0,
        targetHours: 50,
        needsCleaning: false,
      };
      const mockSnapshot = {
        exists: () => true,
        val: () => existingData,
      };
      const mockDbRef = createMockDbRef();
      mockRef.mockReturnValue(mockDbRef);
      mockGet.mockResolvedValue(createMockDataSnapshot(mockSnapshot.val()));
      mockUpdate.mockResolvedValue(undefined);
      const mockDate = new Date('2025-10-15T12:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      // ACT
      const result = await incrementUsageHours(60); // 1 hour

      // ASSERT
      expect(result).toHaveProperty('currentHours', 26.0);
      expect(result).toHaveProperty('lastUpdatedAt', '2025-10-15T12:00:00.000Z');
      expect(update).toHaveBeenCalledWith(mockDbRef, {
        currentHours: 26.0,
        lastUpdatedAt: '2025-10-15T12:00:00.000Z',
      });
    });

    test('sets needsCleaning when threshold reached', async () => {
      // ARRANGE
      const existingData = {
        currentHours: 49.9,
        targetHours: 50,
        needsCleaning: false,
      };
      const mockSnapshot = {
        exists: () => true,
        val: () => existingData,
      };
      const mockDbRef = createMockDbRef();
      mockRef.mockReturnValue(mockDbRef);
      mockGet.mockResolvedValue(createMockDataSnapshot(mockSnapshot.val()));
      mockUpdate.mockResolvedValue(undefined);

      // ACT
      const result = await incrementUsageHours(10); // +0.1667 hours -> 50.0667

      // ASSERT
      expect(result).toHaveProperty('needsCleaning', true);
      expect(result.currentHours).toBeGreaterThan(50);
    });

    test('maintains 4 decimal precision', async () => {
      // ARRANGE
      const existingData = {
        currentHours: 25.1234,
        targetHours: 50,
        needsCleaning: false,
      };
      const mockSnapshot = {
        exists: () => true,
        val: () => existingData,
      };
      const mockDbRef = createMockDbRef();
      mockRef.mockReturnValue(mockDbRef);
      mockGet.mockResolvedValue(createMockDataSnapshot(mockSnapshot.val()));
      mockUpdate.mockResolvedValue(undefined);

      // ACT
      const result = await incrementUsageHours(1); // +0.0167 hours

      // ASSERT
      expect(result.currentHours.toString()).toMatch(/^\d+\.\d{1,4}$/);
      expect(result.currentHours.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(4);
    });

    test('throws error on Firebase failure', async () => {
      // ARRANGE
      const mockDbRef = createMockDbRef();
      mockRef.mockReturnValue(mockDbRef);
      mockGet.mockRejectedValue(new Error('Firebase error'));

      // ACT & ASSERT
      await expect(incrementUsageHours(1)).rejects.toThrow('Firebase error');
    });
  });

  describe('trackUsageHours', () => {
    test('initializes lastUpdatedAt on first tracking without adding time', async () => {
      // ARRANGE
      const existingData = {
        currentHours: 25.0,
        targetHours: 50,
        needsCleaning: false,
        lastUpdatedAt: null, // First time tracking
      };
      const mockSnapshot = {
        exists: () => true,
        val: () => existingData,
      };
      const mockDbRef = createMockDbRef();
      mockRef.mockReturnValue(mockDbRef);
      mockGet.mockResolvedValue(createMockDataSnapshot(mockSnapshot.val()));
      mockUpdate.mockResolvedValue(undefined);
      const mockNow = new Date('2025-10-15T12:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockNow);

      // ACT
      const result = await trackUsageHours('WORK');

      // ASSERT
      // With transaction, first tracking still succeeds but doesn't add time
      expect(result.tracked).toBe(true);
      expect(result.newCurrentHours).toBe(25.0); // currentHours unchanged
      expect(result.elapsedMinutes).toBe(0); // No time elapsed
      expect(runTransaction).toHaveBeenCalled();
    });

    test('tracks usage when stove status is WORK', async () => {
      // ARRANGE
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-10-15T12:00:00.000Z'));

      const existingData = {
        currentHours: 25.0,
        targetHours: 50,
        needsCleaning: false,
        lastUpdatedAt: '2025-10-15T11:59:00.000Z', // 1 minute ago
      };
      const mockSnapshot = {
        exists: () => true,
        val: () => existingData,
      };
      const mockDbRef = createMockDbRef();
      mockRef.mockReturnValue(mockDbRef);
      mockGet.mockResolvedValue(createMockDataSnapshot(mockSnapshot.val()));
      mockUpdate.mockResolvedValue(undefined);

      // ACT
      const result = await trackUsageHours('WORK');

      // ASSERT
      expect(result).toHaveProperty('tracked', true);
      expect(result).toHaveProperty('elapsedMinutes', 1);
      expect(result.newCurrentHours).toBeCloseTo(25.0167, 4);

      jest.useRealTimers();
    });

    test('does not track when stove status is not WORK', async () => {
      // ARRANGE
      // No Firebase mocks needed as it should return early

      // ACT
      const result = await trackUsageHours('OFF');

      // ASSERT
      expect(result).toEqual({
        tracked: false,
        reason: 'Stove not in WORK/MODULATION status',
      });
      expect(runTransaction).not.toHaveBeenCalled();
    });

    test('does not track when elapsed time < 0.5 minutes', async () => {
      // ARRANGE
      const existingData = {
        currentHours: 25.0,
        targetHours: 50,
        needsCleaning: false,
        lastUpdatedAt: '2025-10-15T11:59:50.000Z', // 10 seconds ago
      };
      const mockSnapshot = {
        exists: () => true,
        val: () => existingData,
      };
      const mockDbRef = createMockDbRef();
      mockRef.mockReturnValue(mockDbRef);
      mockGet.mockResolvedValue(createMockDataSnapshot(mockSnapshot.val()));
      const mockNow = new Date('2025-10-15T12:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockNow);

      // ACT
      const result = await trackUsageHours('WORK');

      // ASSERT
      expect(result.tracked).toBe(false);
      expect(result.reason).toContain('Too soon');
    });

    test('handles auto-recovery for missed cron calls (10 minutes gap)', async () => {
      // ARRANGE
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-10-15T12:00:00.000Z'));

      const existingData = {
        currentHours: 25.0,
        targetHours: 50,
        needsCleaning: false,
        lastUpdatedAt: '2025-10-15T11:50:00.000Z', // 10 minutes ago
      };
      const mockSnapshot = {
        exists: () => true,
        val: () => existingData,
      };
      const mockDbRef = createMockDbRef();
      mockRef.mockReturnValue(mockDbRef);
      mockGet.mockResolvedValue(createMockDataSnapshot(mockSnapshot.val()));
      mockUpdate.mockResolvedValue(undefined);

      // ACT
      const result = await trackUsageHours('WORK');

      // ASSERT
      expect(result).toHaveProperty('tracked', true);
      expect(result).toHaveProperty('elapsedMinutes', 10);
      expect(result.newCurrentHours).toBeCloseTo(25.1667, 4); // +10/60 hours

      jest.useRealTimers();
    });

    test('sets needsCleaning when threshold reached during tracking', async () => {
      // ARRANGE
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-10-15T12:00:00.000Z'));

      const existingData = {
        currentHours: 49.95,
        targetHours: 50,
        needsCleaning: false,
        lastUpdatedAt: '2025-10-15T11:57:00.000Z', // 3 minutes ago
      };
      const mockSnapshot = {
        exists: () => true,
        val: () => existingData,
      };
      const mockDbRef = createMockDbRef();
      mockRef.mockReturnValue(mockDbRef);
      mockGet.mockResolvedValue(createMockDataSnapshot(mockSnapshot.val()));
      mockUpdate.mockResolvedValue(undefined);

      // ACT
      const result = await trackUsageHours('WORK');

      // ASSERT
      expect(result).toHaveProperty('tracked', true);
      expect(result).toHaveProperty('needsCleaning', true);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('⚠️ Maintenance threshold reached')
      );

      jest.useRealTimers();
    });

    test('accepts status containing WORK substring', async () => {
      // ARRANGE
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-10-15T12:00:00.000Z'));

      const existingData = {
        currentHours: 25.0,
        targetHours: 50,
        needsCleaning: false,
        lastUpdatedAt: '2025-10-15T11:59:00.000Z',
      };
      const mockSnapshot = {
        exists: () => true,
        val: () => existingData,
      };
      const mockDbRef = createMockDbRef();
      mockRef.mockReturnValue(mockDbRef);
      mockGet.mockResolvedValue(createMockDataSnapshot(mockSnapshot.val()));
      mockUpdate.mockResolvedValue(undefined);

      // ACT
      const result = await trackUsageHours('WORK_ACTIVE'); // Status with WORK substring

      // ASSERT
      expect(result).toHaveProperty('tracked', true);

      jest.useRealTimers();
    });

    test('throws error on Firebase failure', async () => {
      // ARRANGE
      const mockDbRef = createMockDbRef();
      mockRef.mockReturnValue(mockDbRef);
      mockGet.mockRejectedValue(new Error('Firebase error'));

      // ACT & ASSERT
      await expect(trackUsageHours('WORK')).rejects.toThrow('Firebase error');
    });
  });

  describe('confirmCleaning', () => {
    test('confirms cleaning successfully via API', async () => {
      // ARRANGE
      const user = { name: 'Test User' };
      global.fetch = jest.fn().mockResolvedValue(
        createMockFetchResponse({ success: true })
      ) as jest.MockedFunction<typeof fetch>;

      // ACT
      const result = await confirmCleaning(user);

      // ASSERT
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/maintenance/confirm-cleaning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    test('throws error on API failure', async () => {
      // ARRANGE
      global.fetch = jest.fn().mockResolvedValue(
        createMockFetchResponse({ message: 'API error' }, { ok: false })
      ) as jest.MockedFunction<typeof fetch>;

      // ACT & ASSERT
      await expect(confirmCleaning({})).rejects.toThrow('API error');
      expect(console.error).toHaveBeenCalled();
    });

    test('throws error on fetch failure', async () => {
      // ARRANGE
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as jest.MockedFunction<typeof fetch>;

      // ACT & ASSERT
      await expect(confirmCleaning({})).rejects.toThrow('Network error');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('canIgnite', () => {
    test('returns true when needsCleaning is false', async () => {
      // ARRANGE
      const existingData = {
        currentHours: 25,
        targetHours: 50,
        needsCleaning: false,
      };
      const mockSnapshot = {
        exists: () => true,
        val: () => existingData,
      };
      const mockDbRef = createMockDbRef();
      mockRef.mockReturnValue(mockDbRef);
      mockGet.mockResolvedValue(createMockDataSnapshot(mockSnapshot.val()));

      // ACT
      const result = await canIgnite();

      // ASSERT
      expect(result).toBe(true);
    });

    test('returns false when needsCleaning is true', async () => {
      // ARRANGE
      const existingData = {
        currentHours: 55,
        targetHours: 50,
        needsCleaning: true,
      };
      const mockSnapshot = {
        exists: () => true,
        val: () => existingData,
      };
      const mockDbRef = createMockDbRef();
      mockRef.mockReturnValue(mockDbRef);
      mockGet.mockResolvedValue(createMockDataSnapshot(mockSnapshot.val()));

      // ACT
      const result = await canIgnite();

      // ASSERT
      expect(result).toBe(false);
    });

    test('returns true on Firebase error (fail-safe default)', async () => {
      // ARRANGE
      const mockDbRef = createMockDbRef();
      mockRef.mockReturnValue(mockDbRef);
      mockGet.mockRejectedValue(new Error('Firebase error'));

      // ACT
      const result = await canIgnite();

      // ASSERT
      expect(result).toBe(true);
      expect(console.error).toHaveBeenCalledWith(
        'Error checking if can ignite:',
        expect.any(Error)
      );
    });
  });

  describe('getMaintenanceStatus', () => {
    test('returns complete maintenance status with percentage', async () => {
      // ARRANGE
      const existingData = {
        currentHours: 25,
        targetHours: 50,
        needsCleaning: false,
        lastCleanedAt: '2025-09-01T10:00:00.000Z',
      };
      const mockSnapshot = {
        exists: () => true,
        val: () => existingData,
      };
      const mockDbRef = createMockDbRef();
      mockRef.mockReturnValue(mockDbRef);
      mockGet.mockResolvedValue(createMockDataSnapshot(mockSnapshot.val()));

      // ACT
      const result = await getMaintenanceStatus();

      // ASSERT
      expect(result).toHaveProperty('currentHours', 25);
      expect(result).toHaveProperty('targetHours', 50);
      expect(result).toHaveProperty('percentage', 50);
      expect(result).toHaveProperty('remainingHours', 25);
      expect(result).toHaveProperty('isNearLimit', false);
      expect(result).toHaveProperty('needsCleaning', false);
    });

    test('sets isNearLimit true when percentage >= 80%', async () => {
      // ARRANGE
      const existingData = {
        currentHours: 42,
        targetHours: 50,
        needsCleaning: false,
      };
      const mockSnapshot = {
        exists: () => true,
        val: () => existingData,
      };
      const mockDbRef = createMockDbRef();
      mockRef.mockReturnValue(mockDbRef);
      mockGet.mockResolvedValue(createMockDataSnapshot(mockSnapshot.val()));

      // ACT
      const result = await getMaintenanceStatus();

      // ASSERT
      expect(result).toHaveProperty('percentage', 84);
      expect(result).toHaveProperty('isNearLimit', true);
    });

    test('caps percentage at 100% when exceeded', async () => {
      // ARRANGE
      const existingData = {
        currentHours: 75,
        targetHours: 50,
        needsCleaning: true,
      };
      const mockSnapshot = {
        exists: () => true,
        val: () => existingData,
      };
      const mockDbRef = createMockDbRef();
      mockRef.mockReturnValue(mockDbRef);
      mockGet.mockResolvedValue(createMockDataSnapshot(mockSnapshot.val()));

      // ACT
      const result = await getMaintenanceStatus();

      // ASSERT
      expect(result).toHaveProperty('percentage', 100); // Capped at 100
      expect(result).toHaveProperty('remainingHours', 0);
    });

    test('sets isNearLimit false when needsCleaning is true', async () => {
      // ARRANGE
      const existingData = {
        currentHours: 52,
        targetHours: 50,
        needsCleaning: true,
      };
      const mockSnapshot = {
        exists: () => true,
        val: () => existingData,
      };
      const mockDbRef = createMockDbRef();
      mockRef.mockReturnValue(mockDbRef);
      mockGet.mockResolvedValue(createMockDataSnapshot(mockSnapshot.val()));

      // ACT
      const result = await getMaintenanceStatus();

      // ASSERT
      expect(result).toHaveProperty('isNearLimit', false); // Not near, already exceeded
      expect(result).toHaveProperty('needsCleaning', true);
    });

    test('throws error on Firebase failure', async () => {
      // ARRANGE
      const mockDbRef = createMockDbRef();
      mockRef.mockReturnValue(mockDbRef);
      mockGet.mockRejectedValue(new Error('Firebase error'));

      // ACT & ASSERT
      await expect(getMaintenanceStatus()).rejects.toThrow('Firebase error');
    });
  });
});
