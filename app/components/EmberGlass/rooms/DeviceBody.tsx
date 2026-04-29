'use client';
/**
 * DeviceBody — Phase 179 (Plan 179-08 Wave 3 / ROOMS-04 / CONTEXT D-26)
 *
 * Pure dispatcher — switch on device.kind to the matching *Body component.
 * Placed in Wave 3 (not Wave 2) because all 9 body files from Plans 05/06/07
 * must exist before this file's imports type-check.
 *
 * Bundle source: rooms.jsx:354-509 (switch helper pattern).
 * RC-clean: no hooks, no state, no manual memo — just a switch statement.
 * D-66/D-67: React Compiler auto-memoizes. No manual memo hooks — pure switch.
 */

import type { RoomDevice } from './types';
import { StoveBody } from './bodies/StoveBody';
import { ThermoBody, ValveBody } from './bodies/ThermoBody';
import { LightBody } from './bodies/LightBody';
import { PlugBody } from './bodies/PlugBody';
import { SonosBody } from './bodies/SonosBody';
import { TvBody } from './bodies/TvBody';
import { ShadeBody } from './bodies/ShadeBody';
import { CameraBody } from './bodies/CameraBody';
import { SensorBody } from './bodies/SensorBody';

export function DeviceBody({ device }: { device: RoomDevice }): JSX.Element | null {
  switch (device.kind) {
    case 'stove':  return <StoveBody device={device} />;
    case 'thermo': return <ThermoBody device={device} />;
    case 'valve':  return <ValveBody device={device} />;
    case 'light':  return <LightBody device={device} />;
    case 'plug':   return <PlugBody device={device} />;
    case 'sonos':  return <SonosBody device={device} />;
    case 'tv':     return <TvBody device={device} />;
    case 'shade':  return <ShadeBody device={device} />;
    case 'camera': return <CameraBody device={device} />;
    case 'sensor': return <SensorBody device={device} />;
    default:       return null;
  }
}
