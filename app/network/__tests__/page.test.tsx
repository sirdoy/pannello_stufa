/**
 * Network Page Integration Tests
 *
 * Tests the /network page orchestrator:
 * - Loading state and skeleton display
 * - Component data flow (useNetworkData → WanStatusCard + DeviceListTable)
 * - Navigation (back button)
 * - Stale flag propagation
 * - Refresh behavior (loading=true but has cached data)
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NetworkPage from '../page';
import { useNetworkData } from '@/app/components/devices/network/hooks/useNetworkData';
import { useBandwidthHistory } from '../hooks/useBandwidthHistory';
import { useDeviceHistory } from '../hooks/useDeviceHistory';
import type { UseNetworkDataReturn } from '@/app/components/devices/network/types';

// Mock useNetworkData hook
jest.mock('@/app/components/devices/network/hooks/useNetworkData', () => ({
  useNetworkData: jest.fn(),
}));

// Mock useBandwidthHistory hook
const mockAddDataPoint = jest.fn();
const mockSetTimeRange = jest.fn();
jest.mock('../hooks/useBandwidthHistory', () => ({
  useBandwidthHistory: jest.fn(() => ({
    chartData: [],
    timeRange: '24h',
    setTimeRange: mockSetTimeRange,
    addDataPoint: mockAddDataPoint,
    pointCount: 0,
    isEmpty: true,
    isCollecting: false,
    isLoading: false,
  })),
}));

// Mock useDeviceHistory hook
const mockSetDeviceTimeRange = jest.fn();
const mockSetDeviceFilter = jest.fn();
const mockRefresh = jest.fn();
jest.mock('../hooks/useDeviceHistory', () => ({
  useDeviceHistory: jest.fn(() => ({
    events: [],
    timeRange: '24h',
    setTimeRange: mockSetDeviceTimeRange,
    deviceFilter: null,
    setDeviceFilter: mockSetDeviceFilter,
    isLoading: false,
    isEmpty: true,
    refresh: mockRefresh,
  })),
}));

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock sub-components to isolate page logic
jest.mock('../components/WanStatusCard', () => ({
  __esModule: true,
  default: ({ wan, isStale, lastUpdated }: any) => (
    <div
      data-testid="wan-status-card"
      data-connected={wan?.connected}
      data-stale={isStale}
      data-last-updated={lastUpdated}
    />
  ),
}));

jest.mock('../components/DeviceListTable', () => ({
  __esModule: true,
  default: ({ devices, isStale, onCategoryChange }: any) => (
    <div
      data-testid="device-list-table"
      data-count={devices.length}
      data-stale={isStale}
      data-has-on-category-change={!!onCategoryChange}
    />
  ),
}));

jest.mock('../components/BandwidthChart', () => ({
  __esModule: true,
  default: ({ data, timeRange, onTimeRangeChange, isEmpty, isCollecting, pointCount }: any) => (
    <div
      data-testid="bandwidth-chart"
      data-point-count={pointCount}
      data-time-range={timeRange}
      data-is-empty={isEmpty}
      data-is-collecting={isCollecting}
      data-data-length={data.length}
    />
  ),
}));

jest.mock('../components/DeviceHistoryTimeline', () => ({
  __esModule: true,
  default: ({ events, isLoading, isEmpty, timeRange, deviceFilter, devices }: any) => (
    <div
      data-testid="device-history-timeline"
      data-event-count={events.length}
      data-is-loading={isLoading}
      data-is-empty={isEmpty}
      data-time-range={timeRange}
      data-device-filter={deviceFilter}
      data-device-count={devices.length}
    />
  ),
}));

const mockedUseNetworkData = useNetworkData as jest.MockedFunction<typeof useNetworkData>;
const mockedUseBandwidthHistory = useBandwidthHistory as jest.MockedFunction<typeof useBandwidthHistory>;
const mockedUseDeviceHistory = useDeviceHistory as jest.MockedFunction<typeof useDeviceHistory>;

/**
 * Helper: Create mock UseNetworkDataReturn with all required fields
 */
