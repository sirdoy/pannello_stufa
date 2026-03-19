/**
 * Tests for Health Monitoring Service
 *
 * Covers:
 * - checkUserStoveHealth returns proper structure
 * - determineConnectionStatus handles all error cases
 * - detectStateMismatch identifies ON vs OFF mismatches
 * - STARTING states have grace period (not flagged as mismatch)
 * - Partial API failures don't crash health check
 */

import {
  checkUserStoveHealth,
  determineConnectionStatus,
  detectStateMismatch,
} from '../../lib/healthMonitoring';

// Mock dependencies
jest.mock('../../lib/thermorossiProxy');
jest.mock('../../lib/netatmoProxy');
jest.mock('../../lib/firebaseAdmin');

import { getStatus } from '../../lib/thermorossiProxy';
import { getProxyHomestatus } from '../../lib/netatmoProxy';
import { adminDbGet } from '../../lib/firebaseAdmin';

describe('healthMonitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('determineConnectionStatus', () => {
    it('returns online when stove status fetched successfully', () => {
      const stoveResult = {
        status: 'fulfilled' as const,
        value: { stove_state: 'working', power_level: 3, fan_level: 4, data_freshness: 'LIVE', error_code: null, error_description: null },
      } as PromiseSettledResult<unknown>;

      expect(determineConnectionStatus(stoveResult)).toBe('online');
    });

    it('returns offline on timeout error', () => {
      const stoveResult = {
        status: 'rejected' as const,
        reason: new Error('STOVE_TIMEOUT'),
      } as PromiseSettledResult<unknown>;

      expect(determineConnectionStatus(stoveResult)).toBe('offline');
    });

    it('returns error on other errors', () => {
      const stoveResult = {
        status: 'rejected' as const,
        reason: new Error('Network error'),
      } as PromiseSettledResult<unknown>;

      expect(determineConnectionStatus(stoveResult)).toBe('error');
    });

    it('returns error on parsing errors', () => {
      const stoveResult = {
        status: 'rejected' as const,
        reason: new Error('Invalid JSON'),
      } as PromiseSettledResult<unknown>;

      expect(determineConnectionStatus(stoveResult)).toBe('error');
    });
  });

  describe('detectStateMismatch', () => {
    it('returns null when stove status unavailable', () => {
      const stoveResult = { status: 'rejected', reason: new Error('Timeout') };
      const scheduleResult = { status: 'fulfilled', value: 'ON' };
      const netatmoResult = { status: 'fulfilled', value: 'heating' };

      expect(detectStateMismatch(stoveResult, scheduleResult, netatmoResult)).toBeNull();
    });

    it('returns null when expected state unavailable', () => {
      const stoveResult = { status: 'fulfilled', value: { stove_state: 'working', power_level: 3, fan_level: 4, data_freshness: 'LIVE', error_code: null, error_description: null } };
      const scheduleResult = { status: 'rejected', reason: new Error('Failed') };
      const netatmoResult = { status: 'fulfilled', value: 'heating' };

      expect(detectStateMismatch(stoveResult, scheduleResult, netatmoResult)).toBeNull();
    });

    it('detects mismatch when stove should be ON but is OFF', () => {
      const stoveResult = { status: 'fulfilled', value: { stove_state: 'standby', power_level: null, fan_level: null, data_freshness: 'LIVE', error_code: null, error_description: null } };
      const scheduleResult = { status: 'fulfilled', value: 'ON' };
      const netatmoResult = { status: 'fulfilled', value: 'idle' };

      const mismatch = detectStateMismatch(stoveResult, scheduleResult, netatmoResult);

      expect(mismatch).not.toBeNull();
      expect(mismatch!.detected).toBe(true);
      expect(mismatch!.expected).toBe('ON');
      expect(mismatch!.actual).toBe('standby');
      expect(mismatch!.reason).toBe('should_be_on');
    });

    it('detects mismatch when stove should be OFF but is ON', () => {
      const stoveResult = { status: 'fulfilled', value: { stove_state: 'working', power_level: 3, fan_level: 4, data_freshness: 'LIVE', error_code: null, error_description: null } };
      const scheduleResult = { status: 'fulfilled', value: 'OFF' };
      const netatmoResult = { status: 'fulfilled', value: 'idle' };

      const mismatch = detectStateMismatch(stoveResult, scheduleResult, netatmoResult);

      expect(mismatch).not.toBeNull();
      expect(mismatch!.detected).toBe(true);
      expect(mismatch!.expected).toBe('OFF');
      expect(mismatch!.actual).toBe('working');
      expect(mismatch!.reason).toBe('should_be_off');
    });

    it('does not flag STARTING state as mismatch (grace period)', () => {
      const stoveResult = { status: 'fulfilled', value: { stove_state: 'igniting', power_level: null, fan_level: null, data_freshness: 'LIVE', error_code: null, error_description: null } };
      const scheduleResult = { status: 'fulfilled', value: 'ON' };
      const netatmoResult = { status: 'fulfilled', value: 'heating' };

      // STARTING state should not be flagged during grace period
      expect(detectStateMismatch(stoveResult, scheduleResult, netatmoResult)).toBeNull();
    });

    it('detects error state as mismatch', () => {
      const stoveResult = {
        status: 'fulfilled',
        value: { stove_state: 'alarm', power_level: null, fan_level: null, data_freshness: 'LIVE', error_code: 5, error_description: 'Temperature sensor failure' },
      };
      const scheduleResult = { status: 'fulfilled', value: 'ON' };
      const netatmoResult = { status: 'fulfilled', value: 'heating' };

      const mismatch = detectStateMismatch(stoveResult, scheduleResult, netatmoResult);

      expect(mismatch).not.toBeNull();
      expect(mismatch!.detected).toBe(true);
      expect(mismatch!.reason).toBe('stove_error');
      expect(mismatch!.errorDescription).toBe('Temperature sensor failure');
    });

    it('detects coordination issue when Netatmo heating but stove OFF', () => {
      const stoveResult = { status: 'fulfilled', value: { stove_state: 'standby', power_level: null, fan_level: null, data_freshness: 'LIVE', error_code: null, error_description: null } };
      const scheduleResult = { status: 'fulfilled', value: 'OFF' }; // Schedule says OFF
      const netatmoResult = { status: 'fulfilled', value: 'heating' }; // But Netatmo heating

      const mismatch = detectStateMismatch(stoveResult, scheduleResult, netatmoResult);

      expect(mismatch).not.toBeNull();
      expect(mismatch!.detected).toBe(true);
      expect(mismatch!.reason).toBe('netatmo_heating_stove_off');
      expect(mismatch!.netatmoDemand).toBe('heating');
    });

    it('returns null when ON states match (working)', () => {
      const stoveResult = { status: 'fulfilled', value: { stove_state: 'working', power_level: 3, fan_level: 4, data_freshness: 'LIVE', error_code: null, error_description: null } };
      const scheduleResult = { status: 'fulfilled', value: 'ON' };
      const netatmoResult = { status: 'fulfilled', value: 'heating' };

      expect(detectStateMismatch(stoveResult, scheduleResult, netatmoResult)).toBeNull();
    });

    it('returns null when ON states match (modulating)', () => {
      const stoveResult = { status: 'fulfilled', value: { stove_state: 'modulating', power_level: 2, fan_level: 3, data_freshness: 'LIVE', error_code: null, error_description: null } };
      const scheduleResult = { status: 'fulfilled', value: 'ON' };
      const netatmoResult = { status: 'fulfilled', value: 'heating' };

      expect(detectStateMismatch(stoveResult, scheduleResult, netatmoResult)).toBeNull();
    });

    it('returns null when OFF states match', () => {
      const stoveResult = { status: 'fulfilled', value: { stove_state: 'standby', power_level: null, fan_level: null, data_freshness: 'LIVE', error_code: null, error_description: null } };
      const scheduleResult = { status: 'fulfilled', value: 'OFF' };
      const netatmoResult = { status: 'fulfilled', value: 'idle' };

      expect(detectStateMismatch(stoveResult, scheduleResult, netatmoResult)).toBeNull();
    });
  });

  describe('checkUserStoveHealth', () => {
    it('returns proper structure with all fields', async () => {
      const userId = 'auth0|test123';

      // Mock successful responses
      (getStatus as jest.Mock).mockResolvedValue({ stove_state: 'working', power_level: 3, fan_level: 4, data_freshness: 'LIVE', error_code: null, error_description: null });
      (adminDbGet as jest.Mock)
        .mockResolvedValueOnce('auto') // mode
        .mockResolvedValueOnce([{ day: 1, start: 0, end: 1440, enabled: true }]); // schedule
      (getProxyHomestatus as jest.Mock).mockResolvedValue({
        rooms: [{ room_id: 'r1', room_name: 'Living', heating_power_request: 50, temperature: null, therm_setpoint_temperature: null }],
        data_freshness: 'LIVE',
      });

      const health = await checkUserStoveHealth(userId);

      expect(health).toHaveProperty('userId', userId);
      expect(health).toHaveProperty('timestamp');
      expect(health).toHaveProperty('stoveStatus');
      expect(health).toHaveProperty('stoveError');
      expect(health).toHaveProperty('expectedState');
      expect(health).toHaveProperty('netatmoDemand');
      expect(health).toHaveProperty('connectionStatus');
      expect(health).toHaveProperty('stateMismatch');
    });

    it('handles partial failures gracefully (Netatmo down)', async () => {
      const userId = 'auth0|test123';

      // Stove OK, Schedule OK, Netatmo fails
      (getStatus as jest.Mock).mockResolvedValue({ stove_state: 'working', power_level: 3, fan_level: 4, data_freshness: 'LIVE', error_code: null, error_description: null });
      (adminDbGet as jest.Mock)
        .mockResolvedValueOnce('auto')
        .mockResolvedValueOnce([{ day: 1, start: 0, end: 1440, enabled: true }]);
      (getProxyHomestatus as jest.Mock).mockRejectedValue(new Error('Proxy error'));

      const health = await checkUserStoveHealth(userId);

      // Should still return health object
      expect(health.connectionStatus).toBe('online');
      expect(health.stoveStatus).toBeTruthy();
      expect(health.netatmoDemand).toBeNull(); // Failed
      expect(health.stoveError).toBeNull();
    });

    it('handles stove timeout gracefully', async () => {
      const userId = 'auth0|test123';

      // Stove timeout
      (getStatus as jest.Mock).mockRejectedValue(new Error('STOVE_TIMEOUT'));
      (adminDbGet as jest.Mock)
        .mockResolvedValueOnce('auto')
        .mockResolvedValueOnce([{ day: 1, start: 0, end: 1440, enabled: true }]);

      const health = await checkUserStoveHealth(userId);

      expect(health.connectionStatus).toBe('offline');
      expect(health.stoveStatus).toBeNull();
      expect(health.stoveError).toBe('STOVE_TIMEOUT');
    });

    it('handles all API failures gracefully', async () => {
      const userId = 'auth0|test123';

      // All APIs fail
      (getStatus as jest.Mock).mockRejectedValue(new Error('Network error'));
      (adminDbGet as jest.Mock).mockRejectedValue(new Error('Firebase error'));
      (getProxyHomestatus as jest.Mock).mockRejectedValue(new Error('Proxy error'));

      const health = await checkUserStoveHealth(userId);

      // Should still return structure (graceful degradation)
      expect(health.userId).toBe(userId);
      expect(health.connectionStatus).toBe('error');
      expect(health.stoveStatus).toBeNull();
      expect(health.expectedState).toBeNull();
      expect(health.netatmoDemand).toBeNull();
    });

    it('includes timestamp in result', async () => {
      const userId = 'auth0|test123';

      (getStatus as jest.Mock).mockResolvedValue({ stove_state: 'standby', power_level: null, fan_level: null, data_freshness: 'LIVE', error_code: null, error_description: null });
      (adminDbGet as jest.Mock).mockResolvedValue('manual');

      const before = Date.now();
      const health = await checkUserStoveHealth(userId);
      const after = Date.now();

      expect(health.timestamp).toBeGreaterThanOrEqual(before);
      expect(health.timestamp).toBeLessThanOrEqual(after);
    });
  });
});
