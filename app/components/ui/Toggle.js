'use client';

/**
 * Toggle - Reusable toggle/switch component with liquid glass style
 *
 * @param {Object} props
 * @param {boolean} props.checked - Toggle state
 * @param {Function} props.onChange - Change handler
 * @param {string} [props.label] - Optional accessible label
 * @param {boolean} [props.disabled=false] - Disabled state
 * @param {'sm'|'md'} [props.size='md'] - Size variant (sm: h-6 w-11, md: h-8 w-14)
 * @param {string} [props.className] - Additional CSS classes
 */
export default function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'md',
  className = ''
}) {
  const sizeClasses = {
    sm: {
      container: 'h-6 w-11',
      switch: 'h-5 w-5',
      translate: checked ? 'translate-x-5' : 'translate-x-0.5'
    },
    md: {
      container: 'h-8 w-14',
      switch: 'h-7 w-7',
      translate: checked ? 'translate-x-6' : 'translate-x-0.5'
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`
        relative inline-flex items-center rounded-full transition-all duration-200
        ${currentSize.container}
        ${checked
          ? 'bg-gradient-to-r from-primary-500 to-accent-500'
          : 'bg-neutral-200 dark:bg-neutral-700'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900
        ${className}
      `}
    >
      <span
        className={`
          ${currentSize.switch}
          ${currentSize.translate}
          inline-block rounded-full
          bg-white dark:bg-neutral-100
          shadow-lg
          transition-transform duration-200
        `}
      />
    </button>
  );
}
