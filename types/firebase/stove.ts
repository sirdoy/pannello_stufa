/**
 * Stove data types - matches Firebase /stove/* structure
 */

/** Stove operational status */
export type StoveStatus =
  | 'off'
  | 'igniting'
  | 'running'
  | 'modulating'
  | 'shutdown'
  | 'error'
  | 'standby'
  | 'START'
  | 'STANDBY';

/** Stove power level (1-5) */
export type StovePowerLevel = 1 | 2 | 3 | 4 | 5;

/** Stove state as stored in Firebase /stove/state */
export interface StoveState {
  status: StoveStatus;
  power: StovePowerLevel;
  targetTemperature: number;
  currentTemperature?: number;
  exhaustTemperature?: number;
  lastUpdatedAt: string; // ISO 8601
  errorCode?: string;
  errorMessage?: string;
  fanLevel?: number;
  powerLevel?: number;
  statusDescription?: string;
  source?: string;
}

/** Stove command for API requests */
export interface StoveCommand {
  action: 'power_on' | 'power_off' | 'set_power' | 'set_temperature';
  value?: number;
}

/** PID tuning log entry for analysis and optimization */
export interface PIDTuningLogEntry {
  timestamp: number; // Unix timestamp in milliseconds
  roomTemp: number; // Measured room temperature (°C)
  powerLevel: number; // Current stove power level (1-5)
  setpoint: number; // Target temperature (°C)
  pidOutput: number; // Computed PID output (1-5)
  error: number; // Current error (setpoint - measured)
  integral: number; // Integral term state
  derivative: number; // Derivative term (change in error)
  roomId: string; // Netatmo room ID being monitored
  roomName: string; // Room display name
}
