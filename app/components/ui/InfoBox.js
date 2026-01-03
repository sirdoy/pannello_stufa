import Text from './Text';

/**
 * InfoBox Component
 *
 * Reusable info box with icon, label, and value display.
 * Used in device cards to show summary statistics.
 *
 * @param {Object} props
 * @param {string} props.icon - Emoji icon
 * @param {string} props.label - Label text (uppercase)
 * @param {string|number} props.value - Value to display
 * @param {string} props.valueColor - Color for value text (default: neutral)
 * @param {string} props.className - Additional classes
 */
export default function InfoBox({
  icon,
  label,
  value,
  valueColor = 'neutral',
  className = '',
}) {
  const valueColors = {
    neutral: 'text-neutral-800 dark:text-neutral-100',
    primary: 'text-primary-700 dark:text-primary-400',
    success: 'text-success-700 dark:text-success-400',
    warning: 'text-warning-700 dark:text-warning-400',
    info: 'text-info-700 dark:text-info-400',
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-white/[0.08] dark:bg-white/[0.05] border border-white/20 dark:border-white/10 ${className}`}>
      <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-5 min-h-[100px]">
        {/* Icon */}
        <span className="text-3xl sm:text-4xl mb-2">{icon}</span>

        {/* Label */}
        <Text
          variant="tertiary"
          className="text-[10px] sm:text-xs uppercase tracking-wider font-bold mb-1"
        >
          {label}
        </Text>

        {/* Value */}
        <span className={`text-2xl sm:text-3xl font-black ${valueColors[valueColor]}`}>
          {value}
        </span>
      </div>
    </div>
  );
}
