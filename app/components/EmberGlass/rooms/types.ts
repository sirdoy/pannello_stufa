/**
 * Rooms tab type contracts (ROADMAP M84).
 *
 * Rooms and their members come from the Pi (`GET /api/rooms/house/status`); each member is joined
 * with the live data of its provider hook through the registry `device_id`.
 */

import type { HueLight } from '@/types/hueProxy';
import type { TuyaPlug } from '@/types/tuyaProxy';
import type { DirigeraSensor } from '@/types/dirigeraProxy';
import type { CameraStatus } from '@/types/netatmoProxy';
import type { NetatmoTopology, NetatmoStatus } from '@/app/components/devices/thermostat/hooks/useThermostatData';
import type { SonosFullData } from '@/app/components/devices/sonos/hooks/useSonosFullData';

export type DeviceKind =
  | 'stove'
  | 'thermo'
  | 'valve'
  | 'light'
  | 'plug'
  | 'sonos'
  | 'camera'
  | 'sensor'
  | 'host';

export type RoomIcon = 'home' | 'sofa' | 'kitchen' | 'bed' | 'bath' | 'door' | 'garage' | 'box';

export interface RoomConfig {
  /** Room id on the Pi */
  id: number;
  name: string;
  tone: string; // 'var(--accent)' or hex
  icon: RoomIcon;
}

export interface RoomDevice {
  /** Registry id of the device: stable key inside a room */
  id: number;
  kind: DeviceKind;
  name: string;
  /** Lit in the card and counted as active (light on, window open, music playing, heating) */
  on: boolean;
  /** First part of the status line; defaults to "Attivo" / "Inattivo" */
  statusLabel?: string;
  /** Second part of the status line ("21.3° → 21°", "450W") */
  value: string;
  tone: string;
  /** The provider has no reading for this device: never shown as a device state (rule M78) */
  unreachable?: boolean;
  /** Kind-specific payload read by the bodies */
  extra: Record<string, unknown>;
}

/** Live data of the provider hooks, as the Rooms tab reads them. `null` = not loaded yet. */
export interface LiveState {
  stove: { on: boolean; powerLevel: number | null; fanLevel: number | null; unreachable: boolean } | null;
  thermostat: { topology: NetatmoTopology | null; status: NetatmoStatus | null };
  lights: HueLight[] | null;
  plugs: TuyaPlug[] | null;
  sonos: SonosFullData | null;
  sensors: DirigeraSensor[] | null;
  cameras: CameraStatus[] | null;
}
