import { render, screen, fireEvent } from '@testing-library/react';
import TuyaCard from '../TuyaCard';
import { useTuyaData } from '../hooks/useTuyaData';
import type { UseTuyaDataReturn } from '../hooks/useTuyaData';
import type { TuyaPlug } from '@/types/tuyaProxy';

jest.mock('../hooks/useTuyaData');

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockUseTuyaData = jest.mocked(useTuyaData);

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
      Status: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    }
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
  Skeleton.TuyaCard = () => <div data-testid="skeleton-tuya" />;
  Skeleton.Card = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return { __esModule: true, default: Skeleton };
});

jest.mock('../../../ui/LastUpdated', () => ({
  LastUpdated: ({ tsMs }: { tsMs: number | null }) =>
    tsMs ? <div data-testid="last-updated">{tsMs}</div> : null,
}));

jest.mock('../components/TuyaSummary', () => ({
  TuyaSummary: ({ plugs }: { plugs: TuyaPlug[] }) => (
    <div data-testid="tuya-summary">{plugs.length} plugs</div>
  ),
}));

const makePlug = (overrides: Partial<TuyaPlug> = {}): TuyaPlug => ({
  device_id: 'plug-001',
  switch_on: true,
  power_w: 100,
  voltage_v: 230,
  current_ma: 435,
  energy_kwh: 1.2,
  countdown_s: 0,
  data_freshness: 'LIVE',
  last_polled_at: Date.now() / 1000,
  custom_name: 'Test Plug',
  device_type: 'smart_plug',
  ...overrides,
});

const baseReturn: UseTuyaDataReturn = {
  plugs: [makePlug(), makePlug({ device_id: 'plug-002', custom_name: 'Plug 2' })],
  loading: false,
  error: null,
  stale: false,
  lastUpdatedAt: 1711800000000,
};

describe('TuyaCard', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockUseTuyaData.mockReturnValue(baseReturn);
  });

  it('renders skeleton when loading', () => {
    mockUseTuyaData.mockReturnValue({ ...baseReturn, plugs: null, loading: true });
    render(<TuyaCard />);
    expect(screen.getByTestId('skeleton-tuya')).toBeInTheDocument();
  });

  it('renders error banner when error and no plugs', () => {
    mockUseTuyaData.mockReturnValue({
      ...baseReturn,
      plugs: null,
      error: 'Tuya non raggiungibile',
    });
    render(<TuyaCard />);
    expect(screen.getByTestId('banner')).toBeInTheDocument();
    expect(screen.getByText(/Non raggiungibile/)).toBeInTheDocument();
  });

  it('renders TuyaSummary with plug data', () => {
    render(<TuyaCard />);
    expect(screen.getByTestId('tuya-summary')).toBeInTheDocument();
    expect(screen.getByText('2 plugs')).toBeInTheDocument();
  });

  it('renders LastUpdated when lastUpdatedAt set (UX-02)', () => {
    render(<TuyaCard />);
    expect(screen.getByTestId('last-updated')).toBeInTheDocument();
  });

  it('does not render LastUpdated when lastUpdatedAt is null', () => {
    mockUseTuyaData.mockReturnValue({ ...baseReturn, lastUpdatedAt: null });
    render(<TuyaCard />);
    expect(screen.queryByTestId('last-updated')).not.toBeInTheDocument();
  });

  it('links to /tuya when data card is clicked', () => {
    render(<TuyaCard />);
    const link = screen.getByRole('link');
    fireEvent.click(link);
    expect(mockPush).toHaveBeenCalledWith('/tuya');
  });

  it('does not render navigation link in error state', () => {
    mockUseTuyaData.mockReturnValue({
      ...baseReturn,
      plugs: null,
      error: 'Tuya non raggiungibile',
    });
    render(<TuyaCard />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows stale indicator when stale is true', () => {
    mockUseTuyaData.mockReturnValue({ ...baseReturn, stale: true });
    render(<TuyaCard />);
    // Stale banner or indicator renders
    expect(screen.getByTestId('banner')).toBeInTheDocument();
  });
});
