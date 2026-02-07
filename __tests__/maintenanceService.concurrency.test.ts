/**
 * @jest-environment node
 */

import { trackUsageHours } from '../lib/maintenanceService';
import * as firebase from 'firebase/database';

// Mock Firebase
jest.mock('firebase/database', () => ({
  ref: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
  runTransaction: jest.fn(),
}));

jest.mock('../lib/firebase', () => ({
  db: {},
}));

jest.mock('../lib/sandboxService', () => ({
  isLocalEnvironment: jest.fn(() => false),
  isSandboxEnabled: jest.fn(() => false),
  getSandboxMaintenance: jest.fn(),
}));

describe('maintenanceService - Concurrency Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('trackUsageHours - Transaction Safety', () => {
    it('should use Firebase Transaction for atomic updates', async () => {
      const mockTransactionResult = {
        committed: true,
        snapshot: {
          val: () => ({
            currentHours: 10.0167,
            targetHours: 50,
            lastUpdatedAt: new Date().toISOString(),
            needsCleaning: false,
            lastNotificationLevel: 0,
          }),
        },
      };

      firebase.runTransaction.mockResolvedValue(mockTransactionResult);

      const result = await trackUsageHours('WORK - P2 V3');

      expect(firebase.runTransaction).toHaveBeenCalledTimes(1);
      expect(result.tracked).toBe(true);
    });

    it('should track WORK status', async () => {
      const mockTransactionResult = {
        committed: true,
        snapshot: {
          val: () => ({
            currentHours: 10.0167,
            targetHours: 50,
            lastUpdatedAt: new Date().toISOString(),
            needsCleaning: false,
            lastNotificationLevel: 0,
          }),
        },
      };

      firebase.runTransaction.mockResolvedValue(mockTransactionResult);

      const result = await trackUsageHours('WORK');

      expect(result.tracked).toBe(true);
    });

    it('should track MODULATION status', async () => {
      const mockTransactionResult = {
        committed: true,
        snapshot: {
          val: () => ({
            currentHours: 10.0167,
            targetHours: 50,
            lastUpdatedAt: new Date().toISOString(),
            needsCleaning: false,
            lastNotificationLevel: 0,
          }),
        },
      };

      firebase.runTransaction.mockResolvedValue(mockTransactionResult);

      const result = await trackUsageHours('MODULATION');

      expect(result.tracked).toBe(true);
      expect(firebase.runTransaction).toHaveBeenCalled();
    });

    it('should NOT track START status', async () => {
      const result = await trackUsageHours('START');

      expect(result.tracked).toBe(false);
      expect(result.reason).toBe('Stove not in WORK/MODULATION status');
      expect(firebase.runTransaction).not.toHaveBeenCalled();
    });

    it('should NOT track OFF status', async () => {
      const result = await trackUsageHours('OFF');

      expect(result.tracked).toBe(false);
      expect(result.reason).toBe('Stove not in WORK/MODULATION status');
      expect(firebase.runTransaction).not.toHaveBeenCalled();
    });

    it('should abort transaction if called too soon (< 0.5 minutes)', async () => {
      const mockTransactionResult = {
        committed: false,
        snapshot: null,
      };

      firebase.runTransaction.mockImplementation((ref, updateFunction) => {
        const currentData = {
          currentHours: 10.0,
          targetHours: 50,
          lastUpdatedAt: new Date().toISOString(), // Just now
          needsCleaning: false,
          lastNotificationLevel: 0,
        };

        // Transaction function should return undefined to abort
        const result = updateFunction(currentData);

        return Promise.resolve({
          committed: result !== undefined,
          snapshot: result !== undefined ? { val: () => result } : null,
        });
      });

      const result = await trackUsageHours('WORK');

      expect(result.tracked).toBe(false);
      expect(result.reason).toContain('Too soon');
    });

    it('should initialize lastUpdatedAt on first tracking without adding time', async () => {
      let transactionCallCount = 0;

      firebase.runTransaction.mockImplementation((ref, updateFunction) => {
        transactionCallCount++;

        const currentData = {
          currentHours: 0,
          targetHours: 50,
          lastUpdatedAt: null, // First time
          needsCleaning: false,
          lastNotificationLevel: 0,
        };

        const result = updateFunction(currentData);

        return Promise.resolve({
          committed: true,
          snapshot: { val: () => result },
        });
      });

      const result = await trackUsageHours('WORK');

      // Should initialize lastUpdatedAt but not add time
      expect(firebase.runTransaction).toHaveBeenCalled();

      // Verify the transaction function was called
      const transactionFn = firebase.runTransaction.mock.calls[0][1];
      const mockData = {
        currentHours: 0,
        targetHours: 50,
        lastUpdatedAt: null,
        needsCleaning: false,
      };

      const updatedData = transactionFn(mockData);

      // Should have set lastUpdatedAt
      expect(updatedData.lastUpdatedAt).toBeTruthy();
      // Should NOT have added time yet
      expect(updatedData.currentHours).toBe(0);
    });

    it('should calculate elapsed time correctly and add to currentHours', async () => {
      const oldTimestamp = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes ago

      firebase.runTransaction.mockImplementation((ref, updateFunction) => {
        const currentData = {
          currentHours: 10.0,
          targetHours: 50,
          lastUpdatedAt: oldTimestamp.toISOString(),
          needsCleaning: false,
          lastNotificationLevel: 0,
        };

        const result = updateFunction(currentData);

        return Promise.resolve({
          committed: true,
          snapshot: { val: () => result },
        });
      });

      const result = await trackUsageHours('WORK');

      expect(result.tracked).toBe(true);

      // Verify the transaction function calculated elapsed time
      const transactionFn = firebase.runTransaction.mock.calls[0][1];
      const mockData = {
        currentHours: 10.0,
        targetHours: 50,
        lastUpdatedAt: oldTimestamp.toISOString(),
        needsCleaning: false,
        lastNotificationLevel: 0,
      };

      const updatedData = transactionFn(mockData);

      // Should have added approximately 2 minutes (0.0333 hours)
      expect(updatedData.currentHours).toBeGreaterThan(10.0);
      expect(updatedData.currentHours).toBeLessThan(10.05); // Allow some tolerance
    });

    it('should set needsCleaning when threshold reached', async () => {
      const oldTimestamp = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes ago

      firebase.runTransaction.mockImplementation((ref, updateFunction) => {
        const currentData = {
          currentHours: 49.98, // Just below 50h threshold
          targetHours: 50,
          lastUpdatedAt: oldTimestamp.toISOString(),
          needsCleaning: false,
          lastNotificationLevel: 0,
        };

        const result = updateFunction(currentData);

        return Promise.resolve({
          committed: true,
          snapshot: { val: () => result },
        });
      });

      const result = await trackUsageHours('WORK');

      // Verify the transaction function set needsCleaning
      const transactionFn = firebase.runTransaction.mock.calls[0][1];
      const mockData = {
        currentHours: 49.98,
        targetHours: 50,
        lastUpdatedAt: oldTimestamp.toISOString(),
        needsCleaning: false,
        lastNotificationLevel: 0,
      };

      const updatedData = transactionFn(mockData);

      // Should have set needsCleaning to true
      expect(updatedData.needsCleaning).toBe(true);
      expect(updatedData.currentHours).toBeGreaterThanOrEqual(50);
    });

    it('should handle notification data atomically', async () => {
      const oldTimestamp = new Date(Date.now() - 6 * 60 * 1000); // 6 minutes ago

      firebase.runTransaction.mockImplementation((ref, updateFunction) => {
        const currentData = {
          currentHours: 39.9, // Will reach 40h (80% of 50h)
          targetHours: 50,
          lastUpdatedAt: oldTimestamp.toISOString(),
          needsCleaning: false,
          lastNotificationLevel: 0,
        };

        const result = updateFunction(currentData);

        return Promise.resolve({
          committed: true,
          snapshot: { val: () => result },
        });
      });

      const result = await trackUsageHours('WORK');

      expect(result.tracked).toBe(true);

      // Verify notification data is included
      const transactionFn = firebase.runTransaction.mock.calls[0][1];
      const mockData = {
        currentHours: 39.9,
        targetHours: 50,
        lastUpdatedAt: oldTimestamp.toISOString(),
        needsCleaning: false,
        lastNotificationLevel: 0,
      };

      const updatedData = transactionFn(mockData);

      // Should have updated lastNotificationLevel if threshold reached
      if (updatedData.currentHours / updatedData.targetHours >= 0.8) {
        expect(updatedData.lastNotificationLevel).toBeGreaterThan(0);
      }
    });

    it('should handle concurrent calls safely with transaction retry', async () => {
      // Simulate transaction retry due to concurrent modification
      let attemptCount = 0;

      firebase.runTransaction.mockImplementation((ref, updateFunction) => {
        attemptCount++;

        // First attempt: simulate concurrent modification (transaction will retry)
        if (attemptCount === 1) {
          const data = {
            currentHours: 10.0,
            targetHours: 50,
            lastUpdatedAt: new Date(Date.now() - 60000).toISOString(),
            needsCleaning: false,
            lastNotificationLevel: 0,
          };

          const result = updateFunction(data);

          // Simulate Firebase retrying due to concurrent modification
          return Promise.resolve()
            .then(() => {
              // Second attempt with updated data
              const updatedDataFromOtherClient = {
                currentHours: 10.02, // Another client updated it
                targetHours: 50,
                lastUpdatedAt: new Date(Date.now() - 30000).toISOString(),
                needsCleaning: false,
                lastNotificationLevel: 0,
              };

              const finalResult = updateFunction(updatedDataFromOtherClient);

              return {
                committed: true,
                snapshot: { val: () => finalResult },
              };
            });
        }

        return Promise.resolve({
          committed: false,
          snapshot: null,
        });
      });

      const result = await trackUsageHours('WORK');

      // Transaction should have been called at least once
      expect(firebase.runTransaction).toHaveBeenCalled();
    });
  });
});
