'use client';

import { forwardRef, useMemo, useState, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import { cva } from 'class-variance-authority';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import Checkbox from './Checkbox';

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
    ...props
  },
  ref
) {
  // CRITICAL: Memoize data and columns to prevent infinite re-renders
  const data = useMemo(() => dataProp ?? [], [dataProp]);
  const baseColumns = useMemo(() => columnsProp ?? [], [columnsProp]);

  // Sorting state
  const [sorting, setSorting] = useState([]);

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

  // Initialize TanStack Table
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: handleRowSelectionChange,
    enableRowSelection: selectionMode !== 'none',
    enableMultiRowSelection: selectionMode === 'multi',
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: getRowId,
  });

  return (
    <div
      ref={ref}
      className={cn(
        'overflow-x-auto rounded-2xl border border-white/[0.06]',
        className
      )}
      {...props}
    >
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
    </div>
  );
});

DataTable.displayName = 'DataTable';

export { DataTable };
export default DataTable;
