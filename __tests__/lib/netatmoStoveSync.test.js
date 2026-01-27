/**
 * Unit tests for Netatmo Stove Sync Service
 * Tests stove-valve integration logic
 */

import {
  getStoveSyncConfig,
  enableStoveSync,
  disableStoveSync,
  syncLivingRoomWithStove,
  checkStoveSyncOnStatusChange,
  enforceStoveSyncSetpoints,
  setRoomsToBoostMode,
  restoreRoomSetpoints,
} from '@/lib/netatmoStoveSync';

// Mock Firebase Admin
jest.mock('@/lib/firebaseAdmin', () => ({
  adminDbGet: jest.fn(),
  adminDbSet: jest.fn(),
  adminDbUpdate: jest.fn(),
}));

// Mock Netatmo API
jest.mock('@/lib/netatmoApi', () => ({
  default: {
    getHomeStatus: jest.fn(),
    setRoomThermpoint: jest.fn(),
  },
  getHomeStatus: jest.fn(),
  setRoomThermpoint: jest.fn(),
}));

// Mock Token Helper
jest.mock('@/lib/netatmoTokenHelper', () => ({
  getValidAccessToken: jest.fn(),
}));

import { adminDbGet, adminDbSet, adminDbUpdate } from '@/lib/firebaseAdmin';
import NETATMO_API from '@/lib/netatmoApi';
import { getValidAccessToken } from '@/lib/netatmoTokenHelper';

