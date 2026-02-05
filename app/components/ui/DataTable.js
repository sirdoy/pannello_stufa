'use client';

import { forwardRef, useMemo, useState, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { cva } from 'class-variance-authority';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import Checkbox from './Checkbox';
import Button from './Button';
import Text from './Text';
import DataTableToolbar from './DataTableToolbar';

/**
 * DataTable Variants - CVA Configuration
 *
 * Full-featured data table with sorting, CVA variants for visual density,
 * striped rows, and sticky header options. Built on TanStack Table v8.
 *
 * @see https://tanstack.com/table/v8
 */
export const dataTableVariants = cva(
  'w-full border-collapse',
  {
    variants: {
      density: {
        compact: '[&_td]:py-2 [&_th]:py-2',    // 32px rows
        default: '[&_td]:py-3 [&_th]:py-3',    // 44px rows
        relaxed: '[&_td]:py-4 [&_th]:py-4',    // 52px rows
      },
      striped: {
        true: '[&_tbody_tr:nth-child(even)]:bg-white/[0.02]',
        false: '',
      },
      stickyHeader: {
        true: '[&_thead]:sticky [&_thead]:top-0 [&_thead]:bg-slate-900 [&_thead]:z-10',
        false: '',
      },
    },
    defaultVariants: {
      density: 'default',
      striped: false,
      stickyHeader: false,
    },
  }
);

/**
 * Get aria-sort attribute value based on sort direction
 * @param {boolean} isSorted - Whether the column is sorted
 * @param {string|false} direction - 'asc', 'desc', or false
 * @returns {'ascending'|'descending'|'none'} ARIA sort attribute value
 */
function getAriaSortValue(isSorted, direction) {
  if (!isSorted) return 'none';
  return direction === 'asc' ? 'ascending' : 'descending';
}

/**
 * SortIndicator Component
 *
 * Visual indicator showing current sort direction on column headers.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isSorted - Whether the column is sorted
 * @param {string|false} props.direction - Current sort direction
 */
function SortIndicator({ isSorted, direction }) {
  if (!isSorted) {
    return (
      <ChevronsUpDown
        className="ml-1 size-4 text-slate-500"
        aria-hidden="true"
      />
    );
  }

  if (direction === 'asc') {
    return (
      <ChevronUp
        className="ml-1 size-4 text-ember-400"
        aria-hidden="true"
      />
    );
  }

  return (
    <ChevronDown
      className="ml-1 size-4 text-ember-400"
      aria-hidden="true"
    />
  );
}

/**
 * DataTable Component
 *
 * Full-featured data table with TanStack Table v8 integration.
 * Supports sorting, visual density variants, striped rows, and sticky headers.
 *
 * @param {Object} props - Component props
 * @param {Array} props.data - Array of data objects to display in the table
 * @param {Array} props.columns - TanStack Table column definitions
 * @param {'compact'|'default'|'relaxed'} [props.density='default'] - Row density variant
 * @param {boolean} [props.striped=false] - Enable alternating row backgrounds
 * @param {boolean} [props.stickyHeader=false] - Make header sticky on scroll
 * @param {string} [props.className] - Additional CSS classes for the table
 * @param {Function} [props.onRowClick] - Callback when a row is clicked
 * @param {Function} [props.getRowId] - Custom function to get row ID
 * @param {'none'|'single'|'multi'} [props.selectionMode='none'] - Row selection mode
 * @param {Function} [props.onSelectionChange] - Callback when selection changes (selectedRowIds: Record<string, boolean>) => void
 * @param {Object} [props.selectedRows] - Controlled selection state (Record<string, boolean>)
 * @param {boolean} [props.enableFiltering=false] - Enable global and column filtering
 * @param {boolean} [props.enablePagination=false] - Enable pagination
 * @param {number} [props.pageSize=10] - Default page size
 * @param {number[]} [props.pageSizeOptions=[10,25,50,100]] - Page size options for dropdown
 * @param {boolean} [props.showRowCount=true] - Show "Showing X-Y of Z" text
 * @param {Function} [props.onPageChange] - Callback when page changes
 * @param {Array} [props.bulkActions] - Bulk actions for toolbar { id, label, variant?, icon? }
 * @param {Function} [props.onBulkAction] - Callback for bulk actions (actionId, selectedRows) => void
 *
 * @example
 * // Basic usage
 * const columns = [
 *   { accessorKey: 'name', header: 'Name' },
 *   { accessorKey: 'status', header: 'Status' },
 * ];
 * const data = [
 *   { id: '1', name: 'Alpha', status: 'active' },
 *   { id: '2', name: 'Beta', status: 'pending' },
 * ];
 * <DataTable data={data} columns={columns} />
 *
 * @example
 * // With variants
 * <DataTable
 *   data={data}
 *   columns={columns}
 *   density="compact"
 *   striped
 *   stickyHeader
 * />
 *
 * @example
 * // With row click handler
 * <DataTable
 *   data={data}
 *   columns={columns}
 *   onRowClick={(row) => console.log(row.original)}
 * />
 */
const DataTable = forwardRef(function DataTable(
  {
    data: dataProp,
    columns: columnsProp,
    density,
    striped,
    stickyHeader,
    className,
    onRowClick,
    getRowId,
    selectionMode = 'none',
    onSelectionChange,
    selectedRows: controlledSelectedRows,
    enableFiltering = false,
    enablePagination = false,
    pageSize: defaultPageSize = 10,
    pageSizeOptions = [10, 25, 50, 100],
    showRowCount = true,
    onPageChange,
    bulkActions = [],
    onBulkAction,
    ...props
  },
  ref
) {
  // CRITICAL: Memoize data and columns to prevent infinite re-renders
  const data = useMemo(() => dataProp ?? [], [dataProp]);
  const baseColumns = useMemo(() => columnsProp ?? [], [columnsProp]);

  // Sorting state
  const [sorting, setSorting] = useState([]);

  // Filtering state
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // Pagination state
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: defaultPageSize,
  });

  // Selection state (internal for uncontrolled mode)
  const [internalRowSelection, setInternalRowSelection] = useState({});

  // Use controlled or internal selection state
  const isSelectionControlled = controlledSelectedRows !== undefined;
  const rowSelection = isSelectionControlled ? controlledSelectedRows : internalRowSelection;

  // Handle selection change
  const handleRowSelectionChange = useCallback(
    (updaterOrValue) => {
      const newSelection =
        typeof updaterOrValue === 'function'
          ? updaterOrValue(rowSelection)
          : updaterOrValue;

      if (!isSelectionControlled) {
        setInternalRowSelection(newSelection);
      }

      if (onSelectionChange) {
        onSelectionChange(newSelection);
      }
    },
    [isSelectionControlled, rowSelection, onSelectionChange]
  );

  // Create selection column when selectionMode !== 'none'
  const selectionColumn = useMemo(() => {
    if (selectionMode === 'none') return null;

    return {
      id: 'select',
      header: ({ table }) =>
        selectionMode === 'multi' ? (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all rows"
            size="sm"
          />
        ) : null,
      cell: ({ row }) => (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-center"
        >
          <Checkbox
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onCheckedChange={row.toggleSelected}
            aria-label={`Select row ${row.id}`}
            size="sm"
          />
        </div>
      ),
      size: 40,
      enableSorting: false,
    };
  }, [selectionMode]);

  // Merge selection column with user columns
  const columns = useMemo(() => {
    if (selectionColumn) {
      return [selectionColumn, ...baseColumns];
    }
    return baseColumns;
  }, [selectionColumn, baseColumns]);

  // Row click handler
  const handleRowClick = useCallback(
    (row) => {
      if (onRowClick) {
        onRowClick(row);
      }
    },
    [onRowClick]
  );

  // Handle pagination change with callback
  const handlePaginationChange = useCallback(
    (updaterOrValue) => {
      setPagination((prev) => {
        const newPagination =
          typeof updaterOrValue === 'function'
            ? updaterOrValue(prev)
            : updaterOrValue;

        // Call onPageChange callback if provided and page changed
        if (onPageChange && newPagination.pageIndex !== prev.pageIndex) {
          onPageChange(newPagination.pageIndex);
        }

        return newPagination;
      });
    },
    [onPageChange]
  );

  // Initialize TanStack Table
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: handleRowSelectionChange,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: handlePaginationChange,
    enableRowSelection: selectionMode !== 'none',
    enableMultiRowSelection: selectionMode === 'multi',
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getRowId: getRowId,
  });

  // Pagination helpers
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const pageCount = table.getPageCount();
  const totalRows = table.getFilteredRowModel().rows.length;
  const startRow = pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

  // Generate page numbers (max 5 visible with ellipsis)
  const getPageNumbers = useCallback(() => {
    const pages = [];
    const maxVisiblePages = 5;

    if (pageCount <= maxVisiblePages) {
      // Show all pages if total pages <= 5
      for (let i = 0; i < pageCount; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(0);

      // Calculate start and end of visible range
      let start = Math.max(1, pageIndex - 1);
      let end = Math.min(pageCount - 2, pageIndex + 1);

      // Adjust range if at edges
      if (pageIndex <= 2) {
        end = 3;
      } else if (pageIndex >= pageCount - 3) {
        start = pageCount - 4;
      }

      // Add ellipsis before middle pages if needed
      if (start > 1) {
        pages.push('ellipsis-start');
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis after middle pages if needed
      if (end < pageCount - 2) {
        pages.push('ellipsis-end');
      }

      // Always show last page
      pages.push(pageCount - 1);
    }

    return pages;
  }, [pageIndex, pageCount]);

  const pageNumbers = getPageNumbers();

  // Count selected rows for bulk actions
  const selectedRowCount = Object.keys(rowSelection).filter(
    (key) => rowSelection[key]
  ).length;

  return (
    <div ref={ref} className={cn('space-y-4', className)} {...props}>
      {/* Toolbar */}
      {enableFiltering && (
        <DataTableToolbar
          table={table}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          showBulkActions={selectionMode !== 'none' && selectedRowCount > 0}
          bulkActions={bulkActions}
          onBulkAction={onBulkAction}
        />
      )}

      {/* Table Container */}
      <div className="overflow-x-auto rounded-2xl border border-white/[0.06]">
        <table
        className={cn(dataTableVariants({ density, striped, stickyHeader }))}
      >
        <thead className="bg-slate-800/50 border-b border-white/[0.06]">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} role="row">
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const isSorted = header.column.getIsSorted();
                const sortDirection = isSorted;

                return (
                  <th
                    key={header.id}
                    role="columnheader"
                    aria-sort={canSort ? getAriaSortValue(isSorted, sortDirection) : undefined}
                    className={cn(
                      'px-4 text-left text-sm font-semibold text-slate-300',
                      'border-b border-white/[0.06]',
                      canSort && 'cursor-pointer select-none',
                      header.id === 'select' && 'w-10 px-2 text-center'
                    )}
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        className="inline-flex items-center w-full hover:text-slate-100 transition-colors"
                        onClick={header.column.getToggleSortingHandler()}
                        aria-label={`Sort by ${flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )} ${
                          !isSorted
                            ? '(currently unsorted)'
                            : sortDirection === 'asc'
                            ? '(currently ascending)'
                            : '(currently descending)'
                        }`}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        <SortIndicator isSorted={isSorted} direction={sortDirection} />
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr role="row">
              <td
                role="cell"
                colSpan={table.getAllColumns().length}
                className="px-4 py-8 text-center text-slate-400"
              >
                No data available
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                role="row"
                className={cn(
                  'border-b border-white/[0.06] last:border-b-0',
                  'text-slate-200',
                  'hover:bg-white/[0.02] transition-colors',
                  onRowClick && 'cursor-pointer',
                  row.getIsSelected() && 'bg-ember-500/10'
                )}
                onClick={() => handleRowClick(row)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    role="cell"
                    className={cn(
                      'px-4 text-sm',
                      cell.column.id === 'select' && 'w-10 px-2'
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {enablePagination && pageCount > 1 && (
        <div className="flex items-center justify-center gap-4 py-4 border-t border-white/[0.06]">
          {/* ARIA live region for screen readers */}
          <div role="status" aria-live="polite" className="sr-only">
            Page {pageIndex + 1} of {pageCount}. Showing rows {startRow} to {endRow} of {totalRows}.
          </div>

          {/* Visual row count */}
          {showRowCount && totalRows > 0 && (
            <Text variant="secondary" size="sm">
              Showing {startRow}-{endRow} of {totalRows}
            </Text>
          )}

          {/* Page navigation buttons */}
          <nav className="flex gap-1" aria-label="Pagination">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Go to previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {/* Page numbers */}
            {pageNumbers.map((page, idx) =>
              typeof page === 'string' ? (
                <span
                  key={page}
                  className="flex items-center justify-center w-8 h-8 text-slate-500"
                  aria-hidden="true"
                >
                  ...
                </span>
              ) : (
                <Button
                  key={page}
                  variant={page === pageIndex ? 'ember' : 'ghost'}
                  size="sm"
                  onClick={() => table.setPageIndex(page)}
                  aria-current={page === pageIndex ? 'page' : undefined}
                  aria-label={`Go to page ${page + 1}`}
                  className="min-w-[32px]"
                >
                  {page + 1}
                </Button>
              )
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Go to next page"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </nav>

          {/* Rows per page selector */}
          {pageSizeOptions && pageSizeOptions.length > 0 && (
            <div className="flex items-center gap-2">
              <Text variant="secondary" size="sm" as="label" htmlFor="page-size">
                Rows:
              </Text>
              <select
                id="page-size"
                value={pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className={cn(
                  'px-2 py-1 rounded-lg text-sm',
                  'bg-slate-800/60 text-slate-200',
                  'border border-slate-700/50',
                  'focus:outline-none focus-visible:ring-2',
                  'focus-visible:ring-ember-500/50',
                  '[html:not(.dark)_&]:bg-white/80',
                  '[html:not(.dark)_&]:text-slate-700',
                  '[html:not(.dark)_&]:border-slate-300/60'
                )}
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
});

DataTable.displayName = 'DataTable';

export { DataTable };
export default DataTable;
