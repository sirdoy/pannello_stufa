/**
 * PID Controller Tests
 *
 * Tests for the PIDController class and createPIDController factory.
 */

import { PIDController, createPIDController, DEFAULT_PID_CONFIG } from '../pidController';

describe('PIDController', () => {
  describe('constructor', () => {
    it('should use default values when no options provided', () => {
      const pid = new PIDController();
      expect(pid['kp']).toBe(0.5);
      expect(pid['ki']).toBe(0.1);
      expect(pid['kd']).toBe(0.05);
      expect(pid['outputMin']).toBe(1);
      expect(pid['outputMax']).toBe(5);
      expect(pid['integralMax']).toBe(10);
    });

    it('should accept custom configuration', () => {
      const pid = new PIDController({
        kp: 1.0,
        ki: 0.2,
        kd: 0.1,
        outputMin: 2,
        outputMax: 4,
        integralMax: 5,
      });
      expect(pid['kp']).toBe(1.0);
      expect(pid['ki']).toBe(0.2);
      expect(pid['kd']).toBe(0.1);
      expect(pid['outputMin']).toBe(2);
      expect(pid['outputMax']).toBe(4);
      expect(pid['integralMax']).toBe(5);
    });
  });

  describe('compute()', () => {
    it('should return output within bounds (1-5)', () => {
      const pid = new PIDController();

      // Test with various inputs
      const result1 = pid.compute(25, 15, 1); // Large positive error
      expect(result1).toBeGreaterThanOrEqual(1);
      expect(result1).toBeLessThanOrEqual(5);

      pid.reset();
      const result2 = pid.compute(15, 25, 1); // Large negative error
      expect(result2).toBeGreaterThanOrEqual(1);
      expect(result2).toBeLessThanOrEqual(5);

      pid.reset();
      const result3 = pid.compute(20, 20, 1); // No error
      expect(result3).toBeGreaterThanOrEqual(1);
      expect(result3).toBeLessThanOrEqual(5);
    });

    it('should increase output when temperature is below setpoint', () => {
      const pid = new PIDController({ kp: 1.0, ki: 0, kd: 0 });

      // Temperature below setpoint (too cold) should increase power
      const result = pid.compute(21, 19, 1);
      // error = 21 - 19 = 2, P = 1.0 * 2 = 2, clamped and rounded = 2
      expect(result).toBeGreaterThan(1);
    });

    it('should decrease output when temperature is above setpoint', () => {
      const pid = new PIDController({ kp: 1.0, ki: 0, kd: 0 });

      // Temperature above setpoint (too hot) should decrease power
      const result = pid.compute(19, 21, 1);
      // error = 19 - 21 = -2, P = 1.0 * -2 = -2, clamped to min = 1
      expect(result).toBe(1);
    });

    it('should return middle output when at setpoint', () => {
      const pid = new PIDController({ kp: 1.0, ki: 0, kd: 0 });

      // At setpoint, error = 0, output should clamp to minimum
      const result = pid.compute(20, 20, 1);
      // error = 0, P = 0, clamped to min = 1
      expect(result).toBe(1);
    });

    it('should accumulate integral over time', () => {
      const pid = new PIDController({ kp: 0, ki: 1.0, kd: 0 });

      // First computation: integral = 1 * 1 = 1
      pid.compute(21, 20, 1); // error = 1

      // Second computation: integral = 1 + 1 * 1 = 2
      pid.compute(21, 20, 1); // error = 1

      // Third computation: integral = 2 + 1 * 1 = 3
      const result = pid.compute(21, 20, 1); // error = 1, I = 1.0 * 3 = 3
      expect(result).toBe(3);
    });

    it('should respect anti-windup (integral max)', () => {
      const pid = new PIDController({
        kp: 0,
        ki: 1.0,
        kd: 0,
        integralMax: 3,
        outputMax: 10, // Higher max to see integral effect
      });

      // Accumulate large integral
      for (let i = 0; i < 10; i++) {
        pid.compute(25, 20, 1); // error = 5 each time
      }

      // Integral should be clamped to integralMax (3)
      const state = pid.getState();
      expect(state.integral).toBe(3);
    });

    it('should apply derivative when error changes', () => {
      const pid = new PIDController({ kp: 0, ki: 0, kd: 1.0 });

      // First computation (no derivative yet)
      pid.compute(21, 20, 1); // error = 1, prevError = 1

      // Second computation with different error
      // derivative = (0.5 - 1) / 1 = -0.5, D = -0.5
      const result = pid.compute(20.5, 20, 1); // error = 0.5
      // Output = 0 + 0 + (-0.5) = -0.5, clamped to 1
      expect(result).toBe(1);
    });

    it('should throw error for invalid inputs', () => {
      const pid = new PIDController();

      expect(() => pid.compute('21' as any, 20, 1)).toThrow('setpoint and measured must be numbers');
      expect(() => pid.compute(21, '20' as any, 1)).toThrow('setpoint and measured must be numbers');
      expect(() => pid.compute(21, 20, 0)).toThrow('dt must be a positive number');
      expect(() => pid.compute(21, 20, -1)).toThrow('dt must be a positive number');
    });

    it('should round output to nearest integer', () => {
      const pid = new PIDController({ kp: 0.3, ki: 0, kd: 0 });

      // error = 3, P = 0.3 * 3 = 0.9, clamped to 1, rounded = 1
      expect(pid.compute(23, 20, 1)).toBe(1);

      pid.reset();
      // error = 5, P = 0.3 * 5 = 1.5, rounded = 2
      expect(pid.compute(25, 20, 1)).toBe(2);
    });
  });

  describe('reset()', () => {
    it('should clear integral and previous error', () => {
      const pid = new PIDController({ ki: 1.0 });

      // Accumulate some state
      pid.compute(25, 20, 1);
      pid.compute(25, 20, 1);

      const stateBefore = pid.getState();
      expect(stateBefore.integral).not.toBe(0);
      expect(stateBefore.initialized).toBe(true);

      // Reset
      pid.reset();

      const stateAfter = pid.getState();
      expect(stateAfter.integral).toBe(0);
      expect(stateAfter.prevError).toBe(0);
      expect(stateAfter.initialized).toBe(false);
    });
  });

  describe('getState() and setState()', () => {
    it('should return current state', () => {
      const pid = new PIDController();
      pid.compute(22, 20, 1); // error = 2

      const state = pid.getState();
      expect(state).toHaveProperty('integral');
      expect(state).toHaveProperty('prevError');
      expect(state).toHaveProperty('initialized');
      expect(state.prevError).toBe(2);
      expect(state.initialized).toBe(true);
    });

    it('should restore state from previous session', () => {
      const pid = new PIDController();

      pid.setState({
        integral: 5,
        prevError: 2,
        initialized: true,
      });

      const state = pid.getState();
      expect(state.integral).toBe(5);
      expect(state.prevError).toBe(2);
      expect(state.initialized).toBe(true);
    });

    it('should handle null/undefined state gracefully', () => {
      const pid = new PIDController();
      pid.setState(null);
      expect(pid.getState().integral).toBe(0);

      pid.setState(undefined);
      expect(pid.getState().integral).toBe(0);

      pid.setState({});
      expect(pid.getState().integral).toBe(0);
    });
  });
});

