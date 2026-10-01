'use client';

import { forwardRef, useState, useEffect, useRef, type ForwardedRef, type HTMLAttributes, type ReactElement, type ReactNode, type RefAttributes } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import Badge from './Badge';
import Button, { type ButtonProps } from './Button';
import Text from './Text';
import type { Row, Table } from '@tanstack/react-table';

export interface DataTableBulkAction {
  id: string;
  label: string;
  variant?: ButtonProps['variant'];
  icon?: ReactNode;
}

export interface DataTableToolbarProps<TData> extends HTMLAttributes<HTMLDivElement> {
  table: Table<TData>;
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  showBulkActions?: boolean;
  onBulkAction?: (action: string, selectedRows: Row<TData>[]) => void;
  bulkActions?: DataTableBulkAction[];
  className?: string;
}

type DataTableToolbarComponent = (<TData>(
  props: DataTableToolbarProps<TData> & RefAttributes<HTMLDivElement>
) => ReactElement | null) & { displayName?: string };

/**
 * DataTableToolbar Component
 *
 * Toolbar for DataTable providing global search, filter chips display,
 * and bulk actions when rows are selected.
 *
 * @param {Object} props - Component props
 * @param {Object} props.table - TanStack table instance
 * @param {string} props.globalFilter - Current global filter value
 * @param {Function} props.onGlobalFilterChange - Callback when global filter changes
 * @param {boolean} props.showBulkActions - Whether to show bulk actions toolbar
 * @param {Function} props.onBulkAction - Callback when bulk action is triggered (action: string, selectedRows: Row[]) => void
 * @param {Array} props.bulkActions - Array of bulk actions { id: string, label: string, variant?: string, icon?: ReactNode }
 * @param {string} props.className - Additional CSS classes
 *
 * @example
 * <DataTableToolbar
 * table={table}
 * globalFilter={globalFilter}
 * onGlobalFilterChange={setGlobalFilter}
 * showBulkActions={selectedCount > 0}
 * bulkActions={[
 * { id: 'delete', label: 'Delete', variant: 'danger' },
 * { id: 'export', label: 'Export', variant: 'subtle' },
 * ]}
 * onBulkAction={(action, rows) => handleBulkAction(action, rows)}
 * />
 */
const DataTableToolbar = forwardRef(function DataTableToolbar<TData>(
  {
    table,
    globalFilter = '',
    onGlobalFilterChange,
    showBulkActions = false,
    onBulkAction,
    bulkActions = [],
    className = '',
    ...props
  }: DataTableToolbarProps<TData>,
  ref: ForwardedRef<HTMLDivElement>
) {
  // Debounced search state
  const [searchValue, setSearchValue] = useState(globalFilter);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync search value with external globalFilter
  useEffect(() => {
    setSearchValue(globalFilter);
  }, [globalFilter]);

  // Debounced search handler
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce 300ms
    debounceRef.current = setTimeout(() => {
      if (onGlobalFilterChange) {
        onGlobalFilterChange(value);
      }
    }, 300);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Get column filters from table state
  const columnFilters = table?.getState?.()?.columnFilters ?? [];

  // Handle removing a column filter
  const handleRemoveFilter = (columnId: string) => {
    if (table) {
      table.getColumn(columnId)?.setFilterValue(undefined);
    }
  };

  // Handle clearing all filters
  const handleClearAllFilters = () => {
    if (table) {
      table.resetColumnFilters();
      if (onGlobalFilterChange) {
        onGlobalFilterChange('');
      }
    }
  };

  // Get selected rows
  const selectedRows = table?.getSelectedRowModel?.()?.rows ?? [];
  const selectedCount = selectedRows.length;

  // Handle bulk action click
  const handleBulkAction = (actionId: string) => {
    if (onBulkAction) {
      onBulkAction(actionId, selectedRows);
    }
  };

  // Format filter value for display
  const formatFilterValue = (value: unknown) => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return String(value);
  };

  // Get column header name for display
  const getColumnHeaderName = (columnId: string) => {
    const column = table?.getColumn(columnId);
    const headerDef = column?.columnDef?.header;
    if (typeof headerDef === 'string') {
      return headerDef;
    }
    // Fallback to column ID with capitalization
    return columnId.charAt(0).toUpperCase() + columnId.slice(1);
  };

  return (
    <div
      ref={ref}
      className={cn('space-y-3', className)}
      {...props}
    >
      {/* Bulk Actions Toolbar */}
      {showBulkActions && selectedCount > 0 && (
        <div
          className={cn(
            'flex items-center justify-between gap-4 p-3',
            'rounded-xl border border-ember-400/20 bg-ember-500/10'
          )}
          role="toolbar"
          aria-label="Bulk actions"
        >
          {/* Selected count with live region */}
          <div aria-live="polite" aria-atomic="true">
            <Text variant="ember" size="sm" weight="semibold">
              {selectedCount} {selectedCount === 1 ? 'row' : 'rows'} selected
            </Text>
          </div>

          {/* Bulk action buttons */}
          <div className="flex items-center gap-2">
            {Array.isArray(bulkActions) && bulkActions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant || 'subtle'}
                size="sm"
                onClick={() => handleBulkAction(action.id)}
              >
                {action.icon && (
                  <span className="mr-1.5" aria-hidden="true">
                    {action.icon}
                  </span>
                )}
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Search and Controls Row */}
      <div className="flex items-center gap-4">
        {/* Global Search Input */}
        <div className="relative max-w-sm flex-1">
          <Search
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Search..."
            aria-label="Search..."
            className={cn(
              'w-full rounded-xl py-2 pr-4 pl-10',
              'bg-slate-800/60 backdrop-blur-xl',
              'text-slate-100 placeholder:text-slate-500',
              'font-display text-sm font-medium',
              'border border-slate-700/50',
              'focus:outline-none focus-visible:ring-2',
              'focus-visible:border-ember-500/60 focus-visible:ring-ember-500/50',
              'transition-all duration-200',
            )}
          />
        </div>
      </div>

      {/* Filter Chips Row */}
      {(columnFilters.length > 0 || globalFilter) && (
        <div
          className="flex flex-wrap items-center gap-2"
          role="region"
          aria-label="Active filters"
        >
          {/* Global filter chip */}
          {globalFilter && (
            <Badge
              variant="ocean"
              size="sm"
              className="inline-flex items-center gap-1.5"
            >
              <span>Search: {globalFilter}</span>
              <button
                type="button"
                onClick={() => {
                  setSearchValue('');
                  if (onGlobalFilterChange) {
                    onGlobalFilterChange('');
                  }
                }}
                className="rounded p-0.5 transition-colors hover:bg-ocean-500/30"
                aria-label="Remove search filter"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {/* Column filter chips */}
          {columnFilters.map((filter: { id: string; value: unknown }) => (
            <Badge
              key={filter.id}
              variant="ocean"
              size="sm"
              className="inline-flex items-center gap-1.5"
            >
              <span>
                {getColumnHeaderName(filter.id)}: {formatFilterValue(filter.value)}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveFilter(filter.id)}
                className="rounded p-0.5 transition-colors hover:bg-ocean-500/30"
                aria-label={`Remove ${getColumnHeaderName(filter.id)} filter`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}

          {/* Clear all button */}
          {(columnFilters.length > 1 || (columnFilters.length >= 1 && globalFilter)) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAllFilters}
              className="text-xs"
            >
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  );
}) as DataTableToolbarComponent;

DataTableToolbar.displayName = 'DataTableToolbar';

export { DataTableToolbar };
export default DataTableToolbar;
