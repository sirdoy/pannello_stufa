import Text from './Text';

/**
 * InfoBox Component - Ember Noir Design System
 *
 * Reusable info box with icon, label, and value display.
 * Used in device cards to show summary statistics.
 * Supports vertical (default) and horizontal compact layouts.
 *
 * @param {Object} props
 * @param {string} props.icon - Emoji icon
 * @param {string} props.label - Label text (uppercase)
 * @param {string|number} props.value - Value to display
 * @param {'neutral'|'ember'|'ocean'|'sage'|'warning'|'danger'} props.valueColor - Color for value text
 * @param {'vertical'|'horizontal'} props.layout - Layout orientation
 * @param {string} props.className - Additional classes
 */
export default function InfoBox({
  icon,
  label,
  value,
  valueColor = 'neutral',
  layout = 'horizontal',
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

  // Compact vertical layout optimized for 2-column grid
  return (
    <div className={`
      relative overflow-hidden rounded-xl
      bg-slate-800/50 backdrop-blur-xl
      border border-slate-700/40
      transition-all duration-200
      hover:bg-slate-800/70 hover:border-slate-600/50
      [html:not(.dark)_&]:bg-white/70
      [html:not(.dark)_&]:border-slate-200
      [html:not(.dark)_&]:hover:bg-white/90
      [html:not(.dark)_&]:hover:border-slate-300
      ${className}
    `}>
      <div className="relative z-10 flex flex-col items-center justify-center p-3 sm:p-4 min-h-[90px]">
        {/* Icon */}
        <span className="text-2xl sm:text-3xl mb-1.5">{icon}</span>

        {/* Label */}
        <Text
          variant="label"
          size="xs"
          weight="medium"
          as="span"
          className="mb-0.5 text-center"
        >
          {label}
        </Text>

        {/* Value */}
        <span className={`text-lg sm:text-xl font-bold font-display text-center leading-tight ${valueColors[valueColor]}`}>
          {value}
        </span>
      </div>
    </div>
  );
}
