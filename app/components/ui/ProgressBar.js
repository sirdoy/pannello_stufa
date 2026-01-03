/**
 * ProgressBar Component
 *
 * Reusable progress indicator with gradient support and customizable styling.
 * Used for power/fan indicators, maintenance tracking, and percentage displays.
 *
 * @param {Object} props - Component props
 * @param {number} props.value - Progress value (0-100)
 * @param {string} props.gradient - Tailwind gradient classes (e.g., 'from-red-400 to-orange-500')
 * @param {string} props.color - Single color variant ('primary'|'success'|'warning'|'danger'|'info')
 * @param {'sm'|'md'|'lg'} props.size - Bar height
 * @param {boolean} props.animated - Enable smooth transitions
 * @param {string} props.label - Optional label above bar
 * @param {ReactNode} props.leftContent - Optional content on left (icon, text)
 * @param {ReactNode} props.rightContent - Optional content on right (value, text)
 * @param {string} props.className - Additional classes for container
 */
export default function ProgressBar({
  value = 0,
  gradient,
  color = 'primary',
  size = 'md',
  animated = true,
  label,
  leftContent,
  rightContent,
  className = '',
}) {
  // Color variants (se non è specificato gradient)
  const colorVariants = {
    primary: 'from-primary-400 via-primary-500 to-primary-600',
    success: 'from-success-400 via-success-500 to-success-600',
    warning: 'from-warning-400 via-warning-500 to-warning-600',
    danger: 'from-red-400 via-red-500 to-red-600',
    info: 'from-cyan-400 via-sky-400 to-indigo-500',
  };

  // Size variants
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const gradientClass = gradient || colorVariants[color];
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className={className}>
      {/* Label & Content Row */}
      {(label || leftContent || rightContent) && (
        <div className="flex items-center justify-between mb-2">
          {/* Left side */}
          {leftContent && <div className="flex items-center gap-2">{leftContent}</div>}
          {label && !leftContent && (
            <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              {label}
            </span>
          )}

          {/* Right side */}
          {rightContent && <div className="flex items-center gap-2">{rightContent}</div>}
        </div>
      )}

      {/* Progress Bar */}
      <div
        className={`relative bg-neutral-200/50 dark:bg-neutral-800/50 rounded-full overflow-hidden backdrop-blur-sm ${sizeClasses[size]}`}
      >
        <div
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${gradientClass} rounded-full shadow-md ${
            animated ? 'transition-all duration-500' : ''
          }`}
          style={{ width: `${clampedValue}%` }}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin="0"
          aria-valuemax="100"
        />
      </div>
    </div>
  );
}
