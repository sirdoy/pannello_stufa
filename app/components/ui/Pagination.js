import Text from './Text';

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
}) {
  const buttonBaseClasses = 'px-4 py-2.5 rounded-xl font-medium transition-all duration-200';

  const enabledClasses = `
    bg-slate-700/50 hover:bg-slate-600/60 text-slate-200
    [html:not(.dark)_&]:bg-slate-200/80 [html:not(.dark)_&]:hover:bg-slate-300/80 [html:not(.dark)_&]:text-slate-700
    ring-1 ring-slate-600/30 [html:not(.dark)_&]:ring-slate-300/50
    shadow-liquid-sm
  `;

  const disabledClasses = `
    bg-slate-800/30 text-slate-500 cursor-not-allowed
    [html:not(.dark)_&]:bg-slate-100/50 [html:not(.dark)_&]:text-slate-400
    ring-1 ring-slate-700/20 [html:not(.dark)_&]:ring-slate-200/50
  `;

  return (
    <div className="flex justify-between items-center pt-4 gap-4">
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
