/**
 * Firebase type definitions barrel export
 */

// Stove types
export type {
  StoveStatus,
  StovePowerLevel,
  StoveState,
  StoveCommand,
} from './stove';

// Maintenance types
export type {
  MaintenanceType,
  MaintenanceHistoryEntry,
  MaintenanceRecord,
} from './maintenance';

// Notification types
export type {
  NotificationType,
  NotificationStatus,
  FCMToken,
  NotificationPreferences,
  NotificationHistoryEntry,
} from './notifications';

// Device types
export type {
  DeviceType,
  ConnectionStatus,
  DeviceBase,
  ThermostatDevice,
  HueDevice,
  Device,
} from './devices';
