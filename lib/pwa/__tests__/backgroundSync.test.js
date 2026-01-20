/**
 * Background Sync Service Tests
 */

import {
  formatCommandForDisplay,
  COMMAND_STATUS,
  SYNC_TAG,
} from '../backgroundSync';

// Mock IndexedDB - the actual IndexedDB operations are tested separately
jest.mock('../indexedDB', () => ({
  put: jest.fn().mockResolvedValue(1),
  getAll: jest.fn().mockResolvedValue([]),
  getByIndex: jest.fn().mockResolvedValue([]),
  remove: jest.fn().mockResolvedValue(),
  STORES: {
    COMMAND_QUEUE: 'commandQueue',
    DEVICE_STATE: 'deviceState',
    APP_STATE: 'appState',
  },
}));

describe('backgroundSync', () => {
  describe('COMMAND_STATUS', () => {
    it('has all expected status values', () => {
      expect(COMMAND_STATUS.PENDING).toBe('pending');
      expect(COMMAND_STATUS.PROCESSING).toBe('processing');
      expect(COMMAND_STATUS.COMPLETED).toBe('completed');
      expect(COMMAND_STATUS.FAILED).toBe('failed');
    });
  });

  describe('SYNC_TAG', () => {
    it('has the correct sync tag value', () => {
      expect(SYNC_TAG).toBe('stove-command-sync');
    });
  });

  describe('formatCommandForDisplay', () => {
    it('formats stove/ignite command correctly', () => {
      const command = {
        id: 1,
        endpoint: 'stove/ignite',
        timestamp: '2026-01-19T10:30:00.000Z',
        status: 'pending',
      };

      const result = formatCommandForDisplay(command);

      expect(result.label).toBe('Accensione stufa');
      expect(result.icon).toBe('🔥');
      expect(result.id).toBe(1);
      expect(result.status).toBe('pending');
    });

    it('formats stove/shutdown command correctly', () => {
      const command = {
        id: 2,
        endpoint: 'stove/shutdown',
        timestamp: '2026-01-19T10:30:00.000Z',
        status: 'pending',
      };

      const result = formatCommandForDisplay(command);

      expect(result.label).toBe('Spegnimento stufa');
      expect(result.icon).toBe('🌙');
    });

    it('formats stove/set-power command correctly', () => {
      const command = {
        id: 3,
        endpoint: 'stove/set-power',
        timestamp: '2026-01-19T10:30:00.000Z',
        status: 'pending',
      };

      const result = formatCommandForDisplay(command);

      expect(result.label).toBe('Imposta potenza');
      expect(result.icon).toBe('⚡');
    });

    it('handles unknown endpoint with fallback', () => {
      const command = {
        id: 4,
        endpoint: 'unknown/action',
        timestamp: '2026-01-19T10:30:00.000Z',
        status: 'pending',
      };

      const result = formatCommandForDisplay(command);

      expect(result.label).toBe('unknown/action');
      expect(result.icon).toBe('📤');
    });

    it('includes formatted time', () => {
      const command = {
        id: 1,
        endpoint: 'stove/ignite',
        timestamp: '2026-01-19T10:30:00.000Z',
        status: 'pending',
      };

      const result = formatCommandForDisplay(command);

      expect(result.formattedTime).toBeDefined();
      expect(typeof result.formattedTime).toBe('string');
    });

    it('preserves all original command properties', () => {
      const command = {
        id: 1,
        endpoint: 'stove/ignite',
        timestamp: '2026-01-19T10:30:00.000Z',
        status: 'pending',
        retries: 2,
        lastError: 'Network error',
        data: { source: 'manual' },
      };

      const result = formatCommandForDisplay(command);

      expect(result.id).toBe(1);
      expect(result.endpoint).toBe('stove/ignite');
      expect(result.status).toBe('pending');
      expect(result.retries).toBe(2);
      expect(result.lastError).toBe('Network error');
      expect(result.data).toEqual({ source: 'manual' });
    });
  });
});
