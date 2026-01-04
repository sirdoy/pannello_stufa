/**
 * Button Component
 *
 * Versatile button with liquid glass and solid variants, loading states, icon support.
 * Supports accessibility and touch-friendly sizing (min 44px).
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Button text
 * @param {'primary'|'secondary'|'success'|'danger'|'ghost'} props.variant - Button variant
 * @param {'sm'|'md'|'lg'} props.size - Button size
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.loading - Loading state (shows spinner)
 * @param {string} props.icon - Icon emoji/character
 * @param {'left'|'right'} props.iconPosition - Icon position relative to text
 * @param {boolean} props.fullWidth - Expand to full width
 * @param {boolean} props.liquid - Apply liquid glass style
 * @param {boolean} props.iconOnly - Circular icon-only button (reduced padding)
 * @param {string} props.className - Additional Tailwind classes
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  liquid = false,
  iconOnly = false,
  className = '',
  ...props
}) {
  const baseClasses = 'font-semibold transition-all duration-200 flex items-center justify-center gap-2 rounded-3xl relative overflow-hidden transform-gpu will-change-transform';

  // Liquid glass variants (iOS style) - WCAG AAA compliant - 5 core variants
  const liquidVariants = {
    primary: 'bg-primary-500/15 dark:bg-primary-500/25 backdrop-blur-2xl text-primary-700 dark:text-primary-300 shadow-liquid-sm ring-1 ring-primary-500/25 dark:ring-primary-500/35 ring-inset hover:bg-primary-500/20 dark:hover:bg-primary-500/30 hover:shadow-liquid hover:scale-[1.02] active:scale-[0.97] before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary-400/15 dark:before:from-primary-400/25 before:to-transparent before:pointer-events-none',
    secondary: 'bg-neutral-500/15 dark:bg-neutral-400/15 backdrop-blur-2xl text-neutral-800 dark:text-neutral-200 shadow-liquid-sm ring-1 ring-neutral-400/25 dark:ring-neutral-500/25 ring-inset hover:bg-neutral-500/20 dark:hover:bg-neutral-400/20 hover:shadow-liquid hover:scale-[1.02] active:scale-[0.97] before:absolute before:inset-0 before:bg-gradient-to-br before:from-neutral-300/15 dark:before:from-neutral-400/15 before:to-transparent before:pointer-events-none',
    success: 'bg-success-500/15 dark:bg-success-500/25 backdrop-blur-2xl text-success-800 dark:text-success-300 shadow-liquid-sm ring-1 ring-success-500/25 dark:ring-success-500/35 ring-inset hover:bg-success-500/20 dark:hover:bg-success-500/30 hover:shadow-liquid hover:scale-[1.02] active:scale-[0.97] before:absolute before:inset-0 before:bg-gradient-to-br before:from-success-400/15 dark:before:from-success-400/25 before:to-transparent before:pointer-events-none',
    danger: 'bg-primary-500/15 dark:bg-primary-500/25 backdrop-blur-2xl text-primary-700 dark:text-primary-300 shadow-liquid-sm ring-1 ring-primary-500/25 dark:ring-primary-500/35 ring-inset hover:bg-primary-500/20 dark:hover:bg-primary-500/30 hover:shadow-liquid hover:scale-[1.02] active:scale-[0.97] before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary-400/15 dark:before:from-primary-400/25 before:to-transparent before:pointer-events-none',
    ghost: 'bg-transparent backdrop-blur-sm text-neutral-800 dark:text-neutral-200 hover:bg-white/[0.12] dark:hover:bg-white/[0.08] hover:scale-[1.02] active:scale-[0.97]',
  };

  // Solid variants (tradizionali) - 5 core variants
  const solidVariants = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-elevated hover:scale-[1.02] active:scale-95',
    secondary: 'bg-neutral-200 hover:bg-neutral-300 text-neutral-900 shadow-elevated hover:scale-[1.02] active:scale-95',
    success: 'bg-success-600 hover:bg-success-700 text-white shadow-elevated hover:scale-[1.02] active:scale-95',
    danger: 'bg-primary-500 hover:bg-primary-600 text-white shadow-elevated hover:scale-[1.02] active:scale-95',
    ghost: 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-100 hover:scale-[1.02] active:scale-95',
  };

  const variantClasses = liquid ? liquidVariants : solidVariants;

  // iOS minimum touch target: 44px
  // Normal buttons (with text)
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm min-h-[44px]',
    md: 'px-6 py-3 text-base min-h-[44px]',
    lg: 'px-8 py-4 text-lg min-h-[52px]',
  };

  // Icon-only buttons (circular, reduced padding)
  const iconOnlySizeClasses = {
    sm: 'p-2.5 text-sm min-h-[44px] min-w-[44px]',
    md: 'p-3 text-base min-h-[44px] min-w-[44px]',
    lg: 'p-4 text-lg min-h-[52px] min-w-[52px]',
  };

  // Icon sizes relative to button size
  const iconSizeClasses = {
    sm: 'text-lg', // 18px
    md: 'text-xl', // 20px
    lg: 'text-2xl', // 24px
  };

  const disabledClasses = 'bg-neutral-300/50 dark:bg-neutral-700/50 cursor-not-allowed hover:bg-neutral-300/50 dark:hover:bg-neutral-700/50 active:scale-100 opacity-50';

  // Select appropriate size classes
  const appliedSizeClasses = iconOnly ? iconOnlySizeClasses[size] : sizeClasses[size];

  return (
    <button
      disabled={disabled || loading}
      className={`
        ${baseClasses}
        ${disabled || loading ? disabledClasses : variantClasses[variant]}
        ${appliedSizeClasses}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
      )}
      <span className={`flex items-center justify-center gap-2.5 ${loading ? 'invisible' : ''}`}>
        {icon && iconPosition === 'left' && (
          <span className={`${iconSizeClasses[size]} relative z-10`}>{icon}</span>
        )}
        {children && <span className="relative z-10">{children}</span>}
        {icon && iconPosition === 'right' && (
          <span className={`${iconSizeClasses[size]} relative z-10`}>{icon}</span>
        )}
      </span>
    </button>
  );
}