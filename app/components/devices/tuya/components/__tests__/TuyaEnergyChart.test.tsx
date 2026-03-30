import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useTuyaHistory } from '../../hooks/useTuyaHistory';
import type { TuyaHistoryItem } from '@/types/tuyaProxy';

// Mock next/dynamic to render children directly (no lazy loading in tests)
jest.mock('next/dynamic', () => (fn: () => Promise<{ default: React.ComponentType }>) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let Component: React.ComponentType<any> | null = null;
  fn().then((m) => {
    Component = m.default;
  });

  // Return a synchronous wrapper
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const DynamicComponent = (props: any) => {
    if (!Component) return null;
    return React.createElement(Component, props);
  };
  DynamicComponent.displayName = 'DynamicComponent';
  return DynamicComponent;
});

// Mock TuyaEnergyChartInner directly since dynamic import is mocked
jest.mock('../TuyaEnergyChartInner', () => ({
  __esModule: true,
  default: function MockTuyaEnergyChartInner({
    items,
    granularity,
  }: {
    items: TuyaHistoryItem[];
    granularity: string;
  }) {
    return (
      <div data-testid="chart-inner" data-granularity={granularity}>
        {items.map((item) => (
          <span key={item.timestamp} data-power-w={item.power_w} data-avg-power-w={item.avg_power_w} />
        ))}
      </div>
    );
  },
}));

// Mock useTuyaHistory
jest.mock('../../hooks/useTuyaHistory');
const mockUseTuyaHistory = useTuyaHistory as jest.MockedFunction<typeof useTuyaHistory>;

// Re-import after mocking
import TuyaEnergyChart from '../TuyaEnergyChart';

describe('TuyaEnergyChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders period selector with 3 buttons', () => {
    mockUseTuyaHistory.mockReturnValue({ data: null, loading: false, error: null });

    render(<TuyaEnergyChart deviceId="device-01" />);

    expect(screen.getByText('24h')).toBeInTheDocument();
    expect(screen.getByText('7g')).toBeInTheDocument();
    expect(screen.getByText('30g')).toBeInTheDocument();
  });

  it('shows loading state when fetching', () => {
    mockUseTuyaHistory.mockReturnValue({ data: null, loading: true, error: null });

    const { container } = render(<TuyaEnergyChart deviceId="device-01" />);

    const loadingDiv = container.querySelector('.animate-pulse');
    expect(loadingDiv).toBeInTheDocument();
  });

  it('renders chart with raw granularity dataKey power_w', () => {
    const rawItems: TuyaHistoryItem[] = [
      { timestamp: 1700000000, device_id: 'device-01', granularity: 'raw', power_w: 100 },
      { timestamp: 1700000060, device_id: 'device-01', granularity: 'raw', power_w: 120 },
    ];

    mockUseTuyaHistory.mockReturnValue({
      data: {
        device_id: 'device-01',
        granularity: 'raw',
        period: { from: 1700000000, to: 1700003600 },
        page: 1,
        page_size: 500,
        total: 2,
        items: rawItems,
      },
      loading: false,
      error: null,
    });

    render(<TuyaEnergyChart deviceId="device-01" />);

    const chartInner = screen.getByTestId('chart-inner');
    expect(chartInner).toBeInTheDocument();
    expect(chartInner).toHaveAttribute('data-granularity', 'raw');

    // Verify power_w data is passed
    const powerItems = chartInner.querySelectorAll('[data-power-w]');
    expect(powerItems).toHaveLength(2);
  });

  it('renders chart with hourly granularity dataKey avg_power_w', () => {
    const hourlyItems: TuyaHistoryItem[] = [
      {
        timestamp: 1700000000,
        device_id: 'device-01',
        granularity: 'hourly',
        avg_power_w: 95.5,
        energy_kwh_delta: 0.095,
      },
    ];

    mockUseTuyaHistory.mockReturnValue({
      data: {
        device_id: 'device-01',
        granularity: 'hourly',
        period: { from: 1700000000, to: 1700086400 },
        page: 1,
        page_size: 500,
        total: 1,
        items: hourlyItems,
      },
      loading: false,
      error: null,
    });

    render(<TuyaEnergyChart deviceId="device-01" />);

    const chartInner = screen.getByTestId('chart-inner');
    expect(chartInner).toBeInTheDocument();
    expect(chartInner).toHaveAttribute('data-granularity', 'hourly');

    // Verify avg_power_w data is passed
    const avgPowerItems = chartInner.querySelectorAll('[data-avg-power-w]');
    expect(avgPowerItems).toHaveLength(1);
  });
});
