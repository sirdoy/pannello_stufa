import React from 'react';
import { render, screen } from '@testing-library/react';
import StoveCard from '@/app/components/devices/stove/StoveCard';
import fs from 'fs';
import path from 'path';

// Mock all hooks and components
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

jest.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: jest.fn(() => ({
    user: { sub: 'user-123' },
  })),
}));

jest.mock('@/app/context/VersionContext', () => ({
  useVersion: jest.fn(() => ({
    checkVersion: jest.fn(),
  })),
}));

// Mock custom hooks
jest.mock('@/app/components/devices/stove/hooks/useStoveData', () => ({
  useStoveData: jest.fn(),
}));

jest.mock('@/app/components/devices/stove/hooks/useStoveCommands', () => ({
  useStoveCommands: jest.fn(),
}));

// Mock sub-components
jest.mock('@/app/components/devices/stove/components/StoveStatus', () => ({
  __esModule: true,
  default: () => <div data-testid="stove-status">StoveStatus</div>,
}));

jest.mock('@/app/components/devices/stove/components/StovePrimaryActions', () => ({
  __esModule: true,
  default: () => <div data-testid="stove-primary-actions">StovePrimaryActions</div>,
}));

jest.mock('@/app/components/devices/stove/components/StoveBanners', () => ({
  __esModule: true,
  default: () => <div data-testid="stove-banners">StoveBanners</div>,
}));

jest.mock('@/app/components/devices/stove/components/StoveModeControl', () => ({
  __esModule: true,
  default: () => <div data-testid="stove-mode-control">StoveModeControl</div>,
}));

jest.mock('@/app/components/devices/stove/components/StoveAdjustments', () => ({
  __esModule: true,
  default: () => <div data-testid="stove-adjustments">StoveAdjustments</div>,
}));

jest.mock('@/app/components/devices/stove/components/StoveMaintenance', () => ({
  __esModule: true,
  default: () => <div data-testid="stove-maintenance">StoveMaintenance</div>,
}));

// Import after mocking
import { useStoveData } from '@/app/components/devices/stove/hooks/useStoveData';
import { useStoveCommands } from '@/app/components/devices/stove/hooks/useStoveCommands';

const mockUseStoveData = useStoveData as jest.MockedFunction<typeof useStoveData>;
const mockUseStoveCommands = useStoveCommands as jest.MockedFunction<typeof useStoveCommands>;

