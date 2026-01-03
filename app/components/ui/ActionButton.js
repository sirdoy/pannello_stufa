/**
 * ActionButton Component
 *
 * Specialized icon buttons for common actions (edit, delete, close, etc.).
 * Consistent styling with liquid glass effect and color variants.
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.icon - Icon component (e.g., <Edit2 />) or emoji
 * @param {'edit'|'delete'|'close'|'info'|'warning'|'success'|'primary'} props.variant - Color variant
 * @param {'sm'|'md'|'lg'} props.size - Button size
 * @param {Function} props.onClick - Click handler
 * @param {string} props.title - Tooltip text (title attribute)
 * @param {string} props.ariaLabel - Accessibility label
 * @param {boolean} props.disabled - Disabled state
 * @param {string} props.className - Additional classes
 */
export default function ActionButton({
  icon,
  variant = 'primary',
  size = 'md',
  onClick,
  title,
  ariaLabel,
  disabled = false,
  className = '',
  ...props
}) {
  // Color variants with liquid glass styling
  const variants = {
    edit: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 dark:hover:bg-blue-500/30 ring-blue-500/30 dark:ring-blue-500/40',
    delete: 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/20 dark:hover:bg-red-500/30 ring-red-500/30 dark:ring-red-500/40',
    close: 'bg-neutral-200/50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-300/50 dark:hover:bg-neutral-700/50 ring-neutral-400/30 dark:ring-neutral-600/30',
    info: 'bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 dark:hover:bg-cyan-500/30 ring-cyan-500/30 dark:ring-cyan-500/40',
    warning: 'bg-warning-500/10 dark:bg-warning-500/20 text-warning-600 dark:text-warning-400 hover:bg-warning-500/20 dark:hover:bg-warning-500/30 ring-warning-500/30 dark:ring-warning-500/40',
    success: 'bg-success-500/10 dark:bg-success-500/20 text-success-600 dark:text-success-400 hover:bg-success-500/20 dark:hover:bg-success-500/30 ring-success-500/30 dark:ring-success-500/40',
    primary: 'bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 hover:bg-primary-500/20 dark:hover:bg-primary-500/30 ring-primary-500/30 dark:ring-primary-500/40',
  };

  // Size variants (padding + icon size container)
  const sizes = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  };

  // Icon sizes (for lucide-react icons)
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
      `}
      {...props}
    >
      {/* Wrapper per gestire sia icone lucide che emoji */}
      <span className={typeof icon === 'string' ? 'text-lg' : iconSizes[size]}>
        {icon}
      </span>
    </button>
  );
}
