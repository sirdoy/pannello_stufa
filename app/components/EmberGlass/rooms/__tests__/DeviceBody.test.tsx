/**
 * DeviceBody spec: dispatch from device.kind to its body, and `hasDeviceBody` (ROADMAP M84).
 *
 * The bodies are stubs that expose which one was picked and whether `onError` was passed.
 * A device without a reading has no body: it would show made-up values (rule M78). The stove is
 * the exception: it keeps the safe command (switch off).
 */

import { fireEvent, render, screen } from '@testing-library/react';
import type { DeviceKind, RoomDevice } from '../types';

type BodyProps = { device: RoomDevice; onError?: (message: string | null) => void };

function mockBody(name: string) {
  return function MockBody({ device, onError }: BodyProps) {
    return (
      <button
        type="button"
        data-testid={`mock-${name}-body`}
        data-device={device.id}
        data-has-on-error={String(typeof onError === 'function')}
        onClick={() => onError?.(`${name} failed`)}
      />
    );
  };
}

jest.mock('../bodies/StoveBody', () => ({ StoveBody: mockBody('stove') }));
jest.mock('../bodies/ThermoBody', () => ({ ThermoBody: mockBody('thermo') }));
jest.mock('../bodies/LightBody', () => ({ LightBody: mockBody('light') }));
jest.mock('../bodies/PlugBody', () => ({ PlugBody: mockBody('plug') }));
jest.mock('../bodies/SonosBody', () => ({ SonosBody: mockBody('sonos') }));
jest.mock('../bodies/CameraBody', () => ({ CameraBody: mockBody('camera') }));
jest.mock('../bodies/SensorBody', () => ({ SensorBody: mockBody('sensor') }));
jest.mock('../bodies/HostBody', () => ({ HostBody: mockBody('host') }));

import { DeviceBody, hasDeviceBody } from '../DeviceBody';

/** Extra payload that gives each kind something to show */
const EXTRA: Record<DeviceKind, Record<string, unknown>> = {
  stove: { powerLevel: 3, fanLevel: 2 },
  thermo: { current: 20, target: 21, roomId: 'r1' },
  valve: { current: 20, target: 21, roomId: 'r2' },
  light: { lightId: '5', brightness: 80 },
  plug: { id: 'plug-1', power: 12, today_kwh: 1 },
  sonos: { id: 'RINCON_A:1', track: '', artist: '', volume: 20 },
  camera: { cameraId: 'cam-1', sd: 'on', power: 'on' },
  sensor: { sensor: { id: 's-1' } },
  host: { cpu: 7.5, temperature: 52, memory: 40 },
};

function makeDevice(kind: DeviceKind, over: Partial<RoomDevice> = {}): RoomDevice {
  return { id: 1, kind, name: 'Test', on: true, value: '', tone: '#fff', extra: EXTRA[kind], ...over };
}

describe('hasDeviceBody', () => {
  it.each<DeviceKind>(['stove', 'thermo', 'valve', 'light', 'plug', 'sonos', 'camera', 'sensor', 'host'])(
    'a %s with a reading has a body',
    (kind) => {
      expect(hasDeviceBody(makeDevice(kind))).toBe(true);
    },
  );

  it.each<DeviceKind>(['thermo', 'valve', 'light', 'plug', 'sonos', 'camera', 'sensor', 'host'])(
    'an unreachable %s has no body, even with a payload',
    (kind) => {
      expect(hasDeviceBody(makeDevice(kind, { unreachable: true }))).toBe(false);
    },
  );

  it('an unreachable stove keeps its body: the safe command (switch off) stays available', () => {
    expect(hasDeviceBody(makeDevice('stove', { unreachable: true, extra: {} }))).toBe(true);
  });

  it('a sensor still loading (no sensor payload) has no body', () => {
    expect(hasDeviceBody(makeDevice('sensor', { extra: {}, statusLabel: 'In attesa' }))).toBe(false);
  });

  it('a camera still loading (no camera id) has no body', () => {
    expect(hasDeviceBody(makeDevice('camera', { extra: {}, statusLabel: 'In attesa' }))).toBe(false);
  });

  it('a host without CPU stats (the Netatmo relay, a Pi without data) has no body', () => {
    expect(hasDeviceBody(makeDevice('host', { extra: {} }))).toBe(false);
    expect(hasDeviceBody(makeDevice('host', { extra: { cpu: null, temperature: null, memory: null } }))).toBe(false);
  });

  it('a host with 0% CPU still has a body', () => {
    expect(hasDeviceBody(makeDevice('host', { extra: { cpu: 0 } }))).toBe(true);
  });
});

describe('DeviceBody', () => {
  it.each<[DeviceKind, string]>([
    ['stove', 'stove'],
    ['thermo', 'thermo'],
    ['valve', 'thermo'],
    ['light', 'light'],
    ['plug', 'plug'],
    ['sonos', 'sonos'],
    ['camera', 'camera'],
    ['sensor', 'sensor'],
    ['host', 'host'],
  ])('kind "%s" renders the %s body with the device', (kind, body) => {
    const { container } = render(<DeviceBody device={makeDevice(kind, { id: 33 })} />);
    expect(screen.getByTestId(`mock-${body}-body`)).toHaveAttribute('data-device', '33');
    expect(container.children).toHaveLength(1);
  });

  it.each<DeviceKind>(['stove', 'thermo', 'valve', 'light', 'sonos'])(
    'the %s body can send commands: it receives onError',
    (kind) => {
      const onError = jest.fn();
      const { container } = render(<DeviceBody device={makeDevice(kind)} onError={onError} />);
      const body = container.firstElementChild as HTMLElement;
      expect(body).toHaveAttribute('data-has-on-error', 'true');
      fireEvent.click(body);
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(expect.stringMatching(/ failed$/));
    },
  );

  it.each<DeviceKind>(['plug', 'camera', 'sensor', 'host'])(
    'the %s body is read-only: it does not receive onError',
    (kind) => {
      const onError = jest.fn();
      const { container } = render(<DeviceBody device={makeDevice(kind)} onError={onError} />);
      expect(container.firstElementChild).toHaveAttribute('data-has-on-error', 'false');
    },
  );

  it.each<DeviceKind>(['thermo', 'valve', 'light', 'plug', 'sonos', 'camera', 'sensor', 'host'])(
    'renders nothing for an unreachable %s',
    (kind) => {
      const { container } = render(<DeviceBody device={makeDevice(kind, { unreachable: true })} />);
      expect(container).toBeEmptyDOMElement();
    },
  );

  it('renders the stove body for an unreachable stove, with onError', () => {
    const onError = jest.fn();
    render(<DeviceBody device={makeDevice('stove', { unreachable: true, on: false })} onError={onError} />);
    expect(screen.getByTestId('mock-stove-body')).toHaveAttribute('data-has-on-error', 'true');
  });

  it('renders nothing for a device without a reading to show', () => {
    const { container } = render(
      <>
        <DeviceBody device={makeDevice('sensor', { extra: {} })} />
        <DeviceBody device={makeDevice('camera', { extra: {} })} />
        <DeviceBody device={makeDevice('host', { extra: {} })} />
      </>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for an unknown kind', () => {
    const unknown = { ...makeDevice('stove'), kind: 'tv' as never };
    const { container } = render(<DeviceBody device={unknown} />);
    expect(container).toBeEmptyDOMElement();
  });
});
