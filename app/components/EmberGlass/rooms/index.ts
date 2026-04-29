/**
 * Phase 179 — Rooms tab barrel export.
 *
 * Exports every component, primitive, body, lib symbol, and type
 * per CONTEXT D-68. Phase 181+ can import via:
 *   import { RoomsTab } from '@/app/components/EmberGlass/rooms';
 */

// Orchestrator + main components
export { RoomsTab } from './RoomsTab';
export { RoomCard } from './RoomCard';
export type { RoomCardProps } from './RoomCard';
export { RoomSheet } from './RoomSheet';
export type { RoomSheetProps } from './RoomSheet';

// Device presentation
export { DeviceChip } from './DeviceChip';
export { DeviceCard } from './DeviceCard';
export type { DeviceCardProps } from './DeviceCard';
export { DevicePrimaryControl } from './DevicePrimaryControl';
export { DeviceBody } from './DeviceBody';

// Bodies
export { StoveBody } from './bodies/StoveBody';
export { ThermoBody, ValveBody } from './bodies/ThermoBody';
export { LightBody } from './bodies/LightBody';
export { PlugBody } from './bodies/PlugBody';
export { SonosBody } from './bodies/SonosBody';
export { TvBody } from './bodies/TvBody';
export { ShadeBody } from './bodies/ShadeBody';
export { CameraBody } from './bodies/CameraBody';
export { SensorBody } from './bodies/SensorBody';

// Primitives
export { StatChip } from './primitives/StatChip';
export type { StatChipProps } from './primitives/StatChip';
export { DualTempReadout } from './primitives/DualTempReadout';
export type { DualTempReadoutProps } from './primitives/DualTempReadout';
export { SliderRow } from './primitives/SliderRow';
export type { SliderRowProps } from './primitives/SliderRow';
export { ControlRow } from './primitives/ControlRow';
export { MiniButton } from './primitives/MiniButton';
export type { MiniButtonProps } from './primitives/MiniButton';

// Lib + types
export { getDevicesForRoom } from './lib/getDevicesForRoom';
export {
  ROOMS,
  ROOM_ALIASES,
  EXTRA_DEVICES,
  ICON_FOR,
  CATEGORY_ORDER,
  CATEGORY_LABEL,
} from './lib/rooms-config';
export type {
  RoomDevice,
  RoomConfig,
  DeviceKind,
  AggregatorState,
} from './types';
