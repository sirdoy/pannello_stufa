// app/components/ui/__tests__/DataTable.test.js
/**
 * DataTable Component Tests
 *
 * Tests TanStack Table integration, sorting, CVA variants, and accessibility.
 * Uses jest-axe for automated a11y violation detection.
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { createRef } from 'react';
import DataTable, { dataTableVariants } from '../DataTable';

expect.extend(toHaveNoViolations);

// Mock data for tests
const mockData = [
  { id: '1', name: 'Alpha', status: 'active' },
  { id: '2', name: 'Beta', status: 'pending' },
  { id: '3', name: 'Gamma', status: 'inactive' },
];

// Mock columns for tests
const mockColumns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'status', header: 'Status' },
];

describe('DataTable', () => {
  describe('Rendering', () => {
    it('renders table with data and columns', () => {
      render(<DataTable data={mockData} columns={mockColumns} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Alpha')).toBeInTheDocument();
      expect(screen.getByText('Beta')).toBeInTheDocument();
      expect(screen.getByText('Gamma')).toBeInTheDocument();
    });

    it('displays column headers correctly', () => {
      render(<DataTable data={mockData} columns={mockColumns} />);

      expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();
    });

    it('renders all rows from data array', () => {
      render(<DataTable data={mockData} columns={mockColumns} />);

      // Header row + 3 data rows
      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(4); // 1 header + 3 data rows
    });

    it('renders empty tbody when data is empty', () => {
      render(<DataTable data={[]} columns={mockColumns} />);

      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('handles undefined data gracefully', () => {
      render(<DataTable data={undefined} columns={mockColumns} />);

      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('handles undefined columns gracefully', () => {
      render(<DataTable data={mockData} columns={undefined} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('click column header toggles sort (asc -> desc -> none)', async () => {
      const user = userEvent.setup();
      render(<DataTable data={mockData} columns={mockColumns} />);

      const nameHeader = screen.getByRole('columnheader', { name: /name/i });
      const sortButton = within(nameHeader).getByRole('button');

      // Initial state: unsorted
      expect(nameHeader).toHaveAttribute('aria-sort', 'none');

      // First click: ascending
      await user.click(sortButton);
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

      // Second click: descending
      await user.click(sortButton);
      expect(nameHeader).toHaveAttribute('aria-sort', 'descending');

      // Third click: back to none (unsorted)
      await user.click(sortButton);
      expect(nameHeader).toHaveAttribute('aria-sort', 'none');
    });

    it('aria-sort attribute updates on sort change', async () => {
      const user = userEvent.setup();
      render(<DataTable data={mockData} columns={mockColumns} />);

      const nameHeader = screen.getByRole('columnheader', { name: /name/i });
      const sortButton = within(nameHeader).getByRole('button');

      // Click to sort ascending
      await user.click(sortButton);
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

      // Click to sort descending
      await user.click(sortButton);
      expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    });

    it('visual sort indicator appears on sorted column', async () => {
      const user = userEvent.setup();
      render(<DataTable data={mockData} columns={mockColumns} />);

      const nameHeader = screen.getByRole('columnheader', { name: /name/i });
      const sortButton = within(nameHeader).getByRole('button');

      // Initial: ChevronsUpDown indicator (unsorted)
      expect(nameHeader.querySelector('svg')).toBeInTheDocument();

      // After click: ChevronUp (ascending) - verify SVG changes
      await user.click(sortButton);
      expect(nameHeader.querySelector('svg')).toBeInTheDocument();
    });

    it('sorts data correctly when ascending', async () => {
      const user = userEvent.setup();
      render(<DataTable data={mockData} columns={mockColumns} />);

      const nameHeader = screen.getByRole('columnheader', { name: /name/i });
      const sortButton = within(nameHeader).getByRole('button');

      // Click to sort ascending
      await user.click(sortButton);

      // Get all data rows (excluding header)
      const rows = screen.getAllByRole('row').slice(1);
      expect(within(rows[0]).getByText('Alpha')).toBeInTheDocument();
      expect(within(rows[1]).getByText('Beta')).toBeInTheDocument();
      expect(within(rows[2]).getByText('Gamma')).toBeInTheDocument();
    });

    it('sorts data correctly when descending', async () => {
      const user = userEvent.setup();
      render(<DataTable data={mockData} columns={mockColumns} />);

      const nameHeader = screen.getByRole('columnheader', { name: /name/i });
      const sortButton = within(nameHeader).getByRole('button');

      // Click twice to sort descending
      await user.click(sortButton);
      await user.click(sortButton);

      // Get all data rows (excluding header)
      const rows = screen.getAllByRole('row').slice(1);
      expect(within(rows[0]).getByText('Gamma')).toBeInTheDocument();
      expect(within(rows[1]).getByText('Beta')).toBeInTheDocument();
      expect(within(rows[2]).getByText('Alpha')).toBeInTheDocument();
    });
  });

  describe('CVA Variants - Density', () => {
    it('applies compact density variant classes', () => {
      const { container } = render(
        <DataTable data={mockData} columns={mockColumns} density="compact" />
      );
      const table = container.querySelector('table');
      expect(table).toHaveClass('[&_td]:py-2');
      expect(table).toHaveClass('[&_th]:py-2');
    });

    it('applies default density variant by default', () => {
      const { container } = render(
        <DataTable data={mockData} columns={mockColumns} />
      );
      const table = container.querySelector('table');
      expect(table).toHaveClass('[&_td]:py-3');
      expect(table).toHaveClass('[&_th]:py-3');
    });

    it('applies relaxed density variant classes', () => {
      const { container } = render(
        <DataTable data={mockData} columns={mockColumns} density="relaxed" />
      );
      const table = container.querySelector('table');
      expect(table).toHaveClass('[&_td]:py-4');
      expect(table).toHaveClass('[&_th]:py-4');
    });
  });

  describe('CVA Variants - Striped', () => {
    it('applies striped variant when true', () => {
      const { container } = render(
        <DataTable data={mockData} columns={mockColumns} striped />
      );
      const table = container.querySelector('table');
      expect(table).toHaveClass('[&_tbody_tr:nth-child(even)]:bg-white/[0.02]');
    });

    it('does not apply striped variant by default', () => {
      const { container } = render(
        <DataTable data={mockData} columns={mockColumns} />
      );
      const table = container.querySelector('table');
      expect(table).not.toHaveClass('[&_tbody_tr:nth-child(even)]:bg-white/[0.02]');
    });
  });

  describe('CVA Variants - StickyHeader', () => {
    it('applies stickyHeader variant when true', () => {
      const { container } = render(
        <DataTable data={mockData} columns={mockColumns} stickyHeader />
      );
      const table = container.querySelector('table');
      expect(table).toHaveClass('[&_thead]:sticky');
      expect(table).toHaveClass('[&_thead]:top-0');
      expect(table).toHaveClass('[&_thead]:bg-slate-900');
      expect(table).toHaveClass('[&_thead]:z-10');
    });

    it('does not apply stickyHeader variant by default', () => {
      const { container } = render(
        <DataTable data={mockData} columns={mockColumns} />
      );
      const table = container.querySelector('table');
      expect(table).not.toHaveClass('[&_thead]:sticky');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className to wrapper', () => {
      const { container } = render(
        <DataTable data={mockData} columns={mockColumns} className="custom-table" />
      );
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('custom-table');
    });

    it('merges className with default wrapper classes', () => {
      const { container } = render(
        <DataTable data={mockData} columns={mockColumns} className="mt-4" />
      );
      const wrapper = container.firstChild;
      // Default classes
      expect(wrapper).toHaveClass('overflow-x-auto');
      expect(wrapper).toHaveClass('rounded-2xl');
      // Custom class
      expect(wrapper).toHaveClass('mt-4');
    });

    it('passes additional props to wrapper element', () => {
      render(
        <DataTable data={mockData} columns={mockColumns} data-testid="data-table" />
      );
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });
  });

  describe('Row Interaction', () => {
    it('calls onRowClick when a row is clicked', async () => {
      const user = userEvent.setup();
      const onRowClick = jest.fn();
      render(
        <DataTable data={mockData} columns={mockColumns} onRowClick={onRowClick} />
      );

      const rows = screen.getAllByRole('row').slice(1); // Skip header
      await user.click(rows[0]);

      expect(onRowClick).toHaveBeenCalledTimes(1);
      expect(onRowClick).toHaveBeenCalledWith(
        expect.objectContaining({
          original: mockData[0],
        })
      );
    });

    it('adds cursor-pointer class when onRowClick is provided', () => {
      render(
        <DataTable data={mockData} columns={mockColumns} onRowClick={() => {}} />
      );

      const rows = screen.getAllByRole('row').slice(1);
      expect(rows[0]).toHaveClass('cursor-pointer');
    });

    it('does not add cursor-pointer class when onRowClick is not provided', () => {
      render(<DataTable data={mockData} columns={mockColumns} />);

      const rows = screen.getAllByRole('row').slice(1);
      expect(rows[0]).not.toHaveClass('cursor-pointer');
    });
  });

  describe('Custom Row ID', () => {
    it('uses custom getRowId function', () => {
      const customGetRowId = (row) => `custom-${row.id}`;
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          getRowId={customGetRowId}
        />
      );

      // Table should render normally with custom IDs
      expect(screen.getByText('Alpha')).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = createRef();
      render(<DataTable ref={ref} data={mockData} columns={mockColumns} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('ref points to the wrapper div element', () => {
      const ref = createRef();
      render(<DataTable ref={ref} data={mockData} columns={mockColumns} />);
      expect(ref.current.tagName).toBe('DIV');
      expect(ref.current).toHaveClass('overflow-x-auto');
    });
  });

  describe('Base Classes', () => {
    it('wrapper has base styling classes', () => {
      const { container } = render(
        <DataTable data={mockData} columns={mockColumns} />
      );
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('overflow-x-auto');
      expect(wrapper).toHaveClass('rounded-2xl');
      expect(wrapper).toHaveClass('border');
      expect(wrapper).toHaveClass('border-white/[0.06]');
    });

    it('table has base classes from CVA', () => {
      const { container } = render(
        <DataTable data={mockData} columns={mockColumns} />
      );
      const table = container.querySelector('table');
      expect(table).toHaveClass('w-full');
      expect(table).toHaveClass('border-collapse');
    });

    it('thead has Ember Noir styling', () => {
      const { container } = render(
        <DataTable data={mockData} columns={mockColumns} />
      );
      const thead = container.querySelector('thead');
      expect(thead).toHaveClass('bg-slate-800/50');
    });
  });

  describe('Exports', () => {
    it('exports dataTableVariants function', () => {
      expect(typeof dataTableVariants).toBe('function');
    });

    it('dataTableVariants returns string of classes', () => {
      const classes = dataTableVariants({ density: 'compact', striped: true });
      expect(typeof classes).toBe('string');
      expect(classes).toContain('[&_td]:py-2');
      expect(classes).toContain('[&_tbody_tr:nth-child(even)]:bg-white/[0.02]');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations with default props', async () => {
      const { container } = render(
        <DataTable data={mockData} columns={mockColumns} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with all variants', async () => {
      const { container } = render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          density="compact"
          striped
          stickyHeader
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations when empty', async () => {
      const { container } = render(
        <DataTable data={[]} columns={mockColumns} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('sort button has descriptive aria-label', () => {
      render(<DataTable data={mockData} columns={mockColumns} />);

      const nameHeader = screen.getByRole('columnheader', { name: /name/i });
      const sortButton = within(nameHeader).getByRole('button');

      expect(sortButton).toHaveAttribute('aria-label');
      expect(sortButton.getAttribute('aria-label')).toContain('Sort by');
      expect(sortButton.getAttribute('aria-label')).toContain('Name');
    });

    it('column headers have role="columnheader"', () => {
      render(<DataTable data={mockData} columns={mockColumns} />);

      const headers = screen.getAllByRole('columnheader');
      expect(headers).toHaveLength(2);
    });

    it('data cells have role="cell"', () => {
      render(<DataTable data={mockData} columns={mockColumns} />);

      const cells = screen.getAllByRole('cell');
      expect(cells).toHaveLength(6); // 3 rows x 2 columns
    });

    it('rows have role="row"', () => {
      render(<DataTable data={mockData} columns={mockColumns} />);

      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(4); // 1 header row + 3 data rows
    });
  });

  describe('Non-sortable columns', () => {
    it('handles columns with enableSorting: false', () => {
      const columnsWithNonSortable = [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'status', header: 'Status', enableSorting: false },
      ];

      render(<DataTable data={mockData} columns={columnsWithNonSortable} />);

      const statusHeader = screen.getByRole('columnheader', { name: 'Status' });
      // Non-sortable column should not have a button
      expect(within(statusHeader).queryByRole('button')).not.toBeInTheDocument();
      // Non-sortable column should not have aria-sort
      expect(statusHeader).not.toHaveAttribute('aria-sort');
    });
  });
});
