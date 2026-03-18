import { render, screen } from '@testing-library/react';
import StoveStatus from '@/app/components/devices/stove/components/StoveStatus';
import { getStatusInfo, getStatusDisplay } from '@/app/components/devices/stove/stoveStatusUtils';

// Mock useVisibility to control visibility state in tests
jest.mock('@/lib/hooks/useVisibility', () => ({
  useVisibility: jest.fn().mockReturnValue(true),
}));

import { useVisibility } from '@/lib/hooks/useVisibility';

describe('StoveStatus', () => {
  const defaultProps = {
    status: 'WORK',
    fanLevel: 3,
    powerLevel: 2,
    errorCode: 0,
    sandboxMode: false,
    staleness: null,
    statusInfo: getStatusInfo('WORK'),
    statusDisplay: getStatusDisplay('WORK'),
  };

  beforeEach(() => {
    jest.mocked(useVisibility).mockReturnValue(true);
  });

  it('renders status label', () => {
    render(<StoveStatus {...defaultProps} />);
    expect(screen.getByText('IN FUNZIONE')).toBeInTheDocument();
  });

  it('renders fan and power info boxes', () => {
    render(<StoveStatus {...defaultProps} />);
    expect(screen.getByText('Ventola')).toBeInTheDocument();
    expect(screen.getByText('Potenza')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows sandbox badge when sandboxMode is true', () => {
    render(<StoveStatus {...defaultProps} sandboxMode={true} />);
    expect(screen.getByText('SANDBOX')).toBeInTheDocument();
  });

  it('shows error badge when errorCode > 0', () => {
    render(<StoveStatus {...defaultProps} errorCode={5} />);
    expect(screen.getByText('ERR 5')).toBeInTheDocument();
  });

  it('shows staleness badge when isVisible and isStale', () => {
    jest.mocked(useVisibility).mockReturnValue(true);
    const staleness = {
      isStale: true,
      cachedAt: new Date('2024-01-01T12:00:00Z'),
      lastFetch: new Date('2024-01-01T12:00:00Z'),
    };
    render(<StoveStatus {...defaultProps} staleness={staleness} />);
    expect(screen.getByText('Dati non aggiornati')).toBeInTheDocument();
  });

  it('does NOT show staleness badge when errorCode > 0 (error badge takes precedence)', () => {
    const staleness = {
      isStale: true,
      cachedAt: new Date('2024-01-01T12:00:00Z'),
      lastFetch: new Date('2024-01-01T12:00:00Z'),
    };
    render(<StoveStatus {...defaultProps} errorCode={5} staleness={staleness} />);
    expect(screen.queryByText('Dati non aggiornati')).not.toBeInTheDocument();
    expect(screen.getByText('ERR 5')).toBeInTheDocument();
  });

  it('does NOT show staleness badge when tab is not visible', () => {
    jest.mocked(useVisibility).mockReturnValue(false);
    const staleness = {
      isStale: true,
      cachedAt: new Date('2024-01-01T12:00:00Z'),
      lastFetch: new Date('2024-01-01T12:00:00Z'),
    };
    render(<StoveStatus {...defaultProps} staleness={staleness} />);
    expect(screen.queryByText('Dati non aggiornati')).not.toBeInTheDocument();
  });

  it('renders staleness indicator when cachedAt is present', () => {
    const staleness = {
      isStale: false,
      cachedAt: new Date('2024-01-01T12:00:00Z'),
      lastFetch: new Date('2024-01-01T12:00:00Z'),
    };
    render(<StoveStatus {...defaultProps} staleness={staleness} />);
    expect(screen.getByText(/Ultimo aggiornamento:/)).toBeInTheDocument();
  });

  it('handles null fanLevel and powerLevel', () => {
    render(<StoveStatus {...defaultProps} fanLevel={null} powerLevel={null} />);
    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });
});
