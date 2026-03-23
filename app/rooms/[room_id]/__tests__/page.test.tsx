/**
 * Tests for /rooms/[room_id] page
 *
 * Validates ROOM-05 (room detail: heading, description, device list,
 * loading/error/empty states, provider Badge variant, device_type_slug, locale sort).
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import RoomDetailPage from '../page';
import type { Room } from '@/types/rooms';
import type { RegistryDevice } from '@/types/registry';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
  useParams: () => ({ room_id: '1' }),
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

// Mock DataTable — renders data items mapping columns including actions cells
jest.mock('@/app/components/ui/DataTable', () => ({
  __esModule: true,
  default: ({ data, columns }: { data: RegistryDevice[]; columns: any[] }) => (
    <div data-testid="data-table">
      {data.map((item: RegistryDevice) => (
        <div key={item.id} data-testid={`row-${item.id}`}>
          {columns.map((col: any) => {
            if (col.id === 'actions') {
              const cellContent = col.cell?.({ row: { original: item } });
              return <div key="actions">{cellContent}</div>;
            }
            if (col.cell) {
              return <div key={col.accessorKey ?? col.id}>{col.cell({ row: { original: item } })}</div>;
            }
            return (
              <div key={col.accessorKey}>
                {item[col.accessorKey as keyof RegistryDevice] as string}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  ),
}));

// Mock FormModal — returns null when !isOpen
jest.mock('@/app/components/ui/FormModal', () => ({
  __esModule: true,
  default: ({
    isOpen,
    title,
  }: {
    isOpen: boolean;
    title?: string;
  }) => {
    if (!isOpen) return null;
    return <div data-testid="form-modal-assign"><span>{title}</span></div>;
  },
}));

// Mock ConfirmationDialog — returns null when !isOpen
jest.mock('@/app/components/ui/ConfirmationDialog', () => ({
  __esModule: true,
  default: ({
    isOpen,
    title,
  }: {
    isOpen: boolean;
    title?: string;
  }) => {
    if (!isOpen) return null;
    return <div data-testid="confirmation-dialog"><span>{title}</span></div>;
  },
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
  default: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="banner">{children}</div>
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
    disabled,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

// Mock Card
jest.mock('@/app/components/ui/Card', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

// Mock ui barrel exports
jest.mock('@/app/components/ui', () => ({
  Heading: ({ children }: { children?: React.ReactNode }) => <h2>{children}</h2>,
  Text: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
}));

// Mock Select
jest.mock('@/app/components/ui/Select', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <select>{children}</select>,
}));

// Mock useToast
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock('@/app/hooks/useToast', () => ({
  useToast: () => ({ success: mockToastSuccess, error: mockToastError }),
}));

// --- Mock data ---
const mockRoom: Room = {
  id: 1,
  name: 'Soggiorno',
  description: 'Stanza principale',
  created_at: 1700000000,
  updated_at: 1700000000,
};

const mockDevices: RegistryDevice[] = [
  {
    id: 10,
    provider_name: 'hue',
    device_id: 'light-1',
    custom_name: 'Lampada Soggiorno',
    device_type_slug: 'light',
    created_at: 1700000000,
    updated_at: 1700000000,
  },
  {
    id: 20,
    provider_name: 'thermorossi',
    device_id: 'stove-1',
    custom_name: 'Stufa',
    device_type_slug: 'stove',
    created_at: 1700000000,
    updated_at: 1700000000,
  },
];

describe('RoomDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock) = jest.fn((url: string) => {
      if (url === '/api/rooms/1') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRoom) });
      }
      if (url === '/api/rooms/1/devices') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockDevices) });
      }
      return Promise.resolve({ ok: false, status: 500 });
    });
  });

  // ROOM-05: renders device list
  it('Test 1 (ROOM-05): renders device list — fetch /api/rooms/1/devices returns 2 devices, custom_name values visible in DataTable', async () => {
    render(<RoomDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Lampada Soggiorno')).toBeInTheDocument();
      expect(screen.getByText('Stufa')).toBeInTheDocument();
    });
  });

  // ROOM-05: room heading
  it('Test 2 (ROOM-05): room heading — fetch /api/rooms/1 returns room with name "Soggiorno", heading shows "Soggiorno"', async () => {
    render(<RoomDetailPage />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Soggiorno' })).toBeInTheDocument();
    });
  });

  // ROOM-05: room description
  it('Test 3 (ROOM-05): room description — room.description "Stanza principale" is shown below heading', async () => {
    render(<RoomDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Stanza principale')).toBeInTheDocument();
    });
  });

  // ROOM-05: loading state
  it('Test 4 (ROOM-05): loading state — before fetch resolves, Skeleton is rendered', async () => {
    (global.fetch as jest.Mock) = jest.fn(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () => Promise.resolve(mockRoom),
              }),
            200
          )
        )
    );
    render(<RoomDetailPage />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  // ROOM-05: error state (room fetch)
  it('Test 5 (ROOM-05): error state (room fetch) — fetch /api/rooms/1 returns 404, Banner with "Stanza non trovata" shown', async () => {
    (global.fetch as jest.Mock) = jest.fn((url: string) => {
      if (url === '/api/rooms/1') {
        return Promise.resolve({ ok: false, status: 404 });
      }
      if (url === '/api/rooms/1/devices') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockDevices) });
      }
      return Promise.resolve({ ok: false, status: 500 });
    });
    render(<RoomDetailPage />);
    await waitFor(() => {
      expect(screen.getByTestId('banner')).toBeInTheDocument();
      expect(screen.getByTestId('banner').textContent).toContain('Stanza non trovata');
    });
  });

  // ROOM-05: error state (devices fetch)
  it('Test 6 (ROOM-05): error state (devices fetch) — fetch /api/rooms/1/devices rejects, Banner with error message shown', async () => {
    (global.fetch as jest.Mock) = jest.fn((url: string) => {
      if (url === '/api/rooms/1') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRoom) });
      }
      if (url === '/api/rooms/1/devices') {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({ ok: false, status: 500 });
    });
    render(<RoomDetailPage />);
    await waitFor(() => {
      expect(screen.getByTestId('banner')).toBeInTheDocument();
    });
  });

  // ROOM-05: empty state
  it('Test 7 (ROOM-05): empty state — fetch /api/rooms/1/devices returns [], shows "Nessun dispositivo assegnato"', async () => {
    (global.fetch as jest.Mock) = jest.fn((url: string) => {
      if (url === '/api/rooms/1') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRoom) });
      }
      if (url === '/api/rooms/1/devices') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: false, status: 500 });
    });
    render(<RoomDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Nessun dispositivo assegnato')).toBeInTheDocument();
    });
  });

  // ROOM-05: provider Badge variant
  it('Test 8 (ROOM-05): provider Badge variant — hue device shows Badge, thermorossi device shows Badge (variant mapping works)', async () => {
    render(<RoomDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Lampada Soggiorno')).toBeInTheDocument();
    });
    // hue -> ocean variant
    const hueBadge = screen.getByText('hue');
    expect(hueBadge).toHaveAttribute('data-variant', 'ocean');
    // thermorossi -> ember variant
    const thermorossiBadge = screen.getByText('thermorossi');
    expect(thermorossiBadge).toHaveAttribute('data-variant', 'ember');
  });

  // ROOM-05: device_type_slug column
  it('Test 9 (ROOM-05): device_type_slug column — slug shown in mono font code element', async () => {
    render(<RoomDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Lampada Soggiorno')).toBeInTheDocument();
    });
    const lightCode = screen.getByText('light');
    expect(lightCode.tagName.toLowerCase()).toBe('code');
    const stoveCode = screen.getByText('stove');
    expect(stoveCode.tagName.toLowerCase()).toBe('code');
  });

  // ROOM-05: Italian locale sort
  it('Test 10 (ROOM-05): Italian locale sort — devices sorted by custom_name using localeCompare "it"', async () => {
    const unsortedDevices: RegistryDevice[] = [
      { id: 30, provider_name: 'hue', device_id: 'z-1', custom_name: 'Zona B', device_type_slug: 'light', created_at: 1700000000, updated_at: 1700000000 },
      { id: 10, provider_name: 'hue', device_id: 'light-1', custom_name: 'Lampada Soggiorno', device_type_slug: 'light', created_at: 1700000000, updated_at: 1700000000 },
      { id: 20, provider_name: 'thermorossi', device_id: 'stove-1', custom_name: 'Stufa', device_type_slug: 'stove', created_at: 1700000000, updated_at: 1700000000 },
    ];
    (global.fetch as jest.Mock) = jest.fn((url: string) => {
      if (url === '/api/rooms/1') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRoom) });
      }
      if (url === '/api/rooms/1/devices') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(unsortedDevices) });
      }
      return Promise.resolve({ ok: false, status: 500 });
    });
    render(<RoomDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Lampada Soggiorno')).toBeInTheDocument();
    });
    const table = screen.getByTestId('data-table');
    const rows = table.querySelectorAll('[data-testid^="row-"]');
    // Sorted: Lampada Soggiorno (id=10), Stufa (id=20), Zona B (id=30)
    expect(rows[0]).toHaveAttribute('data-testid', 'row-10');
    expect(rows[1]).toHaveAttribute('data-testid', 'row-20');
    expect(rows[2]).toHaveAttribute('data-testid', 'row-30');
  });
});
