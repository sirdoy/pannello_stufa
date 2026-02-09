/**
 * Offline State Cache Service Tests
 */

import {
  formatStoveStateForDisplay,
  formatThermostatStateForDisplay,
  getCacheAge,
  DEVICE_IDS,
} from '../offlineStateCache';

// Mock IndexedDB
jest.mock('../indexedDB', () => ({
  get: jest.fn().mockResolvedValue(null),
  getAll: jest.fn().mockResolvedValue([]),
  put: jest.fn().mockResolvedValue(undefined),
  STORES: {
    COMMAND_QUEUE: 'commandQueue',
    DEVICE_STATE: 'deviceState',
    APP_STATE: 'appState',
  },
}));

describe('offlineStateCache', () => {
  describe('DEVICE_IDS', () => {
    it('has all expected device IDs', () => {
      expect(DEVICE_IDS.STOVE).toBe('stove');
      expect(DEVICE_IDS.THERMOSTAT).toBe('thermostat');
      expect(DEVICE_IDS.LIGHTS).toBe('lights');
    });
  });

  describe('formatStoveStateForDisplay', () => {
    it('returns null for null input', () => {
      expect(formatStoveStateForDisplay(null)).toBeNull();
    });

    it('returns null for undefined state', () => {
      expect(formatStoveStateForDisplay({ timestamp: '2026-01-19T10:00:00Z' } as any)).toBeNull();
    });

    it('formats stove state correctly when on', () => {
      const cachedData = {
        state: {
          status: 'on',
          temperature: 22.5,
          exhaustTemp: 150,
          setpoint: 24,
          powerLevel: 3,
          mode: 'auto',
          needsCleaning: false,
          currentHours: 45,
        },
        timestamp: new Date().toISOString(),
      };

      const result = formatStoveStateForDisplay(cachedData as any);

      expect(result!.isOn).toBe(true);
      expect(result!.status).toBe('on');
      expect(result!.temperature).toBe(22.5);
      expect(result!.exhaustTemp).toBe(150);
      expect(result!.setpoint).toBe(24);
      expect(result!.powerLevel).toBe(3);
      expect(result!.needsCleaning).toBe(false);
      expect(result!.isStale).toBe(false);
    });

    it('formats stove state correctly when off', () => {
      const cachedData = {
        state: {
          status: 'off',
          temperature: 18,
        },
        timestamp: new Date().toISOString(),
      };

      const result = formatStoveStateForDisplay(cachedData as any);

      expect(result!.isOn).toBe(false);
      expect(result!.status).toBe('off');
    });

    it('marks data as stale after 30 minutes', () => {
      const thirtyFiveMinutesAgo = new Date(Date.now() - 35 * 60 * 1000);
      const cachedData = {
        state: { status: 'on' },
        timestamp: thirtyFiveMinutesAgo.toISOString(),
      };

      const result = formatStoveStateForDisplay(cachedData as any);

      expect(result!.isStale).toBe(true);
      expect(result!.ageMinutes).toBeGreaterThan(30);
    });

    it('handles alternative field names', () => {
      const cachedData = {
        state: {
          state: 'on',
          temp: 21,
          fumi: 140,
          setpointTemperature: 23,
          power: 2,
        },
        timestamp: new Date().toISOString(),
      };

      const result = formatStoveStateForDisplay(cachedData as any);

      expect(result!.isOn).toBe(true);
      expect(result!.temperature).toBe(21);
      expect(result!.exhaustTemp).toBe(140);
      expect(result!.setpoint).toBe(23);
      expect(result!.powerLevel).toBe(2);
    });

    it('includes formatted cache timestamp', () => {
      const cachedData = {
        state: { status: 'on' },
        timestamp: '2026-01-19T14:30:00.000Z',
      };

      const result = formatStoveStateForDisplay(cachedData as any);

      expect(result!.cachedAtFormatted).toBeDefined();
      expect(typeof result!.cachedAtFormatted).toBe('string');
    });
  });

  describe('formatThermostatStateForDisplay', () => {
    it('returns null for null input', () => {
      expect(formatThermostatStateForDisplay(null)).toBeNull();
    });

    it('formats thermostat state with rooms array', () => {
      const cachedData = {
        state: {
          rooms: [
            {
              name: 'Soggiorno',
              temperature: 21.5,
              setpoint: 22,
              humidity: 45,
              heating: true,
            },
          ],
          mode: 'schedule',
        },
        timestamp: new Date().toISOString(),
      };

      const result = formatThermostatStateForDisplay(cachedData as any);

      expect(result!.temperature).toBe(21.5);
      expect(result!.setpoint).toBe(22);
      expect(result!.humidity).toBe(45);
      expect(result!.isHeating).toBe(true);
      expect(result!.roomName).toBe('Soggiorno');
      expect(result!.roomCount).toBe(1);
      expect(result!.mode).toBe('schedule');
    });

    it('handles flat thermostat state', () => {
      const cachedData = {
        state: {
          temperature: 20,
          setpoint: 21,
          humidity: 50,
          mode: 'manual',
        },
        timestamp: new Date().toISOString(),
      };

      const result = formatThermostatStateForDisplay(cachedData as any);

      expect(result!.temperature).toBe(20);
      expect(result!.setpoint).toBe(21);
      expect(result!.humidity).toBe(50);
      expect(result!.roomName).toBe('Stanza');
    });

    it('marks data as stale after 30 minutes', () => {
      const fortyMinutesAgo = new Date(Date.now() - 40 * 60 * 1000);
      const cachedData = {
        state: { temperature: 20 },
        timestamp: fortyMinutesAgo.toISOString(),
      };

      const result = formatThermostatStateForDisplay(cachedData as any);

      expect(result!.isStale).toBe(true);
    });
  });

  describe('getCacheAge', () => {
    it('returns "Appena aggiornato" for very recent timestamp', () => {
      const now = new Date().toISOString();
      expect(getCacheAge(now)).toBe('Appena aggiornato');
    });

    it('returns minutes for timestamps under 1 hour', () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      expect(getCacheAge(tenMinutesAgo)).toBe('10 min fa');
    });

    it('returns hours for timestamps under 1 day', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      expect(getCacheAge(threeHoursAgo)).toBe('3 ore fa');
    });

    it('returns days for older timestamps', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      expect(getCacheAge(twoDaysAgo)).toBe('2 giorni fa');
    });
  });
});