describe('netatmoStoveSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStoveSyncConfig', () => {
    it('should return config from Firebase', async () => {
      const mockConfig = {
        enabled: true,
        livingRoomId: 'room-123',
        livingRoomName: 'Salotto',
        stoveTemperature: 16,
        stoveMode: false,
      };

      adminDbGet.mockResolvedValue(mockConfig);

      const result = await getStoveSyncConfig();

      expect(adminDbGet).toHaveBeenCalledWith('netatmo/stoveSync');
      expect(result).toEqual(mockConfig);
    });

    it('should return default config when Firebase returns null', async () => {
      adminDbGet.mockResolvedValue(null);

      const result = await getStoveSyncConfig();

      expect(result).toEqual({
        enabled: false,
        livingRoomId: null,
        livingRoomName: null,
        stoveTemperature: 16,
        stoveMode: false,
        originalSetpoint: null,
        lastSyncAt: null,
        lastSyncAction: null,
      });
    });
  });

  describe('enableStoveSync', () => {
    it('should save config to Firebase', async () => {
      adminDbSet.mockResolvedValue();

      await enableStoveSync('room-123', 'Salotto', 17);

      expect(adminDbSet).toHaveBeenCalledWith('netatmo/stoveSync', expect.objectContaining({
        enabled: true,
        livingRoomId: 'room-123',
        livingRoomName: 'Salotto',
        stoveTemperature: 17,
        stoveMode: false,
        lastSyncAction: 'enabled',
      }));
    });

    it('should use default temperature (16) when not specified', async () => {
      adminDbSet.mockResolvedValue();

      await enableStoveSync('room-123', 'Salotto');

      expect(adminDbSet).toHaveBeenCalledWith('netatmo/stoveSync', expect.objectContaining({
        stoveTemperature: 16,
      }));
    });
  });

  describe('disableStoveSync', () => {
    it('should update config to disabled', async () => {
      adminDbGet.mockResolvedValue({
        enabled: true,
        livingRoomId: 'room-123',
        stoveMode: false,
      });
      adminDbUpdate.mockResolvedValue();

      await disableStoveSync();

      expect(adminDbUpdate).toHaveBeenCalledWith('netatmo/stoveSync', expect.objectContaining({
        enabled: false,
        stoveMode: false,
        lastSyncAction: 'disabled',
      }));
    });
  });

  describe('syncLivingRoomWithStove', () => {
    it('should return disabled when sync is not enabled', async () => {
      adminDbGet.mockResolvedValue({
        enabled: false,
        livingRoomId: 'room-123',
      });

      const result = await syncLivingRoomWithStove(true);

      expect(result).toEqual({
        synced: false,
        reason: 'disabled',
        message: 'Stove sync is not enabled',
      });
    });

    it('should return not_configured when living room is not set', async () => {
      adminDbGet.mockResolvedValue({
        enabled: true,
        livingRoomId: null,
      });

      const result = await syncLivingRoomWithStove(true);

      expect(result).toEqual({
        synced: false,
        reason: 'not_configured',
        message: 'Living room ID not configured',
      });
    });

    it('should return no_change when stove state matches current mode', async () => {
      adminDbGet.mockResolvedValue({
        enabled: true,
        livingRoomId: 'room-123',
        stoveMode: true, // Already in stove mode
      });

      const result = await syncLivingRoomWithStove(true); // Stove is on

      expect(result).toEqual({
        synced: false,
        reason: 'no_change',
        message: 'Stove mode already active',
      });
    });

    it('should set room to stove temperature when stove turns ON', async () => {
      // First call: getStoveSyncConfig
      adminDbGet.mockResolvedValueOnce({
        enabled: true,
        livingRoomId: 'room-123',
        livingRoomName: 'Salotto',
        stoveTemperature: 16,
        stoveMode: false,
      });
      // Second call: home_id
      adminDbGet.mockResolvedValueOnce('home-456');

      getValidAccessToken.mockResolvedValue({ accessToken: 'valid-token' });

      NETATMO_API.getHomeStatus.mockResolvedValue({
        rooms: [{ id: 'room-123', therm_setpoint_temperature: 20 }],
      });
      NETATMO_API.setRoomThermpoint.mockResolvedValue(true);
      adminDbUpdate.mockResolvedValue();

      const result = await syncLivingRoomWithStove(true);

      expect(result.synced).toBe(true);
      expect(result.action).toBe('stove_on');
      expect(result.temperature).toBe(16);

      expect(NETATMO_API.setRoomThermpoint).toHaveBeenCalledWith(
        'valid-token',
        expect.objectContaining({
          home_id: 'home-456',
          room_id: 'room-123',
          mode: 'manual',
          temp: 16,
        })
      );
    });

    it('should return room to schedule when stove turns OFF', async () => {
      // First call: getStoveSyncConfig (for sync check)
      adminDbGet.mockResolvedValueOnce({
        enabled: true,
        livingRoomId: 'room-123',
        livingRoomName: 'Salotto',
        stoveTemperature: 16,
        stoveMode: true, // Currently in stove mode
      });
      // Second call: home_id
      adminDbGet.mockResolvedValueOnce('home-456');
      // Third call: getStoveSyncConfig (in setLivingRoomToSchedule)
      adminDbGet.mockResolvedValueOnce({
        enabled: true,
        livingRoomId: 'room-123',
        livingRoomName: 'Salotto',
        stoveTemperature: 16,
        stoveMode: true,
      });

      getValidAccessToken.mockResolvedValue({ accessToken: 'valid-token' });
      NETATMO_API.setRoomThermpoint.mockResolvedValue(true);
      adminDbUpdate.mockResolvedValue();

      const result = await syncLivingRoomWithStove(false);

      expect(result.synced).toBe(true);
      expect(result.action).toBe('stove_off');

      expect(NETATMO_API.setRoomThermpoint).toHaveBeenCalledWith(
        'valid-token',
        expect.objectContaining({
          home_id: 'home-456',
          room_id: 'room-123',
          mode: 'home',
        })
      );
    });

    it('should handle auth error', async () => {
      adminDbGet.mockResolvedValueOnce({
        enabled: true,
        livingRoomId: 'room-123',
        livingRoomName: 'Salotto',
        stoveTemperature: 16,
        stoveMode: false,
      });

      getValidAccessToken.mockResolvedValue({ error: 'token_expired' });

      const result = await syncLivingRoomWithStove(true);

      expect(result.synced).toBe(false);
      expect(result.reason).toBe('auth_error');
    });
  });

  describe('checkStoveSyncOnStatusChange', () => {
    beforeEach(() => {
      // Default: sync enabled and not in stove mode
      adminDbGet.mockResolvedValue({
        enabled: true,
        livingRoomId: 'room-123',
        livingRoomName: 'Salotto',
        stoveTemperature: 16,
        stoveMode: false,
      });
    });

    it('should sync when stove changes from OFF to ON', async () => {
      adminDbGet.mockResolvedValueOnce({
        enabled: true,
        livingRoomId: 'room-123',
        livingRoomName: 'Salotto',
        stoveTemperature: 16,
        stoveMode: false,
      });
      adminDbGet.mockResolvedValueOnce('home-456');

      getValidAccessToken.mockResolvedValue({ accessToken: 'valid-token' });
      NETATMO_API.getHomeStatus.mockResolvedValue({
        rooms: [{ id: 'room-123', therm_setpoint_temperature: 20 }],
      });
      NETATMO_API.setRoomThermpoint.mockResolvedValue(true);
      adminDbUpdate.mockResolvedValue();

      const result = await checkStoveSyncOnStatusChange('WORK', 'STANDBY');

      expect(result.synced).toBe(true);
      expect(result.action).toBe('stove_on');
    });

    it('should sync when stove changes from ON to OFF', async () => {
      adminDbGet.mockResolvedValueOnce({
        enabled: true,
        livingRoomId: 'room-123',
        livingRoomName: 'Salotto',
        stoveTemperature: 16,
        stoveMode: true, // Was in stove mode
      });
      adminDbGet.mockResolvedValueOnce('home-456');
      adminDbGet.mockResolvedValueOnce({
        enabled: true,
        livingRoomId: 'room-123',
        livingRoomName: 'Salotto',
      });

      getValidAccessToken.mockResolvedValue({ accessToken: 'valid-token' });
      NETATMO_API.setRoomThermpoint.mockResolvedValue(true);
      adminDbUpdate.mockResolvedValue();

      const result = await checkStoveSyncOnStatusChange('STANDBY', 'WORK');

      expect(result.synced).toBe(true);
      expect(result.action).toBe('stove_off');
    });

    it('should not sync when status did not change', async () => {
      const result = await checkStoveSyncOnStatusChange('WORK', 'WORK');

      expect(result).toEqual({
        synced: false,
        reason: 'no_state_change',
      });
    });

    it('should detect WORK status including partial matches', async () => {
      adminDbGet.mockResolvedValueOnce({
        enabled: true,
        livingRoomId: 'room-123',
        livingRoomName: 'Salotto',
        stoveTemperature: 16,
        stoveMode: false,
      });
      adminDbGet.mockResolvedValueOnce('home-456');

      getValidAccessToken.mockResolvedValue({ accessToken: 'valid-token' });
      NETATMO_API.getHomeStatus.mockResolvedValue({
        rooms: [{ id: 'room-123', therm_setpoint_temperature: 20 }],
      });
      NETATMO_API.setRoomThermpoint.mockResolvedValue(true);
      adminDbUpdate.mockResolvedValue();

      // Test with status description containing WORK
      const result = await checkStoveSyncOnStatusChange('WORK_MODULATION', 'STANDBY');

      expect(result.synced).toBe(true);
    });
  });

  describe('enforceStoveSyncSetpoints', () => {
    it('should return disabled when sync is not enabled', async () => {
      adminDbGet.mockResolvedValue({ enabled: false, rooms: [] });

      const result = await enforceStoveSyncSetpoints(true);

      expect(result.enforced).toBe(false);
      expect(result.reason).toBe('disabled_or_not_configured');
    });

    it('should trigger full sync when stoveMode does not match stove state', async () => {
      // Clear all mocks to ensure clean state
      jest.clearAllMocks();

      // stove is ON but stoveMode is false -> need full sync
      adminDbGet.mockImplementation((path) => {
        if (path.includes('stoveSync')) {
          return Promise.resolve({
            enabled: true,
            rooms: [{ id: 'room-123', name: 'Salotto' }],
            stoveTemperature: 16,
            stoveMode: false, // mismatched with stoveIsOn=true!
          });
        }
        if (path.includes('home_id')) {
          return Promise.resolve('home-456');
        }
        return Promise.resolve(null);
      });

      getValidAccessToken.mockResolvedValue({ accessToken: 'valid-token' });
      NETATMO_API.getHomeStatus.mockResolvedValue({
        rooms: [{ id: 'room-123', therm_setpoint_temperature: 20 }],
      });
      NETATMO_API.setRoomThermpoint.mockResolvedValue(true);
      adminDbUpdate.mockResolvedValue();

      const result = await enforceStoveSyncSetpoints(true);

      expect(result.synced).toBe(true);
      expect(result.action).toBe('stove_on');
    });

    it('should re-apply setpoints when current setpoint has drifted', async () => {
      // Clear all mocks to ensure clean state
      jest.clearAllMocks();

      adminDbGet.mockImplementation((path) => {
        if (path.includes('stoveSync')) {
          return Promise.resolve({
            enabled: true,
            rooms: [{ id: 'room-123', name: 'Salotto' }],
            stoveTemperature: 16,
            stoveMode: true,
          });
        }
        if (path.includes('home_id')) {
          return Promise.resolve('home-456');
        }
        return Promise.resolve(null);
      });

      getValidAccessToken.mockResolvedValue({ accessToken: 'valid-token' });
      NETATMO_API.getHomeStatus.mockResolvedValue({
        rooms: [{ id: 'room-123', therm_setpoint_temperature: 20 }], // drifted from 16!
      });
      NETATMO_API.setRoomThermpoint.mockResolvedValue(true);
      adminDbUpdate.mockResolvedValue();

      const result = await enforceStoveSyncSetpoints(true);

      expect(result.enforced).toBe(true);
      expect(result.action).toBe('setpoint_enforcement');
      expect(result.fixedCount).toBe(1);
      expect(NETATMO_API.setRoomThermpoint).toHaveBeenCalledWith(
        'valid-token',
        expect.objectContaining({
          home_id: 'home-456',
          room_id: 'room-123',
          mode: 'manual',
          temp: 16,
        })
      );
    });

    it('should re-apply setpoints when room setpoint is undefined (not found in Netatmo response)', async () => {
      adminDbGet.mockResolvedValueOnce({
        enabled: true,
        rooms: [{ id: 'room-123', name: 'Salotto' }],
        stoveTemperature: 16,
        stoveMode: true,
      });
      adminDbGet.mockResolvedValueOnce('home-456');

      getValidAccessToken.mockResolvedValue({ accessToken: 'valid-token' });
      // Room not found in Netatmo response
      NETATMO_API.getHomeStatus.mockResolvedValue({
        rooms: [{ id: 'other-room', therm_setpoint_temperature: 20 }],
      });
      NETATMO_API.setRoomThermpoint.mockResolvedValue(true);
      adminDbUpdate.mockResolvedValue();

      const result = await enforceStoveSyncSetpoints(true);

      // Should re-apply because we can't verify the setpoint
      expect(result.enforced).toBe(true);
      expect(result.action).toBe('setpoint_enforcement');
      expect(result.fixedCount).toBe(1);
    });

    it('should not re-apply when setpoint is correct (within tolerance)', async () => {
      adminDbGet.mockResolvedValueOnce({
        enabled: true,
        rooms: [{ id: 'room-123', name: 'Salotto' }],
        stoveTemperature: 16,
        stoveMode: true,
      });
      adminDbGet.mockResolvedValueOnce('home-456');

      getValidAccessToken.mockResolvedValue({ accessToken: 'valid-token' });
      NETATMO_API.getHomeStatus.mockResolvedValue({
        rooms: [{ id: 'room-123', therm_setpoint_temperature: 16.3 }], // within 0.5° tolerance
      });

      const result = await enforceStoveSyncSetpoints(true);

      expect(result.enforced).toBe(false);
      expect(result.reason).toBe('setpoints_correct');
      expect(NETATMO_API.setRoomThermpoint).not.toHaveBeenCalled();
    });
  });

  describe('setRoomsToBoostMode', () => {
    it('should apply boost correctly (20°C + 2°C = 22°C)', async () => {
      NETATMO_API.getHomeStatus.mockResolvedValue({
        rooms: [{ id: 'room-123', therm_setpoint_temperature: 20 }],
      });
      NETATMO_API.setRoomThermpoint.mockResolvedValue(true);

      const config = {
        homeId: 'home-456',
        rooms: [{ id: 'room-123', name: 'Salotto' }],
        accessToken: 'valid-token',
      };

      const result = await setRoomsToBoostMode(config, 2, {});

      expect(result.success).toBe(true);
      expect(result.appliedSetpoints['room-123']).toEqual({
        roomName: 'Salotto',
        previous: 20,
        applied: 22,
        capped: false,
      });
      expect(result.previousSetpoints['room-123']).toBe(20);
      expect(result.cappedRooms).toEqual([]);
    });

    it('should cap at 30°C when boost would exceed (29°C + 2°C = 30°C not 31°C)', async () => {
      NETATMO_API.getHomeStatus.mockResolvedValue({
        rooms: [{ id: 'room-123', therm_setpoint_temperature: 29 }],
      });
      NETATMO_API.setRoomThermpoint.mockResolvedValue(true);

      const config = {
        homeId: 'home-456',
        rooms: [{ id: 'room-123', name: 'Salotto' }],
        accessToken: 'valid-token',
      };

      const result = await setRoomsToBoostMode(config, 2, {});

      expect(result.success).toBe(true);
      expect(result.appliedSetpoints['room-123']).toEqual({
        roomName: 'Salotto',
        previous: 29,
        applied: 30,
        capped: true,
      });
      expect(result.cappedRooms).toEqual(['Salotto']);
    });

    it('should store previous setpoints correctly', async () => {
      NETATMO_API.getHomeStatus.mockResolvedValue({
        rooms: [{ id: 'room-123', therm_setpoint_temperature: 21 }],
      });
      NETATMO_API.setRoomThermpoint.mockResolvedValue(true);

      const config = {
        homeId: 'home-456',
        rooms: [{ id: 'room-123', name: 'Salotto' }],
        accessToken: 'valid-token',
      };

      const result = await setRoomsToBoostMode(config, 2, {});

      expect(result.previousSetpoints['room-123']).toBe(21);
    });

    it('should not overwrite existing previousSetpoints entry', async () => {
      NETATMO_API.getHomeStatus.mockResolvedValue({
        rooms: [{ id: 'room-123', therm_setpoint_temperature: 21 }],
      });
      NETATMO_API.setRoomThermpoint.mockResolvedValue(true);

      const config = {
        homeId: 'home-456',
        rooms: [{ id: 'room-123', name: 'Salotto' }],
        accessToken: 'valid-token',
      };

      const existingPrevious = { 'room-123': 19 };
      const result = await setRoomsToBoostMode(config, 2, existingPrevious);

      // Should keep original previous setpoint (19), not overwrite with current (21)
      expect(result.previousSetpoints['room-123']).toBe(19);
    });

    it('should handle multiple rooms correctly', async () => {
      NETATMO_API.getHomeStatus.mockResolvedValue({
        rooms: [
          { id: 'room-123', therm_setpoint_temperature: 20 },
          { id: 'room-456', therm_setpoint_temperature: 22 },
          { id: 'room-789', therm_setpoint_temperature: 18 },
        ],
      });
      NETATMO_API.setRoomThermpoint.mockResolvedValue(true);

      const config = {
        homeId: 'home-456',
        rooms: [
          { id: 'room-123', name: 'Salotto' },
          { id: 'room-456', name: 'Camera' },
          { id: 'room-789', name: 'Studio' },
        ],
        accessToken: 'valid-token',
      };

      const result = await setRoomsToBoostMode(config, 2, {});

      expect(result.success).toBe(true);
      expect(Object.keys(result.appliedSetpoints)).toHaveLength(3);
      expect(result.appliedSetpoints['room-123'].applied).toBe(22);
      expect(result.appliedSetpoints['room-456'].applied).toBe(24);
      expect(result.appliedSetpoints['room-789'].applied).toBe(20);
    });

    it('should return capped flag for rooms hitting limit', async () => {
      NETATMO_API.getHomeStatus.mockResolvedValue({
        rooms: [
          { id: 'room-123', therm_setpoint_temperature: 29 },
          { id: 'room-456', therm_setpoint_temperature: 20 },
        ],
      });
      NETATMO_API.setRoomThermpoint.mockResolvedValue(true);

      const config = {
        homeId: 'home-456',
        rooms: [
          { id: 'room-123', name: 'Salotto' },
          { id: 'room-456', name: 'Camera' },
        ],
        accessToken: 'valid-token',
      };

      const result = await setRoomsToBoostMode(config, 2, {});

      expect(result.appliedSetpoints['room-123'].capped).toBe(true);
      expect(result.appliedSetpoints['room-456'].capped).toBe(false);
    });

    it('should return cappedRooms array with room names', async () => {
      NETATMO_API.getHomeStatus.mockResolvedValue({
        rooms: [
          { id: 'room-123', therm_setpoint_temperature: 28.5 },
          { id: 'room-456', therm_setpoint_temperature: 29 },
        ],
      });
      NETATMO_API.setRoomThermpoint.mockResolvedValue(true);

      const config = {
        homeId: 'home-456',
        rooms: [
          { id: 'room-123', name: 'Salotto' },
          { id: 'room-456', name: 'Camera' },
        ],
        accessToken: 'valid-token',
      };

      const result = await setRoomsToBoostMode(config, 2, {});

      expect(result.cappedRooms).toContain('Salotto');
      expect(result.cappedRooms).toContain('Camera');
      expect(result.cappedRooms).toHaveLength(2);
    });

    it('should handle API errors gracefully (per-room failure does not block others)', async () => {
      NETATMO_API.getHomeStatus.mockResolvedValue({
        rooms: [
          { id: 'room-123', therm_setpoint_temperature: 20 },
          { id: 'room-456', therm_setpoint_temperature: 21 },
          { id: 'room-789', therm_setpoint_temperature: 19 },
        ],
      });

      // Middle room fails
      NETATMO_API.setRoomThermpoint.mockImplementation((token, params) => {
        if (params.room_id === 'room-456') {
          return Promise.resolve(false); // API returns false
        }
        return Promise.resolve(true);
      });

      const config = {
        homeId: 'home-456',
        rooms: [
          { id: 'room-123', name: 'Salotto' },
          { id: 'room-456', name: 'Camera' },
          { id: 'room-789', name: 'Studio' },
        ],
        accessToken: 'valid-token',
      };

      const result = await setRoomsToBoostMode(config, 2, {});

      expect(result.success).toBe(true); // Some succeeded
      expect(result.appliedSetpoints['room-123']).toBeDefined();
      expect(result.appliedSetpoints['room-456']).toBeUndefined(); // Failed room not in results
      expect(result.appliedSetpoints['room-789']).toBeDefined();
    });
  });

  describe('restoreRoomSetpoints', () => {
    it('should restore to previous setpoint when available', async () => {
      NETATMO_API.setRoomThermpoint.mockResolvedValue(true);

      const config = {
        homeId: 'home-456',
        rooms: [{ id: 'room-123', name: 'Salotto' }],
        accessToken: 'valid-token',
      };

      const previousSetpoints = { 'room-123': 20 };
      const result = await restoreRoomSetpoints(config, previousSetpoints);

      expect(result.success).toBe(true);
      expect(result.restoredRooms).toHaveLength(1);
      expect(result.restoredRooms[0]).toEqual({
        roomId: 'room-123',
        roomName: 'Salotto',
        restoredTo: 20,
        hadPrevious: true,
      });

      expect(NETATMO_API.setRoomThermpoint).toHaveBeenCalledWith(
        'valid-token',
        expect.objectContaining({
          home_id: 'home-456',
          room_id: 'room-123',
          mode: 'manual',
          temp: 20,
        })
      );
    });

    it('should return to schedule (home mode) when no previous setpoint', async () => {
      NETATMO_API.setRoomThermpoint.mockResolvedValue(true);

      const config = {
        homeId: 'home-456',
        rooms: [{ id: 'room-123', name: 'Salotto' }],
        accessToken: 'valid-token',
      };

      const result = await restoreRoomSetpoints(config, {});

      expect(result.success).toBe(true);
      expect(result.restoredRooms).toHaveLength(1);
      expect(result.restoredRooms[0]).toEqual({
        roomId: 'room-123',
        roomName: 'Salotto',
        restoredTo: 'schedule',
        hadPrevious: false,
      });

      expect(NETATMO_API.setRoomThermpoint).toHaveBeenCalledWith(
        'valid-token',
        expect.objectContaining({
          home_id: 'home-456',
          room_id: 'room-123',
          mode: 'home',
        })
      );
    });

    it('should handle mixed scenarios (some rooms have previous, some do not)', async () => {
      NETATMO_API.setRoomThermpoint.mockResolvedValue(true);

      const config = {
        homeId: 'home-456',
        rooms: [
          { id: 'room-123', name: 'Salotto' },
          { id: 'room-456', name: 'Camera' },
        ],
        accessToken: 'valid-token',
      };

      const previousSetpoints = { 'room-123': 21 }; // Only room-123 has previous
      const result = await restoreRoomSetpoints(config, previousSetpoints);

      expect(result.success).toBe(true);
      expect(result.restoredRooms).toHaveLength(2);
      expect(result.restoredRooms[0]).toMatchObject({
        roomId: 'room-123',
        restoredTo: 21,
        hadPrevious: true,
      });
      expect(result.restoredRooms[1]).toMatchObject({
        roomId: 'room-456',
        restoredTo: 'schedule',
        hadPrevious: false,
      });
    });

    it('should handle multiple rooms correctly', async () => {
      NETATMO_API.setRoomThermpoint.mockResolvedValue(true);

      const config = {
        homeId: 'home-456',
        rooms: [
          { id: 'room-123', name: 'Salotto' },
          { id: 'room-456', name: 'Camera' },
          { id: 'room-789', name: 'Studio' },
        ],
        accessToken: 'valid-token',
      };

      const previousSetpoints = {
        'room-123': 20,
        'room-456': 22,
        'room-789': 19,
      };
      const result = await restoreRoomSetpoints(config, previousSetpoints);

      expect(result.success).toBe(true);
      expect(result.restoredRooms).toHaveLength(3);
      expect(NETATMO_API.setRoomThermpoint).toHaveBeenCalledTimes(3);
    });

    it('should handle API errors gracefully (per-room failure does not block others)', async () => {
      // First room fails, second succeeds
      NETATMO_API.setRoomThermpoint.mockImplementation((token, params) => {
        if (params.room_id === 'room-123') {
          return Promise.resolve(false); // Fail
        }
        return Promise.resolve(true); // Succeed
      });

      const config = {
        homeId: 'home-456',
        rooms: [
          { id: 'room-123', name: 'Salotto' },
          { id: 'room-456', name: 'Camera' },
        ],
        accessToken: 'valid-token',
      };

      const previousSetpoints = { 'room-123': 20, 'room-456': 22 };
      const result = await restoreRoomSetpoints(config, previousSetpoints);

      expect(result.success).toBe(true); // At least one succeeded
      expect(result.restoredRooms).toHaveLength(1); // Only successful room
      expect(result.restoredRooms[0].roomId).toBe('room-456');
    });

    it('should use Promise.allSettled pattern for graceful degradation', async () => {
      NETATMO_API.setRoomThermpoint.mockResolvedValue(true);

      const config = {
        homeId: 'home-456',
        rooms: [
          { id: 'room-123', name: 'Salotto' },
          { id: 'room-456', name: 'Camera' },
        ],
        accessToken: 'valid-token',
      };

      const previousSetpoints = { 'room-123': 20, 'room-456': 22 };
      const result = await restoreRoomSetpoints(config, previousSetpoints);

      // If one room fails, others should still process
      expect(result.success).toBe(true);
      expect(result.restoredRooms.length).toBeGreaterThan(0);
    });
  });

  describe('Multi-Zone Coordination Edge Cases', () => {
    it('should apply boost to multiple zones independently', async () => {
      NETATMO_API.getHomeStatus.mockResolvedValue({
        rooms: [
          { id: 'room-123', therm_setpoint_temperature: 19 },
          { id: 'room-456', therm_setpoint_temperature: 20 },
          { id: 'room-789', therm_setpoint_temperature: 21 },
        ],
      });
      NETATMO_API.setRoomThermpoint.mockResolvedValue(true);

      const config = {
        homeId: 'home-456',
        rooms: [
          { id: 'room-123', name: 'Salotto' },
          { id: 'room-456', name: 'Camera' },
          { id: 'room-789', name: 'Studio' },
        ],
        accessToken: 'valid-token',
      };

      const result = await setRoomsToBoostMode(config, 2, {});

      expect(result.success).toBe(true);
      expect(result.appliedSetpoints['room-123'].applied).toBe(21);
      expect(result.appliedSetpoints['room-456'].applied).toBe(22);
      expect(result.appliedSetpoints['room-789'].applied).toBe(23);
    });

    it('should handle partial zone failure gracefully', async () => {
      NETATMO_API.getHomeStatus.mockResolvedValue({
        rooms: [
          { id: 'room-123', therm_setpoint_temperature: 20 },
          { id: 'room-456', therm_setpoint_temperature: 21 },
          { id: 'room-789', therm_setpoint_temperature: 19 },
        ],
      });

      // Middle room API call fails
      NETATMO_API.setRoomThermpoint.mockImplementation((token, params) => {
        if (params.room_id === 'room-456') {
          return Promise.resolve(false);
        }
        return Promise.resolve(true);
      });

      const config = {
        homeId: 'home-456',
        rooms: [
          { id: 'room-123', name: 'Salotto' },
          { id: 'room-456', name: 'Camera' },
          { id: 'room-789', name: 'Studio' },
        ],
        accessToken: 'valid-token',
      };

      const result = await setRoomsToBoostMode(config, 2, {});

      expect(result.success).toBe(true); // Others succeeded
      expect(result.appliedSetpoints['room-123']).toBeDefined();
      expect(result.appliedSetpoints['room-456']).toBeUndefined(); // Failed
      expect(result.appliedSetpoints['room-789']).toBeDefined();
    });

    it('should respect per-zone boost configuration', async () => {
      NETATMO_API.getHomeStatus.mockResolvedValue({
        rooms: [
          { id: 'room-123', therm_setpoint_temperature: 20 },
          { id: 'room-456', therm_setpoint_temperature: 20 },
          { id: 'room-789', therm_setpoint_temperature: 20 },
        ],
      });
      NETATMO_API.setRoomThermpoint.mockResolvedValue(true);

      // Apply different boost to each room
      const config1 = {
        homeId: 'home-456',
        rooms: [{ id: 'room-123', name: 'Salotto' }],
        accessToken: 'valid-token',
      };
      const result1 = await setRoomsToBoostMode(config1, 2, {});

      const config2 = {
        homeId: 'home-456',
        rooms: [{ id: 'room-456', name: 'Camera' }],
        accessToken: 'valid-token',
      };
      const result2 = await setRoomsToBoostMode(config2, 3, {});

      const config3 = {
        homeId: 'home-456',
        rooms: [{ id: 'room-789', name: 'Studio' }],
        accessToken: 'valid-token',
      };
      const result3 = await setRoomsToBoostMode(config3, 1.5, {});

      expect(result1.appliedSetpoints['room-123'].applied).toBe(22);
      expect(result2.appliedSetpoints['room-456'].applied).toBe(23);
      expect(result3.appliedSetpoints['room-789'].applied).toBe(21.5);
    });

    it('should restore multiple zones correctly', async () => {
      NETATMO_API.setRoomThermpoint.mockResolvedValue(true);

      const config = {
        homeId: 'home-456',
        rooms: [
          { id: 'room-123', name: 'Salotto' },
          { id: 'room-456', name: 'Camera' },
          { id: 'room-789', name: 'Studio' },
        ],
        accessToken: 'valid-token',
      };

      const previousSetpoints = {
        'room-123': 19,
        'room-456': 21,
        // room-789 has no previous (will return to schedule)
      };

      const result = await restoreRoomSetpoints(config, previousSetpoints);

      expect(result.success).toBe(true);
      expect(result.restoredRooms).toHaveLength(3);
      expect(result.restoredRooms[0]).toMatchObject({
        roomId: 'room-123',
        restoredTo: 19,
        hadPrevious: true,
      });
      expect(result.restoredRooms[1]).toMatchObject({
        roomId: 'room-456',
        restoredTo: 21,
        hadPrevious: true,
      });
      expect(result.restoredRooms[2]).toMatchObject({
        roomId: 'room-789',
        restoredTo: 'schedule',
        hadPrevious: false,
      });
    });

    it('should handle all zones at 30°C cap', async () => {
      NETATMO_API.getHomeStatus.mockResolvedValue({
        rooms: [
          { id: 'room-123', therm_setpoint_temperature: 29 },
          { id: 'room-456', therm_setpoint_temperature: 29 },
          { id: 'room-789', therm_setpoint_temperature: 29 },
        ],
      });
      NETATMO_API.setRoomThermpoint.mockResolvedValue(true);

      const config = {
        homeId: 'home-456',
        rooms: [
          { id: 'room-123', name: 'Salotto' },
          { id: 'room-456', name: 'Camera' },
          { id: 'room-789', name: 'Studio' },
        ],
        accessToken: 'valid-token',
      };

      const result = await setRoomsToBoostMode(config, 2, {});

      expect(result.success).toBe(true);
      expect(result.appliedSetpoints['room-123'].applied).toBe(30);
      expect(result.appliedSetpoints['room-456'].applied).toBe(30);
      expect(result.appliedSetpoints['room-789'].applied).toBe(30);
      expect(result.appliedSetpoints['room-123'].capped).toBe(true);
      expect(result.appliedSetpoints['room-456'].capped).toBe(true);
      expect(result.appliedSetpoints['room-789'].capped).toBe(true);
      expect(result.cappedRooms).toEqual(['Salotto', 'Camera', 'Studio']);
    });
  });
});
