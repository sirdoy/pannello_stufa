/**
 * Tests for /raspi page
 *
 * Validates rendering of all 4 stat sections, skeleton on loading,
 * back button navigation, and data display.
 */

import { render, screen } from '@testing-library/react';
import RaspiPage from '../page';
import type { UseRaspiFullDataReturn } from '@/app/components/devices/raspi/hooks/useRaspiFullData';

// Mock hook
jest.mock('@/app/components/devices/raspi/hooks/useRaspiFullData');
import { useRaspiFullData } from '@/app/components/devices/raspi/hooks/useRaspiFullData';
const mockUseRaspiFullData = jest.mocked(useRaspiFullData);

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock design system components to avoid styled-jsx issues
jest.mock('@/app/components/ui/PageLayout', () => {
  const PageLayout = ({ header, children }: { header?: React.ReactNode; children?: React.ReactNode }) => (
    <div>
      {header}
      {children}
    </div>
  );
  const PageHeader = ({ children }: { children?: React.ReactNode }) => <header>{children}</header>;
  (PageLayout as typeof PageLayout & { Header: typeof PageHeader }).Header = PageHeader;
  return { __esModule: true, default: PageLayout };
});

jest.mock('@/app/components/ui/Skeleton', () => {
  const Skeleton = ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  );
  return { __esModule: true, default: Skeleton };
});

jest.mock('@/app/components/ui/Card', () => ({
  __esModule: true,
  default: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

jest.mock('@/app/components/ui/Heading', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <h2>{children}</h2>,
}));

jest.mock('@/app/components/ui/Text', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <p>{children}</p>,
}));

jest.mock('@/app/components/ui/Button', () => ({
  __esModule: true,
  default: ({ children, onClick }: { children?: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

jest.mock('@/app/components/ui/InfoBox', () => ({
  __esModule: true,
  default: ({ label, value }: { label?: string; value?: string | number }) => (
    <div data-testid="info-box">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  ),
}));

jest.mock('@/app/components/ui', () => ({
  Banner: ({ title }: { title?: string }) => (
    <div data-testid="banner">{title}</div>
  ),
}));

const baseData: UseRaspiFullDataReturn['data'] = {
  cpuPercent: 25.3,
  memoryPercent: 50.0,
  memoryUsedBytes: 500_000_000,
  memoryTotalBytes: 1_000_000_000,
  diskPercent: 25.0,
  diskUsedBytes: 8_000_000_000,
  diskTotalBytes: 32_000_000_000,
  cpuTemperature: 45.2,
  uptimeSeconds: 90000,
  loadAvg1: 0.5,
  loadAvg5: 0.4,
  loadAvg15: 0.3,
  processCount: 120,
  networkBytesSent: 1_000_000,
  networkBytesRecv: 2_000_000,
  networkInterface: 'eth0',
};

describe('/raspi page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all 4 section headings when data is present', () => {
    mockUseRaspiFullData.mockReturnValue({ data: baseData, loading: false, stale: false, error: null });
    render(<RaspiPage />);

    expect(screen.getByText('CPU e Temperatura')).toBeInTheDocument();
    expect(screen.getByText('Memoria e Disco')).toBeInTheDocument();
    expect(screen.getByText('Sistema')).toBeInTheDocument();
    expect(screen.getByText('Rete')).toBeInTheDocument();
  });

  it('renders "← Indietro" back button', () => {
    mockUseRaspiFullData.mockReturnValue({ data: baseData, loading: false, stale: false, error: null });
    render(<RaspiPage />);

    expect(screen.getByText('← Indietro')).toBeInTheDocument();
  });

  it('shows skeletons when loading && no data', () => {
    mockUseRaspiFullData.mockReturnValue({ data: null, loading: true, stale: false, error: null });
    render(<RaspiPage />);

    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThanOrEqual(1);
    // Page sections should NOT render
    expect(screen.queryByText('CPU e Temperatura')).not.toBeInTheDocument();
  });

  it('shows uptime formatted value', () => {
    // 90000 seconds = 1 day + 1 hour
    mockUseRaspiFullData.mockReturnValue({ data: baseData, loading: false, stale: false, error: null });
    render(<RaspiPage />);

    // formatUptime(90000) → 1g 1h (1 day, 1 hour)
    expect(screen.getByText('1g 1h')).toBeInTheDocument();
  });

  it('shows process count', () => {
    mockUseRaspiFullData.mockReturnValue({ data: baseData, loading: false, stale: false, error: null });
    render(<RaspiPage />);

    expect(screen.getByText('120')).toBeInTheDocument();
  });
});
