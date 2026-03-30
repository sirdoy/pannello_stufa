import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useTuyaData } from '@/app/components/devices/tuya/hooks/useTuyaData';
import { useTuyaCommands } from '@/app/components/devices/tuya/hooks/useTuyaCommands';
import type { TuyaPlug } from '@/types/tuyaProxy';

// Mock hooks
jest.mock('@/app/components/devices/tuya/hooks/useTuyaData');
jest.mock('@/app/components/devices/tuya/hooks/useTuyaCommands');

// Mock TuyaPlugCard to isolate page rendering
jest.mock('@/app/components/devices/tuya/components/TuyaPlugCard', () => ({
  TuyaPlugCard: function MockTuyaPlugCard({ plug }: { plug: TuyaPlug }) {
    return <div data-testid={`plug-card-${plug.device_id}`}>{plug.custom_name ?? plug.device_id}</div>;
  },
}));

const mockUseTuyaData = useTuyaData as jest.MockedFunction<typeof useTuyaData>;
const mockUseTuyaCommands = useTuyaCommands as jest.MockedFunction<typeof useTuyaCommands>;

const defaultCommands = {
  togglePlug: jest.fn().mockResolvedValue(null),
  setTimer: jest.fn().mockResolvedValue(null),
  cancelTimer: jest.fn().mockResolvedValue(null),
};

const mockPlug = (id: string): TuyaPlug => ({
  device_id: id,
  switch_on: true,
  power_w: 100,
  voltage_v: 220,
  current_ma: 455,
  energy_kwh: 1.5,
  countdown_s: 0,
  data_freshness: 'LIVE',
  last_polled_at: Date.now() / 1000,
  custom_name: `Plug ${id}`,
  device_type: 'smart_plug',
});

import TuyaPage from '../page';

describe('TuyaPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTuyaCommands.mockReturnValue(defaultCommands);
  });

  it('renders page heading', () => {
    mockUseTuyaData.mockReturnValue({
      plugs: [],
      loading: false,
      error: null,
      stale: false,
      lastUpdatedAt: null,
    });

    render(<TuyaPage />);

    expect(screen.getByText('Tuya Smart Plug')).toBeInTheDocument();
  });

  it('renders plug cards when data available', () => {
    const plugs = [mockPlug('device-01'), mockPlug('device-02')];

    mockUseTuyaData.mockReturnValue({
      plugs,
      loading: false,
      error: null,
      stale: false,
      lastUpdatedAt: Date.now(),
    });

    render(<TuyaPage />);

    expect(screen.getByTestId('plug-card-device-01')).toBeInTheDocument();
    expect(screen.getByTestId('plug-card-device-02')).toBeInTheDocument();
  });

  it('renders error when no data', () => {
    mockUseTuyaData.mockReturnValue({
      plugs: null,
      loading: false,
      error: 'Tuya non raggiungibile',
      stale: false,
      lastUpdatedAt: null,
    });

    render(<TuyaPage />);

    expect(screen.getByText(/Tuya non raggiungibile/i)).toBeInTheDocument();
  });

  it('grid has responsive classes', () => {
    const plugs = [mockPlug('device-01')];

    mockUseTuyaData.mockReturnValue({
      plugs,
      loading: false,
      error: null,
      stale: false,
      lastUpdatedAt: Date.now(),
    });

    const { container } = render(<TuyaPage />);

    const grid = container.querySelector('.grid-cols-1');
    expect(grid).toBeInTheDocument();
    expect(grid?.className).toContain('md:grid-cols-2');
    expect(grid?.className).toContain('lg:grid-cols-3');
  });
});
