/**
 * Tests for thermostat page - Netatmo connection handling
 *
 * This test verifies the fix for the setState-in-render bug where
 * router.replace() was called during render phase instead of in useEffect.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import NetatmoPage from './page';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock NETATMO_ROUTES
jest.mock('@/lib/routes', () => ({
  NETATMO_ROUTES: {
    homesData: '/api/netatmo/homes-data',
    homeStatus: '/api/netatmo/home-status',
    setThermMode: '/api/netatmo/set-therm-mode',
  },
}));

// Mock UI components to avoid complex rendering
jest.mock('@/app/components/ui', () => {
  const MockPageLayout = ({ children, header }) => (
    <div data-testid="page-layout">
      {header}
      {children}
    </div>
  );
  MockPageLayout.Header = ({ title, description }) => (
    <header data-testid="page-header">
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
  const MockTabs = ({ children }) => <div data-testid="tabs">{children}</div>;
  MockTabs.List = ({ children }) => <div data-testid="tabs-list">{children}</div>;
  MockTabs.Trigger = ({ children, value }) => <button data-value={value}>{children}</button>;
  MockTabs.Content = ({ children }) => <div>{children}</div>;

  return {
    Card: ({ children }) => <div data-testid="card">{children}</div>,
    Button: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
    Skeleton: {
      NetatmoPage: () => <div data-testid="skeleton">Loading...</div>,
    },
    ErrorAlert: ({ message }) => <div data-testid="error">{message}</div>,
    Banner: ({ children }) => <div>{children}</div>,
    Heading: ({ children }) => <h1>{children}</h1>,
    Text: ({ children }) => <span>{children}</span>,
    Grid: ({ children }) => <div>{children}</div>,
    InfoBox: ({ title, children }) => <div data-testid="info-box"><strong>{title}</strong>{children}</div>,
    PageLayout: MockPageLayout,
    Tabs: MockTabs,
  };
});

jest.mock('@/app/components/netatmo/RoomCard', () => {
  return function RoomCard() {
    return <div data-testid="room-card">Room Card</div>;
  };
});

jest.mock('@/app/components/devices/thermostat/BatteryWarning', () => ({
  __esModule: true,
  default: () => <div>Battery Warning</div>,
  ModuleBatteryList: () => <div>Battery List</div>,
}));

jest.mock('@/app/components/netatmo/StoveSyncPanel', () => {
  return function StoveSyncPanel() {
    return <div>Stove Sync Panel</div>;
  };
});

describe('NetatmoPage - setState-in-render fix', () => {
  let mockRouter;
  let mockSearchParams;

  beforeEach(() => {
    mockRouter = {
      replace: jest.fn(),
      push: jest.fn(),
    };
    mockSearchParams = {
      get: jest.fn(() => null),
    };

    useRouter.mockReturnValue(mockRouter);
    useSearchParams.mockReturnValue(mockSearchParams);

    // Mock fetch globally
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should NOT call router.replace during render (setState-in-render bug)', async () => {
    // Mock API to return "not connected" response
    global.fetch.mockResolvedValueOnce({
      json: async () => ({
        error: 'Nessun refresh token disponibile',
      }),
    });

    // Track if router.replace is called synchronously during render
    let routerCalledDuringRender = false;
    const originalReplace = mockRouter.replace;
    mockRouter.replace = jest.fn((...args) => {
      // If this is called before the first useEffect runs, it's a bug
      routerCalledDuringRender = true;
      return originalReplace(...args);
    });

    // Render the component
    render(<NetatmoPage />);

    // Router should NOT be called synchronously during render
    expect(routerCalledDuringRender).toBe(false);

    // Wait for the useEffect to run and call router.replace
    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/netatmo');
    });

    // Verify skeleton is shown while redirecting
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  test('should show skeleton immediately when not connected', async () => {
    // Mock API to return "not connected" response
    global.fetch.mockResolvedValueOnce({
      json: async () => ({
        error: 'Nessun refresh token disponibile',
      }),
    });

    render(<NetatmoPage />);

    // Should show loading skeleton initially
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();

    // Wait for loading to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/netatmo/homes-data');
    });

    // Should still show skeleton (not connected state)
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  test('should redirect in useEffect, not in render', async () => {
    // Mock API to return "not connected" response
    global.fetch.mockResolvedValueOnce({
      json: async () => ({
        error: 'Nessun refresh token disponibile',
      }),
    });

    const { rerender } = render(<NetatmoPage />);

    // Initial render should not call router
    expect(mockRouter.replace).not.toHaveBeenCalled();

    // Wait for useEffect to fire after state updates
    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/netatmo');
    }, { timeout: 2000 });

    // Verify redirect happens only once
    expect(mockRouter.replace).toHaveBeenCalledTimes(1);
  });

  test('should not redirect when connected', async () => {
    // Mock API to return successful connection
    global.fetch
      .mockResolvedValueOnce({
        json: async () => ({
          home_id: '123',
          home_name: 'Test Home',
          rooms: [],
          modules: [],
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          mode: 'schedule',
          rooms: [],
          modules: [],
        }),
      });

    render(<NetatmoPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    // Should NOT redirect when connected
    expect(mockRouter.replace).not.toHaveBeenCalled();

    // Should show the main content (topology info)
    await waitFor(() => {
      expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
    });
  });
});
