/**
 * Tests for thermostat page - Netatmo connection handling
 *
 * A not-connected thermostat shows a notice on the page: it never redirects
 * (the old target /netatmo does not exist).
 */

import { render, screen, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import NetatmoPage from './page';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Use the real lib/routes so the mock stays forward-compatible with future
// additions (WR-07). Previously this mock listed only three NETATMO_ROUTES
// fields and omitted CAMERA_ROUTES, causing silent `undefined` reads in any
// code path that grew to use the missing fields.
jest.mock('@/lib/routes', () => {
  const actual = jest.requireActual('@/lib/routes');
  return { ...actual };
});

// Mock UI components to avoid complex rendering
jest.mock('@/app/components/ui', () => {
  const MockPageLayout = ({ children, header }: { children: React.ReactNode; header: React.ReactNode }) => (
    <div data-testid="page-layout">
      {header}
      {children}
    </div>
  );
  MockPageLayout.Header = function MockHeader({ title, description }: { title: string; description: string }) {
    return (
      <header data-testid="page-header">
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
    );
  };
  const MockTabs = ({ children }: { children: React.ReactNode }) => <div data-testid="tabs">{children}</div>;
  MockTabs.List = function MockTabsList({ children }: { children: React.ReactNode }) {
    return <div data-testid="tabs-list">{children}</div>;
  };
  MockTabs.Trigger = function MockTabsTrigger({ children, value }: { children: React.ReactNode; value: string }) {
    return <button data-value={value}>{children}</button>;
  };
  MockTabs.Content = function MockTabsContent({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>;
  };

  return {
    Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
    Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>,
    Skeleton: {
      NetatmoPage: () => <div data-testid="skeleton">Loading...</div>,
    },
    ErrorAlert: ({ message }: { message: string }) => <div data-testid="error">{message}</div>,
    Banner: ({ children, title }: { children?: React.ReactNode; title?: string }) => (
      <div data-testid={title === 'Termostato non collegato' ? 'not-connected' : undefined}>{title}{children}</div>
    ),
    Heading: ({ children }: { children: React.ReactNode }) => <h1>{children}</h1>,
    Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    Grid: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    InfoBox: ({ title, children }: { title: string; children: React.ReactNode }) => <div data-testid="info-box"><strong>{title}</strong>{children}</div>,
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

// Mock WebSocketContext — useThermostatData now consumes the shared WS manager.
// CLOSED keeps the hook on its polling/fetch path (matches the test's fetch mocks).
jest.mock('@/app/context/WebSocketContext', () => ({
  useWebSocketContext: () => ({
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    readyState: 3,
  }),
}));
jest.mock('@/lib/hooks/useWebSocketManager', () => ({
  ReadyState: { OPEN: 1, CLOSED: 3, CONNECTING: 0, CLOSING: 2, UNINSTANTIATED: -1 },
}));

describe('NetatmoPage - setState-in-render fix', () => {
  let mockRouter: { replace: jest.Mock; push: jest.Mock };
  let mockSearchParams: { get: jest.Mock };

  beforeEach(() => {
    mockRouter = {
      replace: jest.fn(),
      push: jest.fn(),
    };
    mockSearchParams = {
      get: jest.fn(() => null),
    };

    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);

    // Mock fetch globally
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('stays on the page with a notice when Netatmo is not connected', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        error: 'Nessun refresh token disponibile',
      }),
    });

    render(<NetatmoPage />);

    // Skeleton while loading
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('not-connected')).toHaveTextContent('Termostato non collegato');
    });

    // The old redirect went to /netatmo, a page that does not exist (404)
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  test('should not redirect when connected', async () => {
    // Mock API to return successful connection in v1 raw-proxy shape
    // (Phase 168 Plan 02: useThermostatData.checkConnection unwraps body.homes[0])
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: async () => ({
          body: {
            homes: [
              {
                id: '123',
                name: 'Test Home',
                rooms: [],
                modules: [],
                schedules: [],
              },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          rooms: [],
          data_freshness: 'LIVE',
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
