/**
 * Tests for Philips Hue Local API Firebase Helper
 */

import { ref, get, set } from 'firebase/database';
import {
  getHueConnection,
  saveHueConnection,
  clearHueConnection,
  getHueStatus,
  isHueConnected,
} from '../hueLocalHelper';

// Mock Firebase
jest.mock('firebase/database');
jest.mock('../../firebase', () => ({
  db: {}, // Mock database instance
}));
jest.mock('../../environmentHelper', () => ({
  getEnvironmentPath: jest.fn((path) => `dev/${path}`),
}));

describe('hueLocalHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getHueConnection', () => {
    it('should return connection data when bridge is paired', async () => {
      const mockData = {
        bridge_ip: '192.168.1.100',
        username: 'test-username-123',
        clientkey: 'test-clientkey-456',
      };

      get.mockResolvedValue({
        exists: () => true,
        val: () => mockData,
      });

      const result = await getHueConnection();

      expect(result).toEqual({
        bridgeIp: '192.168.1.100',
        username: 'test-username-123',
        clientkey: 'test-clientkey-456',
      });
      expect(ref).toHaveBeenCalledWith({}, 'dev/hue');
    });

    it('should return null when no connection exists', async () => {
      get.mockResolvedValue({
        exists: () => false,
      });

      const result = await getHueConnection();

      expect(result).toBeNull();
    });

    it('should return null when missing bridge_ip', async () => {
      get.mockResolvedValue({
        exists: () => true,
        val: () => ({ username: 'test-username' }), // Missing bridge_ip
      });

      const result = await getHueConnection();

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      get.mockRejectedValue(new Error('Firebase error'));

      const result = await getHueConnection();

      expect(result).toBeNull();
    });
  });

  describe('saveHueConnection', () => {
    it('should save connection data to Firebase', async () => {
      await saveHueConnection(
        '192.168.1.100',
        'test-username-123',
        'test-clientkey-456',
        'bridge-id-789'
      );

      expect(set).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bridge_ip: '192.168.1.100',
          username: 'test-username-123',
          clientkey: 'test-clientkey-456',
          bridge_id: 'bridge-id-789',
          connected: true,
          connected_at: expect.any(String),
          updated_at: expect.any(String),
        })
      );
    });

    it('should save without optional parameters', async () => {
      await saveHueConnection('192.168.1.100', 'test-username-123');

      expect(set).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bridge_ip: '192.168.1.100',
          username: 'test-username-123',
          connected: true,
        })
      );
    });

    it('should throw error on Firebase failure', async () => {
      set.mockRejectedValue(new Error('Firebase write error'));

      await expect(
        saveHueConnection('192.168.1.100', 'test-username')
      ).rejects.toThrow('Firebase write error');
    });
  });

  describe('clearHueConnection', () => {
    it('should set connected to false', async () => {
      await clearHueConnection();

      expect(set).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          connected: false,
          disconnected_at: expect.any(String),
        })
      );
    });
  });

  describe('getHueStatus', () => {
    it('should return connected status when paired', async () => {
      const mockData = {
        bridge_ip: '192.168.1.100',
        username: 'test-username',
        bridge_id: 'bridge-123',
        connected_at: '2026-01-04T12:00:00.000Z',
        updated_at: '2026-01-04T12:00:00.000Z',
      };

      get.mockResolvedValue({
        exists: () => true,
        val: () => mockData,
      });

      const result = await getHueStatus();

      expect(result).toEqual({
        connected: true,
        bridge_ip: '192.168.1.100',
        bridge_id: 'bridge-123',
        connected_at: '2026-01-04T12:00:00.000Z',
        updated_at: '2026-01-04T12:00:00.000Z',
      });
    });

    it('should return not connected when missing credentials', async () => {
      get.mockResolvedValue({
        exists: () => true,
        val: () => ({ connected: false }), // No bridge_ip or username
      });

      const result = await getHueStatus();

      expect(result).toEqual({
        connected: false,
        bridge_ip: null,
        bridge_id: null,
        connected_at: null,
        updated_at: null,
      });
    });

    it('should handle errors gracefully', async () => {
      get.mockRejectedValue(new Error('Firebase error'));

      const result = await getHueStatus();

      expect(result).toEqual({
        connected: false,
        error: 'Firebase error',
      });
    });
  });

  describe('isHueConnected', () => {
    it('should return true when connected', async () => {
      get.mockResolvedValue({
        exists: () => true,
        val: () => ({
          bridge_ip: '192.168.1.100',
          username: 'test-username',
        }),
      });

      const result = await isHueConnected();

      expect(result).toBe(true);
    });

    it('should return false when not connected', async () => {
      get.mockResolvedValue({
        exists: () => false,
      });

      const result = await isHueConnected();

      expect(result).toBe(false);
    });
  });
});
