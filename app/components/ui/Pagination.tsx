import type React from 'react';
import Text from './Text';

export interface PaginationProps {
  /** Current page index (0-based) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Handler for previous page button */
  onPrevious: () => void;
  /** Handler for next page button */
  onNext: () => void;
  /** Whether previous page is available */
  hasPrev: boolean;
  /** Whether next page is available */
  hasNext: boolean;
}

/**
 * Pagination Component - Ember Noir Design System
 *
 * Navigation controls for paginated content.
 * Dark-first design with warm accents.
 */
export default function Pagination({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  hasPrev,
  hasNext,
}: PaginationProps): React.ReactElement {
  const buttonBaseClasses = 'px-4 py-2.5 rounded-xl border-[0.5px] font-medium transition-colors duration-200';

  const enabledClasses = `
    border-white/14 bg-white/6 hover:bg-white/10 text-white
  `;

  const disabledClasses = `
    border-white/6 bg-white/4 text-(--text-2) opacity-55 cursor-not-allowed
  `;

  return (
    <div className="flex items-center justify-between gap-4 pt-4">
      <button
        onClick={onPrevious}
        disabled={!hasPrev}
        className={`${buttonBaseClasses} ${hasPrev ? enabledClasses : disabledClasses}`}
      >
        ◀ Precedente
      </button>

      <Text variant="tertiary" size="sm" className="whitespace-nowrap">
        Pagina {currentPage + 1} di {totalPages}
      </Text>

      <button
        onClick={onNext}
        disabled={!hasNext}
        className={`${buttonBaseClasses} ${hasNext ? enabledClasses : disabledClasses}`}
      >
        Successivo ▶
      </button>
    </div>
  );
}
