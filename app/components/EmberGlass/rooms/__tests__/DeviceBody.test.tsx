/**
 * DeviceBody jest spec — Plan 179-08 (ROOMS-04 / CONTEXT D-26).
 *
 * Mocks all *Body imports so DeviceBody can be tested in isolation.
 * Each mock renders a data-testid indicating which body was selected.
 *
 * Tests:
 *   1. kind='stove' → StoveBody
 *   2. kind='thermo' → ThermoBody
 *   3. kind='valve' → ValveBody (ThermoBody.tsx exports both)
 *   4. kind='light' → LightBody; 'plug' → PlugBody; 'sonos' → SonosBody;
 *      'tv' → TvBody; 'shade' → ShadeBody; 'camera' → CameraBody; 'sensor' → SensorBody
 *   5. unknown kind → renders nothing (null)
 */

import { render, screen } from '@testing-library/react';
import type { RoomDevice } from '../types';

// Stub all *Body imports
jest.mock('../bodies/StoveBody', () => ({
  StoveBody: ({ device }: { device: RoomDevice }) => (
    <div data-testid={`mock-stove-body-${device.name}`} />
  ),
}));

jest.mock('../bodies/ThermoBody', () => ({
  ThermoBody: ({ device }: { device: RoomDevice }) => (
    <div data-testid={`mock-thermo-body-${device.name}`} />
  ),
  ValveBody: ({ device }: { device: RoomDevice }) => (
    <div data-testid={`mock-valve-body-${device.name}`} />
  ),
}));

jest.mock('../bodies/LightBody', () => ({
  LightBody: ({ device }: { device: RoomDevice }) => (
    <div data-testid={`mock-light-body-${device.name}`} />
  ),
}));

jest.mock('../bodies/PlugBody', () => ({
  PlugBody: ({ device }: { device: RoomDevice }) => (
    <div data-testid={`mock-plug-body-${device.name}`} />
  ),
}));

jest.mock('../bodies/SonosBody', () => ({
  SonosBody: ({ device }: { device: RoomDevice }) => (
    <div data-testid={`mock-sonos-body-${device.name}`} />
  ),
}));

jest.mock('../bodies/TvBody', () => ({
  TvBody: ({ device }: { device: RoomDevice }) => (
    <div data-testid={`mock-tv-body-${device.name}`} />
  ),
}));

jest.mock('../bodies/ShadeBody', () => ({
  ShadeBody: ({ device }: { device: RoomDevice }) => (
    <div data-testid={`mock-shade-body-${device.name}`} />
  ),
}));

jest.mock('../bodies/CameraBody', () => ({
  CameraBody: ({ device }: { device: RoomDevice }) => (
    <div data-testid={`mock-camera-body-${device.name}`} />
  ),
}));

jest.mock('../bodies/SensorBody', () => ({
  SensorBody: ({ device }: { device: RoomDevice }) => (
    <div data-testid={`mock-sensor-body-${device.name}`} />
  ),
}));

import { DeviceBody } from '../DeviceBody';

const makeDevice = (kind: RoomDevice['kind'], name = 'Test'): RoomDevice => ({
  kind,
  name,
  on: true,
  value: '',
  tone: '#fff',
  extra: {},
});

describe('DeviceBody (ROOMS-04 / CONTEXT D-26)', () => {
  it('Test 1: renders StoveBody for kind="stove"', () => {
    render(<DeviceBody device={makeDevice('stove', 'Stufa')} />);
    expect(screen.getByTestId('mock-stove-body-Stufa')).toBeInTheDocument();
  });

  it('Test 2: renders ThermoBody for kind="thermo"', () => {
    render(<DeviceBody device={makeDevice('thermo', 'Thermo')} />);
    expect(screen.getByTestId('mock-thermo-body-Thermo')).toBeInTheDocument();
  });

  it('Test 3: renders ValveBody for kind="valve"', () => {
    render(<DeviceBody device={makeDevice('valve', 'Valve')} />);
    expect(screen.getByTestId('mock-valve-body-Valve')).toBeInTheDocument();
  });

  it('Test 4a: renders LightBody for kind="light"', () => {
    render(<DeviceBody device={makeDevice('light', 'Luce')} />);
    expect(screen.getByTestId('mock-light-body-Luce')).toBeInTheDocument();
  });

  it('Test 4b: renders PlugBody for kind="plug"', () => {
    render(<DeviceBody device={makeDevice('plug', 'Presa')} />);
    expect(screen.getByTestId('mock-plug-body-Presa')).toBeInTheDocument();
  });

  it('Test 4c: renders SonosBody for kind="sonos"', () => {
    render(<DeviceBody device={makeDevice('sonos', 'Sonos')} />);
    expect(screen.getByTestId('mock-sonos-body-Sonos')).toBeInTheDocument();
  });

  it('Test 4d: renders TvBody for kind="tv"', () => {
    render(<DeviceBody device={makeDevice('tv', 'TV')} />);
    expect(screen.getByTestId('mock-tv-body-TV')).toBeInTheDocument();
  });

  it('Test 4e: renders ShadeBody for kind="shade"', () => {
    render(<DeviceBody device={makeDevice('shade', 'Tapparella')} />);
    expect(screen.getByTestId('mock-shade-body-Tapparella')).toBeInTheDocument();
  });

  it('Test 4f: renders CameraBody for kind="camera"', () => {
    render(<DeviceBody device={makeDevice('camera', 'Camera')} />);
    expect(screen.getByTestId('mock-camera-body-Camera')).toBeInTheDocument();
  });

  it('Test 4g: renders SensorBody for kind="sensor"', () => {
    render(<DeviceBody device={makeDevice('sensor', 'Sensore')} />);
    expect(screen.getByTestId('mock-sensor-body-Sensore')).toBeInTheDocument();
  });

  it('Test 5: renders nothing for unknown kind (returns null)', () => {
    // Cast to never to test the default branch
    const unknownDevice = { ...makeDevice('stove', 'X'), kind: 'unknown' as never };
    const { container } = render(<DeviceBody device={unknownDevice} />);
    expect(container.firstChild).toBeNull();
  });
});
