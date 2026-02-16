import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BandwidthChart from '@/app/network/components/BandwidthChart';
import type { BandwidthHistoryPoint } from '@/app/components/devices/network/types';

// Mock Recharts components - don't test Recharts internals
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ data, children }: { data: unknown; children: React.ReactNode }) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Line: ({ dataKey, name }: { dataKey: string; name: string }) => (
    <div data-testid={`line-${dataKey}`} data-name={name} />
  ),
}));

// Mock TimeRangeSelector
jest.mock('@/app/network/components/TimeRangeSelector', () => ({
  __esModule: true,
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div data-testid="time-range-selector" data-value={value} onClick={() => onChange('1h')}>
      TimeRangeSelector
    </div>
  ),
}));

describe('BandwidthChart', () => {
  const mockOnTimeRangeChange = jest.fn();

  const sampleData: BandwidthHistoryPoint[] = [
    { time: Date.now() - 3600000, download: 50.5, upload: 10.2 },
    { time: Date.now() - 1800000, download: 75.3, upload: 15.8 },
    { time: Date.now(), download: 60.1, upload: 12.5 },
  ];

  beforeEach(() => {
    mockOnTimeRangeChange.mockClear();
  });

  it('shows empty state when isEmpty is true', () => {
    render(
      <BandwidthChart
        data={[]}
        timeRange="24h"
        onTimeRangeChange={mockOnTimeRangeChange}
        isEmpty={true}
        isCollecting={false}
        pointCount={0}
      />
    );

    expect(screen.getByText(/Raccolta dati banda in corso/i)).toBeInTheDocument();
    expect(screen.getByText(/Torna tra qualche minuto/i)).toBeInTheDocument();
  });

  it('shows collecting state with point count when isCollecting is true', () => {
    render(
      <BandwidthChart
        data={sampleData}
        timeRange="24h"
        onTimeRangeChange={mockOnTimeRangeChange}
        isEmpty={false}
        isCollecting={true}
        pointCount={5}
      />
    );

    expect(screen.getByText(/Raccolta dati: 5\/10 punti/i)).toBeInTheDocument();
  });

  it('renders chart container when data provided', () => {
    render(
      <BandwidthChart
        data={sampleData}
        timeRange="24h"
        onTimeRangeChange={mockOnTimeRangeChange}
        isEmpty={false}
        isCollecting={false}
        pointCount={100}
      />
    );

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('renders TimeRangeSelector with correct value and onChange', () => {
    render(
      <BandwidthChart
        data={sampleData}
        timeRange="7d"
        onTimeRangeChange={mockOnTimeRangeChange}
        isEmpty={false}
        isCollecting={false}
        pointCount={100}
      />
    );

    const selector = screen.getByTestId('time-range-selector');
    expect(selector).toBeInTheDocument();
    expect(selector).toHaveAttribute('data-value', '7d');
  });

  it('shows "Banda" heading', () => {
    render(
      <BandwidthChart
        data={sampleData}
        timeRange="24h"
        onTimeRangeChange={mockOnTimeRangeChange}
        isEmpty={false}
        isCollecting={false}
        pointCount={100}
      />
    );

    expect(screen.getByText('Banda')).toBeInTheDocument();
  });

  it('passes correct data to LineChart', () => {
    render(
      <BandwidthChart
        data={sampleData}
        timeRange="24h"
        onTimeRangeChange={mockOnTimeRangeChange}
        isEmpty={false}
        isCollecting={false}
        pointCount={100}
      />
    );

    const lineChart = screen.getByTestId('line-chart');
    const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') ?? '[]');

    expect(chartData).toHaveLength(3);
    expect(chartData[0]).toMatchObject({
      download: 50.5,
      upload: 10.2,
    });
  });

  it('renders download and upload lines', () => {
    render(
      <BandwidthChart
        data={sampleData}
        timeRange="24h"
        onTimeRangeChange={mockOnTimeRangeChange}
        isEmpty={false}
        isCollecting={false}
        pointCount={100}
      />
    );

    const downloadLine = screen.getByTestId('line-download');
    const uploadLine = screen.getByTestId('line-upload');

    expect(downloadLine).toBeInTheDocument();
    expect(downloadLine).toHaveAttribute('data-name', 'Download');

    expect(uploadLine).toBeInTheDocument();
    expect(uploadLine).toHaveAttribute('data-name', 'Upload');
  });

  it('does not render chart when isEmpty is true', () => {
    render(
      <BandwidthChart
        data={[]}
        timeRange="24h"
        onTimeRangeChange={mockOnTimeRangeChange}
        isEmpty={true}
        isCollecting={false}
        pointCount={0}
      />
    );

    expect(screen.queryByTestId('responsive-container')).not.toBeInTheDocument();
  });
});
