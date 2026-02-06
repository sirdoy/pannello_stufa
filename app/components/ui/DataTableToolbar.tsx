'use client';

import { forwardRef, useState, useEffect, useCallback, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import Input from './Input';
import Badge from './Badge';
import Button from './Button';
import Text from './Text';

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
 *   table={table}
 *   globalFilter={globalFilter}
 *   onGlobalFilterChange={setGlobalFilter}
 *   showBulkActions={selectedCount > 0}
 *   bulkActions={[
 *     { id: 'delete', label: 'Delete', variant: 'danger' },
 *     { id: 'export', label: 'Export', variant: 'subtle' },
 *   ]}
 *   onBulkAction={(action, rows) => handleBulkAction(action, rows)}
 * />
 */
const DataTableToolbar = forwardRef(function DataTableToolbar(
  {
    table,
    globalFilter = '',
    onGlobalFilterChange,
    showBulkActions = false,
    onBulkAction,
    bulkActions = [],
    className,
    ...props
  },
  ref
) {
  // Debounced search state
  const [searchValue, setSearchValue] = useState(globalFilter);
  const debounceRef = useRef(null);

  // Sync search value with external globalFilter
  useEffect(() => {
    setSearchValue(globalFilter);
  }, [globalFilter]);

  // Debounced search handler
  const handleSearchChange = useCallback(
    (e) => {
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
    },
    [onGlobalFilterChange]
  );

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
  const handleRemoveFilter = useCallback(
    (columnId) => {
      if (table) {
        table.getColumn(columnId)?.setFilterValue(undefined);
      }
    },
    [table]
  );

  // Handle clearing all filters
  const handleClearAllFilters = useCallback(() => {
    if (table) {
      table.resetColumnFilters();
      if (onGlobalFilterChange) {
        onGlobalFilterChange('');
      }
    }
  }, [table, onGlobalFilterChange]);

  // Get selected rows
  const selectedRows = table?.getSelectedRowModel?.()?.rows ?? [];
  const selectedCount = selectedRows.length;

  // Handle bulk action click
  const handleBulkAction = useCallback(
    (actionId) => {
      if (onBulkAction) {
        onBulkAction(actionId, selectedRows);
      }
    },
    [onBulkAction, selectedRows]
  );

  // Format filter value for display
  const formatFilterValue = (value) => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return String(value);
  };

  // Get column header name for display
  const getColumnHeaderName = (columnId) => {
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
            'bg-ember-500/10 border border-ember-400/20 rounded-xl'
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
            {bulkActions.map((action) => (
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
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Search..."
            className={cn(
              'w-full pl-10 pr-4 py-2 rounded-xl',
              'bg-slate-800/60 backdrop-blur-xl',
              'text-slate-100 placeholder:text-slate-500',
              'font-medium font-display text-sm',
              'border border-slate-700/50',
              'focus:outline-none focus-visible:ring-2',
              'focus-visible:ring-ember-500/50 focus-visible:border-ember-500/60',
              'transition-all duration-200',
              '[html:not(.dark)_&]:bg-white/80',
              '[html:not(.dark)_&]:text-slate-900',
              '[html:not(.dark)_&]:placeholder:text-slate-400',
              '[html:not(.dark)_&]:border-slate-300/60'
            )}
            aria-label="Search table"
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
                className="p-0.5 hover:bg-ocean-500/30 rounded transition-colors"
                aria-label="Remove search filter"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {/* Column filter chips */}
          {columnFilters.map((filter) => (
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
                className="p-0.5 hover:bg-ocean-500/30 rounded transition-colors"
                aria-label={`Remove ${getColumnHeaderName(filter.id)} filter`}
              >
                <X className="w-3 h-3" />
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
});

DataTableToolbar.displayName = 'DataTableToolbar';

export { DataTableToolbar };
export default DataTableToolbar;
