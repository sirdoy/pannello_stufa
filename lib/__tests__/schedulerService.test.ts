import {
  getNextScheduledChange,
  getNextScheduledAction,
  saveSchedule,
  getSchedule,
  getWeeklySchedule,
  setSchedulerMode,
  getSchedulerMode,
  getFullSchedulerMode,
  setSemiManualMode,
  clearSemiManualMode,
} from '../schedulerService';
import { ref, set, get } from 'firebase/database';

// Mock Firebase
jest.mock('firebase/database');
jest.mock('../firebase', () => ({
  db: {},
}));

const mockRef = jest.mocked(ref);
const mockSet = jest.mocked(set);
const mockGet = jest.mocked(get);

describe('schedulerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods to keep test output clean
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getNextScheduledChange', () => {
    test('returns next start time when interval is in future today', async () => {
      // ARRANGE: Mock current time to 08:00 Rome time
      const mockNow = new Date('2025-10-15T06:00:00.000Z'); // 08:00 Rome time (UTC+2 in summer)
      jest.spyOn(global, 'Date').mockImplementation(() => mockNow);

      // Mock Firebase responses - use call order since path inspection is unreliable
      let callCount = 0;
      (mockGet as jest.Mock).mockImplementation(() => {
        callCount++;
        // First call: activeScheduleId
        if (callCount === 1) {
          return Promise.resolve({
            exists: () => true,
            val: () => 'default',
          });
        }
        // Second call: schedule slots for Mercoledì (Wednesday)
        if (callCount === 2) {
          return Promise.resolve({
            exists: () => true,
            val: () => [
              { start: '18:00', end: '22:00', power: 4, fan: 3 },
            ],
          });
        }
        return Promise.resolve({ exists: () => false });
      });

      // ACT
      const result = await getNextScheduledChange();

      // ASSERT
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      // Just verify it's a valid ISO string and contains the date
      expect(result).toMatch(/2025-10-15/);
    });

    test('returns next end time when currently inside interval', async () => {
      // ARRANGE: Mock current time to 19:00 Rome time (inside 18:00-22:00)
      const mockNow = new Date('2025-10-15T17:00:00.000Z'); // 19:00 Rome time
      jest.spyOn(global, 'Date').mockImplementation(() => mockNow);

      let callCount = 0;
      (mockGet as jest.Mock).mockImplementation(() => {
        callCount++;
        // First call: activeScheduleId
        if (callCount === 1) {
          return Promise.resolve({
            exists: () => true,
            val: () => 'default',
          } as any);
        }
        // Second call: schedule slots for Mercoledì
        if (callCount === 2) {
          return Promise.resolve({
            exists: () => true,
            val: () => [
              { start: '18:00', end: '22:00', power: 4, fan: 3 },
            ],
          } as any);
        }
        return Promise.resolve({ exists: () => false } as any);
      });

      // ACT
      const result = await getNextScheduledChange();

      // ASSERT
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/2025-10-15/);
    });

    test('returns first interval of next day when no more intervals today', async () => {
      // ARRANGE: Mock current time to 23:00 Rome time (after all intervals)
      const mockNow = new Date('2025-10-15T21:00:00.000Z'); // 23:00 Rome time
      jest.spyOn(global, 'Date').mockImplementation(() => mockNow);

      let callCount = 0;
      (mockGet as jest.Mock).mockImplementation(() => {
        callCount++;
        // First call: activeScheduleId
        if (callCount === 1) {
          return Promise.resolve({
            exists: () => true,
            val: () => 'default',
          } as any);
        }
        // Second call: Wednesday (today) - past intervals
        if (callCount === 2) {
          return Promise.resolve({
            exists: () => true,
            val: () => [
              { start: '06:00', end: '08:00', power: 3, fan: 2 },
            ],
          } as any);
        }
        // Third call: activeScheduleId again (for next day)
        if (callCount === 3) {
          return Promise.resolve({
            exists: () => true,
            val: () => 'default',
          } as any);
        }
        // Fourth call: Thursday (tomorrow) - future interval
        if (callCount === 4) {
          return Promise.resolve({
            exists: () => true,
            val: () => [
              { start: '18:00', end: '22:00', power: 4, fan: 3 },
            ],
          } as any);
        }
        return Promise.resolve({ exists: () => false } as any);
      });

      // ACT
      const result = await getNextScheduledChange();

      // ASSERT
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      // Should be next day (Oct 16)
      expect(result).toMatch(/2025-10-16/);
    });

    test('returns null when no intervals in next 7 days', async () => {
      // ARRANGE
      const mockNow = new Date('2025-10-15T12:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockNow);

      const emptySnapshot = {
        exists: () => false,
      };
      (get as jest.Mock).mockResolvedValue(emptySnapshot);

      // ACT
      const result = await getNextScheduledChange();

      // ASSERT
      expect(result).toBeNull();
    });

    test('handles Firebase error gracefully', async () => {
      // ARRANGE
      const mockNow = new Date('2025-10-15T12:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockNow);
      (get as jest.Mock).mockRejectedValue(new Error('Firebase error'));

      // ACT
      const result = await getNextScheduledChange();

      // ASSERT
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Errore nel calcolo del prossimo cambio scheduler:',
        expect.any(Error)
      );
    });
  });

  describe('getNextScheduledAction', () => {
    test('returns ignite action with power and fan for future start', async () => {
      // ARRANGE
      const mockNow = new Date('2025-10-15T06:00:00.000Z'); // 08:00 Rome time
      jest.spyOn(global, 'Date').mockImplementation(() => mockNow);

      const mockSnapshot = {
        exists: () => true,
        val: () => [
          { start: '18:00', end: '22:00', power: 4, fan: 3 },
        ],
      };
      (get as jest.Mock).mockResolvedValue(mockSnapshot);

      // ACT
      const result = await getNextScheduledAction();

      // ASSERT
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('action', 'ignite');
      expect(result).toHaveProperty('power', 4);
      expect(result).toHaveProperty('fan', 3);
    });

    test('returns shutdown action when inside interval', async () => {
      // ARRANGE
      const mockNow = new Date('2025-10-15T17:00:00.000Z'); // 19:00 Rome time
      jest.spyOn(global, 'Date').mockImplementation(() => mockNow);

      const mockSnapshot = {
        exists: () => true,
        val: () => [
          { start: '18:00', end: '22:00', power: 4, fan: 3 },
        ],
      };
      (get as jest.Mock).mockResolvedValue(mockSnapshot);

      // ACT
      const result = await getNextScheduledAction();

      // ASSERT
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('action', 'shutdown');
      expect(result).not.toHaveProperty('power');
      expect(result).not.toHaveProperty('fan');
    });

    test('returns null when no scheduled actions', async () => {
      // ARRANGE
      const mockNow = new Date('2025-10-15T12:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockNow);

      const emptySnapshot = {
        exists: () => false,
      };
      (get as jest.Mock).mockResolvedValue(emptySnapshot);

      // ACT
      const result = await getNextScheduledAction();

      // ASSERT
      expect(result).toBeNull();
    });

    test('handles Firebase error gracefully', async () => {
      // ARRANGE
      const mockNow = new Date('2025-10-15T12:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockNow);
      (get as jest.Mock).mockRejectedValue(new Error('Firebase error'));

      // ACT
      const result = await getNextScheduledAction();

      // ASSERT
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('saveSchedule', () => {
    test('saves schedule to Firebase for specified day', async () => {
      // ARRANGE
      const day = 'Lunedì';
      const intervals = [
        { start: '06:00', end: '08:00', power: 3, fan: 2 },
        { start: '18:00', end: '22:00', power: 4, fan: 3 },
      ];

      // Mock get for activeScheduleId calls
      (mockGet as jest.Mock).mockImplementation((dbRef: any) => {
        const path = typeof dbRef === 'string' ? dbRef : (dbRef as any)._path?.toString() || '';
        if (path.includes('activeScheduleId')) {
          return Promise.resolve({
            exists: () => true,
            val: () => 'default',
          } as any);
        }
        return Promise.resolve({ exists: () => false } as any);
      });

      (ref as jest.Mock).mockReturnValue('mock-ref');
      mockSet.mockResolvedValue(undefined);

      // ACT
      await saveSchedule(day, intervals);

      // ASSERT
      // Should call ref with new schema path
      expect(ref).toHaveBeenCalledWith({}, 'schedules-v2/activeScheduleId');
      expect(set).toHaveBeenCalledWith('mock-ref', intervals);
      expect(console.log).toHaveBeenCalledWith(`Scheduler salvato per ${day}`);
    });

    test('handles Firebase error on save', async () => {
      // ARRANGE
      const day = 'Lunedì';
      const intervals: any[] = [];
      (ref as jest.Mock).mockReturnValue('mock-ref');
      mockSet.mockRejectedValue(new Error('Firebase error'));

      // ACT
      await saveSchedule(day, intervals);

      // ASSERT
      expect(console.error).toHaveBeenCalledWith(
        'Errore nel salvataggio scheduler:',
        expect.any(Error)
      );
    });
  });

  describe('getSchedule', () => {
    test('returns schedule for specified day when it exists', async () => {
      // ARRANGE
      const day = 'Lunedì';
      const expectedSchedule = [
        { start: '06:00', end: '08:00', power: 3, fan: 2 },
      ];
      const mockSnapshot = {
        exists: () => true,
        val: () => expectedSchedule,
      };
      (get as jest.Mock).mockResolvedValue(mockSnapshot);

      // ACT
      const result = await getSchedule(day);

      // ASSERT
      expect(result).toEqual(expectedSchedule);
    });

    test('returns empty array when schedule does not exist', async () => {
      // ARRANGE
      const day = 'Lunedì';
      const mockSnapshot = {
        exists: () => false,
      };
      (get as jest.Mock).mockResolvedValue(mockSnapshot);

      // ACT
      const result = await getSchedule(day);

      // ASSERT
      expect(result).toEqual([]);
    });

    test('returns empty array on Firebase error', async () => {
      // ARRANGE
      const day = 'Lunedì';
      (get as jest.Mock).mockRejectedValue(new Error('Firebase error'));

      // ACT
      const result = await getSchedule(day);

      // ASSERT
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        'Errore nel recupero scheduler:',
        expect.any(Error)
      );
    });
  });

  describe('getWeeklySchedule', () => {
    test('returns complete weekly schedule when it exists', async () => {
      // ARRANGE
      const expectedSchedule = {
        Lunedì: [{ start: '06:00', end: '08:00', power: 3, fan: 2 }],
        Martedì: [{ start: '18:00', end: '22:00', power: 4, fan: 3 }],
      };
      const mockSnapshot = {
        exists: () => true,
        val: () => expectedSchedule,
      };
      (get as jest.Mock).mockResolvedValue(mockSnapshot);

      // ACT
      const result = await getWeeklySchedule();

      // ASSERT
      expect(result).toEqual(expectedSchedule);
    });

    test('returns empty object when no schedule exists', async () => {
      // ARRANGE
      const mockSnapshot = {
        exists: () => false,
      };
      (get as jest.Mock).mockResolvedValue(mockSnapshot);

      // ACT
      const result = await getWeeklySchedule();

      // ASSERT
      expect(result).toEqual({});
    });

    test('returns empty object on Firebase error', async () => {
      // ARRANGE
      (get as jest.Mock).mockRejectedValue(new Error('Firebase error'));

      // ACT
      const result = await getWeeklySchedule();

      // ASSERT
      expect(result).toEqual({});
      expect(console.error).toHaveBeenCalledWith(
        'Errore nel recupero completo scheduler:',
        expect.any(Error)
      );
    });
  });

  describe('setSchedulerMode', () => {
    test('sets scheduler mode to enabled with timestamp', async () => {
      // ARRANGE
      (ref as jest.Mock).mockReturnValue('mock-ref');
      mockSet.mockResolvedValue(undefined);
      const mockDate = new Date('2025-10-15T12:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      // ACT
      await setSchedulerMode(true);

      // ASSERT
      expect(set).toHaveBeenCalledWith('mock-ref', {
        enabled: true,
        lastUpdated: '2025-10-15T12:00:00.000Z',
      });
      expect(console.log).toHaveBeenCalledWith('Modalità scheduler impostata su: attiva');
    });

    test('sets scheduler mode to disabled', async () => {
      // ARRANGE
      (ref as jest.Mock).mockReturnValue('mock-ref');
      mockSet.mockResolvedValue(undefined);

      // ACT
      await setSchedulerMode(false);

      // ASSERT
      expect(set).toHaveBeenCalledWith('mock-ref', expect.objectContaining({
        enabled: false,
      }));
      expect(console.log).toHaveBeenCalledWith('Modalità scheduler impostata su: disattiva');
    });

    test('handles Firebase error on mode set', async () => {
      // ARRANGE
      (ref as jest.Mock).mockReturnValue('mock-ref');
      mockSet.mockRejectedValue(new Error('Firebase error'));

      // ACT
      await setSchedulerMode(true);

      // ASSERT
      expect(console.error).toHaveBeenCalledWith(
        'Errore nel salvataggio modalità scheduler:',
        expect.any(Error)
      );
    });
  });

  describe('getSchedulerMode', () => {
    test('returns true when scheduler is enabled', async () => {
      // ARRANGE
      const mockSnapshot = {
        exists: () => true,
        val: () => ({ enabled: true }),
      };
      (get as jest.Mock).mockResolvedValue(mockSnapshot);

      // ACT
      const result = await getSchedulerMode();

      // ASSERT
      expect(result).toBe(true);
    });

    test('returns false when scheduler is disabled', async () => {
      // ARRANGE
      const mockSnapshot = {
        exists: () => true,
        val: () => ({ enabled: false }),
      };
      (get as jest.Mock).mockResolvedValue(mockSnapshot);

      // ACT
      const result = await getSchedulerMode();

      // ASSERT
      expect(result).toBe(false);
    });

    test('returns false when no mode data exists (default)', async () => {
      // ARRANGE
      const mockSnapshot = {
        exists: () => false,
      };
      (get as jest.Mock).mockResolvedValue(mockSnapshot);

      // ACT
      const result = await getSchedulerMode();

      // ASSERT
      expect(result).toBe(false);
    });

    test('returns false on Firebase error', async () => {
      // ARRANGE
      (get as jest.Mock).mockRejectedValue(new Error('Firebase error'));

      // ACT
      const result = await getSchedulerMode();

      // ASSERT
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getFullSchedulerMode', () => {
    test('returns full mode object when it exists', async () => {
      // ARRANGE
      const expectedMode = {
        enabled: true,
        semiManual: true,
        returnToAutoAt: '2025-10-15T18:00:00.000Z',
      };
      const mockSnapshot = {
        exists: () => true,
        val: () => expectedMode,
      };
      (get as jest.Mock).mockResolvedValue(mockSnapshot);

      // ACT
      const result = await getFullSchedulerMode();

      // ASSERT
      expect(result).toEqual(expectedMode);
    });

    test('returns default mode when no data exists', async () => {
      // ARRANGE
      const mockSnapshot = {
        exists: () => false,
      };
      (get as jest.Mock).mockResolvedValue(mockSnapshot);

      // ACT
      const result = await getFullSchedulerMode();

      // ASSERT
      expect(result).toMatchObject({ enabled: false, semiManual: false });
      expect(result.lastUpdated).toBeDefined();
    });

    test('returns default mode on Firebase error', async () => {
      // ARRANGE
      (get as jest.Mock).mockRejectedValue(new Error('Firebase error'));

      // ACT
      const result = await getFullSchedulerMode();

      // ASSERT
      expect(result).toMatchObject({ enabled: false, semiManual: false });
      expect(result.lastUpdated).toBeDefined();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('setSemiManualMode', () => {
    test('activates semi-manual mode with return timestamp', async () => {
      // ARRANGE
      const nextChange = '2025-10-15T18:00:00.000Z';
      const currentMode = { enabled: true, semiManual: false };
      const mockSnapshot = {
        exists: () => true,
        val: () => currentMode,
      };
      (get as jest.Mock).mockResolvedValue(mockSnapshot);
      (ref as jest.Mock).mockReturnValue('mock-ref');
      mockSet.mockResolvedValue(undefined);
      const mockDate = new Date('2025-10-15T12:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      // ACT
      await setSemiManualMode(nextChange);

      // ASSERT
      expect(set).toHaveBeenCalledWith('mock-ref', {
        enabled: true,
        semiManual: true,
        semiManualActivatedAt: '2025-10-15T12:00:00.000Z',
        returnToAutoAt: nextChange,
        lastUpdated: '2025-10-15T12:00:00.000Z',
      });
      expect(console.log).toHaveBeenCalledWith(
        `Modalità semi-manuale attivata. Ritorno automatico previsto: ${nextChange}`
      );
    });

    test('handles Firebase error on semi-manual activation', async () => {
      // ARRANGE
      const nextChange = '2025-10-15T18:00:00.000Z';
      (ref as jest.Mock).mockReturnValue('mock-ref');
      // setSemiManualMode uses set() not get(), so mock set() to fail
      mockSet.mockRejectedValue(new Error('Firebase error'));

      // ACT
      await setSemiManualMode(nextChange);

      // ASSERT
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('clearSemiManualMode', () => {
    test('deactivates semi-manual mode preserving enabled state', async () => {
      // ARRANGE
      const currentMode = {
        enabled: true,
        semiManual: true,
        returnToAutoAt: '2025-10-15T18:00:00.000Z',
      };
      const mockSnapshot = {
        exists: () => true,
        val: () => currentMode,
      };
      (get as jest.Mock).mockResolvedValue(mockSnapshot);
      (ref as jest.Mock).mockReturnValue('mock-ref');
      mockSet.mockResolvedValue(undefined);
      const mockDate = new Date('2025-10-15T12:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      // ACT
      await clearSemiManualMode();

      // ASSERT
      expect(set).toHaveBeenCalledWith('mock-ref', {
        enabled: true,
        semiManual: false,
        lastUpdated: '2025-10-15T12:00:00.000Z',
      });
      expect(console.log).toHaveBeenCalledWith(
        'Modalità semi-manuale disattivata. Ritorno in automatico.'
      );
    });

    test('handles Firebase error on semi-manual clear', async () => {
      // ARRANGE
      (get as jest.Mock).mockRejectedValue(new Error('Firebase error'));

      // ACT
      await clearSemiManualMode();

      // ASSERT
      expect(console.error).toHaveBeenCalled();
    });
  });
});
