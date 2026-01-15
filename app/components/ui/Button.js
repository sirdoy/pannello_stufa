/**
 * Button Component - Ember Noir Design System
 *
 * Sophisticated button with warm gradients and smooth interactions.
 * Features multiple variants for different actions and contexts.
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Button text
 * @param {'ember'|'subtle'|'ghost'|'success'|'danger'|'outline'} props.variant - Button style
 * @param {'sm'|'md'|'lg'} props.size - Button size
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.loading - Loading state (shows spinner)
 * @param {string} props.icon - Icon emoji/character
 * @param {'left'|'right'} props.iconPosition - Icon position relative to text
 * @param {boolean} props.fullWidth - Expand to full width
 * @param {boolean} props.iconOnly - Circular icon-only button
 * @param {string} props.className - Additional Tailwind classes
 *
 * @deprecated props.liquid - No longer needed, all buttons have consistent style
 * @deprecated props.variant="primary" - Use variant="ember" instead
 * @deprecated props.variant="secondary" - Use variant="subtle" instead
 */
export default function Button({
  children,
  variant = 'ember',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  iconOnly = false,
  className = '',
  // Legacy props
  liquid = false,
  ...props
}) {
  // Map legacy variants
  let resolvedVariant = variant;
  if (variant === 'primary') resolvedVariant = 'ember';
  if (variant === 'secondary') resolvedVariant = 'subtle';

  // Base styles - shared across all variants
  const baseClasses = `
    font-display font-semibold
    rounded-xl
    transition-all duration-200
    flex items-center justify-center gap-2.5
    relative overflow-hidden
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
    [html:not(.dark)_&]:focus-visible:ring-offset-slate-50
    active:scale-[0.97]
    select-none
  `;

  // Variant styles - Ember Noir aesthetic
  const variantStyles = {
    // Primary action - Warm ember gradient
    ember: `
      bg-gradient-to-br from-ember-500 via-ember-600 to-flame-600
      text-white
      shadow-[0_2px_8px_rgba(237,111,16,0.25),0_1px_2px_rgba(0,0,0,0.1)]
      hover:from-ember-400 hover:via-ember-500 hover:to-flame-500
      hover:shadow-[0_4px_16px_rgba(237,111,16,0.35),0_2px_4px_rgba(0,0,0,0.1)]
      hover:-translate-y-0.5
    `,

    // Secondary action - Subtle glass
    subtle: `
      bg-white/[0.06]
      text-slate-200
      border border-white/[0.08]
      hover:bg-white/[0.1]
      hover:border-white/[0.12]
      hover:-translate-y-0.5
      [html:not(.dark)_&]:bg-black/[0.04]
      [html:not(.dark)_&]:text-slate-700
      [html:not(.dark)_&]:border-black/[0.08]
      [html:not(.dark)_&]:hover:bg-black/[0.06]
      [html:not(.dark)_&]:hover:border-black/[0.12]
    `,

    // Ghost - Transparent with hover
    ghost: `
      bg-transparent
      text-slate-300
      hover:bg-white/[0.06]
      hover:text-slate-100
      [html:not(.dark)_&]:text-slate-600
      [html:not(.dark)_&]:hover:bg-black/[0.04]
      [html:not(.dark)_&]:hover:text-slate-900
    `,

    // Success action - Muted sage green
    success: `
      bg-gradient-to-br from-sage-500 via-sage-600 to-sage-700
      text-white
      shadow-[0_2px_8px_rgba(96,115,96,0.25),0_1px_2px_rgba(0,0,0,0.1)]
      hover:from-sage-400 hover:via-sage-500 hover:to-sage-600
      hover:shadow-[0_4px_16px_rgba(96,115,96,0.35)]
      hover:-translate-y-0.5
    `,

    // Danger action - Red/Flame
    danger: `
      bg-gradient-to-br from-danger-500 via-danger-600 to-danger-700
      text-white
      shadow-[0_2px_8px_rgba(239,68,68,0.25),0_1px_2px_rgba(0,0,0,0.1)]
      hover:from-danger-400 hover:via-danger-500 hover:to-danger-600
      hover:shadow-[0_4px_16px_rgba(239,68,68,0.35)]
      hover:-translate-y-0.5
    `,

    // Ocean - Muted blue for secondary actions
    ocean: `
      bg-gradient-to-br from-ocean-500 via-ocean-600 to-ocean-700
      text-white
      shadow-[0_2px_8px_rgba(67,125,174,0.25),0_1px_2px_rgba(0,0,0,0.1)]
      hover:from-ocean-400 hover:via-ocean-500 hover:to-ocean-600
      hover:shadow-[0_4px_16px_rgba(67,125,174,0.35)]
      hover:-translate-y-0.5
    `,

    // Outline - Border only
    outline: `
      bg-transparent
      text-ember-400
      border-2 border-ember-500/40
      hover:bg-ember-500/10
      hover:border-ember-500/60
      hover:-translate-y-0.5
      [html:not(.dark)_&]:text-ember-600
      [html:not(.dark)_&]:border-ember-500/50
      [html:not(.dark)_&]:hover:bg-ember-500/10
      [html:not(.dark)_&]:hover:border-ember-500/70
    `,
  };

  // Size styles - iOS minimum touch target: 44px
  const sizeStyles = {
    sm: iconOnly
      ? 'p-2.5 min-h-[44px] min-w-[44px] text-sm'
      : 'px-4 py-2.5 min-h-[44px] text-sm',
    md: iconOnly
      ? 'p-3 min-h-[48px] min-w-[48px] text-base'
      : 'px-5 py-3 min-h-[48px] text-base',
    lg: iconOnly
      ? 'p-4 min-h-[56px] min-w-[56px] text-lg'
      : 'px-6 py-4 min-h-[56px] text-lg',
  };

  // Icon size relative to button
  const iconSizeStyles = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  // Disabled state
  const disabledStyles = `
    opacity-50
    cursor-not-allowed
    pointer-events-none
    hover:transform-none
    hover:shadow-none
  `;

  // Width
  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <button
      disabled={disabled || loading}
      className={`
        ${baseClasses}
        ${disabled || loading ? disabledStyles : variantStyles[resolvedVariant]}
        ${sizeStyles[size]}
        ${widthStyles}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...props}
    >
      {/* Loading spinner overlay */}
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center bg-inherit rounded-inherit">
          <svg
            className="animate-spin h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-90"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
      )}

      {/* Button content */}
      <span
        className={`
          flex items-center justify-center gap-2.5
          ${loading ? 'invisible' : ''}
        `.trim()}
      >
        {icon && iconPosition === 'left' && (
          <span className={iconSizeStyles[size]} aria-hidden="true">
            {icon}
          </span>
        )}
        {children && <span>{children}</span>}
        {icon && iconPosition === 'right' && (
          <span className={iconSizeStyles[size]} aria-hidden="true">
            {icon}
          </span>
        )}
      </span>
    </button>
  );
}

/**
 * IconButton - Compact icon-only button
 */
export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  label,
  className = '',
  ...props
}) {
  return (
    <Button
      variant={variant}
      size={size}
      icon={icon}
      iconOnly
      aria-label={label}
      className={`rounded-full ${className}`}
      {...props}
    />
  );
}

/**
 * ButtonGroup - Group of related buttons
 */
export function ButtonGroup({ children, className = '', ...props }) {
  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      role="group"
      {...props}
    >
      {children}
    </div>
  );
}
