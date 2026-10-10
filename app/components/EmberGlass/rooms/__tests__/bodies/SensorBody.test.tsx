/**
 * SensorBody — readings of an IKEA DIRIGERA sensor (ROADMAP M84), from the live payload in
 * `device.extra.sensor`: one chip per field the sensor has, nothing without a sensor.
 */

import { render, screen, within } from '@testing-library/react';
import { SensorBody } from '../../bodies/SensorBody';
import type { DirigeraSensor } from '@/types/dirigeraProxy';
import type { RoomDevice } from '../../types';

function makeSensor(overrides: Partial<DirigeraSensor>): DirigeraSensor {
  return {
    id: 'sensor-1_1',
    type: 'openCloseSensor',
    custom_name: 'Finestra sala',
    room: 'Sala',
    firmware_version: '1.0.0',
    battery_percentage: null,
    is_reachable: true,
    last_seen: '2026-10-10T08:00:00Z',
    ...overrides,
  };
}

function makeDevice(sensor?: DirigeraSensor): RoomDevice {
  return {
    id: 16,
    kind: 'sensor',
    name: 'Finestra sala',
    on: false,
    statusLabel: 'Chiusa',
    value: '',
    tone: '#5ec8d8',
    extra: sensor ? { sensor } : {},
  };
}

/** Chips in the order they are rendered, as [label, value] */
function chips(): Array<[string | null, string | null]> {
  return screen.queryAllByTestId('stat-chip').map((chip) => [
    chip.firstElementChild!.textContent,
    within(chip).getByTestId('stat-chip-value').textContent,
  ]);
}

describe('SensorBody', () => {
  it('window contact: state and battery', () => {
    render(<SensorBody device={makeDevice(makeSensor({ is_open: true, battery_percentage: 87 }))} />);

    expect(chips()).toEqual([
      ['Stato', 'Aperta'],
      ['Batteria', '87%'],
    ]);
  });

  it('window contact closed', () => {
    render(<SensorBody device={makeDevice(makeSensor({ is_open: false, battery_percentage: 100 }))} />);

    expect(chips()).toEqual([
      ['Stato', 'Chiusa'],
      ['Batteria', '100%'],
    ]);
  });

  it('motion sensor: movement, light level and battery', () => {
    const sensor = makeSensor({ type: 'occupancySensor', is_detected: true, light_level: 12, battery_percentage: 64 });
    render(<SensorBody device={makeDevice(sensor)} />);

    expect(chips()).toEqual([
      ['Movimento', 'Sì'],
      ['Luce', '12 lx'],
      ['Batteria', '64%'],
    ]);
  });

  it('motion sensor with no movement, in the dark, without a light reading', () => {
    const dark = makeSensor({ type: 'occupancySensor', is_detected: false, light_level: 0, battery_percentage: 5 });
    const { unmount } = render(<SensorBody device={makeDevice(dark)} />);
    expect(chips()).toEqual([
      ['Movimento', 'No'],
      ['Luce', '0 lx'],
      ['Batteria', '5%'],
    ]);
    unmount();

    const noLight = makeSensor({ type: 'motionSensor', is_detected: false, light_level: null });
    render(<SensorBody device={makeDevice(noLight)} />);
    expect(chips()).toEqual([['Movimento', 'No']]);
  });

  it('air monitor: temperature, humidity, CO₂ and PM2.5, rounded, no battery chip', () => {
    const sensor = makeSensor({
      type: 'environmentSensor',
      temperature: 21.26,
      humidity: 48.6,
      co2: 612.4,
      pm25: 3.5,
    });
    render(<SensorBody device={makeDevice(sensor)} />);

    expect(chips()).toEqual([
      ['Temp.', '21.3°'],
      ['Umidità', '49%'],
      ['CO₂', '612 ppm'],
      ['PM2.5', '4 µg'],
    ]);
  });

  it('skips the readings the hub sent as null', () => {
    const sensor = makeSensor({
      type: 'environmentSensor',
      temperature: 19,
      humidity: null,
      co2: null,
      pm25: null,
    });
    render(<SensorBody device={makeDevice(sensor)} />);

    expect(chips()).toEqual([['Temp.', '19.0°']]);
  });

  it('shows a zero reading, it is not "missing"', () => {
    const sensor = makeSensor({ type: 'environmentSensor', temperature: 0, humidity: 0, co2: 0, pm25: 0 });
    render(<SensorBody device={makeDevice(sensor)} />);

    expect(chips()).toEqual([
      ['Temp.', '0.0°'],
      ['Umidità', '0%'],
      ['CO₂', '0 ppm'],
      ['PM2.5', '0 µg'],
    ]);
  });

  it('renders nothing without a sensor', () => {
    const { container } = render(<SensorBody device={makeDevice()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for a sensor with no reading at all', () => {
    const { container } = render(<SensorBody device={makeDevice(makeSensor({}))} />);
    expect(container).toBeEmptyDOMElement();
  });
});
