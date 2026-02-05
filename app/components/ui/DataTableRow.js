'use client';

import { ChevronRight } from 'lucide-react';
import { flexRender } from '@tanstack/react-table';
import { cn } from '@/lib/utils/cn';
import Text from './Text';

/**
 * DataTableRow Component
 *
 * Renders a table row with expansion support and keyboard navigation.
 * Uses roving tabindex pattern for accessible keyboard navigation.
 *
 * @param {Object} props - Component props
 * @param {Object} props.row - TanStack Row instance
 * @param {Array} props.columns - Column definitions
 * @param {number} props.index - Row index (for roving tabindex)
 * @param {Function} [props.renderExpandedContent] - Custom expansion content renderer (row) => ReactNode
 * @param {number} [props.extraColumns=0] - Number of extra columns (select, expand, etc.)
 * @param {Function} [props.onRowClick] - Callback when row is clicked
 */
export function DataTableRow({
  row,
  columns,
  index,
  renderExpandedContent,
  extraColumns = 0,
  onRowClick,
}) {
  /**
   * Keyboard navigation handler
   * Implements roving tabindex pattern with arrow keys, Enter, and Space
   */
  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        let nextRow = e.currentTarget.nextElementSibling;
        // Skip expanded content row if present
        if (nextRow?.getAttribute('data-expansion-row')) {
          nextRow = nextRow.nextElementSibling;
        }
        nextRow?.focus();
        break;

      case 'ArrowUp':
        e.preventDefault();
        let prevRow = e.currentTarget.previousElementSibling;
        // Skip expanded content row if present
        if (prevRow?.getAttribute('data-expansion-row')) {
          prevRow = prevRow.previousElementSibling;
        }
        prevRow?.focus();
        break;

      case 'Enter':
        e.preventDefault();
        if (row.getCanExpand()) {
          row.toggleExpanded();
        }
        break;

      case ' ':
        e.preventDefault();
        if (row.getCanSelect()) {
          row.toggleSelected();
        }
        break;

      default:
        break;
    }
  };

  /**
   * Row click handler
   * Expands row if expansion is enabled
   */
  const handleRowClick = () => {
    if (row.getCanExpand()) {
      row.toggleExpanded();
    }
    if (onRowClick) {
      onRowClick(row);
    }
  };

  const isExpanded = row.getIsExpanded();
  const canExpand = row.getCanExpand();
  const totalColumns = columns.length + extraColumns;

  return (
    <>
      {/* Main data row */}
      <tr
        role="row"
        tabIndex={index === 0 ? 0 : -1}
        onClick={handleRowClick}
        onKeyDown={handleKeyDown}
        aria-expanded={canExpand ? isExpanded : undefined}
        aria-selected={row.getIsSelected() || undefined}
        className={cn(
          'border-b border-white/[0.06] last:border-b-0',
          'text-slate-200',
          'hover:bg-white/[0.02] transition-colors',
          canExpand && 'cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ember-500/50',
          row.getIsSelected() && 'bg-ember-500/10',
          isExpanded && 'border-b-0'
        )}
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

      {/* Expanded content row */}
      {isExpanded && (
        <tr
          data-expansion-row
          className="bg-slate-800/30 border-b border-white/[0.06] last:border-b-0"
          role="row"
        >
          <td colSpan={totalColumns} className="p-4" role="cell">
            {renderExpandedContent ? (
              renderExpandedContent(row)
            ) : (
              <Text variant="secondary" size="sm" as="pre" className="whitespace-pre-wrap font-mono">
                {JSON.stringify(row.original, null, 2)}
              </Text>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export default DataTableRow;
