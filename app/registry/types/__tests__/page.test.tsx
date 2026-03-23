/**
 * Tests for /registry/types page
 *
 * Validates: list rendering, create modal, edit modal, delete confirmation.
 * All types are treated equally (no built-in/custom distinction).
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import DeviceTypesPage from '../page';
import type { DeviceType } from '@/types/registry';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
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

// Mock DataTable — renders data items via column definitions
jest.mock('@/app/components/ui/DataTable', () => ({
  __esModule: true,
  default: ({ data, columns }: { data: DeviceType[]; columns: any[] }) => (
    <div data-testid="data-table">
      {data.map((item: DeviceType) => (
        <div key={item.slug} data-testid={`row-${item.slug}`}>
          {columns.map((col: any) => {
            if (col.id === 'actions') {
              return <div key="actions">{col.cell?.({ row: { original: item } })}</div>;
            }
            if (col.cell) {
              return <div key={col.accessorKey}>{col.cell({ row: { original: item } })}</div>;
            }
            return (
              <div key={col.accessorKey}>
                {item[col.accessorKey as keyof DeviceType] as string}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  ),
}));

// Mock FormModal — captures title and renders submit button
let lastFormModalProps: any = null;
jest.mock('@/app/components/ui/FormModal', () => ({
  __esModule: true,
  default: (props: any) => {
    lastFormModalProps = props;
    if (!props.isOpen) return null;
    const handleSubmit = () => {
      if (props.title === 'Crea tipo dispositivo') {
        void props.onSubmit({ slug: 'new_type', label: 'New Type' });
      } else if (props.title === 'Modifica tipo') {
        void props.onSubmit({ label: 'Updated Label' });
      }
    };
    return (
      <div data-testid="form-modal">
        <span>{props.title}</span>
        <button data-testid="modal-submit" onClick={handleSubmit}>Submit</button>
      </div>
    );
  },
}));

// Mock ConfirmationDialog
jest.mock('@/app/components/ui/ConfirmationDialog', () => ({
  __esModule: true,
  default: ({ isOpen, onConfirm, description, title }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="confirmation-dialog">
        <span>{title}</span>
        <span>{description}</span>
        <button data-testid="confirm-button" onClick={() => onConfirm?.()}>Confirm</button>
      </div>
    );
  },
}));

jest.mock('@/app/components/ui/Banner', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <div data-testid="banner">{children}</div>,
}));

jest.mock('@/app/components/ui/Skeleton', () => ({
  __esModule: true,
  default: ({ className }: { className?: string }) => <div data-testid="skeleton" className={className} />,
}));

jest.mock('@/app/components/ui/Button', () => ({
  __esModule: true,
  default: ({ children, onClick }: { children?: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

jest.mock('@/app/components/ui/Card', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/app/components/ui', () => ({
  Heading: ({ children }: { children?: React.ReactNode }) => <h2>{children}</h2>,
  Text: ({ children }: { children?: React.ReactNode }) => <p>{children}</p>,
}));

const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock('@/app/hooks/useToast', () => ({
  useToast: () => ({ success: mockToastSuccess, error: mockToastError }),
}));

jest.mock('@/app/components/ui/Input', () => ({
  __esModule: true,
  default: (props: any) => <input {...props} />,
}));

// --- Mock data ---
const mockTypes: DeviceType[] = [
  { slug: 'light', label: 'Luce', is_builtin: true, created_at: 1700000000 },
  { slug: 'custom_sensor', label: 'Sensore custom', is_builtin: false, created_at: 1700100000 },
];

function mockFetchSuccess(data: DeviceType[] = mockTypes) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => data,
  } as Response);
}

describe('/registry/types page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchSuccess();
  });

  // List rendering
  it('renders DataTable with type data', async () => {
    render(<DeviceTypesPage />);
    await waitFor(() => {
      expect(screen.getByText('Luce')).toBeInTheDocument();
      expect(screen.getByText('custom_sensor')).toBeInTheDocument();
    });
  });

  it('renders Skeleton while loading', async () => {
    global.fetch = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        ok: true, status: 200, json: async () => mockTypes,
      } as Response), 200))
    );
    render(<DeviceTypesPage />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('renders Banner on fetch error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    render(<DeviceTypesPage />);
    await waitFor(() => {
      expect(screen.getByTestId('banner')).toBeInTheDocument();
    });
  });

  // Built-in types have no actions, custom types have Modifica + Elimina
  it('renders Modifica and Elimina only for custom types (not built-in)', async () => {
    render(<DeviceTypesPage />);
    await waitFor(() => {
      expect(screen.getByText('Luce')).toBeInTheDocument();
    });
    const modificaButtons = screen.getAllByRole('button', { name: /modifica/i });
    const eliminaButtons = screen.getAllByRole('button', { name: /elimina/i });
    // Only 1 custom type has actions
    expect(modificaButtons).toHaveLength(1);
    expect(eliminaButtons).toHaveLength(1);
  });

  // Create flow
  it('clicking "Crea tipo" opens FormModal', async () => {
    render(<DeviceTypesPage />);
    await waitFor(() => { expect(screen.getByText('Luce')).toBeInTheDocument(); });
    fireEvent.click(screen.getByRole('button', { name: /crea tipo/i }));
    expect(screen.getByTestId('form-modal')).toBeInTheDocument();
    expect(screen.getByText('Crea tipo dispositivo')).toBeInTheDocument();
  });

  it('create FormModal calls POST /api/registry/types', async () => {
    render(<DeviceTypesPage />);
    await waitFor(() => { expect(screen.getByText('Luce')).toBeInTheDocument(); });

    const postSpy = jest.fn().mockResolvedValue({
      ok: true, status: 201,
      json: async () => ({ slug: 'new_type', label: 'New Type', is_builtin: false, created_at: 1700200000 }),
    } as Response);
    global.fetch = postSpy;

    fireEvent.click(screen.getByRole('button', { name: /crea tipo/i }));
    fireEvent.click(screen.getByTestId('modal-submit'));

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith('/api/registry/types', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ slug: 'new_type', label: 'New Type' }),
      }));
    });
  });

  // Edit flow (only custom types)
  it('clicking "Modifica" opens edit FormModal', async () => {
    render(<DeviceTypesPage />);
    await waitFor(() => { expect(screen.getByText('Sensore custom')).toBeInTheDocument(); });
    const modificaButton = screen.getByRole('button', { name: /modifica/i });
    fireEvent.click(modificaButton);
    expect(screen.getByTestId('form-modal')).toBeInTheDocument();
    expect(screen.getByText('Modifica tipo')).toBeInTheDocument();
  });

  it('edit submits DELETE + POST for the custom type', async () => {
    render(<DeviceTypesPage />);
    await waitFor(() => { expect(screen.getByText('Sensore custom')).toBeInTheDocument(); });

    const modificaButton = screen.getByRole('button', { name: /modifica/i });
    fireEvent.click(modificaButton);

    const fetchSpy = jest.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => mockTypes,
    } as Response);
    global.fetch = fetchSpy;

    fireEvent.click(screen.getByTestId('modal-submit'));

    await waitFor(() => {
      // First call: DELETE old type
      expect(fetchSpy).toHaveBeenCalledWith('/api/registry/types/custom_sensor', expect.objectContaining({ method: 'DELETE' }));
      // Second call: POST new type with updated label
      expect(fetchSpy).toHaveBeenCalledWith('/api/registry/types', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ slug: 'custom_sensor', label: 'Updated Label' }),
      }));
    });
  });

  // Delete flow
  it('clicking "Elimina" opens ConfirmationDialog with type info', async () => {
    render(<DeviceTypesPage />);
    await waitFor(() => { expect(screen.getByText('Sensore custom')).toBeInTheDocument(); });
    const eliminaButton = screen.getByRole('button', { name: /elimina/i });
    fireEvent.click(eliminaButton);
    await waitFor(() => {
      expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
      expect(screen.getByText(/Eliminare.*Sensore custom.*custom_sensor/)).toBeInTheDocument();
    });
  });

  it('confirming delete calls DELETE /api/registry/types/{slug}', async () => {
    const fetchSpy = jest.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => mockTypes,
    } as Response);
    global.fetch = fetchSpy;

    render(<DeviceTypesPage />);
    await waitFor(() => { expect(screen.getByText('Sensore custom')).toBeInTheDocument(); });

    const eliminaButton = screen.getByRole('button', { name: /elimina/i });
    fireEvent.click(eliminaButton);
    await waitFor(() => { expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument(); });

    const deleteSpy = jest.fn().mockResolvedValue({ ok: true, status: 204 } as Response);
    global.fetch = deleteSpy;

    fireEvent.click(screen.getByTestId('confirm-button'));
    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('/api/registry/types/custom_sensor', expect.objectContaining({ method: 'DELETE' }));
    });
  });
});
