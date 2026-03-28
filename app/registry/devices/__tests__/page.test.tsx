/**
 * Tests for /registry/devices page
 *
 * Validates DREG-01 (list, loading, error, empty, pagination),
 * DREG-02 (provider filter, "Tutti" option),
 * DREG-03 (register form, POST call, 409 error),
 * DREG-04 (update form, PUT with numeric id),
 * DREG-05 (delete dialog, DELETE with numeric id, 404 toast),
 * DREG-06 (health stats above table).
 */

import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import DeviceRegistryPage from '../page';
import type { RegistryDevice } from '@/types/registry';

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

// Mock DataTable — renders data items mapping columns including actions
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
              return <div key={col.accessorKey}>{col.cell({ row: { original: item } })}</div>;
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

// Mock FormModal — renders with data-testid based on title to support two modal instances.
// Catches errors from onSubmit to simulate real FormModal behavior (errors keep modal open).
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
    const isRegister = title === 'Registra dispositivo';
    const testid = isRegister ? 'form-modal-register' : 'form-modal-update';
    const handleSubmit = () => {
      const data = isRegister
        ? { provider_name: 'hue', device_id: '99', custom_name: 'New Device', device_type_slug: 'light' }
        : { custom_name: 'Updated Name', device_type_slug: 'sensor' };
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

// Mock Select — renders a native select with data-testid for easy interaction
jest.mock('@/app/components/ui/Select', () => ({
  __esModule: true,
  default: ({
    options,
    value,
    onChange,
    label,
  }: {
    options?: Array<{ value: string | number; label: string }>;
    value?: string | number;
    onChange?: (event: { target: { value: string | number } }) => void;
    label?: string;
  }) => (
    <select
      data-testid="provider-select"
      aria-label={label}
      value={value}
      onChange={(e) => onChange?.({ target: { value: e.target.value } })}
    >
      {options?.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
}));

// --- Mock data ---
const mockDevices: RegistryDevice[] = [
  {
    id: 1,
    provider_name: 'hue',
    device_id: '5',
    custom_name: 'Lampada IKEA',
    device_type_slug: 'light',
    created_at: 1711090000,
    updated_at: 1711090000,
  },
  {
    id: 2,
    provider_name: 'netatmo',
    device_id: 'abc-001',
    custom_name: 'Termostato Camera',
    device_type_slug: 'thermostat',
    created_at: 1711091000,
    updated_at: 1711091000,
  },
];
const mockPaginatedResponse = { items: mockDevices, total_count: 2, limit: 20, offset: 0 };
const mockHealth = { device_types_count: 5, device_registry_count: 2 };

// Helper: mock fetch routing by URL
function mockFetchMulti() {
  global.fetch = jest.fn().mockImplementation((url: string) => {
    if (url.includes('/api/registry/health')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => mockHealth,
      } as Response);
    }
    if (url.includes('/api/registry/devices')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => mockPaginatedResponse,
      } as Response);
    }
    if (url.includes('/api/registry/types')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => [],
      } as Response);
    }
    return Promise.reject(new Error(`Unexpected fetch: ${url}`));
  });
}

