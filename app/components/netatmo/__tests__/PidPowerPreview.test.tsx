// app/components/netatmo/__tests__/PidPowerPreview.test.js
/**
 * PID Power Preview Tests
 *
 * Tests the PID power preview calculation that shows
 * the expected boost power level on the thermostat settings page.
 * Uses the same PIDController as the production scheduler.
 */
import { PIDController } from '@/lib/utils/pidController';

/**
 * Mirror of the computePidPreview function from PidAutomationPanel.
 * Cold start simulation: no accumulated integral/derivative, dt=5 min.
 */
function computePidPreview(measured: number | null, setpoint: number | null, kp: number, ki: number, kd: number) {
  if (measured == null || setpoint == null) return null;
  const pid = new PIDController({ kp, ki, kd });
  return pid.compute(setpoint, measured, 5);
}

describe('PID Power Preview', () => {
  describe('computePidPreview', () => {
    it('should return null when measured is null', () => {
      expect(computePidPreview(null, 20, 0.5, 0.1, 0.05)).toBeNull();
    });

    it('should return null when setpoint is null', () => {
      expect(computePidPreview(18, null, 0.5, 0.1, 0.05)).toBeNull();
    });

    it('should return power level 1-5', () => {
      const result = computePidPreview(19, 21, 0.5, 0.1, 0.05);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(5);
    });

    it('should return integer power level', () => {
      const result = computePidPreview(18.5, 21, 0.5, 0.1, 0.05);
      expect(Number.isInteger(result)).toBe(true);
    });

    it('should return higher power when further below setpoint', () => {
      const smallError = computePidPreview(20, 21, 0.5, 0.1, 0.05);  // 1°C below
      const largeError = computePidPreview(17, 21, 0.5, 0.1, 0.05);  // 4°C below
      expect(largeError!).toBeGreaterThanOrEqual(smallError!);
    });

    it('should return minimum power when at or above setpoint', () => {
      const atTarget = computePidPreview(21, 21, 0.5, 0.1, 0.05);
      expect(atTarget).toBe(1);

      const aboveTarget = computePidPreview(23, 21, 0.5, 0.1, 0.05);
      expect(aboveTarget).toBe(1);
    });

    it('should return high power for large temperature deficit', () => {
      // 5°C below with default gains: error=5, P=0.5*5=2.5
      // integral=5*5=25 clamped to 10, I=0.1*10=1.0, D=0
      // Total=3.5 → rounded to 4
      const result = computePidPreview(16, 21, 0.5, 0.1, 0.05);
      expect(result).toBeGreaterThanOrEqual(3);
    });

    it('should return max power with aggressive gains', () => {
      // With kp=2.0, error=3: P=6 alone exceeds max → clamped to 5
      const result = computePidPreview(18, 21, 2.0, 0.1, 0.05);
      expect(result).toBe(5);
    });

    it('should respond to different kp values', () => {
      const lowKp = computePidPreview(18, 21, 0.2, 0.1, 0.05);
      const highKp = computePidPreview(18, 21, 2.0, 0.1, 0.05);
      expect(highKp!).toBeGreaterThanOrEqual(lowKp!);
    });

    it('should respond to different ki values', () => {
      const lowKi = computePidPreview(18, 21, 0.5, 0.01, 0.05);
      const highKi = computePidPreview(18, 21, 0.5, 0.5, 0.05);
      expect(highKi!).toBeGreaterThanOrEqual(lowKi!);
    });

    it('should produce consistent results with default gains', () => {
      // With defaults (kp=0.5, ki=0.1, kd=0.05), room at 19°C, target 21°C:
      // error = 2, P = 0.5*2 = 1.0, I = 0.1*(2*5) = 1.0, D = 0
      // Total = 2.0, rounded = 2
      const result = computePidPreview(19, 21, 0.5, 0.1, 0.05);
      expect(result).toBe(2);
    });

    it('should handle decimal temperatures', () => {
      const result = computePidPreview(18.7, 20.5, 0.5, 0.1, 0.05);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(5);
      expect(Number.isInteger(result)).toBe(true);
    });
  });
});
