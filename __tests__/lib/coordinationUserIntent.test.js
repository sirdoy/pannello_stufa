/**
 * Tests for User Intent Detection Service
 */

import { detectUserIntent, wasManuallyChanged } from '@/lib/coordinationUserIntent';
import NETATMO_API from '@/lib/netatmoApi';

// Mock netatmoApi
jest.mock('@/lib/netatmoApi', () => ({
  __esModule: true,
  default: {
    getHomeStatus: jest.fn(),
  },
}));

describe('coordinationUserIntent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('detectUserIntent', () => {
    it('detects setpoint change > 0.5°C', async () => {
      // Mock home status with changed setpoint
      NETATMO_API.getHomeStatus.mockResolvedValue({
        rooms: [
          {
            id: 'room1',
            name: 'Living Room',
            therm_setpoint_temperature: 23.0, // Expected 21.0
            therm_setpoint_mode: 'manual',
          },
        ],
      });

      const result = await detectUserIntent(
        'home123',
        ['room1'],
        { room1: 21.0 },
        'access_token'
      );

      expect(result.manualChange).toBe(true);
      expect(result.changes).toHaveLength(1);
      expect(result.changes[0]).toMatchObject({
        roomId: 'room1',
        roomName: 'Living Room',
        type: 'setpoint_changed',
        expected: 21.0,
        actual: 23.0,
      });
      expect(result.reason).toContain('Setpoint modificato manualmente');
      expect(result.reason).toContain('Living Room');
    });

    it('ignores setpoint change <= 0.5°C (tolerance)', async () => {
      // Mock home status with small setpoint change
      NETATMO_API.getHomeStatus.mockResolvedValue({
        rooms: [
          {
            id: 'room1',
            name: 'Living Room',
            therm_setpoint_temperature: 21.3, // Expected 21.0 (diff = 0.3)
            therm_setpoint_mode: 'manual',
          },
        ],
      });

      const result = await detectUserIntent(
        'home123',
        ['room1'],
        { room1: 21.0 },
        'access_token'
      );

      expect(result.manualChange).toBe(false);
      expect(result.changes).toHaveLength(0);
      expect(result.reason).toBe(null);
    });

    it('detects mode change to away', async () => {
      // Mock home status with away mode
      NETATMO_API.getHomeStatus.mockResolvedValue({
        rooms: [
          {
            id: 'room1',
            name: 'Living Room',
            therm_setpoint_temperature: 21.0,
            therm_setpoint_mode: 'away',
          },
        ],
      });

      const result = await detectUserIntent(
        'home123',
        ['room1'],
        { room1: 21.0 },
        'access_token'
      );

      expect(result.manualChange).toBe(true);
      expect(result.changes).toHaveLength(1);
      expect(result.changes[0]).toMatchObject({
        roomId: 'room1',
        type: 'mode_changed',
        expected: 'manual/home',
        actual: 'away',
      });
      expect(result.reason).toContain('Modalità modificata manualmente');
    });

    it('detects mode change to hg (frost guard)', async () => {
      // Mock home status with frost guard mode
      NETATMO_API.getHomeStatus.mockResolvedValue({
        rooms: [
          {
            id: 'room1',
            name: 'Living Room',
            therm_setpoint_temperature: 7.0,
            therm_setpoint_mode: 'hg',
          },
        ],
      });

      const result = await detectUserIntent(
        'home123',
        ['room1'],
        { room1: 21.0 },
        'access_token'
      );

      expect(result.manualChange).toBe(true);
      // Both setpoint and mode change detected (hg mode sets temp to 7°C)
      expect(result.changes).toHaveLength(2);
      const modeChange = result.changes.find(c => c.type === 'mode_changed');
      expect(modeChange.actual).toBe('hg');
    });

    it('detects mode change to off', async () => {
      // Mock home status with off mode
      NETATMO_API.getHomeStatus.mockResolvedValue({
        rooms: [
          {
            id: 'room1',
            name: 'Living Room',
            therm_setpoint_temperature: 7.0,
            therm_setpoint_mode: 'off',
          },
        ],
      });

      const result = await detectUserIntent(
        'home123',
        ['room1'],
        { room1: 21.0 },
        'access_token'
      );

      expect(result.manualChange).toBe(true);
      // Both setpoint and mode change detected (off mode sets temp to 7°C)
      expect(result.changes).toHaveLength(2);
      const modeChange = result.changes.find(c => c.type === 'mode_changed');
      expect(modeChange.actual).toBe('off');
    });

    it('no change detected when setpoint matches', async () => {
      // Mock home status with matching setpoint
      NETATMO_API.getHomeStatus.mockResolvedValue({
        rooms: [
          {
            id: 'room1',
            name: 'Living Room',
            therm_setpoint_temperature: 21.0,
            therm_setpoint_mode: 'manual',
          },
        ],
      });

      const result = await detectUserIntent(
        'home123',
        ['room1'],
        { room1: 21.0 },
        'access_token'
      );

      expect(result.manualChange).toBe(false);
      expect(result.changes).toHaveLength(0);
    });

    it('no change detected in normal home mode', async () => {
      // Mock home status in home mode
      NETATMO_API.getHomeStatus.mockResolvedValue({
        rooms: [
          {
            id: 'room1',
            name: 'Living Room',
            therm_setpoint_temperature: 21.0,
            therm_setpoint_mode: 'home',
          },
        ],
      });

      const result = await detectUserIntent(
        'home123',
        ['room1'],
        { room1: 21.0 },
        'access_token'
      );

      expect(result.manualChange).toBe(false);
      expect(result.changes).toHaveLength(0);
    });

    it('handles missing room data gracefully', async () => {
      // Mock home status without the requested room
      NETATMO_API.getHomeStatus.mockResolvedValue({
        rooms: [
          {
            id: 'room2',
            name: 'Bedroom',
            therm_setpoint_temperature: 19.0,
            therm_setpoint_mode: 'manual',
          },
        ],
      });

      const result = await detectUserIntent(
        'home123',
        ['room1'], // Request room1 but only room2 exists
        { room1: 21.0 },
        'access_token'
      );

      expect(result.manualChange).toBe(false);
      expect(result.changes).toHaveLength(0);
    });

    it('handles API errors gracefully', async () => {
      // Mock API error
      NETATMO_API.getHomeStatus.mockRejectedValue(new Error('API timeout'));

      const result = await detectUserIntent(
        'home123',
        ['room1'],
        { room1: 21.0 },
        'access_token'
      );

      expect(result.manualChange).toBe(false);
      expect(result.changes).toHaveLength(0);
      expect(result.reason).toBe(null);
      expect(result.error).toBe('API timeout');
    });

    it('multi-room detection works correctly', async () => {
      // Mock home status with changes in multiple rooms
      NETATMO_API.getHomeStatus.mockResolvedValue({
        rooms: [
          {
            id: 'room1',
            name: 'Living Room',
            therm_setpoint_temperature: 23.0, // Expected 21.0
            therm_setpoint_mode: 'manual',
          },
          {
            id: 'room2',
            name: 'Bedroom',
            therm_setpoint_temperature: 19.0, // Expected 19.0 (no change)
            therm_setpoint_mode: 'manual',
          },
          {
            id: 'room3',
            name: 'Kitchen',
            therm_setpoint_temperature: 20.0,
            therm_setpoint_mode: 'away', // Mode changed
          },
        ],
      });

      const result = await detectUserIntent(
        'home123',
        ['room1', 'room2', 'room3'],
        { room1: 21.0, room2: 19.0, room3: 20.0 },
        'access_token'
      );

      expect(result.manualChange).toBe(true);
      expect(result.changes).toHaveLength(2);

      // Check setpoint change
      const setpointChange = result.changes.find(c => c.type === 'setpoint_changed');
      expect(setpointChange).toMatchObject({
        roomId: 'room1',
        roomName: 'Living Room',
      });

      // Check mode change
      const modeChange = result.changes.find(c => c.type === 'mode_changed');
      expect(modeChange).toMatchObject({
        roomId: 'room3',
        roomName: 'Kitchen',
      });

      // Reason should include both types
      expect(result.reason).toContain('Setpoint e modalità modificati manualmente');
    });

    it('detects both setpoint and mode change in same room', async () => {
      // Mock home status with both types of changes
      NETATMO_API.getHomeStatus.mockResolvedValue({
        rooms: [
          {
            id: 'room1',
            name: 'Living Room',
            therm_setpoint_temperature: 23.0, // Expected 21.0
            therm_setpoint_mode: 'away', // Mode changed too
          },
        ],
      });

      const result = await detectUserIntent(
        'home123',
        ['room1'],
        { room1: 21.0 },
        'access_token'
      );

      expect(result.manualChange).toBe(true);
      expect(result.changes).toHaveLength(2);
      expect(result.reason).toContain('Setpoint e modalità modificati manualmente');
    });

    it('handles empty home status gracefully', async () => {
      // Mock empty home status
      NETATMO_API.getHomeStatus.mockResolvedValue(null);

      const result = await detectUserIntent(
        'home123',
        ['room1'],
        { room1: 21.0 },
        'access_token'
      );

      expect(result.manualChange).toBe(false);
      expect(result.error).toBe('Unable to fetch home status');
    });
  });

  describe('wasManuallyChanged', () => {
    it('returns true when manual change detected', async () => {
      // Mock home status with changed setpoint
      NETATMO_API.getHomeStatus.mockResolvedValue({
        rooms: [
          {
            id: 'room1',
            name: 'Living Room',
            therm_setpoint_temperature: 23.0,
            therm_setpoint_mode: 'manual',
          },
        ],
      });

      const changed = await wasManuallyChanged(
        'home123',
        'room1',
        21.0,
        'access_token'
      );

      expect(changed).toBe(true);
    });

    it('returns false when no change detected', async () => {
      // Mock home status with matching setpoint
      NETATMO_API.getHomeStatus.mockResolvedValue({
        rooms: [
          {
            id: 'room1',
            name: 'Living Room',
            therm_setpoint_temperature: 21.0,
            therm_setpoint_mode: 'manual',
          },
        ],
      });

      const changed = await wasManuallyChanged(
        'home123',
        'room1',
        21.0,
        'access_token'
      );

      expect(changed).toBe(false);
    });

    it('returns false on API error', async () => {
      // Mock API error
      NETATMO_API.getHomeStatus.mockRejectedValue(new Error('API error'));

      const changed = await wasManuallyChanged(
        'home123',
        'room1',
        21.0,
        'access_token'
      );

      expect(changed).toBe(false);
    });
  });
});