describe('StoveCard Orchestrator', () => {
  const defaultStoveData = {
    status: 'WORK',
    fanLevel: 3,
    powerLevel: 2,
    loading: false,
    refreshing: false,
    initialLoading: false,
    errorCode: 0,
    errorDescription: '',
    sandboxMode: false,
    loadingMessage: '',
    isOnline: true,
    isAccesa: true,
    isSpenta: false,
    needsMaintenance: false,
    schedulerEnabled: false,
    semiManualMode: false,
    returnToAutoAt: null,
    nextScheduledAction: null,
    maintenanceStatus: null,
    cleaningInProgress: false,
    isFirebaseConnected: true,
    hasPendingCommands: false,
    pendingCommands: [],
    staleness: null,
    isVisible: true,
    setLoading: jest.fn(),
    setLoadingMessage: jest.fn(),
    fetchStatusAndUpdate: jest.fn(),
    setSchedulerEnabled: jest.fn(),
    setSemiManualMode: jest.fn(),
    setReturnToAutoAt: jest.fn(),
    setNextScheduledAction: jest.fn(),
    setCleaningInProgress: jest.fn(),
    fetchMaintenanceStatus: jest.fn(),
  };

  const defaultCommands = {
    handleIgnite: jest.fn(),
    handleShutdown: jest.fn(),
    handleFanChange: jest.fn(),
    handlePowerChange: jest.fn(),
    handleClearSemiManual: jest.fn(),
    handleSetManualMode: jest.fn(),
    handleSetAutomaticMode: jest.fn(),
    handleConfirmCleaning: jest.fn(),
    handleManualRefresh: jest.fn(),
    igniteCmd: { isExecuting: false, lastError: null, retry: jest.fn() },
    shutdownCmd: { isExecuting: false, lastError: null, retry: jest.fn() },
    setFanCmd: { isExecuting: false, lastError: null, retry: jest.fn() },
    setPowerCmd: { isExecuting: false, lastError: null, retry: jest.fn() },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStoveData.mockReturnValue(defaultStoveData as any);
    mockUseStoveCommands.mockReturnValue(defaultCommands as any);
  });

  it('renders Skeleton.StovePanel when initialLoading=true', () => {
    mockUseStoveData.mockReturnValue({
      ...defaultStoveData,
      initialLoading: true,
    } as any);

    const { container } = render(<StoveCard />);
    // Skeleton renders divs with specific animation classes
    const skeletonElements = container.querySelectorAll('.animate-shimmer');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('renders StoveStatus component', () => {
    render(<StoveCard />);
    expect(screen.getByTestId('stove-status')).toBeInTheDocument();
  });

  it('renders StovePrimaryActions component', () => {
    render(<StoveCard />);
    expect(screen.getByTestId('stove-primary-actions')).toBeInTheDocument();
  });

  it('renders StoveBanners component', () => {
    render(<StoveCard />);
    expect(screen.getByTestId('stove-banners')).toBeInTheDocument();
  });

  it('renders StoveModeControl when isOnline=true', () => {
    mockUseStoveData.mockReturnValue({
      ...defaultStoveData,
      isOnline: true,
    } as any);

    render(<StoveCard />);
    expect(screen.getByTestId('stove-mode-control')).toBeInTheDocument();
  });

  it('does NOT render StoveModeControl when isOnline=false', () => {
    mockUseStoveData.mockReturnValue({
      ...defaultStoveData,
      isOnline: false,
    } as any);

    render(<StoveCard />);
    expect(screen.queryByTestId('stove-mode-control')).not.toBeInTheDocument();
  });

  it('renders StoveAdjustments when isOnline=true AND status includes WORK', () => {
    mockUseStoveData.mockReturnValue({
      ...defaultStoveData,
      isOnline: true,
      status: 'WORK',
    } as any);

    render(<StoveCard />);
    expect(screen.getByTestId('stove-adjustments')).toBeInTheDocument();
  });

  it('does NOT render StoveAdjustments when status is OFF', () => {
    mockUseStoveData.mockReturnValue({
      ...defaultStoveData,
      isOnline: true,
      status: 'OFF',
    } as any);

    render(<StoveCard />);
    expect(screen.queryByTestId('stove-adjustments')).not.toBeInTheDocument();
  });

  it('does NOT render StoveAdjustments when isOnline=false', () => {
    mockUseStoveData.mockReturnValue({
      ...defaultStoveData,
      isOnline: false,
      status: 'WORK',
    } as any);

    render(<StoveCard />);
    expect(screen.queryByTestId('stove-adjustments')).not.toBeInTheDocument();
  });

  it('renders StoveMaintenance when maintenanceStatus is truthy', () => {
    mockUseStoveData.mockReturnValue({
      ...defaultStoveData,
      maintenanceStatus: { needsCleaning: false, currentHours: 50 },
    } as any);

    render(<StoveCard />);
    expect(screen.getByTestId('stove-maintenance')).toBeInTheDocument();
  });

  it('does NOT render StoveMaintenance when maintenanceStatus is null', () => {
    mockUseStoveData.mockReturnValue({
      ...defaultStoveData,
      maintenanceStatus: null,
    } as any);

    render(<StoveCard />);
    expect(screen.queryByTestId('stove-maintenance')).not.toBeInTheDocument();
  });

  it('renders LoadingOverlay when loading=true', () => {
    mockUseStoveData.mockReturnValue({
      ...defaultStoveData,
      loading: true,
      loadingMessage: 'Test loading...',
    } as any);

    render(<StoveCard />);
    expect(screen.getByText('Test loading...')).toBeInTheDocument();
  });

  it('renders header with Stufa title', () => {
    render(<StoveCard />);
    expect(screen.getByText('Stufa')).toBeInTheDocument();
  });

  it('StoveCard.tsx line count is <= 250 lines (enforcement test)', () => {
    const filePath = path.join(process.cwd(), 'app/components/devices/stove/StoveCard.tsx');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lineCount = fileContent.split('\n').length;

    expect(lineCount).toBeLessThanOrEqual(250);
    // Bonus: verify it's actually lean (target ~200)
    expect(lineCount).toBeLessThanOrEqual(200);
  });

  it('orchestrator uses hooks for state management (no inline useState)', () => {
    const filePath = path.join(process.cwd(), 'app/components/devices/stove/StoveCard.tsx');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Should use custom hooks, not inline useState
    expect(fileContent).toContain('useStoveData');
    expect(fileContent).toContain('useStoveCommands');

    // Should NOT have inline useState calls
    const useStateMatches = fileContent.match(/useState\(/g);
    expect(useStateMatches).toBeNull();
  });

  it('orchestrator composes 6 sub-components', () => {
    const filePath = path.join(process.cwd(), 'app/components/devices/stove/StoveCard.tsx');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    expect(fileContent).toContain('StoveStatus');
    expect(fileContent).toContain('StovePrimaryActions');
    expect(fileContent).toContain('StoveBanners');
    expect(fileContent).toContain('StoveModeControl');
    expect(fileContent).toContain('StoveAdjustments');
    expect(fileContent).toContain('StoveMaintenance');
  });
});
