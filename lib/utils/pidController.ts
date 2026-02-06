/**
 * PID Controller Utility
 *
 * A pure, reusable PID (Proportional-Integral-Derivative) controller
 * for automated temperature regulation via stove power adjustment.
 *
 * Formula: output = kp * error + ki * integral + kd * derivative
 * Where:
 *   - error = setpoint - measured (positive when too cold)
 *   - integral += error * dt (with anti-windup clamp)
 *   - derivative = (error - prevError) / dt
 *
 * Usage:
 *   import { createPIDController } from '@/lib/utils/pidController';
 *
 *   const pid = createPIDController({ kp: 0.5, ki: 0.1, kd: 0.05 });
 *   const powerLevel = pid.compute(setpoint, measured, dt);
 */

/**
 * PID configuration parameters
 */
export interface PIDConfig {
  kp?: number;  // Proportional gain
  ki?: number;  // Integral gain
  kd?: number;  // Derivative gain
  outputMin?: number;  // Minimum output value
  outputMax?: number;  // Maximum output value
  integralMax?: number;  // Anti-windup integral limit
}

/**
 * PID internal state for persistence
 */
export interface PIDState {
  integral: number;
  prevError: number;
  initialized: boolean;
}

/**
 * PID Controller class
 *
 * @param {Object} options - Configuration options
 * @param {number} options.kp - Proportional gain (default: 0.5)
 * @param {number} options.ki - Integral gain (default: 0.1)
 * @param {number} options.kd - Derivative gain (default: 0.05)
 * @param {number} options.outputMin - Minimum output value (default: 1)
 * @param {number} options.outputMax - Maximum output value (default: 5)
 * @param {number} options.integralMax - Anti-windup integral limit (default: 10)
 */
export class PIDController {
  private kp: number;
  private ki: number;
  private kd: number;
  private outputMin: number;
  private outputMax: number;
  private integralMax: number;
  private integral: number;
  private prevError: number;
  private initialized: boolean;

  constructor({
    kp = 0.5,
    ki = 0.1,
    kd = 0.05,
    outputMin = 1,
    outputMax = 5,
    integralMax = 10,
  }: PIDConfig = {}) {
    this.kp = kp;
    this.ki = ki;
    this.kd = kd;
    this.outputMin = outputMin;
    this.outputMax = outputMax;
    this.integralMax = integralMax;

    // Internal state
    this.integral = 0;
    this.prevError = 0;
    this.initialized = false;
  }

  /**
   * Compute the PID output
   *
   * @param {number} setpoint - Target temperature
   * @param {number} measured - Current measured temperature
   * @param {number} dt - Time delta in minutes since last computation
   * @returns {number} - Power level (integer between outputMin and outputMax)
   */
  compute(setpoint: number, measured: number, dt: number): number {
    // Validate inputs
    if (typeof setpoint !== 'number' || typeof measured !== 'number') {
      throw new Error('setpoint and measured must be numbers');
    }
    if (typeof dt !== 'number' || dt <= 0) {
      throw new Error('dt must be a positive number');
    }

    // Calculate error (positive when too cold, need more heat)
    const error = setpoint - measured;

    // Proportional term
    const P = this.kp * error;

    // Integral term with anti-windup
    this.integral += error * dt;
    // Clamp integral to prevent windup
    this.integral = Math.max(-this.integralMax, Math.min(this.integralMax, this.integral));
    const I = this.ki * this.integral;

    // Derivative term (only if we have previous data)
    let D = 0;
    if (this.initialized) {
      const derivative = (error - this.prevError) / dt;
      D = this.kd * derivative;
    }

    // Store current error for next iteration
    this.prevError = error;
    this.initialized = true;

    // Calculate raw output
    const rawOutput = P + I + D;

    // Clamp to output bounds
    const clampedOutput = Math.max(this.outputMin, Math.min(this.outputMax, rawOutput));

    // Round to nearest integer for stove power level
    return Math.round(clampedOutput);
  }

  /**
   * Reset the controller state
   * Call this when starting fresh or after a long pause
   */
  reset(): void {
    this.integral = 0;
    this.prevError = 0;
    this.initialized = false;
  }

  /**
   * Get current controller state for persistence
   * @returns {Object} - { integral, prevError }
   */
  getState(): PIDState {
    return {
      integral: this.integral,
      prevError: this.prevError,
      initialized: this.initialized,
    };
  }

  /**
   * Restore controller state from persistence
   * @param {Object} state - { integral, prevError, initialized }
   */
  setState(state: Partial<PIDState>): void {
    if (state) {
      this.integral = state.integral ?? 0;
      this.prevError = state.prevError ?? 0;
      this.initialized = state.initialized ?? false;
    }
  }
}

/**
 * Factory function to create a PID controller
 *
 * @param {Object} options - Same options as PIDController constructor
 * @returns {PIDController} - Configured PID controller instance
 *
 * @example
 * const pid = createPIDController({ kp: 0.8, ki: 0.2 });
 * const power = pid.compute(21.0, 19.5, 5); // 5 minutes elapsed
 */
export function createPIDController(options: PIDConfig = {}): PIDController {
  return new PIDController(options);
}

/**
 * Default PID configuration for stove-thermostat automation
 * Conservative gains to prevent oscillation in heating systems
 */
export const DEFAULT_PID_CONFIG: Required<PIDConfig> = {
  kp: 0.5,      // Proportional gain - moderate response to error
  ki: 0.1,      // Integral gain - slow correction for steady-state error
  kd: 0.05,     // Derivative gain - damping to prevent overshoot
  outputMin: 1, // Minimum stove power level
  outputMax: 5, // Maximum stove power level
  integralMax: 10, // Anti-windup limit
};
