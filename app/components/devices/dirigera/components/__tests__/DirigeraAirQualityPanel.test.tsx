/**
 * DirigeraAirQualityPanel — IKEA ALPSTUGA readings on /dirigera (D10).
 */

import { render, screen } from '@testing-library/react';
import DirigeraAirQualityPanel from '../DirigeraAirQualityPanel';
import DirigeraTelemetryPanel from '../DirigeraTelemetryPanel';
import type { DirigeraSensor } from '@/types/dirigeraProxy';

const AIR: DirigeraSensor = {
  id: 'env-1',
  relation_id: null,
  type: 'environmentSensor',
  custom_name: 'Aria',
  room: 'Cucina',
  firmware_version: '1.0.26',
  battery_percentage: null,
  is_reachable: true,
  last_seen: '2026-10-01T12:05:23.000Z',
  temperature: 21.25,
  humidity: 52,
  co2: 1200,
  pm25: 3,
};

const DOOR: DirigeraSensor = {
  id: 'door',
  type: 'openCloseSensor',
  custom_name: 'Porta',
  room: 'Ingresso',
  firmware_version: null,
  battery_percentage: 80,
  is_reachable: true,
  last_seen: null,
  is_open: false,
};

describe('DirigeraAirQualityPanel', () => {
  it('renders nothing without environment sensors', () => {
    const { container } = render(<DirigeraAirQualityPanel sensors={[DOOR]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the four readings and colors CO2 by band', () => {
    render(<DirigeraAirQualityPanel sensors={[DOOR, AIR]} />);
    expect(screen.getByText('Aria')).toBeInTheDocument();
    expect(screen.getByText('1200 ppm')).toHaveClass('text-warning-400');
    expect(screen.getByText('3 µg/m³')).toHaveClass('text-success-400');
    expect(screen.getByText('21,3°')).toBeInTheDocument();
    expect(screen.getByText('52%')).toBeInTheDocument();
    expect(screen.getByText('Discreta')).toBeInTheDocument();
  });

  it('flags an unreachable monitor', () => {
    render(<DirigeraAirQualityPanel sensors={[{ ...AIR, is_reachable: false }]} />);
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });
});

describe('DirigeraTelemetryPanel air column', () => {
  it('renders air quality readings and a dash for other sensors', () => {
    render(
      <DirigeraTelemetryPanel
        items={[
          { id: 1, sensor_id: 'env-1', battery_percentage: null, light_level: null,
            temperature: 21.25, humidity: 52, co2: 430, pm25: 3, timestamp: 1790000000 },
          { id: 2, sensor_id: 'door', battery_percentage: 80, light_level: null, timestamp: 1790000000 },
        ]}
        total={2}
        loading={false}
        isLoadingMore={false}
        error={null}
        stale={false}
        loadMore={() => {}}
      />,
    );
    expect(screen.getByText('430 ppm · PM2.5 3 µg/m³ · 21,3° · 52%')).toBeInTheDocument();
  });
});
