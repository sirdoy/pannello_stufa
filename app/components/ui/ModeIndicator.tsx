import Text from './Text';
import Button from './Button';

/**
 * ModeIndicator Component - Ember Noir Design System
 *
 * Displays the current scheduler mode (Manual, Automatic, Semi-Manual).
 * Handles dark/light mode internally via Text component.
 *
 * @param {Object} props
 * @param {boolean} props.enabled - Scheduler enabled state
 * @param {boolean} props.semiManual - Semi-manual mode active
 * @param {string} props.returnToAutoAt - ISO timestamp for auto return
 * @param {Function} props.onConfigClick - Config button handler
 * @param {boolean} props.showConfigButton - Show config button
 * @param {boolean} props.compact - Compact layout
 */
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

  // Ember Noir variants for Text
  const getVariant = () => {
    if (enabled && semiManual) return 'warning';
    if (enabled) return 'sage';
    return 'ember';
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
          <Text variant={getVariant()} size="sm" weight="semibold" as="p">
            {getLabel()}
          </Text>
          <Text variant="tertiary" size="xs" as="p">
            Modalità controllo
          </Text>
        </div>
      </div>
      {showConfigButton && onConfigClick && (
        <Button variant="ocean" size="sm" onClick={onConfigClick}>
          Configura
        </Button>
      )}
      {enabled && semiManual && returnToAutoAt && (
        <Text variant="tertiary" size="xs" className={compact ? 'ml-8 mt-2' : 'mt-2'}>
          Ritorno automatico: {new Date(returnToAutoAt).toLocaleString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      )}
    </div>
  );
}