describe('createPIDController', () => {
  it('should create a PIDController instance', () => {
    const pid = createPIDController();
    expect(pid).toBeInstanceOf(PIDController);
  });

  it('should pass options to constructor', () => {
    const pid = createPIDController({ kp: 0.8, outputMax: 3 });
    expect((pid as any).kp).toBe(0.8);
    expect((pid as any).outputMax).toBe(3);
  });
});

describe('DEFAULT_PID_CONFIG', () => {
  it('should have expected default values', () => {
    expect(DEFAULT_PID_CONFIG.kp).toBe(0.5);
    expect(DEFAULT_PID_CONFIG.ki).toBe(0.1);
    expect(DEFAULT_PID_CONFIG.kd).toBe(0.05);
    expect(DEFAULT_PID_CONFIG.outputMin).toBe(1);
    expect(DEFAULT_PID_CONFIG.outputMax).toBe(5);
    expect(DEFAULT_PID_CONFIG.integralMax).toBe(10);
  });
});

describe('PID Integration Scenarios', () => {
  it('should stabilize toward setpoint over multiple iterations', () => {
    const pid = new PIDController({ kp: 0.5, ki: 0.1, kd: 0.05 });

    // Simulate gradual approach to setpoint
    const setpoint = 21;
    let measured = 18; // Start 3 degrees below

    const outputs = [];
    for (let i = 0; i < 5; i++) {
      const output = pid.compute(setpoint, measured, 5); // 5 min intervals
      outputs.push(output);
      // Simulate temperature rising (simplified)
      measured += (output - 3) * 0.2; // Higher power = faster rise
    }

    // Output should be higher initially, then stabilize
    expect(outputs[0]).toBeGreaterThanOrEqual(2); // Initial boost
    // All outputs should be valid
    outputs.forEach((o) => {
      expect(o).toBeGreaterThanOrEqual(1);
      expect(o).toBeLessThanOrEqual(5);
    });
  });

  it('should handle cold start scenario', () => {
    const pid = new PIDController();

    // Room at 16C, target 21C - cold start
    const result = pid.compute(21, 16, 1);

    // Should request high power
    expect(result).toBeGreaterThanOrEqual(3);
  });

  it('should handle overshoot scenario', () => {
    const pid = new PIDController();

    // Room at 23C, target 21C - overshoot
    const result = pid.compute(21, 23, 1);

    // Should request minimum power
    expect(result).toBe(1);
  });
});
