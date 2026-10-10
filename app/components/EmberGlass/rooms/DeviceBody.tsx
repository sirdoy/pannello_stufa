'use client';
/**
 * DeviceBody — dispatcher from device.kind to its body (controls and readings under the header).
 * A kind without a body (the relay, a device still loading) renders nothing.
 */

import type { RoomDevice } from './types';
import { StoveBody } from './bodies/StoveBody';
import { ThermoBody } from './bodies/ThermoBody';
import { LightBody } from './bodies/LightBody';
import { PlugBody } from './bodies/PlugBody';
import { SonosBody } from './bodies/SonosBody';
import { CameraBody } from './bodies/CameraBody';
import { SensorBody } from './bodies/SensorBody';
import { HostBody } from './bodies/HostBody';

export interface DeviceBodyProps {
  device: RoomDevice;
  /** Reports a refused command to the card, which shows it (null clears it) */
  onError?: (message: string | null) => void;
}

/** True when the device has something to show under its header */
export function hasDeviceBody(device: RoomDevice): boolean {
  // A silent stove keeps its safe command: switching it off (rule M78)
  if (device.unreachable) return device.kind === 'stove';
  switch (device.kind) {
    case 'sensor': return device.extra['sensor'] !== undefined;
    case 'camera': return device.extra['cameraId'] !== undefined;
    case 'host':   return typeof device.extra['cpu'] === 'number';
    default:       return true;
  }
}

export function DeviceBody({ device, onError }: DeviceBodyProps) {
  if (!hasDeviceBody(device)) return null;
  switch (device.kind) {
    case 'stove':  return <StoveBody device={device} onError={onError} />;
    case 'thermo':
    case 'valve':  return <ThermoBody device={device} onError={onError} />;
    case 'light':  return <LightBody device={device} onError={onError} />;
    case 'plug':   return <PlugBody device={device} />;
    case 'sonos':  return <SonosBody device={device} onError={onError} />;
    case 'camera': return <CameraBody device={device} />;
    case 'sensor': return <SensorBody device={device} />;
    case 'host':   return <HostBody device={device} />;
    default:       return null;
  }
}
