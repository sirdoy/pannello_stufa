/**
 * Tests for /rooms/status page
 *
 * Validates RSTAT-01 (per-room cards with device list),
 * RSTAT-02 (whole-house summary stats),
 * RSTAT-03 (rooms health stats),
 * D-20 (Aggiorna button refetch without polling).
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import RoomStatusPage from '../page';
import type { HouseStatusResponse, RoomsHealthResponse } from '@/types/rooms';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
}));

// Mock SettingsLayout
jest.mock('@/app/components/SettingsLayout', () => ({
  __esModule: true,
  default: ({ children, title }: { children?: React.ReactNode; title?: string }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

// Mock Card
jest.mock('@/app/components/ui/Card', () => ({
  __esModule: true,
  default: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

// Mock Badge
jest.mock('@/app/components/ui/Badge', () => ({
  __esModule: true,
  default: ({ children, variant }: { children?: React.ReactNode; variant?: string }) => (
    <span data-variant={variant}>{children}</span>
  ),
}));

// Mock Banner
jest.mock('@/app/components/ui/Banner', () => ({
  __esModule: true,
  default: ({ children, variant }: { children?: React.ReactNode; variant?: string }) => (
    <div data-variant={variant}>{children}</div>
  ),
}));

// Mock Skeleton
jest.mock('@/app/components/ui/Skeleton', () => ({
  __esModule: true,
  default: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

// Mock Button
jest.mock('@/app/components/ui/Button', () => ({
  __esModule: true,
  default: ({
    children,
    onClick,
    variant,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    variant?: string;
  }) => (
    <button data-variant={variant} onClick={onClick}>
      {children}
    </button>
  ),
}));

// Mock ui barrel exports
jest.mock('@/app/components/ui', () => ({
  Heading: ({ children }: { children?: React.ReactNode }) => <h2>{children}</h2>,
  Text: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
}));

// --- Mock data ---
const mockHouseStatus: HouseStatusResponse = {
  rooms: [
    {
      room_id: 1,
      room_name: 'Soggiorno',
      device_count: 2,
      available_count: 1,
      unavailable_count: 1,
      devices: [
        {
          device_registry_id: 1,
          custom_name: 'Luce salotto',
          provider_name: 'hue',
          device_type: 'light',
          status: 'available',
          data: { status: 'available', on: true, brightness: 200, reachable: true },
        },
        {
          device_registry_id: 2,
          custom_name: 'Sensore temp',
          provider_name: 'netatmo',
          device_type: 'sensor',
          status: 'unavailable',
          data: null,
        },
      ],
    },
    {
      room_id: 2,
      room_name: 'Camera',
      device_count: 1,
      available_count: 1,
      unavailable_count: 0,
      devices: [
        {
          device_registry_id: 3,
          custom_name: 'Termostato',
          provider_name: 'netatmo',
          device_type: 'thermostat',
          status: 'available',
          data: { status: 'available', setpoint_temp: 21, measured_temp: 19.5, heating: true },
        },
      ],
    },
  ],
  total_devices: 3,
  total_available: 2,
  total_unavailable: 1,
};

const mockHealth: RoomsHealthResponse = {
  room_count: 2,
  total_device_count: 3,
  orphan_device_count: 1,
};

describe('RoomStatusPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock) = jest.fn((url: string) => {
      if (url === '/api/rooms/house/status') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockHouseStatus) });
      }
      if (url === '/api/rooms/health') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockHealth) });
      }
      return Promise.resolve({ ok: false, status: 500 });
    });
  });

  describe('RSTAT-02', () => {
    it('renders whole-house summary stats', async () => {
      render(<RoomStatusPage />);
      await waitFor(() => {
        expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
      });
      // total_devices: 3 (may appear multiple times due to health total_device_count also being 3)
      expect(screen.getAllByText('3').length).toBeGreaterThan(0);
      // total_available: 2
      expect(screen.getAllByText('2').length).toBeGreaterThan(0);
      // total_unavailable: 1 (may appear multiple times)
      expect(screen.getAllByText('1').length).toBeGreaterThan(0);
      // Labels
      expect(screen.getByText(/Totale:/)).toBeInTheDocument();
      expect(screen.getByText(/Disponibili:/)).toBeInTheDocument();
      expect(screen.getByText(/Non disponibili:/)).toBeInTheDocument();
    });
  });

  describe('RSTAT-01', () => {
    it('renders per-room cards with devices', async () => {
      render(<RoomStatusPage />);
      await waitFor(() => {
        expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
      });
      // Room names visible
      expect(screen.getByText('Soggiorno')).toBeInTheDocument();
      expect(screen.getByText('Camera')).toBeInTheDocument();
      // Device name visible
      expect(screen.getByText('Luce salotto')).toBeInTheDocument();
      // Provider Badge for hue
      const hueBadges = screen.getAllByText('hue');
      expect(hueBadges.length).toBeGreaterThan(0);
      const hueBadgeEl = hueBadges[0]!.closest('[data-variant]');
      expect(hueBadgeEl?.getAttribute('data-variant')).toBe('ocean');
      // Device type in mono
      expect(screen.getByText('light')).toBeInTheDocument();
      // Disponibile badge (sage) for available device
      const disponibileBadges = screen.getAllByText('Disponibile');
      expect(disponibileBadges.length).toBeGreaterThan(0);
      const dispBadge = disponibileBadges[0]!.closest('[data-variant]');
      expect(dispBadge?.getAttribute('data-variant')).toBe('sage');
      // Non disponibile badge (ember) for unavailable device
      const nonDispBadges = screen.getAllByText('Non disponibile');
      expect(nonDispBadges.length).toBeGreaterThan(0);
      const nonDispBadge = nonDispBadges[0]!.closest('[data-variant]');
      expect(nonDispBadge?.getAttribute('data-variant')).toBe('ember');
    });

    it('renders provider-specific data', async () => {
      render(<RoomStatusPage />);
      await waitFor(() => {
        expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
      });
      // Light with on=true shows "Accesa"
      expect(screen.getByText(/Accesa/)).toBeInTheDocument();
      // Thermostat shows measured_temp, setpoint_temp, heating
      expect(screen.getByText(/19\.5°C/)).toBeInTheDocument();
      expect(screen.getByText(/21°C setpoint/)).toBeInTheDocument();
      expect(screen.getByText(/In riscaldamento/)).toBeInTheDocument();
    });

    it('does not render data for unavailable device', async () => {
      render(<RoomStatusPage />);
      await waitFor(() => {
        expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
      });
      // Sensore temp device has data: null and status: unavailable
      // Should NOT show temperature/humidity text
      expect(screen.queryByText(/\d+°C.*umidita/)).not.toBeInTheDocument();
    });
  });

  describe('RSTAT-03', () => {
    it('renders health stats', async () => {
      render(<RoomStatusPage />);
      await waitFor(() => {
        expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
      });
      expect(screen.getByText(/Stanze:/)).toBeInTheDocument();
      expect(screen.getByText(/Assegnati:/)).toBeInTheDocument();
      expect(screen.getByText(/Orfani:/)).toBeInTheDocument();
    });
  });

  describe('D-20', () => {
    it('Aggiorna button triggers refetch', async () => {
      render(<RoomStatusPage />);
      await waitFor(() => {
        expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
      });
      const fetchCallsBefore = (global.fetch as jest.Mock).mock.calls.filter((call: string[]) =>
        (call[0] as string).includes('house/status')
      ).length;
      fireEvent.click(screen.getByText('Aggiorna'));
      await waitFor(() => {
        const fetchCallsAfter = (global.fetch as jest.Mock).mock.calls.filter((call: string[]) =>
          (call[0] as string).includes('house/status')
        ).length;
        expect(fetchCallsAfter).toBeGreaterThan(fetchCallsBefore);
      });
    });
  });

  it('shows loading skeleton', () => {
    (global.fetch as jest.Mock) = jest.fn(
      () => new Promise(() => { /* never resolves */ })
    );
    render(<RoomStatusPage />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('shows error banner on fetch failure', async () => {
    (global.fetch as jest.Mock) = jest.fn((url: string) => {
      if (url === '/api/rooms/health') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockHealth) });
      }
      return Promise.resolve({ ok: false, status: 500 });
    });
    render(<RoomStatusPage />);
    await waitFor(() => {
      // Wait for loading to complete and error banner to appear
      expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
      // Banner renders with error variant and contains the error message
      const banner = document.querySelector('[data-variant="error"]');
      expect(banner).toBeInTheDocument();
    });
  });

  it('shows empty state when no rooms', async () => {
    (global.fetch as jest.Mock) = jest.fn((url: string) => {
      if (url === '/api/rooms/house/status') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              rooms: [],
              total_devices: 0,
              total_available: 0,
              total_unavailable: 0,
            }),
        });
      }
      if (url === '/api/rooms/health') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockHealth) });
      }
      return Promise.resolve({ ok: false, status: 500 });
    });
    render(<RoomStatusPage />);
    await waitFor(() => {
      expect(screen.getByText('Nessuna stanza configurata')).toBeInTheDocument();
    });
  });

  it('shows empty room message', async () => {
    (global.fetch as jest.Mock) = jest.fn((url: string) => {
      if (url === '/api/rooms/house/status') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              rooms: [
                {
                  room_id: 1,
                  room_name: 'Salotto',
                  device_count: 0,
                  available_count: 0,
                  unavailable_count: 0,
                  devices: [],
                },
              ],
              total_devices: 0,
              total_available: 0,
              total_unavailable: 0,
            }),
        });
      }
      if (url === '/api/rooms/health') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockHealth) });
      }
      return Promise.resolve({ ok: false, status: 500 });
    });
    render(<RoomStatusPage />);
    await waitFor(() => {
      expect(screen.getByText('Nessun dispositivo assegnato')).toBeInTheDocument();
    });
  });

  it('sorts rooms by Italian locale', async () => {
    (global.fetch as jest.Mock) = jest.fn((url: string) => {
      if (url === '/api/rooms/house/status') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              rooms: [
                { room_id: 1, room_name: 'Ufficio', device_count: 0, available_count: 0, unavailable_count: 0, devices: [] },
                { room_id: 2, room_name: 'Camera', device_count: 0, available_count: 0, unavailable_count: 0, devices: [] },
              ],
              total_devices: 0,
              total_available: 0,
              total_unavailable: 0,
            }),
        });
      }
      if (url === '/api/rooms/health') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockHealth) });
      }
      return Promise.resolve({ ok: false, status: 500 });
    });
    render(<RoomStatusPage />);
    await waitFor(() => {
      expect(screen.getByText('Camera')).toBeInTheDocument();
      expect(screen.getByText('Ufficio')).toBeInTheDocument();
    });
    // Camera should appear before Ufficio in document order
    const bodyHtml = document.body.innerHTML;
    const cameraIndex = bodyHtml.indexOf('Camera');
    const uffIndex = bodyHtml.indexOf('Ufficio');
    expect(cameraIndex).toBeLessThan(uffIndex);
  });
});