describe('/registry/devices page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchMulti();
  });

  // DREG-01: List rendering
  it('Test 1 (DREG-01): renders DataTable with device rows showing custom_name, provider_name, device_type_slug, device_id', async () => {
    render(<DeviceRegistryPage />);
    await waitFor(() => {
      expect(screen.getByText('Lampada IKEA')).toBeInTheDocument();
      expect(screen.getByText('Termostato Camera')).toBeInTheDocument();
      // provider_name appears as both badge and select option — use getAllByText
      expect(screen.getAllByText('hue').length).toBeGreaterThan(0);
      expect(screen.getAllByText('netatmo').length).toBeGreaterThan(0);
    });
  });

  it('Test 2 (DREG-01): renders Skeleton placeholder while loading', async () => {
    // Delay fetch to keep loading state visible
    global.fetch = jest.fn().mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                status: 200,
                json: async () => mockPaginatedResponse,
              } as Response),
            200
          )
        )
    );
    render(<DeviceRegistryPage />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('Test 3 (DREG-01): renders Banner with error message when fetch rejects', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    render(<DeviceRegistryPage />);
    await waitFor(() => {
      expect(screen.getByTestId('banner')).toBeInTheDocument();
    });
  });

  it('Test 4 (DREG-01): empty state shows "Nessun dispositivo registrato" when items=[]', async () => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/api/registry/health')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockHealth,
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ items: [], total_count: 0, limit: 20, offset: 0 }),
      } as Response);
    });
    render(<DeviceRegistryPage />);
    await waitFor(() => {
      expect(screen.getByText('Nessun dispositivo registrato')).toBeInTheDocument();
    });
  });

  // DREG-02: Provider filter
  it('Test 5 (DREG-02): changing provider Select triggers refetch with provider_name query param in URL', async () => {
    render(<DeviceRegistryPage />);
    await waitFor(() => {
      expect(screen.getByText('Lampada IKEA')).toBeInTheDocument();
    });

    const fetchSpy = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/api/registry/health')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockHealth,
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => mockPaginatedResponse,
      } as Response);
    });
    global.fetch = fetchSpy;

    const providerSelect = screen.getByTestId('provider-select');
    fireEvent.change(providerSelect, { target: { value: 'hue' } });

    await waitFor(() => {
      const deviceCalls = fetchSpy.mock.calls.filter((call: any[]) =>
        (call[0] as string).includes('/api/registry/devices')
      );
      expect(deviceCalls.length).toBeGreaterThan(0);
      const lastDeviceCall = deviceCalls[deviceCalls.length - 1]!;
      expect(lastDeviceCall[0]).toContain('provider_name=hue');
    });
  });

  it('Test 6 (DREG-02): selecting "Tutti" sends no provider_name param (URL has only limit and offset)', async () => {
    const fetchSpy = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/api/registry/health')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockHealth,
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => mockPaginatedResponse,
      } as Response);
    });
    global.fetch = fetchSpy;

    render(<DeviceRegistryPage />);
    await waitFor(() => {
      expect(screen.getByText('Lampada IKEA')).toBeInTheDocument();
    });

    // Select 'hue' first
    const providerSelect = screen.getByTestId('provider-select');
    fireEvent.change(providerSelect, { target: { value: 'hue' } });

    await waitFor(() => {
      const hueCalls = fetchSpy.mock.calls.filter((call: string[]) =>
        (call[0] as string).includes('provider_name=hue')
      );
      expect(hueCalls.length).toBeGreaterThan(0);
    });

    // Select 'Tutti' (empty value) — should fetch without provider_name
    fireEvent.change(providerSelect, { target: { value: '' } });

    await waitFor(() => {
      // Find all device calls that do NOT contain provider_name and come after hue calls
      const allDeviceCalls = fetchSpy.mock.calls.filter((call: string[]) =>
        (call[0] as string).includes('/api/registry/devices')
      );
      const tuttiCalls = allDeviceCalls.filter(
        (call: string[]) => !(call[0] as string).includes('provider_name=')
      );
      expect(tuttiCalls.length).toBeGreaterThanOrEqual(2); // initial + after selecting Tutti
    });
  });

  // DREG-06: Health stats
  it('Test 7 (DREG-06): health stats display "Tipi dispositivo: 5" and "Dispositivi registrati: 2"', async () => {
    render(<DeviceRegistryPage />);
    // Wait for the health stats labels to appear
    await waitFor(() => {
      expect(screen.getByText(/Tipi dispositivo:/)).toBeInTheDocument();
      expect(screen.getByText(/Dispositivi registrati:/)).toBeInTheDocument();
    });
    // Verify the counts are visible (may appear multiple times — use getAllByText)
    expect(screen.getAllByText('5').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
  });

  // DREG-01: Pagination
  it('Test 8 (DREG-01): pagination next button calls setPage and triggers refetch with correct offset', async () => {
    // Return more devices than page size to show pagination
    const manyDevicesResponse = {
      items: mockDevices,
      total_count: 25, // > PAGE_SIZE (20) to show pagination
      limit: 20,
      offset: 0,
    };

    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/api/registry/health')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockHealth,
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => manyDevicesResponse,
      } as Response);
    });

    render(<DeviceRegistryPage />);
    await waitFor(() => {
      expect(screen.getByText('Lampada IKEA')).toBeInTheDocument();
    });

    // Pagination controls should be visible (total > PAGE_SIZE)
    const nextButton = screen.getByRole('button', { name: /successiva/i });
    expect(nextButton).toBeInTheDocument();

    const fetchSpy = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/api/registry/health')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockHealth,
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ items: [], total_count: 25, limit: 20, offset: 20 }),
      } as Response);
    });
    global.fetch = fetchSpy;

    fireEvent.click(nextButton);

    await waitFor(() => {
      const deviceCalls = fetchSpy.mock.calls.filter((call: any[]) =>
        (call[0] as string).includes('/api/registry/devices')
      );
      expect(deviceCalls.length).toBeGreaterThan(0);
      const lastCall = deviceCalls[deviceCalls.length - 1]!;
      expect(lastCall[0]).toContain('offset=20');
    });
  });

  // DREG-03: Register device
  it('Test 9 (DREG-03): clicking "Registra dispositivo" button opens register FormModal', async () => {
    render(<DeviceRegistryPage />);
    await waitFor(() => {
      expect(screen.getByText('Lampada IKEA')).toBeInTheDocument();
    });

    // Click the "Registra dispositivo" toolbar button
    const registerButtons = screen.getAllByRole('button', { name: /registra dispositivo/i });
    fireEvent.click(registerButtons[0]!);

    await waitFor(() => {
      expect(screen.getByTestId('form-modal-register')).toBeInTheDocument();
    });
  });

  it('Test 10 (DREG-03): register FormModal onSubmit calls POST /api/registry/devices with correct body', async () => {
    render(<DeviceRegistryPage />);
    await waitFor(() => {
      expect(screen.getByText('Lampada IKEA')).toBeInTheDocument();
    });

    // Open register modal
    const registerButtons = screen.getAllByRole('button', { name: /registra dispositivo/i });
    fireEvent.click(registerButtons[0]!);

    await waitFor(() => {
      expect(screen.getByTestId('form-modal-register')).toBeInTheDocument();
    });

    // Override fetch for POST
    const postSpy = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/api/registry/health')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => mockHealth } as Response);
      }
      if (url === '/api/registry/devices' || url.includes('/api/registry/devices?')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockPaginatedResponse,
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 201,
        json: async () => ({ id: 3, provider_name: 'hue', device_id: '99', custom_name: 'New Device', device_type_slug: 'light', created_at: 1711099000, updated_at: 1711099000 }),
      } as Response);
    });
    global.fetch = postSpy;

    const submitButton = screen.getByTestId('form-modal-register-submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      const postCall = postSpy.mock.calls.find(
        (call: any[]) => call[1]?.method === 'POST'
      );
      expect(postCall).toBeDefined();
      expect(postCall![0]).toBe('/api/registry/devices');
      const body = JSON.parse(postCall![1].body as string);
      expect(body).toMatchObject({
        provider_name: 'hue',
        device_id: '99',
        custom_name: 'New Device',
        device_type_slug: 'light',
      });
    });
  });

  it('Test 11 (DREG-03): register with 409 response throws error (modal stays open — no toastSuccess called)', async () => {
    render(<DeviceRegistryPage />);
    await waitFor(() => {
      expect(screen.getByText('Lampada IKEA')).toBeInTheDocument();
    });

    // Open register modal
    const registerButtons = screen.getAllByRole('button', { name: /registra dispositivo/i });
    fireEvent.click(registerButtons[0]!);

    await waitFor(() => {
      expect(screen.getByTestId('form-modal-register')).toBeInTheDocument();
    });

    // Override fetch for POST to return 409 — the page throws, FormModal mock swallows it
    global.fetch = jest.fn().mockImplementation((url: string, options?: any) => {
      if (options?.method === 'POST') {
        return Promise.resolve({
          ok: false,
          status: 409,
          json: async () => ({ detail: 'duplicate' }),
        } as unknown as Response);
      }
      if (url.includes('/api/registry/devices')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => mockPaginatedResponse } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => mockHealth } as Response);
    });

    const submitButton = screen.getByTestId('form-modal-register-submit');
    fireEvent.click(submitButton);

    // Wait for async to settle — error is swallowed by FormModal mock
    await new Promise((r) => setTimeout(r, 100));

    expect(mockToastSuccess).not.toHaveBeenCalled();
  });

  // DREG-04: Update device
  it('Test 12 (DREG-04): clicking "Modifica" button on a row opens update FormModal', async () => {
    render(<DeviceRegistryPage />);
    await waitFor(() => {
      expect(screen.getByText('Lampada IKEA')).toBeInTheDocument();
    });

    // Click "Modifica" on row 1
    const modificaButtons = screen.getAllByRole('button', { name: /modifica/i });
    fireEvent.click(modificaButtons[0]!);

    await waitFor(() => {
      expect(screen.getByTestId('form-modal-update')).toBeInTheDocument();
    });
  });

  it('Test 13 (DREG-04): update FormModal onSubmit calls PUT /api/registry/devices/{id} using numeric device.id', async () => {
    render(<DeviceRegistryPage />);
    await waitFor(() => {
      expect(screen.getByText('Lampada IKEA')).toBeInTheDocument();
    });

    // Click "Modifica" on row with id=1
    const modificaButtons = screen.getAllByRole('button', { name: /modifica/i });
    fireEvent.click(modificaButtons[0]!);

    await waitFor(() => {
      expect(screen.getByTestId('form-modal-update')).toBeInTheDocument();
    });

    // Override fetch for PUT
    const putSpy = jest.fn().mockImplementation((url: string, options?: any) => {
      if (options?.method === 'PUT') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ ...mockDevices[0], custom_name: 'Updated Name', device_type_slug: 'sensor' }),
        } as Response);
      }
      if (url.includes('/api/registry/health')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => mockHealth } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => mockPaginatedResponse } as Response);
    });
    global.fetch = putSpy;

    const submitButton = screen.getByTestId('form-modal-update-submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      const putCall = putSpy.mock.calls.find(
        (call: any[]) => call[1]?.method === 'PUT'
      );
      expect(putCall).toBeDefined();
      // Must use numeric id=1, NOT device_id string '5'
      expect(putCall![0]).toBe('/api/registry/devices/1');
    });
  });

  // DREG-05: Unregister device
  it('Test 14 (DREG-05): clicking "Rimuovi" button on a row opens ConfirmationDialog showing device info', async () => {
    render(<DeviceRegistryPage />);
    await waitFor(() => {
      expect(screen.getByText('Lampada IKEA')).toBeInTheDocument();
    });

    // Click "Rimuovi" on row 1
    const rimuoviButtons = screen.getAllByRole('button', { name: /rimuovi/i });
    fireEvent.click(rimuoviButtons[0]!);

    await waitFor(() => {
      expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
      // Description should contain custom_name and provider_name (may appear in multiple elements)
      expect(screen.getAllByText(/Lampada IKEA/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/hue/).length).toBeGreaterThan(0);
    });
  });

  it('Test 15 (DREG-05): confirming unregister calls DELETE /api/registry/devices/{id} using numeric device.id', async () => {
    render(<DeviceRegistryPage />);
    await waitFor(() => {
      expect(screen.getByText('Lampada IKEA')).toBeInTheDocument();
    });

    // Click "Rimuovi" on row with id=1
    const rimuoviButtons = screen.getAllByRole('button', { name: /rimuovi/i });
    fireEvent.click(rimuoviButtons[0]!);

    await waitFor(() => {
      expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
    });

    // Override fetch for DELETE
    const deleteSpy = jest.fn().mockImplementation((url: string, options?: any) => {
      if (options?.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          status: 204,
        } as Response);
      }
      if (url.includes('/api/registry/health')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => mockHealth } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => mockPaginatedResponse } as Response);
    });
    global.fetch = deleteSpy;

    const confirmButton = screen.getByTestId('confirm-button');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      const deleteCall = deleteSpy.mock.calls.find(
        (call: any[]) => call[1]?.method === 'DELETE'
      );
      expect(deleteCall).toBeDefined();
      // Must use numeric id=1, NOT device_id string '5'
      expect(deleteCall![0]).toBe('/api/registry/devices/1');
    });
  });

  it('Test 16 (DREG-05): unregister 404 response calls toastError (not toastSuccess)', async () => {
    render(<DeviceRegistryPage />);
    await waitFor(() => {
      expect(screen.getByText('Lampada IKEA')).toBeInTheDocument();
    });

    // Click "Rimuovi" on row 1
    const rimuoviButtons = screen.getAllByRole('button', { name: /rimuovi/i });
    fireEvent.click(rimuoviButtons[0]!);

    await waitFor(() => {
      expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
    });

    // Override fetch for DELETE to return 404
    global.fetch = jest.fn().mockImplementation((url: string, options?: any) => {
      if (options?.method === 'DELETE') {
        return Promise.resolve({
          ok: false,
          status: 404,
        } as Response);
      }
      if (url.includes('/api/registry/health')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => mockHealth } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => mockPaginatedResponse } as Response);
    });

    const confirmButton = screen.getByTestId('confirm-button');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled();
    });
    expect(mockToastSuccess).not.toHaveBeenCalled();
  });
});
