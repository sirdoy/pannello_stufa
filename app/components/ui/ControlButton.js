'use client';

/**
 * ControlButton - Ember Noir Design System
 *
 * Increment/Decrement control button with warm accent styling.
 * Used for numeric controls with visual feedback for disabled state.
 *
 * @param {Object} props - Component props
 * @param {'increment'|'decrement'} props.type - Button type
 * @param {'ember'|'ocean'|'warning'|'sage'|'danger'|'info'} props.variant - Color variant
 * @param {boolean} props.disabled - Disabled state
 * @param {function} props.onClick - Click handler
 * @param {'sm'|'md'|'lg'} props.size - Button size
 * @param {string} props.className - Additional CSS classes
 */
export default function ControlButton({
  type = 'increment',
  variant = 'ember',
  disabled = false,
  onClick,
  size = 'lg',
  className = '',
  ...props
}) {
  // Size classes
  const sizeClasses = {
    sm: 'h-12 text-2xl',
    md: 'h-14 text-3xl',
    lg: 'h-16 sm:h-20 text-3xl sm:text-4xl',
  };

  // Variant color classes - Ember Noir palette
  const variantClasses = {
    // Primary: warm copper/amber
    ember: `
      bg-gradient-to-br from-ember-500 to-flame-600
      hover:from-ember-400 hover:to-flame-500
      shadow-ember-glow-sm hover:shadow-ember-glow
    `,
    // Secondary: muted ocean blue
    ocean: `
      bg-gradient-to-br from-ocean-500 to-ocean-600
      hover:from-ocean-400 hover:to-ocean-500
      shadow-[0_4px_15px_rgba(67,125,174,0.25)]
      hover:shadow-[0_6px_20px_rgba(67,125,174,0.35)]
    `,
    // Warning: amber
    warning: `
      bg-gradient-to-br from-warning-500 to-warning-600
      hover:from-warning-400 hover:to-warning-500
      shadow-[0_4px_15px_rgba(234,179,8,0.25)]
      hover:shadow-[0_6px_20px_rgba(234,179,8,0.35)]
    `,
    // Sage: muted green
    sage: `
      bg-gradient-to-br from-sage-500 to-sage-600
      hover:from-sage-400 hover:to-sage-500
      shadow-[0_4px_15px_rgba(96,115,96,0.25)]
      hover:shadow-[0_6px_20px_rgba(96,115,96,0.35)]
    `,
    // Danger: red
    danger: `
      bg-gradient-to-br from-danger-500 to-danger-600
      hover:from-danger-400 hover:to-danger-500
      shadow-[0_4px_15px_rgba(239,68,68,0.25)]
      hover:shadow-[0_6px_20px_rgba(239,68,68,0.35)]
    `,
    // Legacy: info maps to ocean
    info: `
      bg-gradient-to-br from-ocean-500 to-ocean-600
      hover:from-ocean-400 hover:to-ocean-500
      shadow-[0_4px_15px_rgba(67,125,174,0.25)]
      hover:shadow-[0_6px_20px_rgba(67,125,174,0.35)]
    `,
  };

  // Symbol based on type
  const symbol = type === 'increment' ? '+' : '−';

  // Base classes
  const baseClasses = `
    rounded-xl font-black font-display
    transition-all duration-200
    border border-white/10 [html:not(.dark)_&]:border-black/5
    ${sizeClasses[size]}
  `;

  // State-dependent classes
  const stateClasses = disabled
    ? 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50 shadow-none [html:not(.dark)_&]:bg-slate-200 [html:not(.dark)_&]:text-slate-400'
    : `${variantClasses[variant]} text-white active:scale-95`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${stateClasses} ${className}`.trim().replace(/\s+/g, ' ')}
      {...props}
    >
      {symbol}
    </button>
  );
}
