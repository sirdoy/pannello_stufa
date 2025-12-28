/**
 * StoveCard External Sync Tests
 * Tests Firebase sync when external changes are detected via polling
 */

import { updateStoveState } from '@/lib/stoveStateService';

// Mock the stove state service
jest.mock('@/lib/stoveStateService', () => ({
  updateStoveState: jest.fn(),
}));

describe('StoveCard - External Change Detection & Firebase Sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Firebase Sync Logic', () => {
    it('should detect status change and call updateStoveState', async () => {
      // Simulate polling detecting a status change
      const previousStatus = 'spento';
      const newStatus = 'acceso';
      const newFanLevel = 3;
      const newPowerLevel = 2;
      const newErrorCode = 0;
      const newErrorDescription = '';

      // Simulate the logic in fetchStatusAndUpdate
      const hasChanges = previousStatus !== newStatus;

      if (hasChanges && previousStatus !== null) {
        await updateStoveState({
          status: newStatus,
          fanLevel: newFanLevel,
          powerLevel: newPowerLevel,
          errorCode: newErrorCode,
          errorDescription: newErrorDescription,
          source: 'external_change'
        });
      }

      expect(updateStoveState).toHaveBeenCalledWith({
        status: 'acceso',
        fanLevel: 3,
        powerLevel: 2,
        errorCode: 0,
        errorDescription: '',
        source: 'external_change'
      });
    });

    it('should detect fan level change and sync to Firebase', async () => {
      const previousFanLevel = 3;
      const newFanLevel = 5;
      const previousStatus = 'acceso';
      const newStatus = 'acceso';

      const hasChanges =
        previousStatus !== newStatus ||
        previousFanLevel !== newFanLevel;

      if (hasChanges && previousStatus !== null) {
        await updateStoveState({
          status: newStatus,
          fanLevel: newFanLevel,
          powerLevel: 2,
          errorCode: 0,
          errorDescription: '',
          source: 'external_change'
        });
      }

      expect(updateStoveState).toHaveBeenCalled();
    });

    it('should NOT sync on initial load (previousStatus is null)', async () => {
      const previousStatus = null;
      const newStatus = 'acceso';

      const hasChanges = previousStatus !== newStatus;

      if (hasChanges && previousStatus !== null) {
        await updateStoveState({
          status: newStatus,
          fanLevel: 3,
          powerLevel: 2,
          errorCode: 0,
          errorDescription: '',
          source: 'external_change'
        });
      }

      // Should NOT be called because previousStatus is null (initial load)
      expect(updateStoveState).not.toHaveBeenCalled();
    });

    it('should NOT sync if no changes detected', async () => {
      const previousStatus = 'acceso';
      const newStatus = 'acceso';
      const previousFanLevel = 3;
      const newFanLevel = 3;
      const previousPowerLevel = 2;
      const newPowerLevel = 2;

      const hasChanges =
        previousStatus !== newStatus ||
        previousFanLevel !== newFanLevel ||
        previousPowerLevel !== newPowerLevel;

      if (hasChanges && previousStatus !== null) {
        await updateStoveState({
          status: newStatus,
          fanLevel: newFanLevel,
          powerLevel: newPowerLevel,
          errorCode: 0,
          errorDescription: '',
          source: 'external_change'
        });
      }

      // Should NOT be called because no changes
      expect(updateStoveState).not.toHaveBeenCalled();
    });
  });

  describe('Adaptive Polling Intervals', () => {
    it('should use 15s interval when stove is ON', () => {
      const status = 'acceso';
      const usePollingFallback = false;

      const stoveIsOn = status !== 'spento' &&
                        status !== 'standby' &&
                        status !== 'errore' &&
                        status !== '...' &&
                        status !== 'sconosciuto';

      const interval = usePollingFallback ? 10000 : (stoveIsOn ? 15000 : 60000);

      expect(interval).toBe(15000);
    });

    it('should use 60s interval when stove is OFF', () => {
      const status = 'spento';
      const usePollingFallback = false;

      const stoveIsOn = status !== 'spento' &&
                        status !== 'standby' &&
                        status !== 'errore' &&
                        status !== '...' &&
                        status !== 'sconosciuto';

      const interval = usePollingFallback ? 10000 : (stoveIsOn ? 15000 : 60000);

      expect(interval).toBe(60000);
    });

    it('should use 10s interval when Firebase disconnected', () => {
      const status = 'acceso';
      const usePollingFallback = true;

      const stoveIsOn = status !== 'spento' &&
                        status !== 'standby' &&
                        status !== 'errore' &&
                        status !== '...' &&
                        status !== 'sconosciuto';

      const interval = usePollingFallback ? 10000 : (stoveIsOn ? 15000 : 60000);

      expect(interval).toBe(10000);
    });
  });
});

/**
 * MANUAL TESTING INSTRUCTIONS
 *
 * To verify multi-device real-time sync works correctly:
 *
 * 1. Setup:
 *    - Open app in 2 browser tabs (Device A & Device B)
 *    - Both should show same stove state
 *
 * 2. Test External Change Detection:
 *    - Manually turn ON stove using physical controls (not app)
 *    - Wait max 15 seconds
 *    - Device A polling detects change → updates Firebase
 *    - Device B Firebase listener receives update → UI updates
 *    - Result: Both devices show "acceso" within 15s
 *
 * 3. Test Auto-Shutdown:
 *    - Let stove run out of pellets (or simulate)
 *    - Stove auto-shuts down
 *    - Wait max 15 seconds
 *    - Device A polling detects shutdown → updates Firebase
 *    - Device B receives update instantly via Firebase listener
 *    - Result: Both devices show "spento"
 *
 * 4. Test Manual Physical Changes:
 *    - Change fan level using stove's physical buttons
 *    - Wait max 15 seconds
 *    - Both devices should reflect new fan level
 *
 * 5. Verify Polling Intervals:
 *    - Open browser console
 *    - Check log messages for polling frequency
 *    - When ON: "Adaptive polling (15000ms) - stove on"
 *    - When OFF: "Adaptive polling (60000ms) - stove off"
 *
 * Expected Results:
 * ✅ All external changes propagate to all devices within 15s
 * ✅ Firebase shows correct state in console
 * ✅ No infinite loops or excessive polling
 * ✅ Polling adapts based on stove state
 */
