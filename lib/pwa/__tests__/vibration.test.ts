/**
 * Vibration Service Tests
 */

import {
  isVibrationSupported,
  vibrate,
  stopVibration,
  vibrateShort,
  vibrateSuccess,
  vibrateWarning,
  vibrateError,
  vibrateCritical,
  VIBRATION_PATTERNS,
} from '../vibration';

describe('vibration', () => {
  describe('VIBRATION_PATTERNS', () => {
    it('has all required patterns', () => {
      expect(VIBRATION_PATTERNS.SHORT).toBeDefined();
      expect(VIBRATION_PATTERNS.MEDIUM).toBeDefined();
      expect(VIBRATION_PATTERNS.LONG).toBeDefined();
      expect(VIBRATION_PATTERNS.SUCCESS).toBeDefined();
      expect(VIBRATION_PATTERNS.WARNING).toBeDefined();
      expect(VIBRATION_PATTERNS.ERROR).toBeDefined();
      expect(VIBRATION_PATTERNS.CRITICAL).toBeDefined();
      expect(VIBRATION_PATTERNS.HEARTBEAT).toBeDefined();
      expect(VIBRATION_PATTERNS.NOTIFICATION).toBeDefined();
    });

    it('patterns are arrays', () => {
      Object.values(VIBRATION_PATTERNS).forEach((pattern) => {
        expect(Array.isArray(pattern)).toBe(true);
      });
    });
  });

  describe('isVibrationSupported', () => {
    it('returns boolean', () => {
      const result = isVibrationSupported();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('vibrate functions', () => {
    beforeEach(() => {
      // Mock navigator.vibrate
      navigator.vibrate = jest.fn().mockReturnValue(true);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('vibrate calls navigator.vibrate', () => {
      vibrate([100]);
      expect(navigator.vibrate).toHaveBeenCalledWith([100]);
    });

    it('vibrateShort uses SHORT pattern', () => {
      vibrateShort();
      expect(navigator.vibrate).toHaveBeenCalledWith(VIBRATION_PATTERNS.SHORT);
    });

    it('vibrateSuccess uses SUCCESS pattern', () => {
      vibrateSuccess();
      expect(navigator.vibrate).toHaveBeenCalledWith(VIBRATION_PATTERNS.SUCCESS);
    });

    it('vibrateWarning uses WARNING pattern', () => {
      vibrateWarning();
      expect(navigator.vibrate).toHaveBeenCalledWith(VIBRATION_PATTERNS.WARNING);
    });

    it('vibrateError uses ERROR pattern', () => {
      vibrateError();
      expect(navigator.vibrate).toHaveBeenCalledWith(VIBRATION_PATTERNS.ERROR);
    });

    it('vibrateCritical uses CRITICAL pattern', () => {
      vibrateCritical();
      expect(navigator.vibrate).toHaveBeenCalledWith(VIBRATION_PATTERNS.CRITICAL);
    });
  });

  describe('stopVibration', () => {
    it('calls navigator.vibrate(0)', () => {
      navigator.vibrate = jest.fn().mockReturnValue(true);
      stopVibration();
      expect(navigator.vibrate).toHaveBeenCalledWith(0);
    });
  });
});
