import { render, screen, fireEvent } from '@testing-library/react';
import RaspiCard from '../RaspiCard';
import { useRaspiData } from '../hooks/useRaspiData';
import type { UseRaspiDataReturn } from '../hooks/useRaspiData';

jest.mock('../hooks/useRaspiData');

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));
const mockUseRaspiData = jest.mocked(useRaspiData);

// Mock SmartHomeCard and HealthIndicator as pass-through
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
  Skeleton.RaspiCard = () => <div data-testid="skeleton-raspi" />;
  Skeleton.Card = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return { __esModule: true, default: Skeleton };
});

const baseData: UseRaspiDataReturn = {
  data: { cpuPercent: 25.3, memoryPercent: 50.0, diskPercent: 25.0, cpuTemperature: 45.2 },
  loading: false,
  error: null,
  stale: false,
  health: 'ok',
};

describe('RaspiCard', () => {
  beforeEach(() => {
    mockUseRaspiData.mockReturnValue(baseData);
  });

  it('renders 4 metric values when data available', () => {
    render(<RaspiCard />);
    expect(screen.getByText('25.3%')).toBeInTheDocument();   // CPU
    expect(screen.getByText('50.0%')).toBeInTheDocument();   // RAM
    expect(screen.getByText('25.0%')).toBeInTheDocument();   // Disk
    expect(screen.getByText('45.2°C')).toBeInTheDocument();  // Temp
  });

  it('renders skeleton when loading', () => {
    mockUseRaspiData.mockReturnValue({ ...baseData, data: null, loading: true });
    render(<RaspiCard />);
    expect(screen.getByTestId('skeleton-raspi')).toBeInTheDocument();
  });

  it('renders error banner when error and no data', () => {
    mockUseRaspiData.mockReturnValue({
      ...baseData,
      data: null,
      error: 'Raspberry Pi non raggiungibile',
    });
    render(<RaspiCard />);
    expect(screen.getByText('Raspberry Pi non raggiungibile')).toBeInTheDocument();
  });

  it('renders stale banner when stale with data', () => {
    mockUseRaspiData.mockReturnValue({ ...baseData, stale: true });
    render(<RaspiCard />);
    expect(screen.getByText(/non aggiornati/i)).toBeInTheDocument();
    // Data still shows
    expect(screen.getByText('25.3%')).toBeInTheDocument();
  });

  it('renders HealthIndicator in header', () => {
    render(<RaspiCard />);
    expect(screen.getByTestId('health-indicator')).toBeInTheDocument();
  });

  it('renders dash when cpuTemperature is null', () => {
    mockUseRaspiData.mockReturnValue({
      ...baseData,
      data: { ...baseData.data!, cpuTemperature: null },
    });
    render(<RaspiCard />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('navigates to /raspi when data card is clicked', () => {
    mockUseRaspiData.mockReturnValue(baseData);
    render(<RaspiCard />);
    const link = screen.getByRole('link');
    fireEvent.click(link);
    expect(mockPush).toHaveBeenCalledWith('/raspi');
  });

  it('does not navigate when in error state', () => {
    mockUseRaspiData.mockReturnValue({
      ...baseData,
      data: null,
      error: 'Raspberry Pi non raggiungibile',
    });
    render(<RaspiCard />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
