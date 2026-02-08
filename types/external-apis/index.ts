/**
 * External APIs Type Definitions - Barrel Export
 *
 * Re-exports all external API type definitions for convenient importing.
 *
 * Usage:
 *   import type { HueLight, NetatmoHome, Camera } from '@/types/external-apis';
 *
 * Or specific modules:
 *   import type { HueLight } from '@/types/external-apis/hue';
 */

// Hue v2 API
export type {
  HueLight,
  HueRoom,
  HueGroupedLight,
  HueScene,
  HueBridge,
  HueBridgeConfig,
  HueEntertainment,
  HueButton,
  HueMotion,
} from './hue';

// Netatmo Energy API
export type {
  NetatmoDevice,
  NetatmoModule,
  NetatmoHome,
  NetatmoRoom,
  NetatmoSchedule,
  NetatmoZone,
  NetatmoTimetableSlot,
  NetatmoHomeStatus,
  NetatmoHomesData,
  NetatmoApiResponse,
  NetatmoTokenResponse,
  ParsedRoom,
  ParsedModule,
  ParsedSchedule,
  RoomTemperature,
} from './netatmo';

// Netatmo Security Camera API
export type {
  Camera,
  CameraModule,
  CameraEvent,
  CameraSnapshot,
  CameraPerson,
  CameraHome,
  CameraLiveStream,
  ParsedCamera,
  ParsedPerson,
  CameraSettings,
  CameraEventsResponse,
} from './camera';
