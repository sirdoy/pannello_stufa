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
