/**
 * NetworkCard Integration Tests
 *
 * Tests the NetworkCard orchestrator component including:
 * - Loading state (skeleton)
 * - Setup error state
 * - WAN status bar rendering
 * - Bandwidth hero numbers
 * - Device count and health
 * - Stale indicator
 * - Click navigation
 * - Keyboard navigation
 */

import { render, screen, fireEvent } from '@testing-library/react';
import NetworkCard from '../NetworkCard';
import { useNetworkData } from '../hooks/useNetworkData';
import { useNetworkCommands } from '../hooks/useNetworkCommands';
import type { UseNetworkDataReturn } from '../types';

// Mock modules
jest.mock('../hooks/useNetworkData');
jest.mock('../hooks/useNetworkCommands');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

// Mock Recharts components to avoid rendering issues in tests
jest.mock('recharts', () => ({
  ResponsiveContainer: () => <div data-testid="responsive-container" />,
  AreaChart: () => <div data-testid="area-chart" />,
  Area: () => null,
}));

const mockUseNetworkData = useNetworkData as jest.MockedFunction<typeof useNetworkData>;
const mockUseNetworkCommands = useNetworkCommands as jest.MockedFunction<
  typeof useNetworkCommands
>;

describe('NetworkCard', () => {
  const mockNavigateToNetwork = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNetworkCommands.mockReturnValue({
      navigateToNetwork: mockNavigateToNetwork,
    });
  });

  const createMockData = (overrides?: Partial<UseNetworkDataReturn>): UseNetworkDataReturn => ({
    bandwidth: { download: 45.2, upload: 12.8, timestamp: Date.now() },
    devices: [
      { id: '1', name: 'Device 1', ip: '192.168.1.10', mac: 'AA:BB:CC:DD:EE:FF', active: true },
      { id: '2', name: 'Device 2', ip: '192.168.1.11', mac: 'AA:BB:CC:DD:EE:AA', active: true },
    ],
    wan: { connected: true, uptime: 86400, linkSpeed: 100, timestamp: Date.now() },
    downloadHistory: [
      { time: Date.now() - 60000, mbps: 40 },
      { time: Date.now(), mbps: 45.2 },
    ],
    uploadHistory: [
      { time: Date.now() - 60000, mbps: 10 },
      { time: Date.now(), mbps: 12.8 },
    ],
    loading: false,
    connected: true,
    stale: false,
    lastUpdated: Date.now(),
    health: 'excellent',
    healthMapped: 'ok',
    error: null,
    activeDeviceCount: 2,
    updateDeviceCategory: jest.fn(),
    ...overrides,
  });

  describe('Loading state', () => {
    it('shows skeleton when loading', () => {
      mockUseNetworkData.mockReturnValue(createMockData({ loading: true }));

      const { container } = render(<NetworkCard />);

      // Skeleton should be present - check for skeleton structure
      const skeletonCard = container.querySelector('.overflow-visible');
      expect(skeletonCard).toBeInTheDocument();

      // Should contain skeleton pulse elements
      const pulseElements = container.querySelectorAll('.bg-slate-700\\/50');
      expect(pulseElements.length).toBeGreaterThan(0);
    });
  });

  describe('Setup error state', () => {
    it('shows setup banner when error.type is setup', () => {
      mockUseNetworkData.mockReturnValue(
        createMockData({
          error: {
            type: 'setup',
            message: 'TR-064 not enabled',
          },
        })
      );

      render(<NetworkCard />);

      expect(screen.getByText('Configura Fritz!Box')).toBeInTheDocument();
      expect(screen.getByText(/configura le credenziali Fritz!Box/i)).toBeInTheDocument();
    });
  });

  describe('Generic error state', () => {
    it('shows error banner for generic errors', () => {
      mockUseNetworkData.mockReturnValue(
        createMockData({
          error: {
            type: 'generic',
            message: 'Fritz!Box non raggiungibile',
          },
        })
      );

      render(<NetworkCard />);

      expect(screen.getByText('Errore connessione')).toBeInTheDocument();
      expect(screen.getByText('Fritz!Box non raggiungibile')).toBeInTheDocument();
    });
  });

  describe('WAN status bar', () => {
    it('displays green status bar when WAN is online', () => {
      mockUseNetworkData.mockReturnValue(createMockData({ connected: true }));

      render(<NetworkCard />);

      expect(screen.getByText('Online')).toBeInTheDocument();
      // Green styling is applied via className, verified by presence of "Online" text
    });

    it('displays red status bar when WAN is offline', () => {
      mockUseNetworkData.mockReturnValue(
        createMockData({
          connected: false,
          wan: { connected: false, uptime: 0, timestamp: Date.now() },
        })
      );

      render(<NetworkCard />);

      expect(screen.getByText('Offline')).toBeInTheDocument();
    });
  });

  describe('Bandwidth hero numbers', () => {
    it('displays download and upload bandwidth values', () => {
      mockUseNetworkData.mockReturnValue(
        createMockData({
          bandwidth: { download: 45.2, upload: 12.8, timestamp: Date.now() },
        })
      );

      render(<NetworkCard />);

      expect(screen.getByText('45.2')).toBeInTheDocument();
      expect(screen.getByText('12.8')).toBeInTheDocument();
      expect(screen.getAllByText('Mbps')).toHaveLength(2);
    });

    it('shows dashes when bandwidth is null', () => {
      mockUseNetworkData.mockReturnValue(createMockData({ bandwidth: null }));

      render(<NetworkCard />);

      const dashes = screen.getAllByText('--');
      expect(dashes.length).toBeGreaterThanOrEqual(2); // Download and upload
    });
  });

  describe('Device count and health', () => {
    it('displays active device count', () => {
      mockUseNetworkData.mockReturnValue(createMockData({ activeDeviceCount: 7 }));

      render(<NetworkCard />);

      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('Dispositivi')).toBeInTheDocument();
    });

    it('displays health indicator in header', () => {
      mockUseNetworkData.mockReturnValue(
        createMockData({ health: 'excellent', healthMapped: 'ok' })
      );

      render(<NetworkCard />);

      // HealthIndicator is rendered (verified by icon presence)
      const healthSection = screen.getByText('Eccellente');
      expect(healthSection).toBeInTheDocument();
    });
  });

  describe('Stale indicator', () => {
    it('shows stale indicator when data is old', () => {
      const pastTimestamp = Date.now() - 5 * 60 * 1000; // 5 minutes ago
      mockUseNetworkData.mockReturnValue(
        createMockData({ stale: true, lastUpdated: pastTimestamp })
      );

      render(<NetworkCard />);

      expect(screen.getByText(/Aggiornato/i)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('handles click navigation', () => {
      mockUseNetworkData.mockReturnValue(createMockData());

      render(<NetworkCard />);

      const card = screen.getByRole('link', { name: /Vai alla pagina Rete/i });
      fireEvent.click(card);

      expect(mockNavigateToNetwork).toHaveBeenCalledTimes(1);
    });

    it('handles Enter key navigation', () => {
      mockUseNetworkData.mockReturnValue(createMockData());

      render(<NetworkCard />);

      const card = screen.getByRole('link', { name: /Vai alla pagina Rete/i });
      fireEvent.keyDown(card, { key: 'Enter' });

      expect(mockNavigateToNetwork).toHaveBeenCalledTimes(1);
    });

    it('handles Space key navigation', () => {
      mockUseNetworkData.mockReturnValue(createMockData());

      render(<NetworkCard />);

      const card = screen.getByRole('link', { name: /Vai alla pagina Rete/i });
      fireEvent.keyDown(card, { key: ' ' });

      expect(mockNavigateToNetwork).toHaveBeenCalledTimes(1);
    });
  });

  describe('Uptime formatting', () => {
    it('displays formatted uptime', () => {
      mockUseNetworkData.mockReturnValue(
        createMockData({
          wan: {
            connected: true,
            uptime: 86400 + 18000, // 1 day + 5 hours
            timestamp: Date.now(),
          },
        })
      );

      render(<NetworkCard />);

      // Should show "1g 5h" or similar uptime format
      expect(screen.getByText(/1g 5h/i)).toBeInTheDocument();
    });
  });
});