function createMockNetworkData(overrides: Partial<UseNetworkDataReturn> = {}): UseNetworkDataReturn {
  return {
    bandwidth: null,
    devices: [],
    wan: null,
    downloadHistory: [],
    uploadHistory: [],
    loading: false,
    connected: false,
    stale: false,
    lastUpdated: null,
    health: 'poor',
    healthMapped: 'error',
    error: null,
    activeDeviceCount: 0,
    updateDeviceCategory: jest.fn(),
    ...overrides,
  };
}

describe('NetworkPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAddDataPoint.mockClear();
    mockSetTimeRange.mockClear();
    mockSetDeviceTimeRange.mockClear();
    mockSetDeviceFilter.mockClear();
    mockRefresh.mockClear();
  });

  describe('Loading State', () => {
    it('shows loading skeleton when loading=true and no data', () => {
      mockedUseNetworkData.mockReturnValue(
        createMockNetworkData({
          loading: true,
          wan: null,
          devices: [],
        })
      );

      const { container } = render(<NetworkPage />);

      // Skeleton elements should be present (check by className pattern)
      const skeletons = container.querySelectorAll('.rounded-xl, .rounded-2xl');
      expect(skeletons.length).toBeGreaterThan(0);

      // WanStatusCard should NOT be rendered
      expect(screen.queryByTestId('wan-status-card')).not.toBeInTheDocument();
    });

    it('shows page content when loading=true but has cached data', () => {
      const wanData = {
        connected: true,
        uptime: 3600,
        externalIp: '1.2.3.4',
        timestamp: Date.now(),
      };

      const device1 = {
        id: 'dev-01',
        name: 'Device 1',
        ip: '192.168.1.10',
        mac: 'AA:BB:CC:DD:EE:01',
        active: true,
        bandwidth: undefined,
        lastSeen: undefined,
      };

      mockedUseNetworkData.mockReturnValue(
        createMockNetworkData({
          loading: true, // Still loading (refresh in progress)
          wan: wanData,
          devices: [device1],
          stale: true,
          lastUpdated: Date.now(),
        })
      );

      render(<NetworkPage />);

      // Should render components (not skeleton) even while refreshing
      expect(screen.getByTestId('wan-status-card')).toBeInTheDocument();
      expect(screen.getByTestId('device-list-table')).toBeInTheDocument();
    });
  });

  describe('Component Rendering', () => {
    it('renders WanStatusCard with wan data', () => {
      const wanData = {
        connected: true,
        uptime: 7200,
        externalIp: '1.2.3.4',
        timestamp: Date.now(),
      };

      const lastUpdated = Date.now();

      mockedUseNetworkData.mockReturnValue(
        createMockNetworkData({
          loading: false,
          wan: wanData,
          devices: [],
          stale: false,
          lastUpdated,
        })
      );

      render(<NetworkPage />);

      const wanCard = screen.getByTestId('wan-status-card');
      expect(wanCard).toBeInTheDocument();
      expect(wanCard).toHaveAttribute('data-connected', 'true');
      expect(wanCard).toHaveAttribute('data-stale', 'false');
      expect(wanCard).toHaveAttribute('data-last-updated', String(lastUpdated));
    });

    it('renders DeviceListTable with devices data', () => {
      const wanData = {
        connected: true,
        uptime: 3600,
        externalIp: '1.2.3.4',
        timestamp: Date.now(),
      };

      const devices = [
        {
          id: 'dev-01',
          name: 'Device 1',
          ip: '192.168.1.10',
          mac: 'AA:BB:CC:DD:EE:01',
          active: true,
          bandwidth: undefined,
          lastSeen: undefined,
        },
        {
          id: 'dev-02',
          name: 'Device 2',
          ip: '192.168.1.11',
          mac: 'AA:BB:CC:DD:EE:02',
          active: false,
          bandwidth: undefined,
          lastSeen: Date.now() - 3600000,
        },
        {
          id: 'dev-03',
          name: 'Device 3',
          ip: '192.168.1.12',
          mac: 'AA:BB:CC:DD:EE:03',
          active: true,
          bandwidth: undefined,
          lastSeen: undefined,
        },
      ];

      mockedUseNetworkData.mockReturnValue(
        createMockNetworkData({
          loading: false,
          wan: wanData,
          devices,
          stale: false,
        })
      );

      render(<NetworkPage />);

      const deviceTable = screen.getByTestId('device-list-table');
      expect(deviceTable).toBeInTheDocument();
      expect(deviceTable).toHaveAttribute('data-count', '3');
      expect(deviceTable).toHaveAttribute('data-stale', 'false');
    });
  });

  describe('Navigation', () => {
    it('back button navigates to home', async () => {
      const user = userEvent.setup();

      const wanData = {
        connected: true,
        uptime: 3600,
        externalIp: '1.2.3.4',
        timestamp: Date.now(),
      };

      mockedUseNetworkData.mockReturnValue(
        createMockNetworkData({
          loading: false,
          wan: wanData,
          devices: [],
        })
      );

      render(<NetworkPage />);

      const backButton = screen.getByRole('button', { name: /indietro/i });
      expect(backButton).toBeInTheDocument();

      await user.click(backButton);

      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  describe('Stale Flag Propagation', () => {
    it('passes stale flag to both components', () => {
      const wanData = {
        connected: true,
        uptime: 3600,
        externalIp: '1.2.3.4',
        timestamp: Date.now(),
      };

      const devices = [
        {
          id: 'dev-01',
          name: 'Device 1',
          ip: '192.168.1.10',
          mac: 'AA:BB:CC:DD:EE:01',
          active: true,
          bandwidth: undefined,
          lastSeen: undefined,
        },
      ];

      mockedUseNetworkData.mockReturnValue(
        createMockNetworkData({
          loading: false,
          wan: wanData,
          devices,
          stale: true,
          lastUpdated: Date.now(),
        })
      );

      render(<NetworkPage />);

      const wanCard = screen.getByTestId('wan-status-card');
      const deviceTable = screen.getByTestId('device-list-table');

      expect(wanCard).toHaveAttribute('data-stale', 'true');
      expect(deviceTable).toHaveAttribute('data-stale', 'true');
    });
  });

  describe('Page Layout', () => {
    it('renders page title', () => {
      mockedUseNetworkData.mockReturnValue(
        createMockNetworkData({
          loading: false,
          wan: {
            connected: true,
            uptime: 3600,
            externalIp: '1.2.3.4',
            timestamp: Date.now(),
          },
          devices: [],
        })
      );

      render(<NetworkPage />);

      expect(screen.getByRole('heading', { name: /rete/i })).toBeInTheDocument();
    });
  });

  describe('Bandwidth Chart Integration', () => {
    it('renders BandwidthChart component on page', () => {
      mockedUseNetworkData.mockReturnValue(
        createMockNetworkData({
          loading: false,
          wan: {
            connected: true,
            uptime: 3600,
            externalIp: '1.2.3.4',
            timestamp: Date.now(),
          },
          devices: [],
        })
      );

      render(<NetworkPage />);

      expect(screen.getByTestId('bandwidth-chart')).toBeInTheDocument();
    });

    it('passes bandwidth history data to BandwidthChart', () => {
      const chartData = [
        { time: Date.now() - 3600000, download: 50, upload: 10 },
        { time: Date.now() - 1800000, download: 75, upload: 15 },
        { time: Date.now(), download: 60, upload: 12 },
      ];

      mockedUseBandwidthHistory.mockReturnValue({
        chartData,
        timeRange: '1h',
        setTimeRange: mockSetTimeRange,
        addDataPoint: mockAddDataPoint,
        pointCount: 100,
        isEmpty: false,
        isCollecting: false,
      });

      mockedUseNetworkData.mockReturnValue(
        createMockNetworkData({
          loading: false,
          wan: {
            connected: true,
            uptime: 3600,
            externalIp: '1.2.3.4',
            timestamp: Date.now(),
          },
          devices: [],
        })
      );

      render(<NetworkPage />);

      const bandwidthChart = screen.getByTestId('bandwidth-chart');
      expect(bandwidthChart).toHaveAttribute('data-point-count', '100');
      expect(bandwidthChart).toHaveAttribute('data-time-range', '1h');
      expect(bandwidthChart).toHaveAttribute('data-is-empty', 'false');
      expect(bandwidthChart).toHaveAttribute('data-data-length', '3');
    });

    it('calls addDataPoint when networkData.bandwidth updates', () => {
      const bandwidthData = {
        download: 50.5,
        upload: 10.2,
        timestamp: Date.now(),
      };

      mockedUseNetworkData.mockReturnValue(
        createMockNetworkData({
          loading: false,
          bandwidth: bandwidthData,
          wan: {
            connected: true,
            uptime: 3600,
            externalIp: '1.2.3.4',
            timestamp: Date.now(),
          },
          devices: [],
        })
      );

      render(<NetworkPage />);

      // useEffect should have called addDataPoint with bandwidth data
      expect(mockAddDataPoint).toHaveBeenCalledWith(bandwidthData);
    });

    it('loading skeleton includes chart skeleton', () => {
      mockedUseNetworkData.mockReturnValue(
        createMockNetworkData({
          loading: true,
          wan: null,
          devices: [],
        })
      );

      const { container } = render(<NetworkPage />);

      // Should have 5 skeleton blocks now (title + WAN + devices + chart + timeline)
      const skeletons = container.querySelectorAll('.rounded-xl, .rounded-2xl');
      expect(skeletons.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Device History Timeline Integration', () => {
    it('renders DeviceHistoryTimeline component on page', () => {
      mockedUseNetworkData.mockReturnValue(
        createMockNetworkData({
          loading: false,
          wan: {
            connected: true,
            uptime: 3600,
            externalIp: '1.2.3.4',
            timestamp: Date.now(),
          },
          devices: [],
        })
      );

      render(<NetworkPage />);

      expect(screen.getByTestId('device-history-timeline')).toBeInTheDocument();
    });

    it('passes device history data to DeviceHistoryTimeline', () => {
      const mockEvents = [
        {
          deviceMac: 'AA:BB:CC:DD:EE:FF',
          deviceName: 'Device 1',
          deviceIp: '192.168.1.100',
          eventType: 'connected' as const,
          timestamp: Date.now(),
        },
      ];

      const mockDevices = [
        {
          id: 'dev-01',
          name: 'Device 1',
          ip: '192.168.1.100',
          mac: 'AA:BB:CC:DD:EE:FF',
          active: true,
          bandwidth: undefined,
          lastSeen: undefined,
        },
      ];

      mockedUseDeviceHistory.mockReturnValue({
        events: mockEvents,
        timeRange: '7d',
        setTimeRange: mockSetDeviceTimeRange,
        deviceFilter: 'AA:BB:CC:DD:EE:FF',
        setDeviceFilter: mockSetDeviceFilter,
        isLoading: false,
        isEmpty: false,
        refresh: mockRefresh,
      });

      mockedUseNetworkData.mockReturnValue(
        createMockNetworkData({
          loading: false,
          wan: {
            connected: true,
            uptime: 3600,
            externalIp: '1.2.3.4',
            timestamp: Date.now(),
          },
          devices: mockDevices,
        })
      );

      render(<NetworkPage />);

      const timeline = screen.getByTestId('device-history-timeline');
      expect(timeline).toHaveAttribute('data-event-count', '1');
      expect(timeline).toHaveAttribute('data-is-loading', 'false');
      expect(timeline).toHaveAttribute('data-is-empty', 'false');
      expect(timeline).toHaveAttribute('data-time-range', '7d');
      expect(timeline).toHaveAttribute('data-device-filter', 'AA:BB:CC:DD:EE:FF');
      expect(timeline).toHaveAttribute('data-device-count', '1');
    });
  });

  describe('Category Override Integration', () => {
    it('passes onCategoryChange callback to DeviceListTable', () => {
      const wanData = {
        connected: true,
        uptime: 3600,
        externalIp: '1.2.3.4',
        timestamp: Date.now(),
      };

      mockedUseNetworkData.mockReturnValue(
        createMockNetworkData({
          loading: false,
          wan: wanData,
          devices: [],
        })
      );

      render(<NetworkPage />);

      const deviceTable = screen.getByTestId('device-list-table');
      expect(deviceTable).toHaveAttribute('data-has-on-category-change', 'true');
    });
  });
});
