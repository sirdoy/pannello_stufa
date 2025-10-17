/**
 * Device Registry - Main Export
 * Centralized exports for device management system
 */

export {
  DEVICE_TYPES,
  DEVICE_CONFIG,
  DEVICE_COLORS,
  GLOBAL_SECTIONS,
} from './deviceTypes';

export {
  getEnabledDevices,
  getDeviceConfig,
  getDeviceColors,
  deviceHasFeature,
  getDeviceNavItems,
  getGlobalNavItems,
  getNavigationStructure,
  isDeviceRoute,
  getActiveDevice,
  getDeviceBadge,
} from './deviceRegistry';
