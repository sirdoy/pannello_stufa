import Text from './Text';

/**
 * InfoBox Component - Ember Noir Design System
 *
 * Reusable info box with icon, label, and value display.
 * Used in device cards to show summary statistics.
 *
 * @param {Object} props
 * @param {string} props.icon - Emoji icon
 * @param {string} props.label - Label text (uppercase)
 * @param {string|number} props.value - Value to display
 * @param {'neutral'|'ember'|'ocean'|'sage'|'warning'|'danger'} props.valueColor - Color for value text
 * @param {string} props.className - Additional classes
 */
export default function InfoBox({
  icon,
  label,
  value,
  valueColor = 'neutral',
  className = '',
}) {
  // Ember Noir value colors with light mode support
  const valueColors = {
    neutral: 'text-slate-100 [html:not(.dark)_&]:text-slate-900',
    ember: 'text-ember-400 [html:not(.dark)_&]:text-ember-600',
    ocean: 'text-ocean-400 [html:not(.dark)_&]:text-ocean-600',
    sage: 'text-sage-400 [html:not(.dark)_&]:text-sage-600',
    warning: 'text-warning-400 [html:not(.dark)_&]:text-warning-600',
    danger: 'text-danger-400 [html:not(.dark)_&]:text-danger-600',
    // Legacy mappings
    primary: 'text-ember-400 [html:not(.dark)_&]:text-ember-600',
    success: 'text-sage-400 [html:not(.dark)_&]:text-sage-600',
    info: 'text-ocean-400 [html:not(.dark)_&]:text-ocean-600',
  };

  return (
    <div className={`
      relative overflow-hidden rounded-2xl
      bg-slate-800/60 backdrop-blur-xl
      border border-slate-700/50
      transition-all duration-200
      hover:bg-slate-800/80 hover:border-slate-600/60
      [html:not(.dark)_&]:bg-white/80
      [html:not(.dark)_&]:border-slate-200
      [html:not(.dark)_&]:hover:bg-white/90
      [html:not(.dark)_&]:hover:border-slate-300
      ${className}
    `}>
      <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-5 min-h-[100px]">
        {/* Icon */}
        <span className="text-3xl sm:text-4xl mb-2">{icon}</span>

        {/* Label */}
        <Text
          variant="tertiary"
          className="text-[10px] sm:text-xs uppercase tracking-wider font-bold font-display mb-1 text-slate-400 [html:not(.dark)_&]:text-slate-500"
        >
          {label}
        </Text>

        {/* Value */}
        <span className={`text-2xl sm:text-3xl font-black font-display ${valueColors[valueColor]}`}>
          {value}
        </span>
      </div>
    </div>
  );
}
