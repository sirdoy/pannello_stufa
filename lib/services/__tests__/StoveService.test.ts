/**
 * StoveService Tests
 *
 * Tests for stove ignite/shutdown operations with Netatmo thermostat sync
 */

// Mock problematic dependencies BEFORE importing the service
jest.mock('@/lib/core', () => ({
  ApiError: {
    maintenanceRequired: jest.fn(() => new Error('Maintenance required')),
  },
}));

jest.mock('@/lib/repositories/MaintenanceRepository', () => ({
  MaintenanceRepository: jest.fn().mockImplementation(() => ({
    canIgnite: jest.fn().mockResolvedValue(true),
  })),
}));

jest.mock('@/lib/repositories/StoveStateRepository', () => ({
  StoveStateRepository: jest.fn().mockImplementation(() => ({
    updateState: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('@/lib/repositories/SchedulerModeRepository', () => ({
  SchedulerModeRepository: jest.fn().mockImplementation(() => ({
    getMode: jest.fn().mockResolvedValue({ enabled: false, semiManual: false }),
    setSemiManual: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('@/lib/stoveApi', () => ({
  igniteStove: jest.fn().mockResolvedValue({ success: true }),
  shutdownStove: jest.fn().mockResolvedValue({ success: true }),
  setFanLevel: jest.fn().mockResolvedValue({ success: true }),
  setPowerLevel: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/lib/schedulerService', () => ({
  getNextScheduledChange: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/lib/netatmoStoveSync', () => ({
  syncLivingRoomWithStove: jest.fn().mockResolvedValue({
    synced: true,
    roomNames: 'Living Room',
    temperature: 16,
  }),
}));

// Now import the service and mocks
import { StoveService } from '../StoveService';
import { MaintenanceRepository } from '@/lib/repositories/MaintenanceRepository';
import { igniteStove, shutdownStove } from '@/lib/stoveApi';
import { syncLivingRoomWithStove } from '@/lib/netatmoStoveSync';

describe('StoveService', () => {
  let service: any;

  beforeEach(() => {
    jest.clearAllMocks();
    (syncLivingRoomWithStove as jest.Mock).mockResolvedValue({
      synced: true,
      roomNames: 'Living Room',
      temperature: 16,
    });
    service = new StoveService();
  });

  describe('ignite', () => {
    it('should call syncLivingRoomWithStove(true) after successful ignition', async () => {
      await service.ignite(3, 'manual');

      // Wait for async sync operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(igniteStove).toHaveBeenCalledWith(3);
      expect(syncLivingRoomWithStove).toHaveBeenCalledWith(true);
    });

    it('should still sync thermostats for scheduler source', async () => {
      await service.ignite(4, 'scheduler');

      // Wait for async sync operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(igniteStove).toHaveBeenCalledWith(4);
      expect(syncLivingRoomWithStove).toHaveBeenCalledWith(true);
    });

    it('should not block on sync errors', async () => {
      (syncLivingRoomWithStove as jest.Mock).mockRejectedValue(new Error('Netatmo unavailable'));

      // Should not throw, even if sync fails
      const result = await service.ignite(3, 'manual');

      expect(result).toEqual({ success: true });
      expect(syncLivingRoomWithStove).toHaveBeenCalledWith(true);
    });

    it('should not sync when maintenance check fails', async () => {
      // Override the maintenance repo for this test
      (MaintenanceRepository as jest.Mock).mockImplementation(() => ({
        canIgnite: jest.fn().mockResolvedValue(false),
      }));
      const serviceWithBlockedMaintenance = new StoveService();

      await expect(serviceWithBlockedMaintenance.ignite(3, 'manual')).rejects.toThrow();

      expect(syncLivingRoomWithStove).not.toHaveBeenCalled();
    });
  });

  describe('shutdown', () => {
    it('should call syncLivingRoomWithStove(false) after successful shutdown', async () => {
      await service.shutdown('manual');

      // Wait for async sync operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(shutdownStove).toHaveBeenCalled();
      expect(syncLivingRoomWithStove).toHaveBeenCalledWith(false);
    });

    it('should still sync thermostats for scheduler source', async () => {
      await service.shutdown('scheduler');

      // Wait for async sync operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(shutdownStove).toHaveBeenCalled();
      expect(syncLivingRoomWithStove).toHaveBeenCalledWith(false);
    });

    it('should not block on sync errors', async () => {
      (syncLivingRoomWithStove as jest.Mock).mockRejectedValue(new Error('Netatmo unavailable'));

      // Should not throw, even if sync fails
      const result = await service.shutdown('manual');

      expect(result).toEqual({ success: true });
      expect(syncLivingRoomWithStove).toHaveBeenCalledWith(false);
    });
  });
});
