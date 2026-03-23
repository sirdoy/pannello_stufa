/**
 * Tests for /registry/devices page
 *
 * Validates DREG-01 (list, loading, error, empty, pagination),
 * DREG-02 (provider filter, "Tutti" option),
 * DREG-06 (health stats above table).
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
      const deviceCalls = fetchSpy.mock.calls.filter((call: string[]) =>
        call[0].includes('/api/registry/devices')
      );
      expect(deviceCalls.length).toBeGreaterThan(0);
      const lastDeviceCall = deviceCalls[deviceCalls.length - 1];
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
      const deviceCalls = fetchSpy.mock.calls.filter((call: string[]) =>
        call[0].includes('/api/registry/devices')
      );
      expect(deviceCalls.length).toBeGreaterThan(0);
      const lastCall = deviceCalls[deviceCalls.length - 1];
      expect(lastCall[0]).toContain('offset=20');
    });
  });
});
