/**
 * ActionButton Component - Ember Noir Design System
 *
 * Specialized icon buttons for common actions (edit, delete, close, etc.).
 * Consistent styling with Ember Noir aesthetic and color variants.
 * Handles dark/light mode internally.
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.icon - Icon component or emoji
 * @param {'ember'|'ocean'|'sage'|'warning'|'danger'|'ghost'} props.variant - Color variant
 * @param {'sm'|'md'|'lg'} props.size - Button size
 * @param {Function} props.onClick - Click handler
 * @param {string} props.title - Tooltip text
 * @param {string} props.ariaLabel - Accessibility label
 * @param {boolean} props.disabled - Disabled state
 * @param {string} props.className - Additional layout classes
 */
export default function ActionButton({
  icon,
  variant = 'ember',
  size = 'md',
  onClick,
  title,
  ariaLabel,
  disabled = false,
  className = '',
  ...props
}) {
  // Ember Noir color variants with light mode support
  const variants = {
    ember: `
      bg-ember-500/15 text-ember-400 ring-ember-500/30
      hover:bg-ember-500/25 hover:ring-ember-500/50
      [html:not(.dark)_&]:bg-ember-500/10 [html:not(.dark)_&]:text-ember-600 [html:not(.dark)_&]:ring-ember-500/25
      [html:not(.dark)_&]:hover:bg-ember-500/20
    `,
    ocean: `
      bg-ocean-500/15 text-ocean-400 ring-ocean-500/30
      hover:bg-ocean-500/25 hover:ring-ocean-500/50
      [html:not(.dark)_&]:bg-ocean-500/10 [html:not(.dark)_&]:text-ocean-600 [html:not(.dark)_&]:ring-ocean-500/25
      [html:not(.dark)_&]:hover:bg-ocean-500/20
    `,
    sage: `
      bg-sage-500/15 text-sage-400 ring-sage-500/30
      hover:bg-sage-500/25 hover:ring-sage-500/50
      [html:not(.dark)_&]:bg-sage-500/10 [html:not(.dark)_&]:text-sage-600 [html:not(.dark)_&]:ring-sage-500/25
      [html:not(.dark)_&]:hover:bg-sage-500/20
    `,
    warning: `
      bg-warning-500/15 text-warning-400 ring-warning-500/30
      hover:bg-warning-500/25 hover:ring-warning-500/50
      [html:not(.dark)_&]:bg-warning-500/10 [html:not(.dark)_&]:text-warning-600 [html:not(.dark)_&]:ring-warning-500/25
      [html:not(.dark)_&]:hover:bg-warning-500/20
    `,
    danger: `
      bg-danger-500/15 text-danger-400 ring-danger-500/30
      hover:bg-danger-500/25 hover:ring-danger-500/50
      [html:not(.dark)_&]:bg-danger-500/10 [html:not(.dark)_&]:text-danger-600 [html:not(.dark)_&]:ring-danger-500/25
      [html:not(.dark)_&]:hover:bg-danger-500/20
    `,
    ghost: `
      bg-slate-500/10 text-slate-400 ring-slate-500/20
      hover:bg-slate-500/20 hover:ring-slate-500/40
      [html:not(.dark)_&]:bg-slate-500/5 [html:not(.dark)_&]:text-slate-500 [html:not(.dark)_&]:ring-slate-500/15
      [html:not(.dark)_&]:hover:bg-slate-500/10
    `,
    // Legacy mappings
    edit: `
      bg-ocean-500/15 text-ocean-400 ring-ocean-500/30
      hover:bg-ocean-500/25 hover:ring-ocean-500/50
      [html:not(.dark)_&]:bg-ocean-500/10 [html:not(.dark)_&]:text-ocean-600 [html:not(.dark)_&]:ring-ocean-500/25
    `,
    delete: `
      bg-danger-500/15 text-danger-400 ring-danger-500/30
      hover:bg-danger-500/25 hover:ring-danger-500/50
      [html:not(.dark)_&]:bg-danger-500/10 [html:not(.dark)_&]:text-danger-600 [html:not(.dark)_&]:ring-danger-500/25
    `,
    close: `
      bg-slate-500/10 text-slate-400 ring-slate-500/20
      hover:bg-slate-500/20 hover:ring-slate-500/40
      [html:not(.dark)_&]:bg-slate-500/5 [html:not(.dark)_&]:text-slate-500 [html:not(.dark)_&]:ring-slate-500/15
    `,
    info: `
      bg-ocean-500/15 text-ocean-400 ring-ocean-500/30
      hover:bg-ocean-500/25 hover:ring-ocean-500/50
      [html:not(.dark)_&]:bg-ocean-500/10 [html:not(.dark)_&]:text-ocean-600 [html:not(.dark)_&]:ring-ocean-500/25
    `,
    success: `
      bg-sage-500/15 text-sage-400 ring-sage-500/30
      hover:bg-sage-500/25 hover:ring-sage-500/50
      [html:not(.dark)_&]:bg-sage-500/10 [html:not(.dark)_&]:text-sage-600 [html:not(.dark)_&]:ring-sage-500/25
    `,
    primary: `
      bg-ember-500/15 text-ember-400 ring-ember-500/30
      hover:bg-ember-500/25 hover:ring-ember-500/50
      [html:not(.dark)_&]:bg-ember-500/10 [html:not(.dark)_&]:text-ember-600 [html:not(.dark)_&]:ring-ember-500/25
    `,
  };

  // Size variants
  const sizes = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  };

  // Icon sizes
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const disabledClasses = 'opacity-50 cursor-not-allowed pointer-events-none';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel || title}
      className={`
        rounded-full
        transition-all duration-200
        backdrop-blur-sm
        ring-1 ring-inset
        ${variants[variant]}
        ${sizes[size]}
        ${disabled ? disabledClasses : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...props}
    >
      <span className={typeof icon === 'string' ? 'text-lg' : iconSizes[size]}>
        {icon}
      </span>
    </button>
  );
}
