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
import type { UseNetworkDataReturn } from '@/app/components/devices/network/types';

// Mock useNetworkData hook
jest.mock('@/app/components/devices/network/hooks/useNetworkData', () => ({
  useNetworkData: jest.fn(),
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
  default: ({ devices, isStale }: any) => (
    <div
      data-testid="device-list-table"
      data-count={devices.length}
      data-stale={isStale}
    />
  ),
}));

const mockedUseNetworkData = useNetworkData as jest.MockedFunction<typeof useNetworkData>;

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
    ...overrides,
  };
}

describe('NetworkPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
        name: 'Device 1',
        ip: '192.168.1.10',
        mac: 'AA:BB:CC:DD:EE:01',
        active: true,
        bandwidth: null,
        lastSeen: null,
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
          name: 'Device 1',
          ip: '192.168.1.10',
          mac: 'AA:BB:CC:DD:EE:01',
          active: true,
          bandwidth: null,
          lastSeen: null,
        },
        {
          name: 'Device 2',
          ip: '192.168.1.11',
          mac: 'AA:BB:CC:DD:EE:02',
          active: false,
          bandwidth: null,
          lastSeen: Date.now() - 3600000,
        },
        {
          name: 'Device 3',
          ip: '192.168.1.12',
          mac: 'AA:BB:CC:DD:EE:03',
          active: true,
          bandwidth: null,
          lastSeen: null,
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
          name: 'Device 1',
          ip: '192.168.1.10',
          mac: 'AA:BB:CC:DD:EE:01',
          active: true,
          bandwidth: null,
          lastSeen: null,
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
});
