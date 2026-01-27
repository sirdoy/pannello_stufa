/**
 * Tests for Coordination Debounce Timer Service
 */

import {
  startDebounceTimer,
  cancelDebounceTimer,
  hasPendingDebounce,
  getDebounceStatus,
  handleStoveStateChange,
  _internals,
} from '@/lib/coordinationDebounce';

// Mock coordinationState
jest.mock('@/lib/coordinationState', () => ({
  updateCoordinationState: jest.fn().mockResolvedValue({}),
}));

import { updateCoordinationState } from '@/lib/coordinationState';

describe('coordinationDebounce', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    _internals.activeTimers.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('startDebounceTimer', () => {
    it('creates timer and stores in Map', async () => {
      const userId = 'user123';
      const callback = jest.fn();

      const result = await startDebounceTimer(userId, 'ON', callback, 120000);

      expect(result).toEqual({ started: true, duration: 120000 });
      expect(_internals.activeTimers.has(userId)).toBe(true);

      const entry = _internals.activeTimers.get(userId);
      expect(entry.targetState).toBe('ON');
      expect(entry.duration).toBe(120000);
      expect(entry.timer).toBeDefined();
    });

    it('cancels existing timer for same user', async () => {
      const userId = 'user123';
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      // Start first timer
      await startDebounceTimer(userId, 'ON', callback1, 120000);
      expect(_internals.activeTimers.size).toBe(1);

      // Start second timer (should cancel first)
      await startDebounceTimer(userId, 'OFF', callback2, 30000);
      expect(_internals.activeTimers.size).toBe(1);

      // Only second timer should be active
      const entry = _internals.activeTimers.get(userId);
      expect(entry.targetState).toBe('OFF');
      expect(entry.duration).toBe(30000);
    });

    it('updates coordinationState.pendingDebounce to true', async () => {
      const userId = 'user123';
      const callback = jest.fn();

      await startDebounceTimer(userId, 'ON', callback, 120000);

      expect(updateCoordinationState).toHaveBeenCalledWith(
        expect.objectContaining({
          pendingDebounce: true,
          debounceStartedAt: expect.any(Number),
        })
      );
    });

    it('executes callback after delay', async () => {
      const userId = 'user123';
      const callback = jest.fn();

      await startDebounceTimer(userId, 'ON', callback, 120000);

      // Advance timers
      jest.advanceTimersByTime(120000);

      // Wait for async callback
      await Promise.resolve();

      expect(callback).toHaveBeenCalledTimes(1);
      expect(_internals.activeTimers.has(userId)).toBe(false);
    });

    it('updates state to pendingDebounce false when timer fires', async () => {
      const userId = 'user123';
      const callback = jest.fn();

      updateCoordinationState.mockClear();
      await startDebounceTimer(userId, 'ON', callback, 120000);

      // Advance timers
      jest.advanceTimersByTime(120000);
      await Promise.resolve();

      // Should be called twice: once on start, once on completion
      expect(updateCoordinationState).toHaveBeenCalledTimes(2);
      expect(updateCoordinationState).toHaveBeenLastCalledWith(
        expect.objectContaining({
          pendingDebounce: false,
          debounceStartedAt: null,
        })
      );
    });
  });

  describe('cancelDebounceTimer', () => {
    it('clears timer and removes from Map', async () => {
      const userId = 'user123';
      const callback = jest.fn();

      await startDebounceTimer(userId, 'ON', callback, 120000);
      expect(_internals.activeTimers.has(userId)).toBe(true);

      const result = await cancelDebounceTimer(userId);

      expect(result).toEqual({ cancelled: true });
      expect(_internals.activeTimers.has(userId)).toBe(false);

      // Advance timers - callback should NOT fire
      jest.advanceTimersByTime(120000);
      await Promise.resolve();
      expect(callback).not.toHaveBeenCalled();
    });

    it('updates coordinationState.pendingDebounce to false', async () => {
      const userId = 'user123';
      const callback = jest.fn();

      await startDebounceTimer(userId, 'ON', callback, 120000);
      updateCoordinationState.mockClear();

      await cancelDebounceTimer(userId);

      expect(updateCoordinationState).toHaveBeenCalledWith(
        expect.objectContaining({
          pendingDebounce: false,
          debounceStartedAt: null,
        })
      );
    });

    it('returns cancelled false if no timer exists', async () => {
      const result = await cancelDebounceTimer('nonexistent');
      expect(result).toEqual({ cancelled: false });
    });
  });

  describe('hasPendingDebounce', () => {
    it('returns true when timer exists', async () => {
      const userId = 'user123';
      const callback = jest.fn();

      await startDebounceTimer(userId, 'ON', callback, 120000);
      expect(hasPendingDebounce(userId)).toBe(true);
    });

    it('returns false when no timer exists', () => {
      expect(hasPendingDebounce('user123')).toBe(false);
    });
  });

  describe('getDebounceStatus', () => {
    it('returns null status when no timer', () => {
      const status = getDebounceStatus('user123');

      expect(status).toEqual({
        pending: false,
        startedAt: null,
        remainingMs: null,
        targetState: null,
      });
    });

    it('returns remaining time correctly', async () => {
      const userId = 'user123';
      const callback = jest.fn();

      await startDebounceTimer(userId, 'ON', callback, 120000);

      // Advance 60 seconds
      jest.advanceTimersByTime(60000);

      const status = getDebounceStatus(userId);

      expect(status.pending).toBe(true);
      expect(status.targetState).toBe('ON');
      expect(status.remainingMs).toBe(60000); // 120000 - 60000
      expect(status.startedAt).toBeGreaterThan(0);
    });
  });

  describe('handleStoveStateChange', () => {
    it('starts 2-min timer on ON with no pending', async () => {
      const userId = 'user123';
      const callback = jest.fn();

      const result = await handleStoveStateChange(userId, 'ON', callback);

      expect(result).toEqual({ action: 'timer_started', delayMs: 120000 });
      expect(_internals.activeTimers.has(userId)).toBe(true);

      const entry = _internals.activeTimers.get(userId);
      expect(entry.targetState).toBe('ON');
      expect(entry.duration).toBe(120000);
    });

    it('applies 30s retry on OFF during debounce with targetState ON', async () => {
      const userId = 'user123';
      const callback = jest.fn();

      // Start ON timer
      await handleStoveStateChange(userId, 'ON', callback);
      expect(_internals.activeTimers.get(userId).targetState).toBe('ON');
      expect(_internals.activeTimers.get(userId).duration).toBe(120000);

      // Stove turns OFF → should cancel and start 30s retry
      const result = await handleStoveStateChange(userId, 'OFF', callback);

      expect(result).toEqual({ action: 'retry_started', delayMs: 30000 });

      const entry = _internals.activeTimers.get(userId);
      expect(entry.targetState).toBe('OFF');
      expect(entry.duration).toBe(30000);
    });

    it('executes immediately on OFF with no pending', async () => {
      const userId = 'user123';
      const callback = jest.fn();

      const result = await handleStoveStateChange(userId, 'OFF', callback);

      expect(result).toEqual({ action: 'executed_immediately', delayMs: 0 });
      expect(callback).toHaveBeenCalledTimes(1);
      expect(_internals.activeTimers.has(userId)).toBe(false);
    });

    it('no action when state matches targetState', async () => {
      const userId = 'user123';
      const callback = jest.fn();

      // Start ON timer
      await handleStoveStateChange(userId, 'ON', callback);

      // Send ON again → no change
      const result = await handleStoveStateChange(userId, 'ON', callback);

      expect(result).toEqual({ action: 'no_change', delayMs: null });
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('removes old entries after 5 minutes', async () => {
      const userId = 'user123';
      const callback = jest.fn();

      await startDebounceTimer(userId, 'ON', callback, 120000);
      expect(_internals.activeTimers.size).toBe(1);

      // Advance 6 minutes (beyond maxAge)
      jest.advanceTimersByTime(6 * 60 * 1000);

      // Run cleanup
      _internals.cleanupOldEntries();

      expect(_internals.activeTimers.size).toBe(0);
    });

    it('does not remove recent entries', async () => {
      const userId = 'user123';
      const callback = jest.fn();

      await startDebounceTimer(userId, 'ON', callback, 120000);
      expect(_internals.activeTimers.size).toBe(1);

      // Advance 1 minute (within maxAge, and before timer expires)
      jest.advanceTimersByTime(1 * 60 * 1000);

      // Run cleanup
      _internals.cleanupOldEntries();

      expect(_internals.activeTimers.size).toBe(1);
    });
  });
});
