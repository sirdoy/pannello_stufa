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
});
