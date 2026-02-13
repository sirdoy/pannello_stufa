/**
 * StovePage Integration Tests
 *
 * Tests orchestrator pattern integration:
 * - Hook composition (useStoveData + useStoveCommands)
 * - Sub-component rendering with correct props
 * - Loading states
 * - Conditional rendering based on status
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StovePage from '@/app/stove/page';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: () => ({ user: { sub: 'user-123' } }),
}));

jest.mock('@/app/context/VersionContext', () => ({
  useVersion: () => ({ checkVersion: jest.fn() }),
}));

jest.mock('@/lib/hooks/useBackgroundSync', () => ({
  useBackgroundSync: jest.fn(() => ({
    queueStoveCommand: jest.fn(),
  })),
}));

// Mock hooks
jest.mock('@/app/components/devices/stove/hooks/useStoveData');
jest.mock('@/app/components/devices/stove/hooks/useStoveCommands');

// Mock sub-components
jest.mock('@/app/stove/components/StovePageBanners', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="stove-page-banners">Banners</div>),
}));

jest.mock('@/app/stove/components/StovePageHero', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="stove-page-hero">Hero</div>),
}));

jest.mock('@/app/stove/components/StovePageAdjustments', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="stove-page-adjustments">Adjustments</div>),
}));

jest.mock('@/app/stove/components/StovePageNavigation', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="stove-page-navigation">Navigation</div>),
}));

import { useStoveData } from '@/app/components/devices/stove/hooks/useStoveData';
import { useStoveCommands } from '@/app/components/devices/stove/hooks/useStoveCommands';
import StovePageBanners from '@/app/stove/components/StovePageBanners';
import StovePageHero from '@/app/stove/components/StovePageHero';
import StovePageAdjustments from '@/app/stove/components/StovePageAdjustments';

const mockUseStoveData = jest.mocked(useStoveData);
const mockUseStoveCommands = jest.mocked(useStoveCommands);
const MockStovePageBanners = jest.mocked(StovePageBanners);
const MockStovePageHero = jest.mocked(StovePageHero);
const MockStovePageAdjustments = jest.mocked(StovePageAdjustments);

const createMockStoveData = (overrides = {}) => ({
  status: 'OFF',
  fanLevel: 3,
  powerLevel: 2,
  loading: false,
  refreshing: false,
  initialLoading: false,
  schedulerEnabled: false,
  semiManualMode: false,
  returnToAutoAt: null,
  nextScheduledAction: null,
  errorCode: 0,
  errorDescription: '',
  maintenanceStatus: null,
  cleaningInProgress: false,
  sandboxMode: false,
  loadingMessage: '',
  isFirebaseConnected: true,
  usePollingFallback: false,
  isOnline: true,
  hasPendingCommands: false,
  pendingCommands: [],
  staleness: null,
  isVisible: true,
  isAccesa: false,
  isSpenta: true,
  needsMaintenance: false,
  fetchStatusAndUpdate: jest.fn(),
  setLoading: jest.fn(),
  setLoadingMessage: jest.fn(),
  setCleaningInProgress: jest.fn(),
  setSchedulerEnabled: jest.fn(),
  setSemiManualMode: jest.fn(),
  setReturnToAutoAt: jest.fn(),
  setNextScheduledAction: jest.fn(),
  fetchMaintenanceStatus: jest.fn(),
  fetchSchedulerMode: jest.fn(),
  ...overrides,
});

const createMockCommands = () => ({
  handleIgnite: jest.fn(),
  handleShutdown: jest.fn(),
  handleFanChange: jest.fn(),
  handlePowerChange: jest.fn(),
  handleClearSemiManual: jest.fn(),
  handleSetManualMode: jest.fn(),
  handleSetAutomaticMode: jest.fn(),
  handleConfirmCleaning: jest.fn(),
  handleManualRefresh: jest.fn(),
  igniteCmd: {} as any,
  shutdownCmd: {} as any,
  setFanCmd: {} as any,
  setPowerCmd: {} as any,
});

describe('StovePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStoveData.mockReturnValue(createMockStoveData());
    mockUseStoveCommands.mockReturnValue(createMockCommands());
  });

  it('renders skeleton during initial loading', () => {
    mockUseStoveData.mockReturnValue(createMockStoveData({ initialLoading: true }));

    render(<StovePage />);

    expect(screen.queryByTestId('stove-page-hero')).not.toBeInTheDocument();
    expect(screen.queryByTestId('stove-page-banners')).not.toBeInTheDocument();
  });

  it('renders StovePageHero with correct data props', () => {
    const mockData = createMockStoveData({
      status: 'WORK',
      fanLevel: 4,
      powerLevel: 3,
      errorCode: 0,
      sandboxMode: true,
    });
    mockUseStoveData.mockReturnValue(mockData);

    render(<StovePage />);

    // Verify component was called with key data props
    const heroProps = MockStovePageHero.mock.calls[0]?.[0];
    expect(heroProps).toBeDefined();
    expect(heroProps.status).toBe('WORK');
    expect(heroProps.fanLevel).toBe(4);
    expect(heroProps.powerLevel).toBe(3);
    expect(heroProps.errorCode).toBe(0);
    expect(heroProps.sandboxMode).toBe(true);
  });

  it('renders StovePageAdjustments only when status includes WORK', () => {
    // Not WORK status
    mockUseStoveData.mockReturnValue(createMockStoveData({ status: 'OFF' }));
    const { rerender } = render(<StovePage />);
    expect(screen.queryByTestId('stove-page-adjustments')).not.toBeInTheDocument();

    // WORK status
    mockUseStoveData.mockReturnValue(createMockStoveData({ status: 'WORK' }));
    rerender(<StovePage />);
    expect(screen.getByTestId('stove-page-adjustments')).toBeInTheDocument();
  });

  it('renders StovePageNavigation', () => {
    render(<StovePage />);
    expect(screen.getByTestId('stove-page-navigation')).toBeInTheDocument();
  });

  it('applies correct theme classes based on status', () => {
    mockUseStoveData.mockReturnValue(createMockStoveData({ status: 'WORK' }));

    const { container } = render(<StovePage />);

    // Check for ember theme gradient
    const gradientDiv = container.querySelector('.bg-gradient-to-br');
    expect(gradientDiv).toBeInTheDocument();
    expect(gradientDiv?.className).toContain('from-ember-950');
  });

  it('calls handleIgnite when StovePageHero fires onIgnite', async () => {
    const mockCommands = createMockCommands();
    mockUseStoveCommands.mockReturnValue(mockCommands);
    mockUseStoveData.mockReturnValue(createMockStoveData({ isOnline: true }));

    render(<StovePage />);

    // Get the onIgnite prop passed to StovePageHero
    const heroProps = MockStovePageHero.mock.calls[0]?.[0];
    expect(heroProps).toBeDefined();

    // Trigger onIgnite
    await heroProps.onIgnite();

    expect(mockCommands.handleIgnite).toHaveBeenCalled();
  });

  it('renders StovePageBanners with all required data', () => {
    const mockData = createMockStoveData({
      errorCode: 5,
      errorDescription: 'Test error',
      needsMaintenance: true,
      maintenanceStatus: { needsCleaning: true, currentHours: 50 },
      cleaningInProgress: false,
      isFirebaseConnected: true,
      hasPendingCommands: false,
      pendingCommands: [],
    });
    mockUseStoveData.mockReturnValue(mockData);

    render(<StovePage />);

    // Verify component was called with key data props
    const bannersProps = MockStovePageBanners.mock.calls[0]?.[0];
    expect(bannersProps).toBeDefined();
    expect(bannersProps.errorCode).toBe(5);
    expect(bannersProps.errorDescription).toBe('Test error');
    expect(bannersProps.needsMaintenance).toBe(true);
    expect(bannersProps.maintenanceStatus).toEqual({ needsCleaning: true, currentHours: 50 });
    expect(bannersProps.cleaningInProgress).toBe(false);
    expect(bannersProps.isFirebaseConnected).toBe(true);
    expect(bannersProps.hasPendingCommands).toBe(false);
  });
});
