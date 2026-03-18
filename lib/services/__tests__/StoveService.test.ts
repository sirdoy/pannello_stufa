/**
 * StoveService Tests
 *
 * Tests for stove ignite/shutdown operations
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

// Now import the service and mocks
import { StoveService } from '../StoveService';
import { MaintenanceRepository } from '@/lib/repositories/MaintenanceRepository';
import { igniteStove, shutdownStove } from '@/lib/stoveApi';

describe('StoveService', () => {
  let service: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset MaintenanceRepository to default (canIgnite=true) so tests that override it
    // (e.g. 'should not sync when maintenance check fails') don't leak into subsequent tests
    // when running in randomized order. clearAllMocks() does not reset mockImplementation.
    (MaintenanceRepository as jest.Mock).mockImplementation(() => ({
      canIgnite: jest.fn().mockResolvedValue(true),
    }));
    service = new StoveService();
  });

  describe('ignite', () => {
    it('should call igniteStove after successful ignition', async () => {
      const result = await service.ignite(3, 'manual');

      expect(igniteStove).toHaveBeenCalledWith(3);
      expect(result).toEqual({ success: true });
    });

    it('should call igniteStove for scheduler source', async () => {
      const result = await service.ignite(4, 'scheduler');

      expect(igniteStove).toHaveBeenCalledWith(4);
      expect(result).toEqual({ success: true });
    });

    it('should not sync when maintenance check fails', async () => {
      // Override the maintenance repo for this test
      (MaintenanceRepository as jest.Mock).mockImplementation(() => ({
        canIgnite: jest.fn().mockResolvedValue(false),
      }));
      const serviceWithBlockedMaintenance = new StoveService();

      await expect(serviceWithBlockedMaintenance.ignite(3, 'manual')).rejects.toThrow();

      expect(igniteStove).not.toHaveBeenCalled();
    });
  });

  describe('shutdown', () => {
    it('should call shutdownStove after successful shutdown', async () => {
      const result = await service.shutdown('manual');

      expect(shutdownStove).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should call shutdownStove for scheduler source', async () => {
      const result = await service.shutdown('scheduler');

      expect(shutdownStove).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });
});
