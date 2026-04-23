/**
 * Storico grezzo Tab Integration Tests (Phase 171-02)
 *
 * Verifies:
 * - Tab renders the three raw-history sub-sections when active
 * - Hooks are paused when tab is not active (D-10 lazy-load)
 * - Changing TimeRangeSelector propagates to bandwidth + events hooks
 * - Device presence 404-graceful state renders "Endpoint non disponibile sul proxy"
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NetworkPage from '../page';

// ---- Mocks ----

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock next/dynamic so BandwidthChart / BandwidthCorrelationChart / DeviceCountChart
// don't try to load their real implementations.
jest.mock('next/dynamic', () => () => () => null);

// Core network data hook — return enough for the page to render past the skeleton guard.
jest.mock('@/app/components/devices/network/hooks/useNetworkData', () => ({
  useNetworkData: () => ({
    bandwidth: null,
    devices: [
      {
        id: 'dev-01',
        name: 'Device 1',
        ip: '192.168.1.10',
        mac: 'AA:BB:CC:DD:EE:01',
        active: true,
        bandwidth: undefined,
        lastSeen: undefined,
      },
    ],
    wan: { connected: true, uptime: 3600, externalIp: '1.2.3.4', timestamp: Date.now() },
    downloadHistory: [],
    uploadHistory: [],
    loading: false,
    connected: true,
    stale: false,
    lastUpdated: Date.now(),
    lastUpdatedAt: Date.now(),
    health: 'excellent',
    healthMapped: 'ok',
    error: null,
    activeDeviceCount: 1,
    updateDeviceCategory: jest.fn(),
  }),
}));

jest.mock('../hooks/useBandwidthHistory', () => ({
  useBandwidthHistory: () => ({
    chartData: [],
    timeRange: '24h',
    setTimeRange: jest.fn(),
    addDataPoint: jest.fn(),
    pointCount: 0,
    isEmpty: true,
    isCollecting: false,
    isLoading: false,
  }),
}));

jest.mock('../hooks/useDeviceHistory', () => ({
  useDeviceHistory: () => ({
    events: [],
    timeRange: '24h',
    setTimeRange: jest.fn(),
    deviceFilter: null,
    setDeviceFilter: jest.fn(),
    isLoading: false,
    isEmpty: true,
    refresh: jest.fn(),
  }),
}));

jest.mock('../hooks/useBandwidthCorrelation', () => ({
  useBandwidthCorrelation: () => ({
    chartData: [],
    insight: null,
    status: 'insufficient',
    addDataPoint: jest.fn(),
    pointCount: 0,
    minPoints: 20,
  }),
}));

jest.mock('../hooks/useFritzSystemInfo', () => ({
  useFritzSystemInfo: () => ({ data: null, loading: false, stale: false }),
}));

jest.mock('../hooks/useFritzWifiClients', () => ({
  useFritzWifiClients: () => ({ clients: [], loading: false, stale: false, band: 'all', setBand: jest.fn(), total: 0 }),
}));

jest.mock('../hooks/useFritzNetworkServices', () => ({
  useFritzNetworkServices: () => ({ dhcp: null, portForwarding: null, upnp: null, mesh: null, loading: false, stale: false }),
}));

jest.mock('../hooks/useFritzBandwidthTiers', () => ({
  useFritzBandwidthTiers: () => ({ tier: 'realtime', setTier: jest.fn(), tierData: [], loading: false, autoGranularity: null }),
}));

jest.mock('../hooks/useFritzWifiNetworks', () => ({
  useFritzWifiNetworks: () => ({ networks: [], loading: false, stale: false }),
}));

jest.mock('../hooks/useFritzBudgetStats', () => ({
  useFritzBudgetStats: () => ({ data: null, loading: false, error: false }),
}));

jest.mock('../hooks/useFritzDeviceCountHistory', () => ({
  useFritzDeviceCountHistory: () => ({ days: 30, setDays: jest.fn(), chartData: [], loading: false }),
}));

// Raw-history hooks — the subjects of these tests.
const bandwidthHookMock = jest.fn();
const presenceHookMock = jest.fn();
const eventsHookMock = jest.fn();
// Shared flag flipped by individual tests to toggle the presence `notFound` state.
const presenceState = { notFound: false };

jest.mock('../hooks/useFritzBandwidthHistoryRaw', () => ({
  useFritzBandwidthHistoryRaw: (opts: { paused?: boolean; hours?: '1h' | '24h' | '7d' }) => {
    bandwidthHookMock(opts);
    return { items: [], loading: false, stale: false, totalCount: 0, page: 0, setPage: jest.fn() };
  },
}));

jest.mock('../hooks/useFritzDevicePresenceHistory', () => ({
  useFritzDevicePresenceHistory: (opts: { paused?: boolean }) => {
    presenceHookMock(opts);
    return {
      items: [],
      loading: false,
      stale: presenceState.notFound,
      notFound: presenceState.notFound,
      totalCount: 0,
      page: 0,
      setPage: jest.fn(),
    };
  },
}));

jest.mock('../hooks/useFritzDeviceEventsRaw', () => ({
  useFritzDeviceEventsRaw: (opts: { paused?: boolean; hours?: '1h' | '24h' | '7d' }) => {
    eventsHookMock(opts);
    return { items: [], loading: false, stale: false, totalCount: 0, page: 0, setPage: jest.fn() };
  },
}));

describe('Storico grezzo tab (Phase 171-02)', () => {
  beforeEach(() => {
    bandwidthHookMock.mockClear();
    presenceHookMock.mockClear();
    eventsHookMock.mockClear();
    presenceState.notFound = false;
  });

  it('renders the three raw-history sub-section headings after clicking the Storico grezzo tab', async () => {
    const user = userEvent.setup();
    render(<NetworkPage />);

    // Initially not visible — storico tab is not the default active tab.
    expect(screen.queryByText('Bandwidth grezzo')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Storico grezzo' }));

    expect(screen.getByText('Bandwidth grezzo')).toBeInTheDocument();
    expect(screen.getByText('Presenza dispositivi')).toBeInTheDocument();
    expect(screen.getByText('Eventi dispositivi')).toBeInTheDocument();
  });

  it('hooks receive paused=true while storico tab is inactive (D-10 lazy-load)', () => {
    render(<NetworkPage />);

    // First render — dispositivi tab is active, storico hooks are paused.
    const bwFirstCall = bandwidthHookMock.mock.calls[0][0] as { paused?: boolean; hours?: string };
    const presenceFirstCall = presenceHookMock.mock.calls[0][0] as { paused?: boolean };
    const eventsFirstCall = eventsHookMock.mock.calls[0][0] as { paused?: boolean; hours?: string };

    expect(bwFirstCall.paused).toBe(true);
    expect(bwFirstCall.hours).toBe('24h');
    expect(presenceFirstCall.paused).toBe(true);
    expect(eventsFirstCall.paused).toBe(true);
    expect(eventsFirstCall.hours).toBe('24h');
  });

  it('changing TimeRangeSelector to 7d propagates hours to bandwidth + events hooks', async () => {
    const user = userEvent.setup();
    render(<NetworkPage />);

    await user.click(screen.getByRole('button', { name: 'Storico grezzo' }));

    bandwidthHookMock.mockClear();
    eventsHookMock.mockClear();

    // TimeRangeSelector renders 1h / 24h / 7d as its three range buttons. Multiple
    // TimeRangeSelectors exist on the page (DeviceHistoryTimeline also renders one);
    // the storico one is the FIRST match because RawHistoryTab renders above the
    // DeviceHistoryTimeline block.
    const sevenDayButtons = screen.getAllByRole('button', { name: '7d' });
    await user.click(sevenDayButtons[0]);

    const bwCalls = bandwidthHookMock.mock.calls.map((c) => (c[0] as { hours?: string }).hours);
    const evCalls = eventsHookMock.mock.calls.map((c) => (c[0] as { hours?: string }).hours);
    expect(bwCalls).toContain('7d');
    expect(evCalls).toContain('7d');
  });

  it('presence hook notFound=true renders "Endpoint non disponibile sul proxy" without crashing', async () => {
    presenceState.notFound = true;

    const user = userEvent.setup();
    expect(() => render(<NetworkPage />)).not.toThrow();

    await user.click(screen.getByRole('button', { name: 'Storico grezzo' }));

    expect(screen.getByText('Endpoint non disponibile sul proxy')).toBeInTheDocument();
  });
});
