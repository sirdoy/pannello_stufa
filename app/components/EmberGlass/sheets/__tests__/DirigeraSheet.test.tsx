/**
 * DirigeraSheet — air quality section for the IKEA ALPSTUGA (D10).
 */
import { render, screen } from '@testing-library/react';

import { DirigeraSheet } from '../DirigeraSheet';
import type { DirigeraSensor } from '@/types/dirigeraProxy';

jest.mock('@/app/components/devices/dirigera/hooks/useDirigeraFullData', () => ({
  useDirigeraFullData: () => ({ data: null, loading: true, error: null, stale: false }),
}));

const base = {
  relation_id: null,
  firmware_version: null,
  is_reachable: true,
  last_seen: null,
};

const SENSORS: DirigeraSensor[] = [
  { ...base, id: 'door', type: 'openCloseSensor', custom_name: 'Porta', room: 'Ingresso',
    battery_percentage: 80, is_open: false },
  { ...base, id: 'air', type: 'environmentSensor', custom_name: 'Aria', room: 'Cucina',
    battery_percentage: null, temperature: 21.25, humidity: 52, co2: 1700, pm25: 3 },
];

describe('DirigeraSheet air quality', () => {
  it('lists the monitor under Aria with CO2, PM2.5 and climate', () => {
    render(<DirigeraSheet sensors={SENSORS} loading={false} />);
    const air = screen.getByTestId('dirigera-sheet-air');
    expect(air).toHaveTextContent('CO₂ 1700 ppm');
    expect(air).toHaveTextContent('PM2.5 3 µg/m³');
    expect(screen.getByText('Cucina · 21,3° · 52%')).toBeInTheDocument();
    expect(screen.getByText('Chiuso')).toBeInTheDocument();
  });

  it('omits the section without monitors', () => {
    render(<DirigeraSheet sensors={[SENSORS[0]!]} loading={false} />);
    expect(screen.queryByTestId('dirigera-sheet-air')).not.toBeInTheDocument();
  });
});

describe('DirigeraSheet motion sensors (M60)', () => {
  const motion = (extra: Partial<DirigeraSensor>): DirigeraSensor => ({
    ...base, id: 'm', type: 'occupancySensor', custom_name: 'Movimento sala', room: 'Soggiorno',
    battery_percentage: 86, is_detected: true, ...extra,
  });

  it('shows motion state and light level on the same row', () => {
    render(<DirigeraSheet sensors={[motion({ light_level: 22 })]} loading={false} />);
    expect(screen.getByText('Movimento', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByTestId('dirigera-sheet-lux')).toHaveTextContent('22 lux');
  });

  it('keeps 0 lux (dark) and hides the reading without a light sensor', () => {
    const { rerender } = render(<DirigeraSheet sensors={[motion({ light_level: 0 })]} loading={false} />);
    expect(screen.getByTestId('dirigera-sheet-lux')).toHaveTextContent('0 lux');
    rerender(<DirigeraSheet sensors={[motion({})]} loading={false} />);
    expect(screen.queryByTestId('dirigera-sheet-lux')).not.toBeInTheDocument();
  });

  it('contact sensors never show lux', () => {
    render(<DirigeraSheet sensors={[SENSORS[0]!]} loading={false} />);
    expect(screen.queryByTestId('dirigera-sheet-lux')).not.toBeInTheDocument();
  });
});
