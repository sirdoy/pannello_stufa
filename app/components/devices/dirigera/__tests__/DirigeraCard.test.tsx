import { render, screen, fireEvent } from '@testing-library/react';
import DirigeraCard from '../DirigeraCard';
import { useDirigeraData } from '../hooks/useDirigeraData';
import type { UseDirigeraDataReturn } from '../hooks/useDirigeraData';

jest.mock('../hooks/useDirigeraData');

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));
const mockUseDirigeraData = jest.mocked(useDirigeraData);

// Mock SmartHomeCard, HealthIndicator, Banner as pass-through
jest.mock('../../../ui', () => ({
  SmartHomeCard: Object.assign(
    ({ children, title, headerActions }: { children?: React.ReactNode; title?: string; headerActions?: React.ReactNode }) => (
      <div data-testid="smart-home-card" data-title={title}>
        {headerActions}
        {children}
      </div>
    ),
    {
      Controls: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    }
  ),
  HealthIndicator: ({ status }: { status: string }) => (
    <div data-testid="health-indicator" data-status={status} />
  ),
  Banner: ({ title, children }: { title?: string; children?: React.ReactNode }) => (
    <div data-testid="banner" data-title={title}>
      {title}
      {children}
    </div>
  ),
}));

jest.mock('../../../ui/Skeleton', () => {
  const Skeleton = () => null;
  Skeleton.DirigeraCard = () => <div data-testid="skeleton-dirigera" />;
  Skeleton.Card = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return { __esModule: true, default: Skeleton };
});

const baseSummary = {
  total_sensors: 5,
  open_count: 1,
  offline_count: 0,
  low_battery_count: 0,
  is_stale: false,
};

const baseHealth = {
  firmware_version: '1.0.0',
  connected_sensors: 5,
  is_reachable: true,
};

const baseData: UseDirigeraDataReturn = {
  data: { health: baseHealth, summary: baseSummary },
  loading: false,
  error: null,
  stale: false,
  health: 'ok',
  lastUpdatedAt: null,
};

describe('DirigeraCard', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockUseDirigeraData.mockReturnValue(baseData);
  });

  it('renders skeleton when loading', () => {
    mockUseDirigeraData.mockReturnValue({ ...baseData, data: null, loading: true });
    render(<DirigeraCard />);
    expect(screen.getByTestId('skeleton-dirigera')).toBeInTheDocument();
  });

  it('renders error banner when error and no data', () => {
    mockUseDirigeraData.mockReturnValue({
      ...baseData,
      data: null,
      error: 'DIRIGERA non raggiungibile',
    });
    render(<DirigeraCard />);
    expect(screen.getByText('Non raggiungibile')).toBeInTheDocument();
    expect(screen.getByText('DIRIGERA non raggiungibile')).toBeInTheDocument();
  });

  it('renders stats when data available', () => {
    render(<DirigeraCard />);
    expect(screen.getByText('Sensori totali')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Contatti aperti')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('navigates to /dirigera on click', () => {
    render(<DirigeraCard />);
    const link = screen.getByRole('link');
    fireEvent.click(link);
    expect(mockPush).toHaveBeenCalledWith('/dirigera');
  });

  it('shows stale banner when stale', () => {
    mockUseDirigeraData.mockReturnValue({ ...baseData, stale: true });
    render(<DirigeraCard />);
    expect(screen.getByText(/non aggiornati/i)).toBeInTheDocument();
    // Data still shows
    expect(screen.getByText('Sensori totali')).toBeInTheDocument();
  });

  it('renders health indicator in header', () => {
    render(<DirigeraCard />);
    expect(screen.getByTestId('health-indicator')).toBeInTheDocument();
  });

  it('does not navigate when in error state', () => {
    mockUseDirigeraData.mockReturnValue({
      ...baseData,
      data: null,
      error: 'DIRIGERA non raggiungibile',
    });
    render(<DirigeraCard />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
