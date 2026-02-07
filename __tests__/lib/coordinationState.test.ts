/**
 * Tests for Coordination State Service
 */

import {
  getCoordinationState,
  updateCoordinationState,
  resetCoordinationState
} from '../../lib/coordinationState.js';

// Mock dependencies
jest.mock('../../lib/firebaseAdmin.js');
jest.mock('../../lib/environmentHelper.js');

import { adminDbGet, adminDbSet } from '../../lib/firebaseAdmin.js';
import { getEnvironmentPath } from '../../lib/environmentHelper.js';

describe('coordinationState', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock implementations
    getEnvironmentPath.mockImplementation(path => `test/${path}`);
  });

  describe('getCoordinationState', () => {
    it('returns default state when nothing stored', async () => {
      adminDbGet.mockResolvedValue(null);

      const state = await getCoordinationState();

      expect(state).toMatchObject({
        stoveOn: false,
        automationPaused: false,
        pausedUntil: null,
        pauseReason: null,
        pendingDebounce: false,
        debounceStartedAt: null,
        previousSetpoints: null,
      });
      expect(state.lastStateChange).toBeGreaterThan(0);
      expect(adminDbGet).toHaveBeenCalledWith('test/coordination/state');
    });

    it('returns stored state', async () => {
      const storedState = {
        stoveOn: true,
        automationPaused: true,
        pausedUntil: 1738000000000,
        pauseReason: 'manual_setpoint_change',
        lastStateChange: 1737990000000,
        pendingDebounce: false,
        debounceStartedAt: null,
        previousSetpoints: { '12345': 21 },
      };
      adminDbGet.mockResolvedValue(storedState);

      const state = await getCoordinationState();

      expect(state).toEqual(storedState);
      expect(adminDbGet).toHaveBeenCalledWith('test/coordination/state');
    });

    it('uses environment-aware path', async () => {
      adminDbGet.mockResolvedValue(null);

      await getCoordinationState();

      expect(getEnvironmentPath).toHaveBeenCalledWith('coordination/state');
    });
  });

  describe('updateCoordinationState', () => {
    it('merges updates correctly', async () => {
      const existingState = {
        stoveOn: false,
        automationPaused: false,
        pausedUntil: null,
        pauseReason: null,
        lastStateChange: 1737980000000,
        pendingDebounce: false,
        debounceStartedAt: null,
        previousSetpoints: null,
      };
      adminDbGet.mockResolvedValue(existingState);

      const updates = {
        stoveOn: true,
        previousSetpoints: { '12345': 21 },
      };

      const updatedState = await updateCoordinationState(updates);

      // Verify merged fields
      expect(updatedState.stoveOn).toBe(true);
      expect(updatedState.previousSetpoints).toEqual({ '12345': 21 });
      expect(updatedState.automationPaused).toBe(false); // Unchanged
      expect(updatedState.pausedUntil).toBeNull(); // Unchanged
      expect(updatedState.lastStateChange).toBeGreaterThan(existingState.lastStateChange);
      expect(adminDbSet).toHaveBeenCalledWith('test/coordination/state', updatedState);
    });

    it('sets lastStateChange automatically', async () => {
      adminDbGet.mockResolvedValue({
        stoveOn: false,
        automationPaused: false,
        pausedUntil: null,
        pauseReason: null,
        lastStateChange: 1737980000000,
        pendingDebounce: false,
        debounceStartedAt: null,
        previousSetpoints: null,
      });

      const before = Date.now();
      const updatedState = await updateCoordinationState({ stoveOn: true });
      const after = Date.now();

      expect(updatedState.lastStateChange).toBeGreaterThanOrEqual(before);
      expect(updatedState.lastStateChange).toBeLessThanOrEqual(after);
    });

    it('handles partial updates', async () => {
      const existingState = {
        stoveOn: true,
        automationPaused: false,
        pausedUntil: null,
        pauseReason: null,
        lastStateChange: 1737980000000,
        pendingDebounce: true,
        debounceStartedAt: 1737990000000,
        previousSetpoints: { '12345': 21 },
      };
      adminDbGet.mockResolvedValue(existingState);

      const updates = { pendingDebounce: false };
      const updatedState = await updateCoordinationState(updates);

      expect(updatedState.pendingDebounce).toBe(false);
      expect(updatedState.debounceStartedAt).toBe(1737990000000); // Unchanged
      expect(updatedState.stoveOn).toBe(true); // Unchanged
    });

    it('overwrites existing lastStateChange', async () => {
      adminDbGet.mockResolvedValue({
        stoveOn: false,
        automationPaused: false,
        pausedUntil: null,
        pauseReason: null,
        lastStateChange: 1737980000000,
        pendingDebounce: false,
        debounceStartedAt: null,
        previousSetpoints: null,
      });

      const updatedState = await updateCoordinationState({
        stoveOn: true,
        lastStateChange: 9999999999999, // Should be ignored
      });

      expect(updatedState.lastStateChange).not.toBe(9999999999999);
      expect(updatedState.lastStateChange).toBeCloseTo(Date.now(), -2);
    });
  });

  describe('resetCoordinationState', () => {
    it('clears all state to defaults', async () => {
      const resetState = await resetCoordinationState();

      expect(resetState).toMatchObject({
        stoveOn: false,
        automationPaused: false,
        pausedUntil: null,
        pauseReason: null,
        pendingDebounce: false,
        debounceStartedAt: null,
        previousSetpoints: null,
      });
      expect(resetState.lastStateChange).toBeGreaterThan(0);
      expect(adminDbSet).toHaveBeenCalledWith('test/coordination/state', resetState);
    });

    it('uses environment-aware path', async () => {
      await resetCoordinationState();

      expect(getEnvironmentPath).toHaveBeenCalledWith('coordination/state');
    });
  });

  describe('state shape', () => {
    it('matches documented schema', async () => {
      adminDbGet.mockResolvedValue(null);
      const state = await getCoordinationState();

      // Verify all required fields exist
      expect(state).toHaveProperty('stoveOn');
      expect(state).toHaveProperty('automationPaused');
      expect(state).toHaveProperty('pausedUntil');
      expect(state).toHaveProperty('pauseReason');
      expect(state).toHaveProperty('lastStateChange');
      expect(state).toHaveProperty('pendingDebounce');
      expect(state).toHaveProperty('debounceStartedAt');
      expect(state).toHaveProperty('previousSetpoints');

      // Verify types
      expect(typeof state.stoveOn).toBe('boolean');
      expect(typeof state.automationPaused).toBe('boolean');
      expect(typeof state.pendingDebounce).toBe('boolean');
      expect(typeof state.lastStateChange).toBe('number');
      expect(state.pausedUntil).toBeNull();
      expect(state.pauseReason).toBeNull();
      expect(state.debounceStartedAt).toBeNull();
      expect(state.previousSetpoints).toBeNull();
    });
  });
});
