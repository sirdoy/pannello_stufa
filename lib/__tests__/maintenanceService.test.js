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

// Mock Firebase module
jest.mock('firebase/database', () => ({
  ref: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
}));
jest.mock('../firebase', () => ({
  db: {},
}));
jest.mock('../logService', () => ({
  logUserAction: jest.fn(),
}));

// Get mocked functions
const { ref, get, set, update } = require('firebase/database');

describe('maintenanceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Setup mock functions
    ref.mockReturnValue('mock-ref');
    get.mockResolvedValue({ exists: () => false });
    set.mockResolvedValue();
    update.mockResolvedValue();
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
      ref.mockReturnValue('mock-ref');
      get.mockResolvedValue(mockSnapshot);

      // ACT
      const result = await getMaintenanceData();

      // ASSERT
      expect(result).toEqual(existingData);
      expect(ref).toHaveBeenCalledWith({}, 'maintenance');
    });

    test('initializes with default data when not exists', async () => {
      // ARRANGE
      const mockSnapshot = {
        exists: () => false,
      };
      ref.mockReturnValue('mock-ref');
      get.mockResolvedValue(mockSnapshot);
      set.mockResolvedValue();

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
      expect(set).toHaveBeenCalledWith('mock-ref', expect.objectContaining({
        currentHours: 0,
        targetHours: 50,
        lastUpdatedAt: null,
      }));
    });

    test('throws error on Firebase failure', async () => {
      // ARRANGE
      ref.mockReturnValue('mock-ref');
      get.mockRejectedValue(new Error('Firebase error'));

      // ACT & ASSERT
      await expect(getMaintenanceData()).rejects.toThrow('Firebase error');
      expect(console.error).toHaveBeenCalledWith(
        'Error getting maintenance data:',
        expect.any(Error)
      );
    });
  });

  describe('updateTargetHours', () => {
    test('updates target hours successfully', async () => {
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
      ref.mockReturnValue('mock-ref');
      get.mockResolvedValue(mockSnapshot);
      update.mockResolvedValue();

      // ACT
      const result = await updateTargetHours(100);

      // ASSERT
      expect(result).toBe(true);
      expect(update).toHaveBeenCalledWith('mock-ref', {
        targetHours: 100,
        // lastUpdatedAt should NOT be updated when changing config
      });
    });

    test('sets needsCleaning when currentHours >= new targetHours', async () => {
      // ARRANGE
      const existingData = {
        currentHours: 75,
        targetHours: 100,
        needsCleaning: false,
      };
      const updatedData = {
        currentHours: 75,
        targetHours: 50, // Updated
        needsCleaning: false,
      };
      const mockSnapshot1 = {
        exists: () => true,
        val: () => updatedData,
      };
      ref.mockReturnValue('mock-ref');
      // getMaintenanceData() is called after first update to check if needsCleaning
      get.mockResolvedValue(mockSnapshot1);
      update.mockResolvedValue();

      // ACT
      await updateTargetHours(50); // New target lower than current hours

      // ASSERT
      // First call updates targetHours, second call sets needsCleaning
      expect(update).toHaveBeenCalledTimes(2);
      expect(update).toHaveBeenNthCalledWith(1, 'mock-ref', {
        targetHours: 50,
      });
      expect(update).toHaveBeenNthCalledWith(2, 'mock-ref', {
        needsCleaning: true,
      });
    });

    test('does not set needsCleaning when currentHours < new targetHours', async () => {
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
      ref.mockReturnValue('mock-ref');
      get.mockResolvedValue(mockSnapshot);
      update.mockResolvedValue();

      // ACT
      await updateTargetHours(100);

      // ASSERT
      expect(update).toHaveBeenCalledTimes(1); // Only initial update, not needsCleaning
    });

    test('throws error on Firebase failure', async () => {
      // ARRANGE
      ref.mockReturnValue('mock-ref');
      update.mockRejectedValue(new Error('Firebase error'));

      // ACT & ASSERT
      await expect(updateTargetHours(100)).rejects.toThrow('Firebase error');
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
      ref.mockReturnValue('mock-ref');
      get.mockResolvedValue(mockSnapshot);
      update.mockResolvedValue();
      const mockDate = new Date('2025-10-15T12:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      // ACT
      const result = await incrementUsageHours(60); // 1 hour

      // ASSERT
      expect(result).toHaveProperty('currentHours', 26.0);
      expect(result).toHaveProperty('lastUpdatedAt', '2025-10-15T12:00:00.000Z');
      expect(update).toHaveBeenCalledWith('mock-ref', {
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
      ref.mockReturnValue('mock-ref');
      get.mockResolvedValue(mockSnapshot);
      update.mockResolvedValue();

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
      ref.mockReturnValue('mock-ref');
      get.mockResolvedValue(mockSnapshot);
      update.mockResolvedValue();

      // ACT
      const result = await incrementUsageHours(1); // +0.0167 hours

      // ASSERT
      expect(result.currentHours.toString()).toMatch(/^\d+\.\d{1,4}$/);
      expect(result.currentHours.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(4);
    });

    test('throws error on Firebase failure', async () => {
      // ARRANGE
      ref.mockReturnValue('mock-ref');
      get.mockRejectedValue(new Error('Firebase error'));

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
      ref.mockReturnValue('mock-ref');
      get.mockResolvedValue(mockSnapshot);
      update.mockResolvedValue();
      const mockNow = new Date('2025-10-15T12:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockNow);

      // ACT
      const result = await trackUsageHours('WORK');

      // ASSERT
      expect(result).toEqual({
        tracked: false,
        reason: 'First tracking - lastUpdatedAt initialized',
      });
      expect(update).toHaveBeenCalledWith('mock-ref', {
        lastUpdatedAt: '2025-10-15T12:00:00.000Z',
      });
      // currentHours should NOT be updated
      expect(update).not.toHaveBeenCalledWith('mock-ref', expect.objectContaining({
        currentHours: expect.anything(),
      }));
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
      ref.mockReturnValue('mock-ref');
      get.mockResolvedValue(mockSnapshot);
      update.mockResolvedValue();

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
        reason: 'Stove not in WORK status',
      });
      expect(get).not.toHaveBeenCalled();
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
      ref.mockReturnValue('mock-ref');
      get.mockResolvedValue(mockSnapshot);
      const mockNow = new Date('2025-10-15T12:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockNow);

      // ACT
      const result = await trackUsageHours('WORK');

      // ASSERT
      expect(result).toEqual({
        tracked: false,
        reason: 'Too soon since last update',
      });
      expect(update).not.toHaveBeenCalled();
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
      ref.mockReturnValue('mock-ref');
      get.mockResolvedValue(mockSnapshot);
      update.mockResolvedValue();

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
      ref.mockReturnValue('mock-ref');
      get.mockResolvedValue(mockSnapshot);
      update.mockResolvedValue();

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
      ref.mockReturnValue('mock-ref');
      get.mockResolvedValue(mockSnapshot);
      update.mockResolvedValue();

      // ACT
      const result = await trackUsageHours('WORK_ACTIVE'); // Status with WORK substring

      // ASSERT
      expect(result).toHaveProperty('tracked', true);

      jest.useRealTimers();
    });

    test('throws error on Firebase failure', async () => {
      // ARRANGE
      ref.mockReturnValue('mock-ref');
      get.mockRejectedValue(new Error('Firebase error'));

      // ACT & ASSERT
      await expect(trackUsageHours('WORK')).rejects.toThrow('Firebase error');
    });
  });

  describe('confirmCleaning', () => {
    test('resets maintenance data and logs cleaning action', async () => {
      // ARRANGE
      const existingData = {
        currentHours: 52.5,
        targetHours: 50,
        needsCleaning: true,
        lastCleanedAt: '2025-09-01T10:00:00.000Z',
      };
      const mockSnapshot = {
        exists: () => true,
        val: () => existingData,
      };
      const user = { name: 'Test User' };
      ref.mockReturnValue('mock-ref');
      get.mockResolvedValue(mockSnapshot);
      update.mockResolvedValue();
      logUserAction.mockResolvedValue();
      const mockDate = new Date('2025-10-15T12:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      // ACT
      const result = await confirmCleaning(user);

      // ASSERT
      expect(result).toBe(true);
      expect(logUserAction).toHaveBeenCalledWith(
        'Pulizia stufa',
        'stove', // device parameter
        '52.50h',
        {
          previousHours: 52.5,
          targetHours: 50,
          cleanedAt: '2025-10-15T12:00:00.000Z',
          source: 'manual',
        }
      );
      expect(update).toHaveBeenCalledWith('mock-ref', {
        currentHours: 0,
        needsCleaning: false,
        lastCleanedAt: '2025-10-15T12:00:00.000Z',
        lastUpdatedAt: '2025-10-15T12:00:00.000Z',
      });
    });

    test('throws error on Firebase failure', async () => {
      // ARRANGE
      ref.mockReturnValue('mock-ref');
      get.mockRejectedValue(new Error('Firebase error'));

      // ACT & ASSERT
      await expect(confirmCleaning({})).rejects.toThrow('Firebase error');
    });

    test('throws error on log failure', async () => {
      // ARRANGE
      const existingData = {
        currentHours: 52.5,
        targetHours: 50,
        needsCleaning: true,
      };
      const mockSnapshot = {
        exists: () => true,
        val: () => existingData,
      };
      ref.mockReturnValue('mock-ref');
      get.mockResolvedValue(mockSnapshot);
      logUserAction.mockRejectedValue(new Error('Log error'));

      // ACT & ASSERT
      await expect(confirmCleaning({})).rejects.toThrow('Log error');
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
      ref.mockReturnValue('mock-ref');
      get.mockResolvedValue(mockSnapshot);

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
      ref.mockReturnValue('mock-ref');
      get.mockResolvedValue(mockSnapshot);

      // ACT
      const result = await canIgnite();

      // ASSERT
      expect(result).toBe(false);
    });

    test('returns true on Firebase error (fail-safe default)', async () => {
      // ARRANGE
      ref.mockReturnValue('mock-ref');
      get.mockRejectedValue(new Error('Firebase error'));

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
      ref.mockReturnValue('mock-ref');
      get.mockResolvedValue(mockSnapshot);

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
      ref.mockReturnValue('mock-ref');
      get.mockResolvedValue(mockSnapshot);

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
      ref.mockReturnValue('mock-ref');
      get.mockResolvedValue(mockSnapshot);

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
      ref.mockReturnValue('mock-ref');
      get.mockResolvedValue(mockSnapshot);

      // ACT
      const result = await getMaintenanceStatus();

      // ASSERT
      expect(result).toHaveProperty('isNearLimit', false); // Not near, already exceeded
      expect(result).toHaveProperty('needsCleaning', true);
    });

    test('throws error on Firebase failure', async () => {
      // ARRANGE
      ref.mockReturnValue('mock-ref');
      get.mockRejectedValue(new Error('Firebase error'));

      // ACT & ASSERT
      await expect(getMaintenanceStatus()).rejects.toThrow('Firebase error');
    });
  });
});
