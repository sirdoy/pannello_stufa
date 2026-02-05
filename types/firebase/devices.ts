/**
 * Device registry types - matches Firebase /devices/* structure
 */

/** Supported device types */
export type DeviceType = 'stove' | 'thermostat' | 'hue' | 'camera';

/** Device connection status */
export type ConnectionStatus = 'connected' | 'disconnected' | 'unknown';

/** Base device interface */
export interface DeviceBase {
  id: string;
  type: DeviceType;
  name: string;
  enabled: boolean;
  lastSeen?: string; // ISO 8601
  connectionStatus: ConnectionStatus;
}

/** Thermostat device */
export interface ThermostatDevice extends DeviceBase {
  type: 'thermostat';
  homeId?: string;
  roomId?: string;
  currentTemperature?: number;
  setpointTemperature?: number;
}

/** Hue device (bridge) */
export interface HueDevice extends DeviceBase {
  type: 'hue';
  bridgeId?: string;
  lightCount?: number;
}

/** Union of all device types */
export type Device = DeviceBase | ThermostatDevice | HueDevice;
