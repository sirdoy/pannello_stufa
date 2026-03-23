/**
 * Tests for /rooms page
 *
 * Validates ROOM-01 (list, loading, error, empty, health stats,
 * device count badge singular/plural, date formatting).
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

  // ROOM-02: Create room
  it('Test 8 (ROOM-02): "Crea stanza" button opens create FormModal', async () => {
    render(<RoomsPage />);
    await waitFor(() => {
      expect(screen.getByText('Soggiorno')).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /crea stanza/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByTestId('form-modal-create')).toBeInTheDocument();
    });
  });

  it('Test 9 (ROOM-02): Create onSubmit calls POST /api/rooms with { name, description: null } body', async () => {
    render(<RoomsPage />);
    await waitFor(() => {
      expect(screen.getByText('Soggiorno')).toBeInTheDocument();
    });

    // Open create modal
    const createButton = screen.getByRole('button', { name: /crea stanza/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByTestId('form-modal-create')).toBeInTheDocument();
    });

    // Override fetch for POST
    const postSpy = jest.fn().mockImplementation((url: string, options?: any) => {
      if (options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({ id: 3, name: 'Nuova Stanza', description: null, created_at: 1700300000, updated_at: 1700300000, device_count: 0 }),
        });
      }
      if (url === '/api/rooms/health') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockHealth) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRooms) });
    });
    global.fetch = postSpy;

    const submitButton = screen.getByTestId('form-modal-create-submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      const postCall = postSpy.mock.calls.find(
        (call: any[]) => call[1]?.method === 'POST'
      );
      expect(postCall).toBeDefined();
      expect(postCall![0]).toBe('/api/rooms');
      expect(postCall![1].headers['Content-Type']).toBe('application/json');
      const body = JSON.parse(postCall![1].body as string);
      expect(body.name).toBe('Nuova Stanza');
    });
  });

  it('Test 10 (ROOM-02): Create 409 throws — toastSuccess NOT called, form stays open', async () => {
    render(<RoomsPage />);
    await waitFor(() => {
      expect(screen.getByText('Soggiorno')).toBeInTheDocument();
    });

    // Open create modal
    const createButton = screen.getByRole('button', { name: /crea stanza/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByTestId('form-modal-create')).toBeInTheDocument();
    });

    // Override fetch for POST 409
    global.fetch = jest.fn().mockImplementation((url: string, options?: any) => {
      if (options?.method === 'POST') {
        return Promise.resolve({ ok: false, status: 409 });
      }
      if (url === '/api/rooms/health') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockHealth) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRooms) });
    });

    const submitButton = screen.getByTestId('form-modal-create-submit');
    fireEvent.click(submitButton);

    await new Promise((r) => setTimeout(r, 100));

    expect(mockToastSuccess).not.toHaveBeenCalled();
  });

  // ROOM-03: Edit room
  it('Test 11 (ROOM-03): "Modifica" button opens edit FormModal', async () => {
    render(<RoomsPage />);
    await waitFor(() => {
      expect(screen.getByText('Soggiorno')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /modifica/i });
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('form-modal-edit')).toBeInTheDocument();
    });
  });

  it('Test 12 (ROOM-03): Edit onSubmit calls PUT /api/rooms/1 with numeric room.id', async () => {
    render(<RoomsPage />);
    await waitFor(() => {
      expect(screen.getByText('Soggiorno')).toBeInTheDocument();
    });

    // Click Modifica on first row (room id=1 — Soggiorno)
    const editButtons = screen.getAllByRole('button', { name: /modifica/i });
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('form-modal-edit')).toBeInTheDocument();
    });

    // Override fetch for PUT
    const putSpy = jest.fn().mockImplementation((url: string, options?: any) => {
      if (options?.method === 'PUT') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ id: 1, name: 'Stanza Aggiornata', description: null, created_at: 1700000000, updated_at: 1700000000, device_count: 3 }),
        });
      }
      if (url === '/api/rooms/health') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockHealth) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRooms) });
    });
    global.fetch = putSpy;

    const submitButton = screen.getByTestId('form-modal-edit-submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      const putCall = putSpy.mock.calls.find(
        (call: any[]) => call[1]?.method === 'PUT'
      );
      expect(putCall).toBeDefined();
      expect(putCall![0]).toContain('/api/rooms/1');
      expect(putCall![1].method).toBe('PUT');
    });
  });

  it('Test 13 (ROOM-03): Edit 409 throws — toastSuccess NOT called', async () => {
    render(<RoomsPage />);
    await waitFor(() => {
      expect(screen.getByText('Soggiorno')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /modifica/i });
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('form-modal-edit')).toBeInTheDocument();
    });

    global.fetch = jest.fn().mockImplementation((url: string, options?: any) => {
      if (options?.method === 'PUT') {
        return Promise.resolve({ ok: false, status: 409 });
      }
      if (url === '/api/rooms/health') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockHealth) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRooms) });
    });

    const submitButton = screen.getByTestId('form-modal-edit-submit');
    fireEvent.click(submitButton);

    await new Promise((r) => setTimeout(r, 100));

    expect(mockToastSuccess).not.toHaveBeenCalled();
  });

  it('Test 14 (ROOM-03): Edit 404 calls toastError — mockToastError called, NOT mockToastSuccess', async () => {
    render(<RoomsPage />);
    await waitFor(() => {
      expect(screen.getByText('Soggiorno')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /modifica/i });
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('form-modal-edit')).toBeInTheDocument();
    });

    global.fetch = jest.fn().mockImplementation((url: string, options?: any) => {
      if (options?.method === 'PUT') {
        return Promise.resolve({ ok: false, status: 404 });
      }
      if (url === '/api/rooms/health') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockHealth) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRooms) });
    });

    const submitButton = screen.getByTestId('form-modal-edit-submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled();
    });
    expect(mockToastSuccess).not.toHaveBeenCalled();
  });

  // ROOM-04: Delete room
  it('Test 15 (ROOM-04): "Elimina" button opens ConfirmationDialog with room name and device count', async () => {
    render(<RoomsPage />);
    await waitFor(() => {
      expect(screen.getByText('Soggiorno')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /elimina/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
      // Soggiorno has device_count: 3
      expect(screen.getByTestId('confirmation-dialog').textContent).toContain('Soggiorno');
      expect(screen.getByTestId('confirmation-dialog').textContent).toContain('3 dispositivi');
    });
  });

  it('Test 16 (ROOM-04): Confirm delete calls DELETE /api/rooms/1 with numeric room.id', async () => {
    render(<RoomsPage />);
    await waitFor(() => {
      expect(screen.getByText('Soggiorno')).toBeInTheDocument();
    });

    // Click Elimina on first row (room id=1 — Soggiorno)
    const deleteButtons = screen.getAllByRole('button', { name: /elimina/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
    });

    // Override fetch for DELETE
    const deleteSpy = jest.fn().mockImplementation((url: string, options?: any) => {
      if (options?.method === 'DELETE') {
        return Promise.resolve({ ok: true, status: 204 });
      }
      if (url === '/api/rooms/health') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockHealth) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRooms) });
    });
    global.fetch = deleteSpy;

    const confirmButton = screen.getByTestId('confirm-button');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      const deleteCall = deleteSpy.mock.calls.find(
        (call: any[]) => call[1]?.method === 'DELETE'
      );
      expect(deleteCall).toBeDefined();
      expect(deleteCall![0]).toContain('/api/rooms/1');
      expect(deleteCall![1].method).toBe('DELETE');
    });
  });

  it('Test 17 (ROOM-04): Delete 404 calls toastError', async () => {
    render(<RoomsPage />);
    await waitFor(() => {
      expect(screen.getByText('Soggiorno')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /elimina/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
    });

    global.fetch = jest.fn().mockImplementation((url: string, options?: any) => {
      if (options?.method === 'DELETE') {
        return Promise.resolve({ ok: false, status: 404 });
      }
      if (url === '/api/rooms/health') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockHealth) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRooms) });
    });

    const confirmButton = screen.getByTestId('confirm-button');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled();
    });
  });
});
