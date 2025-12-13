export default function ModeIndicator({
  enabled,
  semiManual = false,
  returnToAutoAt = null,
  onConfigClick,
  showConfigButton = true,
  compact = false,
}) {
  const getIcon = () => {
    if (enabled && semiManual) return '⚙️';
    if (enabled) return '⏰';
    return '🔧';
  };

  const getColor = () => {
    if (enabled && semiManual) return 'text-warning-600';
    if (enabled) return 'text-success-600';
    return 'text-accent-600';
  };

  const getLabel = () => {
    if (enabled && semiManual) return 'Semi-manuale';
    if (enabled) return 'Automatica';
    return 'Manuale';
  };

  return (
    <div className={`flex items-center justify-between ${compact ? 'gap-2' : ''}`}>
      <div className="flex items-center gap-2">
        <span className={compact ? 'text-xl' : 'text-2xl'}>{getIcon()}</span>
        <div>
          <p className={`${compact ? 'text-sm' : 'text-sm'} font-semibold ${getColor()}`}>
            {getLabel()}
          </p>
          <p className={`${compact ? 'text-xs' : 'text-xs'} text-neutral-500 dark:text-neutral-400`}>Modalità controllo</p>
        </div>
      </div>
      {showConfigButton && onConfigClick && (
        <button
          onClick={onConfigClick}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-info-500/10 dark:bg-info-500/15 backdrop-blur-xl text-info-700 dark:text-info-300 hover:bg-info-500/15 dark:hover:bg-info-500/20 shadow-liquid-sm ring-1 ring-info-500/20 dark:ring-info-500/25 ring-inset transition-all duration-200"
        >
          Configura
        </button>
      )}
      {enabled && semiManual && returnToAutoAt && (
        <p className={`${compact ? 'text-xs ml-8' : 'text-xs'} text-neutral-500 dark:text-neutral-400 mt-2`}>
          Ritorno automatico: {new Date(returnToAutoAt).toLocaleString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      )}
    </div>
  );
}