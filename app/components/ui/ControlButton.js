'use client';

/**
 * ControlButton - Increment/Decrement control button
 * Used for numeric controls with visual feedback for disabled state
 *
 * @example
 * <ControlButton
 *   type="increment"
 *   variant="info"
 *   onClick={handleIncrement}
 *   disabled={value >= max}
 * />
 */
export default function ControlButton({
  type = 'increment',
  variant = 'info',
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

  // Variant color classes (enabled state)
  const variantClasses = {
    info: 'bg-gradient-to-br from-info-500 to-info-600 hover:from-info-600 hover:to-info-700',
    warning: 'bg-gradient-to-br from-warning-500 to-warning-600 hover:from-warning-600 hover:to-warning-700',
    success: 'bg-gradient-to-br from-success-500 to-success-600 hover:from-success-600 hover:to-success-700',
    danger: 'bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700',
    neutral: 'bg-gradient-to-br from-neutral-500 to-neutral-600 hover:from-neutral-600 hover:to-neutral-700',
  };

  // Symbol based on type
  const symbol = type === 'increment' ? '+' : '−';

  // Base classes
  const baseClasses = `
    rounded-xl font-black
    transition-all duration-200
    shadow-lg
    ${sizeClasses[size]}
  `;

  // State-dependent classes
  const stateClasses = disabled
    ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed opacity-50'
    : `${variantClasses[variant]} text-white hover:shadow-xl active:scale-95 active:shadow-inner`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${stateClasses} ${className}`}
      {...props}
    >
      {symbol}
    </button>
  );
}
