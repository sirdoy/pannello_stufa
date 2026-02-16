import { render, screen } from '@testing-library/react';
import BandwidthCorrelationChart from '../BandwidthCorrelationChart';
import type { CorrelationDataPoint } from '@/app/components/devices/network/types';

describe('BandwidthCorrelationChart', () => {
  const mockData: CorrelationDataPoint[] = [
    { time: 1700000000000, bandwidth: 50, powerLevel: 3 },
    { time: 1700000060000, bandwidth: 55, powerLevel: 4 },
    { time: 1700000120000, bandwidth: 48, powerLevel: 2 },
  ];

  it('renders heading "Correlazione Banda-Stufa"', () => {
    render(
      <BandwidthCorrelationChart
        data={mockData}
        status="ready"
        pointCount={3}
        minPoints={30}
      />
    );

    expect(screen.getByText('Correlazione Banda-Stufa')).toBeInTheDocument();
  });

  it('shows "Stufa spenta" text when status is stove-off', () => {
    render(
      <BandwidthCorrelationChart
        data={[]}
        status="stove-off"
        pointCount={0}
        minPoints={30}
      />
    );

    expect(screen.getByText('Stufa spenta — correlazione non disponibile')).toBeInTheDocument();
  });

  it('shows collecting text with point count when status is collecting', () => {
    render(
      <BandwidthCorrelationChart
        data={mockData}
        status="collecting"
        pointCount={15}
        minPoints={30}
      />
    );

    expect(screen.getByText('Raccolta dati: 15/30 punti')).toBeInTheDocument();
  });

  it('renders ResponsiveContainer when status is ready with data', () => {
    const { container } = render(
      <BandwidthCorrelationChart
        data={mockData}
        status="ready"
        pointCount={30}
        minPoints={30}
      />
    );

    // ResponsiveContainer has the recharts-responsive-container class
    const responsiveContainer = container.querySelector('.recharts-responsive-container');
    expect(responsiveContainer).toBeInTheDocument();
  });

  it('does not render chart when data is empty', () => {
    const { container } = render(
      <BandwidthCorrelationChart
        data={[]}
        status="ready"
        pointCount={0}
        minPoints={30}
      />
    );

    const responsiveContainer = container.querySelector('.recharts-responsive-container');
    expect(responsiveContainer).not.toBeInTheDocument();
  });

  it('shows insufficient data message when status is insufficient', () => {
    render(
      <BandwidthCorrelationChart
        data={[]}
        status="insufficient"
        pointCount={5}
        minPoints={30}
      />
    );

    expect(screen.getByText('Dati insufficienti per la correlazione')).toBeInTheDocument();
  });
});
