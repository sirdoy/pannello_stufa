// app/components/ui/__tests__/DataTable.test.js
/**
 * DataTable Component Tests
 *
 * Tests TanStack Table integration, sorting, CVA variants, and accessibility.
 * Uses jest-axe for automated a11y violation detection.
 */
import { render, screen, within, waitFor } from '@testing-library/react';
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
      expect(within(rows[0]!).getByText('Alpha')).toBeInTheDocument();
      expect(within(rows[1]!).getByText('Beta')).toBeInTheDocument();
      expect(within(rows[2]!).getByText('Gamma')).toBeInTheDocument();
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
      expect(within(rows[0]!).getByText('Gamma')).toBeInTheDocument();
      expect(within(rows[1]!).getByText('Beta')).toBeInTheDocument();
      expect(within(rows[2]!).getByText('Alpha')).toBeInTheDocument();
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
      // Default class (space-y-4 for layout)
      expect(wrapper).toHaveClass('space-y-4');
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
      await user.click(rows[0]!);

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
      const customGetRowId = (row: any) => `custom-${row.id}`;
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
      const ref = createRef<HTMLDivElement>();
      render(<DataTable ref={ref} data={mockData} columns={mockColumns} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('ref points to the wrapper div element', () => {
      const ref = createRef<HTMLDivElement>();
      render(<DataTable ref={ref} data={mockData} columns={mockColumns} />);
      expect(ref.current?.tagName).toBe('DIV');
      expect(ref.current).toHaveClass('space-y-4');
    });
  });

  describe('Base Classes', () => {
    it('table container has base styling classes', () => {
      const { container } = render(
        <DataTable data={mockData} columns={mockColumns} />
      );
      // Table container is child of wrapper
      const tableContainer = container.querySelector('.overflow-x-auto');
      expect(tableContainer).toBeInTheDocument();
      expect(tableContainer).toHaveClass('rounded-2xl');
      expect(tableContainer).toHaveClass('border');
      expect(tableContainer).toHaveClass('border-white/[0.06]');
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

  describe('Row Selection', () => {
    it('shows checkbox column when selectionMode is multi', () => {
      render(
        <DataTable data={mockData} columns={mockColumns} selectionMode="multi" />
      );

      // Should have 3 column headers (select + name + status)
      const headers = screen.getAllByRole('columnheader');
      expect(headers).toHaveLength(3);

      // Check for select-all checkbox
      expect(screen.getByRole('checkbox', { name: /select all/i })).toBeInTheDocument();
    });

    it('shows checkbox column when selectionMode is single', () => {
      render(
        <DataTable data={mockData} columns={mockColumns} selectionMode="single" />
      );

      // Should have row checkboxes (one per row)
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(3); // One per data row (no select-all for single)
    });

    it('does not show checkbox column when selectionMode is none', () => {
      render(
        <DataTable data={mockData} columns={mockColumns} selectionMode="none" />
      );

      // No checkboxes
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('calls onSelectionChange when row is selected', async () => {
      const user = userEvent.setup();
      const onSelectionChange = jest.fn();

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          selectionMode="multi"
          onSelectionChange={onSelectionChange}
        />
      );

      // Click first row checkbox
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]!); // Skip select-all

      expect(onSelectionChange).toHaveBeenCalled();
    });

    it('checkbox click does not trigger row click', async () => {
      const user = userEvent.setup();
      const onRowClick = jest.fn();

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          selectionMode="multi"
          onRowClick={onRowClick}
        />
      );

      // Click first row checkbox
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]!); // Skip select-all

      // Row click should not be triggered due to stopPropagation
      expect(onRowClick).not.toHaveBeenCalled();
    });

    it('selected rows have highlighted background', async () => {
      const user = userEvent.setup();

      render(
        <DataTable data={mockData} columns={mockColumns} selectionMode="multi" />
      );

      // Click first row checkbox
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]!); // Select first data row

      // Get data rows and check first one is selected
      const rows = screen.getAllByRole('row').slice(1);
      expect(rows[0]!).toHaveClass('bg-ember-500/10');
    });
  });

  describe('Filtering', () => {
    it('shows toolbar when enableFiltering is true', () => {
      render(
        <DataTable data={mockData} columns={mockColumns} enableFiltering />
      );

      // Search input should be present
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('does not show toolbar when enableFiltering is false', () => {
      render(
        <DataTable data={mockData} columns={mockColumns} enableFiltering={false} />
      );

      // Search input should not be present
      expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument();
    });

    it('filters rows when global filter is typed', async () => {
      const user = userEvent.setup();

      render(
        <DataTable data={mockData} columns={mockColumns} enableFiltering />
      );

      // Type in search input
      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'Alpha');

      // Wait for debounce using waitFor (more reliable than setTimeout in full suite)
      await waitFor(() => {
        expect(screen.queryByText('Beta')).not.toBeInTheDocument();
      }, { timeout: 1000 });

      // Only Alpha should be visible
      expect(screen.getByText('Alpha')).toBeInTheDocument();
      expect(screen.queryByText('Gamma')).not.toBeInTheDocument();
    });
  });

  describe('Row Expansion', () => {
    it('shows expand icon column when enableExpansion is true', () => {
      render(
        <DataTable data={mockData} columns={mockColumns} enableExpansion />
      );

      // Should have 3 column headers (expand + name + status)
      const headers = screen.getAllByRole('columnheader');
      expect(headers).toHaveLength(3);
    });

    it('does not show expand icon column when enableExpansion is false', () => {
      render(
        <DataTable data={mockData} columns={mockColumns} enableExpansion={false} />
      );

      // Should have 2 column headers (name + status)
      const headers = screen.getAllByRole('columnheader');
      expect(headers).toHaveLength(2);
    });

    it('clicking row toggles expansion', async () => {
      const user = userEvent.setup();
      render(
        <DataTable data={mockData} columns={mockColumns} enableExpansion />
      );

      // Get first data row (skip header)
      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1];

      // Initially not expanded
      expect(firstDataRow).toHaveAttribute('aria-expanded', 'false');

      // Click to expand
      await user.click(firstDataRow!);

      // Should be expanded
      expect(firstDataRow).toHaveAttribute('aria-expanded', 'true');

      // Expansion row should be visible with data
      const expansionRows = document.querySelectorAll('[data-expansion-row]');
      expect(expansionRows).toHaveLength(1);
    });

    it('chevron rotates when row is expanded', async () => {
      const user = userEvent.setup();
      render(
        <DataTable data={mockData} columns={mockColumns} enableExpansion />
      );

      // Find expand button
      const expandButtons = screen.getAllByRole('button', { name: /expand row/i });
      const firstExpandButton = expandButtons[0]!;

      // Initially not rotated
      const chevron = firstExpandButton.querySelector('svg');
      expect(chevron).not.toHaveClass('rotate-90');

      // Click to expand
      await user.click(firstExpandButton);

      // Chevron should be rotated
      expect(chevron).toHaveClass('rotate-90');
    });

    it('renderExpandedContent shows custom content', async () => {
      const user = userEvent.setup();
      const renderExpandedContent = (row: any) => (
        <div data-testid="custom-content">Custom: {row.original.name}</div>
      );

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          enableExpansion
          renderExpandedContent={renderExpandedContent}
        />
      );

      // Get first data row and expand
      const rows = screen.getAllByRole('row');
      await user.click(rows[1]!);

      // Custom content should be visible
      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
      expect(screen.getByText(/Custom: Alpha/i)).toBeInTheDocument();
    });

    it('shows default JSON content when no renderExpandedContent provided', async () => {
      const user = userEvent.setup();
      render(
        <DataTable data={mockData} columns={mockColumns} enableExpansion />
      );

      // Get first data row and expand
      const rows = screen.getAllByRole('row');
      await user.click(rows[1]!);

      // Should show JSON representation
      const expansionRow = document.querySelector('[data-expansion-row]');
      expect(expansionRow).toHaveTextContent('"name"');
      expect(expansionRow).toHaveTextContent('"Alpha"');
    });

    it('getRowCanExpand controls which rows can expand', () => {
      const getRowCanExpand = (row: any) => row.original.status === 'active';

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          enableExpansion
          getRowCanExpand={getRowCanExpand}
        />
      );

      // Only active rows should have expand button
      const expandButtons = screen.queryAllByRole('button', { name: /expand row/i });
      expect(expandButtons.length).toBe(1); // Only 'Alpha' is active
    });

    it('expand button click does not trigger row click', async () => {
      const user = userEvent.setup();
      const onRowClick = jest.fn();

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          enableExpansion
          onRowClick={onRowClick}
        />
      );

      // Click expand button
      const expandButtons = screen.getAllByRole('button', { name: /expand row/i });
      await user.click(expandButtons[0]!);

      // Row click should not be triggered due to stopPropagation
      expect(onRowClick).not.toHaveBeenCalled();
    });

    it('aria-expanded reflects expansion state', async () => {
      const user = userEvent.setup();
      render(
        <DataTable data={mockData} columns={mockColumns} enableExpansion />
      );

      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1]!;

      // Initially collapsed
      expect(firstDataRow).toHaveAttribute('aria-expanded', 'false');

      // Expand
      await user.click(firstDataRow);
      expect(firstDataRow).toHaveAttribute('aria-expanded', 'true');

      // Collapse
      await user.click(firstDataRow);
      expect(firstDataRow).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Keyboard Navigation', () => {
    it('first row has tabIndex 0, others have tabIndex -1', () => {
      render(
        <DataTable data={mockData} columns={mockColumns} enableExpansion />
      );

      const rows = screen.getAllByRole('row').slice(1); // Skip header

      expect(rows[0]).toHaveAttribute('tabIndex', '0');
      expect(rows[1]).toHaveAttribute('tabIndex', '-1');
      expect(rows[2]).toHaveAttribute('tabIndex', '-1');
    });

    it('ArrowDown moves focus to next row', async () => {
      const user = userEvent.setup();
      render(
        <DataTable data={mockData} columns={mockColumns} enableExpansion />
      );

      const rows = screen.getAllByRole('row').slice(1); // Skip header

      // Focus first row
      rows[0]!.focus();
      expect(rows[0]!).toHaveFocus();

      // Press ArrowDown
      await user.keyboard('{ArrowDown}');

      // Second row should be focused
      expect(rows[1]!).toHaveFocus();
    });

    it('ArrowUp moves focus to previous row', async () => {
      const user = userEvent.setup();
      render(
        <DataTable data={mockData} columns={mockColumns} enableExpansion />
      );

      const rows = screen.getAllByRole('row').slice(1); // Skip header

      // Focus second row
      rows[1]!.focus();
      expect(rows[1]!).toHaveFocus();

      // Press ArrowUp
      await user.keyboard('{ArrowUp}');

      // First row should be focused
      expect(rows[0]).toHaveFocus();
    });

    it('Enter key toggles expansion', async () => {
      const user = userEvent.setup();
      render(
        <DataTable data={mockData} columns={mockColumns} enableExpansion />
      );

      const rows = screen.getAllByRole('row').slice(1);
      const firstDataRow = rows[0]!;

      // Focus and press Enter
      firstDataRow.focus();
      await user.keyboard('{Enter}');

      // Should be expanded
      expect(firstDataRow).toHaveAttribute('aria-expanded', 'true');

      // Press Enter again
      await user.keyboard('{Enter}');

      // Should be collapsed
      expect(firstDataRow).toHaveAttribute('aria-expanded', 'false');
    });

    it('Space key toggles selection', async () => {
      const user = userEvent.setup();
      render(
        <DataTable data={mockData} columns={mockColumns} selectionMode="multi" enableExpansion />
      );

      const rows = screen.getAllByRole('row').slice(1);
      const firstDataRow = rows[0]!;

      // Focus and press Space
      firstDataRow.focus();
      await user.keyboard('{ }');

      // Row should be selected (indicated by background class)
      expect(firstDataRow).toHaveClass('bg-ember-500/10');
    });

    it('arrow keys skip expansion content rows', async () => {
      const user = userEvent.setup();
      render(
        <DataTable data={mockData} columns={mockColumns} enableExpansion />
      );

      const rows = screen.getAllByRole('row').slice(1);
      const firstDataRow = rows[0]!;

      // Focus first row and expand it
      firstDataRow.focus();
      await user.keyboard('{Enter}');

      // Verify expanded
      expect(firstDataRow).toHaveAttribute('aria-expanded', 'true');

      // Press ArrowDown
      await user.keyboard('{ArrowDown}');

      // Should skip expansion row and go to next data row
      const allRows = screen.getAllByRole('row').slice(1);
      const secondDataRow = allRows.find((row) =>
        row.getAttribute('aria-expanded') !== null &&
        row !== firstDataRow
      );

      expect(secondDataRow).toHaveFocus();
    });
  });

  describe('Responsive Scrolling', () => {
    it('scroll container has overflow-x-auto', () => {
      const { container } = render(
        <DataTable data={mockData} columns={mockColumns} />
      );

      const scrollContainer = container.querySelector('.overflow-x-auto');
      expect(scrollContainer).toBeInTheDocument();
      expect(scrollContainer).toHaveClass('overflow-x-auto');
    });

    it('table has min-w-full to prevent column squeezing', () => {
      const { container } = render(
        <DataTable data={mockData} columns={mockColumns} />
      );

      const table = container.querySelector('table');
      expect(table).toHaveClass('min-w-full');
    });

    it('fade indicator appears when content overflows', async () => {
      const { container } = render(
        <DataTable data={mockData} columns={mockColumns} />
      );

      // Find scroll container
      const scrollContainer = container.querySelector('.overflow-x-auto');

      // Mock scrollable state
      Object.defineProperty(scrollContainer, 'scrollWidth', {
        value: 1000,
        configurable: true,
      });
      Object.defineProperty(scrollContainer, 'clientWidth', {
        value: 500,
        configurable: true,
      });
      Object.defineProperty(scrollContainer, 'scrollLeft', {
        value: 0,
        configurable: true,
        writable: true,
      });

      // Trigger scroll event to update indicator
      await userEvent.setup();
      scrollContainer!.dispatchEvent(new Event('scroll'));

      // Wait for state update
      await screen.findByRole('table');

      // Check for fade indicator
      const fadeIndicator = container.querySelector('.pointer-events-none');
      expect(fadeIndicator).toBeInTheDocument();
    });

    it('scrollbar styling classes applied', () => {
      const { container } = render(
        <DataTable data={mockData} columns={mockColumns} />
      );

      const scrollContainer = container.querySelector('.overflow-x-auto');
      expect(scrollContainer).toHaveClass('scrollbar-thin');
      expect(scrollContainer).toHaveClass('scrollbar-thumb-slate-700');
    });
  });

  describe('Pagination', () => {
    // Generate larger dataset for pagination testing
    const largeMockData = Array.from({ length: 25 }, (_, i) => ({
      id: String(i + 1),
      name: `Item ${i + 1}`,
      status: i % 2 === 0 ? 'active' : 'pending',
    }));

    it('shows pagination when enablePagination is true and multiple pages', () => {
      render(
        <DataTable
          data={largeMockData}
          columns={mockColumns}
          enablePagination
          pageSize={10}
        />
      );

      // Pagination nav should be present
      expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument();

      // Should show "Showing 1-10 of 25"
      expect(screen.getByText(/Showing 1-10 of 25/i)).toBeInTheDocument();
    });

    it('does not show pagination when all data fits on one page', () => {
      render(
        <DataTable
          data={mockData} // Only 3 items
          columns={mockColumns}
          enablePagination
          pageSize={10}
        />
      );

      // Pagination nav should not be present (3 items < 10 page size)
      expect(screen.queryByRole('navigation', { name: /pagination/i })).not.toBeInTheDocument();
    });

    it('navigates to next page when clicking next button', async () => {
      const user = userEvent.setup();

      render(
        <DataTable
          data={largeMockData}
          columns={mockColumns}
          enablePagination
          pageSize={10}
        />
      );

      // Click next page button
      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      // Should now show page 2
      expect(screen.getByText(/Showing 11-20 of 25/i)).toBeInTheDocument();
    });

    it('shows page number buttons', () => {
      render(
        <DataTable
          data={largeMockData}
          columns={mockColumns}
          enablePagination
          pageSize={10}
        />
      );

      // Should show page 1, 2, 3 buttons
      expect(screen.getByRole('button', { name: /page 1/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /page 2/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /page 3/i })).toBeInTheDocument();
    });

    it('highlights current page button', () => {
      render(
        <DataTable
          data={largeMockData}
          columns={mockColumns}
          enablePagination
          pageSize={10}
        />
      );

      // Page 1 button should have aria-current="page"
      const page1Button = screen.getByRole('button', { name: /page 1/i });
      expect(page1Button).toHaveAttribute('aria-current', 'page');
    });

    it('has ARIA live region for page changes', () => {
      render(
        <DataTable
          data={largeMockData}
          columns={mockColumns}
          enablePagination
          pageSize={10}
        />
      );

      // Should have sr-only live region
      const liveRegion = document.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveClass('sr-only');
    });

    it('shows rows per page selector', () => {
      render(
        <DataTable
          data={largeMockData}
          columns={mockColumns}
          enablePagination
          pageSize={10}
          pageSizeOptions={[10, 25, 50]}
        />
      );

      // Should have page size select
      const pageSelect = screen.getByRole('combobox');
      expect(pageSelect).toBeInTheDocument();
      expect(pageSelect).toHaveValue('10');
    });
  });
});
