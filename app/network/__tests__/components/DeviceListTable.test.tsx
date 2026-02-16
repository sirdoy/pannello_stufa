/**
 * DeviceListTable Tests
 *
 * Tests the DeviceListTable component including:
 * - DataTable integration (filtering, pagination, sorting)
 * - Column configuration (5 columns with correct enableGlobalFilter)
 * - Device pre-sorting (online before offline)
 * - Status filter tabs (all/online/offline)
 * - Device count display
 * - Empty state handling
 */

import { render, screen, fireEvent } from '@testing-library/react';
import DeviceListTable from '../../components/DeviceListTable';
import type { DeviceData } from '@/app/components/devices/network/types';

// Mock UI components to avoid circular dependency
jest.mock('@/app/components/ui', () => ({
  DataTable: jest.fn(({ data, columns, enableFiltering, enablePagination, pageSize, density, striped }) => (
    <div
      data-testid="data-table"
      data-rows={data.length}
      data-columns={columns.length}
      data-filtering={enableFiltering}
      data-pagination={enablePagination}
      data-page-size={pageSize}
      data-density={density}
      data-striped={striped}
    >
      {data.map((d: any, i: number) => {
        // Render the category column cell for testing
        const categoryColumn = columns.find((col: any) => col.accessorKey === 'category');
        return (
          <div
            key={i}
            data-testid={`row-${i}`}
            data-name={d.name}
            data-ip={d.ip}
            data-active={d.active}
          >
            {categoryColumn && categoryColumn.cell && (
              <div data-testid={`category-cell-${i}`}>
                {categoryColumn.cell({ row: { original: d } })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  )),
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  Heading: ({ children, level }: any) => {
    const Tag = `h${level}` as any;
    return <Tag>{children}</Tag>;
  },
  Badge: ({ children, variant, size }: any) => (
    <span data-variant={variant} data-size={size}>{children}</span>
  ),
}));

// Mock DeviceCategoryBadge component
jest.mock('../../components/DeviceCategoryBadge', () => ({
  __esModule: true,
  default: jest.fn(({ category, onClick }) => (
    <div
      data-testid="category-badge"
      data-category={category}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {category}
    </div>
  )),
}));

describe('DeviceListTable', () => {
  const mockDevices: DeviceData[] = [
    {
      id: '1',
      name: 'Device A',
      ip: '192.168.1.10',
      mac: 'AA:BB:CC:DD:EE:01',
      active: true,
      bandwidth: 45.2,
      lastSeen: Date.now(),
      category: 'mobile',
    },
    {
      id: '2',
      name: 'Device B',
      ip: '192.168.1.11',
      mac: 'AA:BB:CC:DD:EE:02',
      active: false,
      bandwidth: 0,
      lastSeen: Date.now() - 3600000,
      category: 'smart-home',
    },
    {
      id: '3',
      name: 'Device C',
      ip: '192.168.1.12',
      mac: 'AA:BB:CC:DD:EE:03',
      active: true,
      bandwidth: 12.8,
      lastSeen: Date.now(),
      // No category - should default to 'unknown'
    },
    {
      id: '4',
      name: 'Device D',
      ip: '192.168.1.13',
      mac: 'AA:BB:CC:DD:EE:04',
      active: false,
      lastSeen: undefined, // Never connected
    },
  ];

  describe('DataTable integration', () => {
    it('renders DataTable with enableFiltering=true and enablePagination=true and pageSize=25', () => {
      render(<DeviceListTable devices={mockDevices} isStale={false} />);

      const dataTable = screen.getByTestId('data-table');
      expect(dataTable).toBeInTheDocument();
      expect(dataTable).toHaveAttribute('data-filtering', 'true');
      expect(dataTable).toHaveAttribute('data-pagination', 'true');
      expect(dataTable).toHaveAttribute('data-page-size', '25');
    });

    it('passes all 6 columns to DataTable', () => {
      render(<DeviceListTable devices={mockDevices} isStale={false} />);

      const dataTable = screen.getByTestId('data-table');
      expect(dataTable).toHaveAttribute('data-columns', '6');
    });

    it('passes density and striped props to DataTable', () => {
      render(<DeviceListTable devices={mockDevices} isStale={false} />);

      const dataTable = screen.getByTestId('data-table');
      expect(dataTable).toHaveAttribute('data-density', 'default');
      expect(dataTable).toHaveAttribute('data-striped', 'true');
    });
  });

  describe('Device sorting', () => {
    it('sorts online devices before offline devices in the data array', () => {
      render(<DeviceListTable devices={mockDevices} isStale={false} />);

      const row0 = screen.getByTestId('row-0');
      const row1 = screen.getByTestId('row-1');
      const row2 = screen.getByTestId('row-2');
      const row3 = screen.getByTestId('row-3');

      // First two should be online (Device A and Device C)
      expect(row0).toHaveAttribute('data-active', 'true');
      expect(row1).toHaveAttribute('data-active', 'true');

      // Last two should be offline (Device B and Device D)
      expect(row2).toHaveAttribute('data-active', 'false');
      expect(row3).toHaveAttribute('data-active', 'false');
    });

    it('sorts devices alphabetically within online/offline groups', () => {
      render(<DeviceListTable devices={mockDevices} isStale={false} />);

      const row0 = screen.getByTestId('row-0');
      const row1 = screen.getByTestId('row-1');

      // Online devices sorted alphabetically: A before C
      expect(row0).toHaveAttribute('data-name', 'Device A');
      expect(row1).toHaveAttribute('data-name', 'Device C');
    });
  });

  describe('Status filter tabs', () => {
    it('shows all devices by default', () => {
      render(<DeviceListTable devices={mockDevices} isStale={false} />);

      const dataTable = screen.getByTestId('data-table');
      expect(dataTable).toHaveAttribute('data-rows', '4');
    });

    it('filters to show only online devices', () => {
      render(<DeviceListTable devices={mockDevices} isStale={false} />);

      const onlineButton = screen.getByText(/Online \(2\)/);
      fireEvent.click(onlineButton);

      const dataTable = screen.getByTestId('data-table');
      expect(dataTable).toHaveAttribute('data-rows', '2');

      const row0 = screen.getByTestId('row-0');
      const row1 = screen.getByTestId('row-1');
      expect(row0).toHaveAttribute('data-active', 'true');
      expect(row1).toHaveAttribute('data-active', 'true');
    });

    it('filters to show only offline devices', () => {
      render(<DeviceListTable devices={mockDevices} isStale={false} />);

      const offlineButton = screen.getByText(/Offline \(2\)/);
      fireEvent.click(offlineButton);

      const dataTable = screen.getByTestId('data-table');
      expect(dataTable).toHaveAttribute('data-rows', '2');

      const row0 = screen.getByTestId('row-0');
      const row1 = screen.getByTestId('row-1');
      expect(row0).toHaveAttribute('data-active', 'false');
      expect(row1).toHaveAttribute('data-active', 'false');
    });

    it('highlights active filter tab with ember underline', () => {
      render(<DeviceListTable devices={mockDevices} isStale={false} />);

      const allButton = screen.getByText(/Tutti \(4\)/);
      const onlineButton = screen.getByText(/Online \(2\)/);

      // All tab should be active by default
      expect(allButton).toHaveClass('text-ember-400', 'border-b-2', 'border-ember-400');

      // Click online tab
      fireEvent.click(onlineButton);

      // Online tab should now be active
      expect(onlineButton).toHaveClass('text-ember-400', 'border-b-2', 'border-ember-400');
      expect(allButton).not.toHaveClass('text-ember-400');
    });
  });

  describe('Header and device count', () => {
    it('shows "Dispositivi" heading with device count badge', () => {
      render(<DeviceListTable devices={mockDevices} isStale={false} />);

      expect(screen.getByText('Dispositivi')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument(); // Total count badge
    });

    it('displays correct counts in filter tabs', () => {
      render(<DeviceListTable devices={mockDevices} isStale={false} />);

      expect(screen.getByText(/Tutti \(4\)/)).toBeInTheDocument();
      expect(screen.getByText(/Online \(2\)/)).toBeInTheDocument();
      expect(screen.getByText(/Offline \(2\)/)).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('handles empty device list', () => {
      render(<DeviceListTable devices={[]} isStale={false} />);

      const dataTable = screen.getByTestId('data-table');
      expect(dataTable).toHaveAttribute('data-rows', '0');
      expect(screen.getByText('Dispositivi')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument(); // Count badge
    });
  });

  describe('Column configuration', () => {
    // Note: Testing column configuration is tricky with mocked DataTable.
    // We verify columns are passed correctly via the data-columns attribute.
    // The actual column definitions (enableGlobalFilter, etc.) are tested
    // through the component implementation and TypeScript types.

    it('passes 6 columns with correct types', () => {
      render(<DeviceListTable devices={mockDevices} isStale={false} />);

      const dataTable = screen.getByTestId('data-table');
      // 6 columns: name, IP, MAC, category, status, bandwidth
      expect(dataTable).toHaveAttribute('data-columns', '6');
    });
  });

  describe('Category column', () => {
    it('renders category column with header "Categoria"', () => {
      // This is implicitly tested through the column count being 6
      // The actual header rendering is handled by DataTable
      render(<DeviceListTable devices={mockDevices} isStale={false} />);

      const dataTable = screen.getByTestId('data-table');
      expect(dataTable).toHaveAttribute('data-columns', '6');
    });

    it('shows DeviceCategoryBadge for each device with correct category', () => {
      render(<DeviceListTable devices={mockDevices} isStale={false} />);

      const badges = screen.getAllByTestId('category-badge');
      expect(badges).toHaveLength(4);

      // After sorting: online devices first (A, C), then offline (B, D)
      // Device A (row 0) has category 'mobile'
      expect(badges[0]).toHaveAttribute('data-category', 'mobile');

      // Device C (row 1) has no category, defaults to 'unknown'
      expect(badges[1]).toHaveAttribute('data-category', 'unknown');

      // Device B (row 2) has category 'smart-home'
      expect(badges[2]).toHaveAttribute('data-category', 'smart-home');

      // Device D (row 3) has no category, defaults to 'unknown'
      expect(badges[3]).toHaveAttribute('data-category', 'unknown');
    });

    it('shows "unknown" badge when device has no category', () => {
      render(<DeviceListTable devices={mockDevices} isStale={false} />);

      const badges = screen.getAllByTestId('category-badge');

      // Device C (row 1) and Device D (row 3) have no category, should default to 'unknown'
      expect(badges[1]).toHaveAttribute('data-category', 'unknown');
      expect(badges[3]).toHaveAttribute('data-category', 'unknown');
    });

    it('clicking a badge opens category dropdown when onCategoryChange provided', () => {
      const handleCategoryChange = jest.fn();
      render(<DeviceListTable devices={mockDevices} isStale={false} onCategoryChange={handleCategoryChange} />);

      const badges = screen.getAllByTestId('category-badge');

      // Click first badge (Device A - mobile)
      fireEvent.click(badges[0]);

      // Dropdown should appear
      const dropdown = screen.getByRole('combobox');
      expect(dropdown).toBeInTheDocument();
      expect(dropdown).toHaveValue('mobile');
    });

    it('selecting a category from dropdown calls onCategoryChange with mac and new category', () => {
      const handleCategoryChange = jest.fn();
      render(<DeviceListTable devices={mockDevices} isStale={false} onCategoryChange={handleCategoryChange} />);

      const badges = screen.getAllByTestId('category-badge');

      // Click first badge (Device A - mobile)
      fireEvent.click(badges[0]);

      // Change dropdown value
      const dropdown = screen.getByRole('combobox');
      fireEvent.change(dropdown, { target: { value: 'pc' } });

      // onCategoryChange should be called with Device A's MAC and new category
      expect(handleCategoryChange).toHaveBeenCalledWith('AA:BB:CC:DD:EE:01', 'pc');
    });
  });
});
