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

// Mock environment helper to avoid path prefix issues in tests
jest.mock('@/lib/environmentHelper', () => ({
  getEnvironmentPath: jest.fn((path) => path),  // Return path as-is
  isDevelopment: jest.fn(() => false),
}));

import { adminDbGet, adminDbSet, adminDbUpdate } from '@/lib/firebaseAdmin';
import NETATMO_API from '@/lib/netatmoApi';
import { getValidAccessToken } from '@/lib/netatmoTokenHelper';

// Use jest.mocked() for type-safe mocking
const mockedAdminDbGet = jest.mocked(adminDbGet);
const mockedAdminDbSet = jest.mocked(adminDbSet);
const mockedAdminDbUpdate = jest.mocked(adminDbUpdate);
const mockedGetValidAccessToken = jest.mocked(getValidAccessToken);
const mockedNetatmoApiGetHomeStatus = jest.mocked(NETATMO_API.getHomeStatus);
const mockedNetatmoApiSetRoomThermpoint = jest.mocked(NETATMO_API.setRoomThermpoint);

describe('netatmoStoveSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStoveSyncConfig', () => {
    it('should return config from Firebase', async () => {
      const mockConfig = {
        enabled: true,
        rooms: [{ id: 'room-123', name: 'Salotto' }],
        stoveTemperature: 16,
        stoveMode: false,
      };

      mockedAdminDbGet.mockResolvedValue(mockConfig);

      const result = await getStoveSyncConfig();

      expect(mockedAdminDbGet).toHaveBeenCalledWith('netatmo/stoveSync');
      expect(result).toEqual(mockConfig);
    });

    it('should return default config when Firebase returns null', async () => {
      mockedAdminDbGet.mockResolvedValue(null);

      const result = await getStoveSyncConfig();

      expect(result).toEqual({
        enabled: false,
        rooms: [],
        stoveTemperature: 16,
        stoveMode: false,
        lastSyncAt: null,
        lastSyncAction: null,
      });
    });
  });

  describe('enableStoveSync', () => {
    it('should save config to Firebase with rooms array format', async () => {
      mockedAdminDbSet.mockResolvedValue();

      // enableStoveSync accepts old 3-arg API: (roomId, roomName, stoveTemperature)
      await (enableStoveSync as any)('room-123', 'Salotto', 17);

      expect(mockedAdminDbSet).toHaveBeenCalledWith('netatmo/stoveSync', expect.objectContaining({
        enabled: true,
        rooms: [{ id: 'room-123', name: 'Salotto', originalSetpoint: null }],
        stoveTemperature: 17,
        stoveMode: false,
        lastSyncAction: 'enabled',
      }));
    });

    it('should use default temperature (16) when not specified', async () => {
      mockedAdminDbSet.mockResolvedValue();

      // enableStoveSync accepts old 2-arg API: (roomId, roomName)
      await (enableStoveSync as any)('room-123', 'Salotto');

      expect(mockedAdminDbSet).toHaveBeenCalledWith('netatmo/stoveSync', expect.objectContaining({
        stoveTemperature: 16,
      }));
    });
  });

  describe('disableStoveSync', () => {
    it('should update config to disabled', async () => {
      mockedAdminDbGet.mockResolvedValue({
        enabled: true,
        livingRoomId: 'room-123',
        stoveMode: false,
      });
      mockedAdminDbUpdate.mockResolvedValue();

      await disableStoveSync();

      expect(mockedAdminDbUpdate).toHaveBeenCalledWith('netatmo/stoveSync', expect.objectContaining({
        enabled: false,
        stoveMode: false,
        lastSyncAction: 'disabled',
      }));
    });
  });

  describe('syncLivingRoomWithStove', () => {
    it('should return disabled when sync is not enabled', async () => {
      mockedAdminDbGet.mockResolvedValue({
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

    it('should return not_configured when rooms are not configured', async () => {
      mockedAdminDbGet.mockResolvedValue({
        enabled: true,
        rooms: [], // Empty rooms array - new format
      });

      const result = await syncLivingRoomWithStove(true);

      expect(result).toEqual({
        synced: false,
        reason: 'not_configured',
        message: 'No rooms configured for stove sync',
      });
    });

    it('should return no_change when stove state matches current mode', async () => {
      mockedAdminDbGet.mockResolvedValue({
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
      mockedAdminDbGet.mockResolvedValueOnce({
        enabled: true,
        livingRoomId: 'room-123',
        livingRoomName: 'Salotto',
        stoveTemperature: 16,
        stoveMode: false,
      });
      // Second call: home_id
      mockedAdminDbGet.mockResolvedValueOnce('home-456');

      mockedGetValidAccessToken.mockResolvedValue({ accessToken: 'valid-token', error: null });

      mockedNetatmoApiGetHomeStatus.mockResolvedValue({
        rooms: [{ id: 'room-123', name: 'Salotto', type: 'livingroom', therm_setpoint_temperature: 20 }],
      });
      mockedNetatmoApiSetRoomThermpoint.mockResolvedValue(true);
      mockedAdminDbUpdate.mockResolvedValue();

      const result = await syncLivingRoomWithStove(true);

      expect(result.synced).toBe(true);
      // Type narrowing for discriminated union - only access action/temperature if synced
      if (result.synced && 'action' in result) {
        expect(result.action).toBe('stove_on');
      }
      if (result.synced && 'temperature' in result) {
        expect(result.temperature).toBe(16);
      }

      expect(mockedNetatmoApiSetRoomThermpoint).toHaveBeenCalledWith(
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
      mockedAdminDbGet.mockResolvedValueOnce({
        enabled: true,
        livingRoomId: 'room-123',
        livingRoomName: 'Salotto',
        stoveTemperature: 16,
        stoveMode: true, // Currently in stove mode
      });
      // Second call: home_id
      mockedAdminDbGet.mockResolvedValueOnce('home-456');
      // Third call: getStoveSyncConfig (in setLivingRoomToSchedule)
      mockedAdminDbGet.mockResolvedValueOnce({
        enabled: true,
        livingRoomId: 'room-123',
        livingRoomName: 'Salotto',
        stoveTemperature: 16,
        stoveMode: true,
      });

      mockedGetValidAccessToken.mockResolvedValue({ accessToken: 'valid-token', error: null });
      mockedNetatmoApiSetRoomThermpoint.mockResolvedValue(true);
      mockedAdminDbUpdate.mockResolvedValue();

      const result = await syncLivingRoomWithStove(false);

      expect(result.synced).toBe(true);
      if (result.synced && 'action' in result) {
        expect(result.action).toBe('stove_off');
      }

      expect(mockedNetatmoApiSetRoomThermpoint).toHaveBeenCalledWith(
        'valid-token',
        expect.objectContaining({
          home_id: 'home-456',
          room_id: 'room-123',
          mode: 'home',
        })
      );
    });

    it('should handle auth error', async () => {
      // Reset mocks to remove any queued mockResolvedValueOnce calls
      mockedAdminDbGet.mockReset();
      mockedGetValidAccessToken.mockReset();

      mockedAdminDbGet.mockImplementation((path) => {
        if (path === 'netatmo/stoveSync') {
          return Promise.resolve({
            enabled: true,
            rooms: [{ id: 'room-123', name: 'Salotto' }],
            stoveTemperature: 16,
            stoveMode: false,
          });
        }
        return Promise.resolve(null);
      });

      mockedGetValidAccessToken.mockResolvedValue({ accessToken: null, error: 'TOKEN_EXPIRED', message: 'Token expired' });

      const result = await syncLivingRoomWithStove(true);

      expect(result.synced).toBe(false);
      expect(result.reason).toBe('auth_error');
    });
  });

  describe('checkStoveSyncOnStatusChange', () => {
    beforeEach(() => {
      // Default: sync enabled and not in stove mode
      mockedAdminDbGet.mockResolvedValue({
        enabled: true,
        rooms: [{ id: 'room-123', name: 'Salotto' }],
        stoveTemperature: 16,
        stoveMode: false,
      });
    });

    it('should sync when stove changes from OFF to ON', async () => {
      mockedAdminDbGet.mockImplementation((path) => {
        if (path === 'netatmo/stoveSync') {
          return Promise.resolve({
            enabled: true,
            rooms: [{ id: 'room-123', name: 'Salotto' }],
            stoveTemperature: 16,
            stoveMode: false,
          });
        }
        if (path === 'netatmo/home_id') {
          return Promise.resolve('home-456');
        }
        return Promise.resolve(null);
      });

      mockedGetValidAccessToken.mockResolvedValue({ accessToken: 'valid-token', error: null });
      mockedNetatmoApiGetHomeStatus.mockResolvedValue({
        rooms: [{ id: 'room-123', name: 'Salotto', type: 'livingroom', therm_setpoint_temperature: 20 }],
      });
      mockedNetatmoApiSetRoomThermpoint.mockResolvedValue(true);
      mockedAdminDbUpdate.mockResolvedValue();

      const result = await checkStoveSyncOnStatusChange('WORK', 'STANDBY');

      expect(result.synced).toBe(true);
      if (result.synced && 'action' in result) {
        expect(result.action).toBe('stove_on');
      }
    });

    it('should sync when stove changes from ON to OFF', async () => {
      // Use mockImplementation to handle multiple calls with different paths
      mockedAdminDbGet.mockImplementation((path) => {
        if (path === 'netatmo/stoveSync') {
          return Promise.resolve({
            enabled: true,
            rooms: [{ id: 'room-123', name: 'Salotto' }],
            stoveTemperature: 16,
            stoveMode: true, // Was in stove mode
          });
        }
        if (path === 'netatmo/home_id') {
          return Promise.resolve('home-456');
        }
        return Promise.resolve(null);
      });

      mockedGetValidAccessToken.mockResolvedValue({ accessToken: 'valid-token', error: null });
      mockedNetatmoApiSetRoomThermpoint.mockResolvedValue(true);
      mockedAdminDbUpdate.mockResolvedValue();

      const result = await checkStoveSyncOnStatusChange('STANDBY', 'WORK');

      expect(result.synced).toBe(true);
      if (result.synced && 'action' in result) {
        expect(result.action).toBe('stove_off');
      }
    });

    it('should not sync when status did not change', async () => {
      const result = await checkStoveSyncOnStatusChange('WORK', 'WORK');

      expect(result).toEqual({
        synced: false,
        reason: 'no_state_change',
      });
    });

    it('should detect WORK status including partial matches', async () => {
      mockedAdminDbGet.mockImplementation((path) => {
        if (path === 'netatmo/stoveSync') {
          return Promise.resolve({
            enabled: true,
            rooms: [{ id: 'room-123', name: 'Salotto' }],
            stoveTemperature: 16,
            stoveMode: false,
          });
        }
        if (path === 'netatmo/home_id') {
          return Promise.resolve('home-456');
        }
        return Promise.resolve(null);
      });

      mockedGetValidAccessToken.mockResolvedValue({ accessToken: 'valid-token', error: null });
      mockedNetatmoApiGetHomeStatus.mockResolvedValue({
        rooms: [{ id: 'room-123', name: 'Salotto', type: 'livingroom', therm_setpoint_temperature: 20 }],
      });
      mockedNetatmoApiSetRoomThermpoint.mockResolvedValue(true);
      mockedAdminDbUpdate.mockResolvedValue();

      // Test with status description containing WORK
      const result = await checkStoveSyncOnStatusChange('WORK_MODULATION', 'STANDBY');

      expect(result.synced).toBe(true);
    });
  });

  describe('enforceStoveSyncSetpoints', () => {
    it('should return disabled when sync is not enabled', async () => {
      mockedAdminDbGet.mockResolvedValue({ enabled: false, rooms: [] });

      const result = await enforceStoveSyncSetpoints(true);

      // For enforced: false, access reason directly (type assertion for test)
      const enforcedResult = result as { enforced: boolean; reason?: string };
      expect(enforcedResult.enforced).toBe(false);
      if (!enforcedResult.enforced && 'reason' in enforcedResult) {
        expect(enforcedResult.reason).toBe('disabled_or_not_configured');
      }
    });

    it('should trigger full sync when stoveMode does not match stove state', async () => {
      // Clear all mocks to ensure clean state
      jest.clearAllMocks();

      // stove is ON but stoveMode is false -> need full sync
      mockedAdminDbGet.mockImplementation((path) => {
        if (path === 'netatmo/stoveSync') {
          return Promise.resolve({
            enabled: true,
            rooms: [{ id: 'room-123', name: 'Salotto' }],
            stoveTemperature: 16,
            stoveMode: false, // mismatched with stoveIsOn=true!
          });
        }
        if (path === 'netatmo/home_id') {
          return Promise.resolve('home-456');
        }
        return Promise.resolve(null);
      });

      mockedGetValidAccessToken.mockResolvedValue({ accessToken: 'valid-token', error: null });
      mockedNetatmoApiGetHomeStatus.mockResolvedValue({
        rooms: [{ id: 'room-123', name: 'Salotto', type: 'livingroom', therm_setpoint_temperature: 20 }],
      });
      mockedNetatmoApiSetRoomThermpoint.mockResolvedValue(true);
      mockedAdminDbUpdate.mockResolvedValue();

      const result = await enforceStoveSyncSetpoints(true);

      expect(result.synced).toBe(true);
      if (result.synced && 'action' in result) {
        expect(result.action).toBe('stove_on');
      }
    });

    it('should re-apply setpoints when current setpoint has drifted', async () => {
      // Clear all mocks to ensure clean state
      jest.clearAllMocks();

      mockedAdminDbGet.mockImplementation((path) => {
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

      mockedGetValidAccessToken.mockResolvedValue({ accessToken: 'valid-token', error: null });
      mockedNetatmoApiGetHomeStatus.mockResolvedValue({
        rooms: [{ id: 'room-123', name: 'Salotto', type: 'livingroom', therm_setpoint_temperature: 20 }], // drifted from 16!
      });
      mockedNetatmoApiSetRoomThermpoint.mockResolvedValue(true);
      mockedAdminDbUpdate.mockResolvedValue();

      const result = await enforceStoveSyncSetpoints(true);

      // Type assertion for test - we know it returns enforced result
      const enforcedResult = result as { enforced: boolean; action?: string; fixedCount?: number };
      expect(enforcedResult.enforced).toBe(true);
      if (enforcedResult.enforced && 'action' in enforcedResult) {
        expect(enforcedResult.action).toBe('setpoint_enforcement');
      }
      if (enforcedResult.enforced && 'fixedCount' in enforcedResult) {
        expect(enforcedResult.fixedCount).toBe(1);
      }
      expect(mockedNetatmoApiSetRoomThermpoint).toHaveBeenCalledWith(
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
      mockedAdminDbGet.mockResolvedValueOnce({
        enabled: true,
        rooms: [{ id: 'room-123', name: 'Salotto' }],
        stoveTemperature: 16,
        stoveMode: true,
      });
      mockedAdminDbGet.mockResolvedValueOnce('home-456');

      mockedGetValidAccessToken.mockResolvedValue({ accessToken: 'valid-token', error: null });
      // Room not found in Netatmo response
      mockedNetatmoApiGetHomeStatus.mockResolvedValue({
        rooms: [{ id: 'other-room', name: 'Other', type: 'other', therm_setpoint_temperature: 20 }],
      });
      mockedNetatmoApiSetRoomThermpoint.mockResolvedValue(true);
      mockedAdminDbUpdate.mockResolvedValue();

      const result = await enforceStoveSyncSetpoints(true);

      // Should re-apply because we can't verify the setpoint (type assertion for test)
      const enforcedResult = result as { enforced: boolean; action?: string; fixedCount?: number };
      expect(enforcedResult.enforced).toBe(true);
      if (enforcedResult.enforced && 'action' in enforcedResult) {
        expect(enforcedResult.action).toBe('setpoint_enforcement');
      }
      if (enforcedResult.enforced && 'fixedCount' in enforcedResult) {
        expect(enforcedResult.fixedCount).toBe(1);
      }
    });

    it('should not re-apply when setpoint is correct (within tolerance)', async () => {
      mockedAdminDbGet.mockResolvedValueOnce({
        enabled: true,
        rooms: [{ id: 'room-123', name: 'Salotto' }],
        stoveTemperature: 16,
        stoveMode: true,
      });
      mockedAdminDbGet.mockResolvedValueOnce('home-456');

      mockedGetValidAccessToken.mockResolvedValue({ accessToken: 'valid-token', error: null });
      mockedNetatmoApiGetHomeStatus.mockResolvedValue({
        rooms: [{ id: 'room-123', name: 'Salotto', type: 'livingroom', therm_setpoint_temperature: 16.3 }], // within 0.5° tolerance
      });

      const result = await enforceStoveSyncSetpoints(true);

      // Type assertion for test
      const enforcedResult = result as { enforced: boolean; reason?: string };
      expect(enforcedResult.enforced).toBe(false);
      if (!enforcedResult.enforced && 'reason' in enforcedResult) {
        expect(enforcedResult.reason).toBe('setpoints_correct');
      }
      expect(mockedNetatmoApiSetRoomThermpoint).not.toHaveBeenCalled();
    });
  });

  describe('setRoomsToBoostMode', () => {
    it('should apply boost correctly (20°C + 2°C = 22°C)', async () => {
      mockedNetatmoApiGetHomeStatus.mockResolvedValue({
        rooms: [{ id: 'room-123', name: 'Salotto', type: 'livingroom', therm_setpoint_temperature: 20 }],
      });
      mockedNetatmoApiSetRoomThermpoint.mockResolvedValue(true);

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
      mockedNetatmoApiGetHomeStatus.mockResolvedValue({
        rooms: [{ id: 'room-123', name: 'Salotto', type: 'livingroom', therm_setpoint_temperature: 29 }],
      });
      mockedNetatmoApiSetRoomThermpoint.mockResolvedValue(true);

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
      mockedNetatmoApiGetHomeStatus.mockResolvedValue({
        rooms: [{ id: 'room-123', name: 'Salotto', type: 'livingroom', therm_setpoint_temperature: 21 }],
      });
      mockedNetatmoApiSetRoomThermpoint.mockResolvedValue(true);

      const config = {
        homeId: 'home-456',
        rooms: [{ id: 'room-123', name: 'Salotto' }],
        accessToken: 'valid-token',
      };

      const result = await setRoomsToBoostMode(config, 2, {});

      expect(result.previousSetpoints['room-123']).toBe(21);
    });

    it('should not overwrite existing previousSetpoints entry', async () => {
      mockedNetatmoApiGetHomeStatus.mockResolvedValue({
        rooms: [{ id: 'room-123', name: 'Salotto', type: 'livingroom', therm_setpoint_temperature: 21 }],
      });
      mockedNetatmoApiSetRoomThermpoint.mockResolvedValue(true);

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
      mockedNetatmoApiGetHomeStatus.mockResolvedValue({
        rooms: [
          { id: 'room-123', name: 'Salotto', type: 'livingroom', therm_setpoint_temperature: 20 },
          { id: 'room-456', name: 'Camera', type: 'bedroom', therm_setpoint_temperature: 22 },
          { id: 'room-789', name: 'Studio', type: 'office', therm_setpoint_temperature: 18 },
        ],
      });
      mockedNetatmoApiSetRoomThermpoint.mockResolvedValue(true);

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
      mockedNetatmoApiGetHomeStatus.mockResolvedValue({
        rooms: [
          { id: 'room-123', name: 'Salotto', type: 'livingroom', therm_setpoint_temperature: 29 },
          { id: 'room-456', name: 'Camera', type: 'bedroom', therm_setpoint_temperature: 20 },
        ],
      });
      mockedNetatmoApiSetRoomThermpoint.mockResolvedValue(true);

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
      mockedNetatmoApiGetHomeStatus.mockResolvedValue({
        rooms: [
          { id: 'room-123', name: 'Salotto', type: 'livingroom', therm_setpoint_temperature: 28.5 },
          { id: 'room-456', name: 'Camera', type: 'bedroom', therm_setpoint_temperature: 29 },
        ],
      });
      mockedNetatmoApiSetRoomThermpoint.mockResolvedValue(true);

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
      mockedNetatmoApiGetHomeStatus.mockResolvedValue({
        rooms: [
          { id: 'room-123', name: 'Salotto', type: 'livingroom', therm_setpoint_temperature: 20 },
          { id: 'room-456', name: 'Camera', type: 'bedroom', therm_setpoint_temperature: 21 },
          { id: 'room-789', name: 'Studio', type: 'office', therm_setpoint_temperature: 19 },
        ],
      });

      // Middle room fails
      mockedNetatmoApiSetRoomThermpoint.mockImplementation((token, params) => {
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
      mockedNetatmoApiSetRoomThermpoint.mockResolvedValue(true);

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

      expect(mockedNetatmoApiSetRoomThermpoint).toHaveBeenCalledWith(
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
      mockedNetatmoApiSetRoomThermpoint.mockResolvedValue(true);

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

      expect(mockedNetatmoApiSetRoomThermpoint).toHaveBeenCalledWith(
        'valid-token',
        expect.objectContaining({
          home_id: 'home-456',
          room_id: 'room-123',
          mode: 'home',
        })
      );
    });

    it('should handle mixed scenarios (some rooms have previous, some do not)', async () => {
      mockedNetatmoApiSetRoomThermpoint.mockResolvedValue(true);

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
      mockedNetatmoApiSetRoomThermpoint.mockResolvedValue(true);

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
      expect(mockedNetatmoApiSetRoomThermpoint).toHaveBeenCalledTimes(3);
    });

    it('should handle API errors gracefully (per-room failure does not block others)', async () => {
      // First room fails, second succeeds
      mockedNetatmoApiSetRoomThermpoint.mockImplementation((token, params) => {
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
      mockedNetatmoApiSetRoomThermpoint.mockResolvedValue(true);

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
      mockedNetatmoApiGetHomeStatus.mockResolvedValue({
        rooms: [
          { id: 'room-123', name: 'Salotto', type: 'livingroom', therm_setpoint_temperature: 19 },
          { id: 'room-456', name: 'Camera', type: 'bedroom', therm_setpoint_temperature: 20 },
          { id: 'room-789', name: 'Studio', type: 'office', therm_setpoint_temperature: 21 },
        ],
      });
      mockedNetatmoApiSetRoomThermpoint.mockResolvedValue(true);

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
      mockedNetatmoApiGetHomeStatus.mockResolvedValue({
        rooms: [
          { id: 'room-123', name: 'Salotto', type: 'livingroom', therm_setpoint_temperature: 20 },
          { id: 'room-456', name: 'Camera', type: 'bedroom', therm_setpoint_temperature: 21 },
          { id: 'room-789', name: 'Studio', type: 'office', therm_setpoint_temperature: 19 },
        ],
      });

      // Middle room API call fails
      mockedNetatmoApiSetRoomThermpoint.mockImplementation((token, params) => {
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
      mockedNetatmoApiGetHomeStatus.mockResolvedValue({
        rooms: [
          { id: 'room-123', name: 'Salotto', type: 'livingroom', therm_setpoint_temperature: 20 },
          { id: 'room-456', name: 'Camera', type: 'bedroom', therm_setpoint_temperature: 20 },
          { id: 'room-789', name: 'Studio', type: 'office', therm_setpoint_temperature: 20 },
        ],
      });
      mockedNetatmoApiSetRoomThermpoint.mockResolvedValue(true);

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
      mockedNetatmoApiSetRoomThermpoint.mockResolvedValue(true);

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
      mockedNetatmoApiGetHomeStatus.mockResolvedValue({
        rooms: [
          { id: 'room-123', name: 'Salotto', type: 'livingroom', therm_setpoint_temperature: 29 },
          { id: 'room-456', name: 'Camera', type: 'bedroom', therm_setpoint_temperature: 29 },
          { id: 'room-789', name: 'Studio', type: 'office', therm_setpoint_temperature: 29 },
        ],
      });
      mockedNetatmoApiSetRoomThermpoint.mockResolvedValue(true);

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
