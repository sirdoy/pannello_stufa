/**
 * Tests for /rooms page
 *
 * Validates ROOM-01 (list, loading, error, empty, health stats,
 * device count badge singular/plural, date formatting).
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import RoomsPage from '../page';
import type { Room, RoomsHealthResponse } from '@/types/rooms';

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

// Mock DataTable — renders data items mapping columns including actions cells
jest.mock('@/app/components/ui/DataTable', () => ({
  __esModule: true,
  default: ({ data, columns }: { data: Room[]; columns: any[] }) => (
    <div data-testid="data-table">
      {data.map((item: Room) => (
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
                {item[col.accessorKey as keyof Room] as string}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  ),
}));

// Mock FormModal — when isOpen=true renders div with data-testid based on title
jest.mock('@/app/components/ui/FormModal', () => ({
  __esModule: true,
  default: ({
    isOpen,
    onSubmit,
    title,
  }: {
    isOpen: boolean;
    onSubmit: (data: any) => Promise<void>;
    children?: any;
    title?: string;
  }) => {
    if (!isOpen) return null;
    const isCreate = title === 'Crea stanza';
    const testid = isCreate ? 'form-modal-create' : 'form-modal-edit';
    const handleSubmit = () => {
      const data = isCreate
        ? { name: 'Nuova Stanza', description: 'Test' }
        : { name: 'Stanza Aggiornata', description: null };
      // Catch errors silently — real FormModal keeps modal open on error
      Promise.resolve(onSubmit(data)).catch(() => { /* swallow — modal stays open */ });
    };
    return (
      <div data-testid={testid}>
        <span>{title}</span>
        <button data-testid={`${testid}-submit`} onClick={handleSubmit}>
          Submit
        </button>
      </div>
    );
  },
}));

// Mock ConfirmationDialog
jest.mock('@/app/components/ui/ConfirmationDialog', () => ({
  __esModule: true,
  default: ({
    isOpen,
    onConfirm,
    description,
    title,
  }: {
    isOpen: boolean;
    onConfirm?: () => void | Promise<void>;
    description?: string;
    title?: string;
  }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="confirmation-dialog">
        <span>{title}</span>
        <span>{description}</span>
        <button data-testid="confirm-button" onClick={() => onConfirm?.()}>
          Confirm
        </button>
      </div>
    );
  },
}));

// Mock Badge
jest.mock('@/app/components/ui/Badge', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
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

// Mock useToast
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock('@/app/hooks/useToast', () => ({
  useToast: () => ({ success: mockToastSuccess, error: mockToastError }),
}));

// --- Mock data ---
const mockRooms: Room[] = [
  { id: 1, name: 'Soggiorno', description: 'Stanza principale', created_at: 1700000000, updated_at: 1700000000, device_count: 3 },
  { id: 2, name: 'Camera', description: null, created_at: 1700100000, updated_at: 1700100000, device_count: 0 },
];

const mockHealth: RoomsHealthResponse = {
  room_count: 5,
  total_device_count: 12,
  orphan_device_count: 2,
};

describe('RoomsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock) = jest.fn((url: string) => {
      if (url === '/api/rooms/health') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockHealth) });
      }
      if (url === '/api/rooms') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRooms) });
      }
      return Promise.resolve({ ok: false, status: 500 });
    });
  });

  // ROOM-01: renders room list
  it('Test 1 (ROOM-01): renders room list — fetch /api/rooms returns 2 rooms, room names visible', async () => {
    render(<RoomsPage />);
    await waitFor(() => {
      expect(screen.getByText('Soggiorno')).toBeInTheDocument();
      expect(screen.getByText('Camera')).toBeInTheDocument();
    });
  });

  // ROOM-01: device_count Badge singular/plural
  it('Test 2 (ROOM-01): device_count Badge — 3 shows "3 dispositivi", 0 shows "0 dispositivi", 1 shows "1 dispositivo"', async () => {
    // Include a room with device_count=1 for singular test
    const roomsWithOne: Room[] = [
      ...mockRooms,
      { id: 3, name: 'Bagno', description: null, created_at: 1700200000, updated_at: 1700200000, device_count: 1 },
    ];
    (global.fetch as jest.Mock) = jest.fn((url: string) => {
      if (url === '/api/rooms/health') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockHealth) });
      }
      if (url === '/api/rooms') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(roomsWithOne) });
      }
      return Promise.resolve({ ok: false, status: 500 });
    });

    render(<RoomsPage />);
    await waitFor(() => {
      expect(screen.getByText('3 dispositivi')).toBeInTheDocument();
      expect(screen.getByText('0 dispositivi')).toBeInTheDocument();
      expect(screen.getByText('1 dispositivo')).toBeInTheDocument();
    });
  });

  // ROOM-01: loading state
  it('Test 3 (ROOM-01): loading state — before fetch resolves, Skeleton is rendered', async () => {
    (global.fetch as jest.Mock) = jest.fn(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () => Promise.resolve(mockRooms),
              }),
            200
          )
        )
    );
    render(<RoomsPage />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  // ROOM-01: error state
  it('Test 4 (ROOM-01): error state — fetch rejects, Banner shows error message', async () => {
    (global.fetch as jest.Mock) = jest.fn((url: string) => {
      if (url === '/api/rooms/health') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockHealth) });
      }
      return Promise.reject(new Error('Network error'));
    });
    render(<RoomsPage />);
    await waitFor(() => {
      expect(screen.getByTestId('banner')).toBeInTheDocument();
    });
  });

  // ROOM-01: empty state
  it('Test 5 (ROOM-01): empty state — fetch returns [], shows "Nessuna stanza creata"', async () => {
    (global.fetch as jest.Mock) = jest.fn((url: string) => {
      if (url === '/api/rooms/health') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockHealth) });
      }
      if (url === '/api/rooms') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: false, status: 500 });
    });
    render(<RoomsPage />);
    await waitFor(() => {
      expect(screen.getByText('Nessuna stanza creata')).toBeInTheDocument();
    });
  });

  // ROOM-01: health stats
  it('Test 6 (ROOM-01): health stats — room_count:5, total_device_count:12, orphan_device_count:2 all visible', async () => {
    render(<RoomsPage />);
    await waitFor(() => {
      expect(screen.getByText(/Stanze:/)).toBeInTheDocument();
      expect(screen.getByText(/Dispositivi assegnati:/)).toBeInTheDocument();
      expect(screen.getByText(/Orfani:/)).toBeInTheDocument();
    });
    expect(screen.getAllByText('5').length).toBeGreaterThan(0);
    expect(screen.getAllByText('12').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
  });

  // ROOM-01: created_at formatted
  it('Test 7 (ROOM-01): created_at formatted — date column shows Italian locale formatted date', async () => {
    render(<RoomsPage />);
    await waitFor(() => {
      expect(screen.getByText('Soggiorno')).toBeInTheDocument();
    });
    // 1700000000 * 1000 = Nov 14 or 15 2023 in it-IT locale
    const formatted = new Date(1700000000 * 1000).toLocaleDateString('it-IT');
    expect(screen.getByText(formatted)).toBeInTheDocument();
  });
});
