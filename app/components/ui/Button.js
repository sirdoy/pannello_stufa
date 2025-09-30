export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  className = '',
  ...props
}) {
  const baseClasses = 'font-semibold shadow-card transition-all duration-200 flex items-center justify-center gap-2 rounded-2xl';

  const variantClasses = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white active:scale-95',
    secondary: 'bg-neutral-200 hover:bg-neutral-300 text-neutral-900 active:scale-95',
    success: 'bg-success-600 hover:bg-success-700 text-white active:scale-95',
    danger: 'bg-primary-500 hover:bg-primary-600 text-white active:scale-95',
    accent: 'bg-accent-600 hover:bg-accent-700 text-white active:scale-95',
    outline: 'border-2 border-neutral-300 hover:bg-neutral-50 text-neutral-900 active:scale-95',
    ghost: 'hover:bg-neutral-100 text-neutral-900 active:scale-95',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
  };

  const disabledClasses = 'bg-neutral-300 cursor-not-allowed hover:bg-neutral-300 active:scale-100';

  return (
    <button
      disabled={disabled || loading}
      className={`
        ${baseClasses}
        ${disabled || loading ? disabledClasses : variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {icon && <span className="text-2xl">{icon}</span>}
      {children}
    </button>
  );
}