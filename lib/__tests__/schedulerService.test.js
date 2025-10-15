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
      // ARRANGE: Mock current time to 08:00
      const mockNow = new Date('2025-10-15T06:00:00.000Z'); // 08:00 Rome time (UTC+2)
      jest.spyOn(global, 'Date').mockImplementation(() => mockNow);

      // Mock Firebase snapshot with interval starting at 18:00
      const mockSnapshot = {
        exists: () => true,
        val: () => [
          { start: '18:00', end: '22:00', power: 4, fan: 3 },
        ],
      };
      get.mockResolvedValue(mockSnapshot);

      // ACT
      const result = await getNextScheduledChange();

      // ASSERT
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/T16:00:00/); // 18:00 Rome = 16:00 UTC
    });

    test('returns next end time when currently inside interval', async () => {
      // ARRANGE: Mock current time to 19:00 (inside 18:00-22:00 interval)
      const mockNow = new Date('2025-10-15T17:00:00.000Z'); // 19:00 Rome time
      jest.spyOn(global, 'Date').mockImplementation(() => mockNow);

      const mockSnapshot = {
        exists: () => true,
        val: () => [
          { start: '18:00', end: '22:00', power: 4, fan: 3 },
        ],
      };
      get.mockResolvedValue(mockSnapshot);

      // ACT
      const result = await getNextScheduledChange();

      // ASSERT
      expect(result).toBeTruthy();
      expect(result).toMatch(/T20:00:00/); // 22:00 Rome = 20:00 UTC
    });

    test('returns first interval of next day when no more intervals today', async () => {
      // ARRANGE: Mock current time to 23:00 (after all intervals)
      const mockNow = new Date('2025-10-15T21:00:00.000Z'); // 23:00 Rome time
      jest.spyOn(global, 'Date').mockImplementation(() => mockNow);

      // Today has no more intervals
      const todaySnapshot = {
        exists: () => true,
        val: () => [
          { start: '06:00', end: '08:00', power: 3, fan: 2 },
        ],
      };

      // Tomorrow has an interval
      const tomorrowSnapshot = {
        exists: () => true,
        val: () => [
          { start: '18:00', end: '22:00', power: 4, fan: 3 },
        ],
      };

      get.mockImplementation((dbRef) => {
        const path = dbRef.toString();
        if (path.includes('Mercoledì')) return Promise.resolve(todaySnapshot);
        if (path.includes('Giovedì')) return Promise.resolve(tomorrowSnapshot);
        return Promise.resolve({ exists: () => false });
      });

      // ACT
      const result = await getNextScheduledChange();

      // ASSERT
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    test('returns null when no intervals in next 7 days', async () => {
      // ARRANGE
      const mockNow = new Date('2025-10-15T12:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockNow);

      const emptySnapshot = {
        exists: () => false,
      };
      get.mockResolvedValue(emptySnapshot);

      // ACT
      const result = await getNextScheduledChange();

      // ASSERT
      expect(result).toBeNull();
    });

    test('handles Firebase error gracefully', async () => {
      // ARRANGE
      const mockNow = new Date('2025-10-15T12:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockNow);
      get.mockRejectedValue(new Error('Firebase error'));

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
      get.mockResolvedValue(mockSnapshot);

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
      get.mockResolvedValue(mockSnapshot);

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
      get.mockResolvedValue(emptySnapshot);

      // ACT
      const result = await getNextScheduledAction();

      // ASSERT
      expect(result).toBeNull();
    });

    test('handles Firebase error gracefully', async () => {
      // ARRANGE
      const mockNow = new Date('2025-10-15T12:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockNow);
      get.mockRejectedValue(new Error('Firebase error'));

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
      ref.mockReturnValue('mock-ref');
      set.mockResolvedValue();

      // ACT
      await saveSchedule(day, intervals);

      // ASSERT
      expect(ref).toHaveBeenCalledWith({}, `stoveScheduler/${day}`);
      expect(set).toHaveBeenCalledWith('mock-ref', intervals);
      expect(console.log).toHaveBeenCalledWith(`Scheduler salvato per ${day}`);
    });

    test('handles Firebase error on save', async () => {
      // ARRANGE
      const day = 'Lunedì';
      const intervals = [];
      ref.mockReturnValue('mock-ref');
      set.mockRejectedValue(new Error('Firebase error'));

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
      get.mockResolvedValue(mockSnapshot);

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
      get.mockResolvedValue(mockSnapshot);

      // ACT
      const result = await getSchedule(day);

      // ASSERT
      expect(result).toEqual([]);
    });

    test('returns empty array on Firebase error', async () => {
      // ARRANGE
      const day = 'Lunedì';
      get.mockRejectedValue(new Error('Firebase error'));

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
      get.mockResolvedValue(mockSnapshot);

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
      get.mockResolvedValue(mockSnapshot);

      // ACT
      const result = await getWeeklySchedule();

      // ASSERT
      expect(result).toEqual({});
    });

    test('returns empty object on Firebase error', async () => {
      // ARRANGE
      get.mockRejectedValue(new Error('Firebase error'));

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
      ref.mockReturnValue('mock-ref');
      set.mockResolvedValue();
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
      ref.mockReturnValue('mock-ref');
      set.mockResolvedValue();

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
      ref.mockReturnValue('mock-ref');
      set.mockRejectedValue(new Error('Firebase error'));

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
      get.mockResolvedValue(mockSnapshot);

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
      get.mockResolvedValue(mockSnapshot);

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
      get.mockResolvedValue(mockSnapshot);

      // ACT
      const result = await getSchedulerMode();

      // ASSERT
      expect(result).toBe(false);
    });

    test('returns false on Firebase error', async () => {
      // ARRANGE
      get.mockRejectedValue(new Error('Firebase error'));

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
      get.mockResolvedValue(mockSnapshot);

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
      get.mockResolvedValue(mockSnapshot);

      // ACT
      const result = await getFullSchedulerMode();

      // ASSERT
      expect(result).toEqual({ enabled: false, semiManual: false });
    });

    test('returns default mode on Firebase error', async () => {
      // ARRANGE
      get.mockRejectedValue(new Error('Firebase error'));

      // ACT
      const result = await getFullSchedulerMode();

      // ASSERT
      expect(result).toEqual({ enabled: false, semiManual: false });
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
      get.mockResolvedValue(mockSnapshot);
      ref.mockReturnValue('mock-ref');
      set.mockResolvedValue();
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
      get.mockRejectedValue(new Error('Firebase error'));

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
      get.mockResolvedValue(mockSnapshot);
      ref.mockReturnValue('mock-ref');
      set.mockResolvedValue();
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
      get.mockRejectedValue(new Error('Firebase error'));

      // ACT
      await clearSemiManualMode();

      // ASSERT
      expect(console.error).toHaveBeenCalled();
    });
  });
});
