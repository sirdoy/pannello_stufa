'use client';

/**
 * Toggle Component - Ember Noir Design System
 *
 * Switch/toggle with warm ember gradient when active.
 * Handles dark/light mode internally.
 *
 * @param {Object} props
 * @param {boolean} props.checked - Toggle state
 * @param {Function} props.onChange - Change handler
 * @param {string} props.label - Accessible label (required for a11y)
 * @param {boolean} props.disabled - Disabled state
 * @param {'sm'|'md'|'lg'} props.size - Size variant
 * @param {'ember'|'ocean'|'sage'} props.variant - Color variant when checked
 * @param {string} props.className - Additional layout classes
 */
export default function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'md',
  variant = 'ember',
  className = ''
}) {
  // Size configuration
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
    },
    lg: {
      container: 'h-10 w-[4.5rem]',
      switch: 'h-9 w-9',
      translate: checked ? 'translate-x-8' : 'translate-x-0.5'
    }
  };

  // Variant colors - Ember Noir palette
  const variantClasses = {
    ember: 'bg-gradient-to-r from-ember-500 to-flame-600',
    ocean: 'bg-gradient-to-r from-ocean-500 to-ocean-600',
    sage: 'bg-gradient-to-r from-sage-500 to-sage-600',
  };

  const currentSize = sizeClasses[size];

  // Off state - dark/light mode
  const offStateClasses = `
    bg-slate-700
    [html:not(.dark)_&]:bg-slate-300
  `;

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
        ${checked ? variantClasses[variant] : offStateClasses}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus:outline-none focus:ring-2 focus:ring-ember-500/50 focus:ring-offset-2
        focus:ring-offset-slate-900 [html:not(.dark)_&]:focus:ring-offset-white
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      <span
        className={`
          ${currentSize.switch}
          ${currentSize.translate}
          inline-block rounded-full
          bg-white shadow-lg
          transition-transform duration-200
        `.trim().replace(/\s+/g, ' ')}
      />
    </button>
  );
}
