/**
 * Tests for /registry/types page
 *
 * Validates DTYPE-01 (list, loading, error, badges),
 * DTYPE-02 (create modal, POST call), DTYPE-03 (no delete on built-in,
 * confirm dialog, DELETE call).
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import DeviceTypesPage from '../page';
import type { DeviceType } from '@/types/registry';

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

// Mock DataTable — renders data items mapping label and slug
jest.mock('@/app/components/ui/DataTable', () => ({
  __esModule: true,
  default: ({ data, columns }: { data: DeviceType[]; columns: any[] }) => (
    <div data-testid="data-table">
      {data.map((item: DeviceType) => (
        <div key={item.slug} data-testid={`row-${item.slug}`}>
          {columns.map((col: any) => {
            if (col.id === 'actions') {
              const cellContent = col.cell?.({ row: { original: item } });
              return <div key="actions">{cellContent}</div>;
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

// Mock FormModal — renders children when isOpen=true, expose onSubmit via submit button
jest.mock('@/app/components/ui/FormModal', () => ({
  __esModule: true,
  default: ({
    isOpen,
    onSubmit,
    children,
    title,
  }: {
    isOpen: boolean;
    onSubmit: (data: any) => Promise<void>;
    children: (form: any) => React.ReactNode;
    title?: string;
  }) => {
    if (!isOpen) return null;
    const handleSubmit = () => {
      void onSubmit({ slug: 'new_type', label: 'New Type' });
    };
    return (
      <div data-testid="form-modal">
        <span>{title}</span>
        {typeof children === 'function'
          ? children({ control: {}, formState: {} })
          : children}
        <button data-testid="modal-submit" onClick={handleSubmit}>
          Submit
        </button>
      </div>
    );
  },
}));

// Mock ConfirmationDialog — renders description when isOpen=true, expose onConfirm via button
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
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
}));

// Mock Card
jest.mock('@/app/components/ui/Card', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

// Mock ui barrel exports (Heading and Text)
jest.mock('@/app/components/ui', () => ({
  Heading: ({ children }: { children?: React.ReactNode }) => <h2>{children}</h2>,
  Text: ({ children }: { children?: React.ReactNode }) => <p>{children}</p>,
}));

// Mock useToast
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock('@/app/hooks/useToast', () => ({
  useToast: () => ({ success: mockToastSuccess, error: mockToastError }),
}));

// Mock Input
jest.mock('@/app/components/ui/Input', () => ({
  __esModule: true,
  default: (props: any) => <input {...props} />,
}));

// --- Mock data ---
const mockTypes: DeviceType[] = [
  { slug: 'light', label: 'Luce', is_builtin: true, created_at: 1700000000 },
  { slug: 'custom_sensor', label: 'Sensore custom', is_builtin: false, created_at: 1700100000 },
];

// Helper: mock a successful fetch returning types
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

  // DTYPE-01: List rendering
  it('Test 1 (DTYPE-01): renders DataTable with type data when fetch resolves', async () => {
    render(<DeviceTypesPage />);
    await waitFor(() => {
      expect(screen.getByText('Luce')).toBeInTheDocument();
      expect(screen.getByText('custom_sensor')).toBeInTheDocument();
    });
  });

  it('Test 2 (DTYPE-01): renders Skeleton placeholder while loading', async () => {
    // Delay fetch to keep loading state visible
    global.fetch = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        status: 200,
        json: async () => mockTypes,
      } as Response), 200))
    );
    render(<DeviceTypesPage />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('Test 3 (DTYPE-01): renders Banner with error message when fetch rejects', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    render(<DeviceTypesPage />);
    await waitFor(() => {
      expect(screen.getByTestId('banner')).toBeInTheDocument();
    });
  });

  it('Test 4 (DTYPE-01): built-in types show "Built-in" badge text, custom types show "Custom"', async () => {
    render(<DeviceTypesPage />);
    await waitFor(() => {
      expect(screen.getByText('Built-in')).toBeInTheDocument();
      expect(screen.getByText('Custom')).toBeInTheDocument();
    });
  });

  // DTYPE-02: Create flow
  it('Test 5 (DTYPE-02): clicking "Crea tipo" button opens FormModal (isOpen becomes true)', async () => {
    render(<DeviceTypesPage />);
    await waitFor(() => {
      expect(screen.getByText('Luce')).toBeInTheDocument();
    });
    const createButton = screen.getByRole('button', { name: /crea tipo/i });
    fireEvent.click(createButton);
    expect(screen.getByTestId('form-modal')).toBeInTheDocument();
  });

  it('Test 6 (DTYPE-02): FormModal onSubmit calls POST /api/registry/types with { slug, label } body', async () => {
    const mockPost = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ slug: 'new_type', label: 'New Type', is_builtin: false, created_at: 1700200000 }),
    } as Response);
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockTypes,
      } as Response)
      .mockImplementationOnce(mockPost)
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockTypes,
      } as Response);

    render(<DeviceTypesPage />);
    await waitFor(() => {
      expect(screen.getByText('Luce')).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /crea tipo/i });
    fireEvent.click(createButton);

    const submitButton = screen.getByTestId('modal-submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        '/api/registry/types',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ slug: 'new_type', label: 'New Type' }),
        })
      );
    });
  });

  // DTYPE-03: Delete flow
  it('Test 7 (DTYPE-03): delete button "Elimina" is NOT rendered for built-in types (is_builtin=true)', async () => {
    render(<DeviceTypesPage />);
    await waitFor(() => {
      expect(screen.getByText('Luce')).toBeInTheDocument();
    });
    // "Elimina" button(s) should only appear for custom_sensor, not light
    const eliminaButtons = screen.queryAllByRole('button', { name: /elimina/i });
    // There should be exactly 1 (for custom type only)
    expect(eliminaButtons).toHaveLength(1);
  });

  it('Test 8 (DTYPE-03): clicking "Elimina" opens ConfirmationDialog with type label and slug in description', async () => {
    render(<DeviceTypesPage />);
    await waitFor(() => {
      expect(screen.getByText('Sensore custom')).toBeInTheDocument();
    });

    const eliminaButton = screen.getByRole('button', { name: /elimina/i });
    fireEvent.click(eliminaButton);

    await waitFor(() => {
      expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
      expect(screen.getByText(/Sensore custom/)).toBeInTheDocument();
      expect(screen.getByText(/custom_sensor/)).toBeInTheDocument();
    });
  });

  it('Test 9 (DTYPE-03): confirming delete calls DELETE /api/registry/types/{slug}', async () => {
    const mockDelete = jest.fn().mockResolvedValue({
      ok: true,
      status: 204,
    } as Response);
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockTypes,
      } as Response)
      .mockImplementationOnce(mockDelete)
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockTypes,
      } as Response);

    render(<DeviceTypesPage />);
    await waitFor(() => {
      expect(screen.getByText('Sensore custom')).toBeInTheDocument();
    });

    const eliminaButton = screen.getByRole('button', { name: /elimina/i });
    fireEvent.click(eliminaButton);

    await waitFor(() => {
      expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
    });

    const confirmButton = screen.getByTestId('confirm-button');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith(
        '/api/registry/types/custom_sensor',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
});
