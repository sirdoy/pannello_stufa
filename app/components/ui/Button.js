export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  liquid = false,
  className = '',
  ...props
}) {
  const baseClasses = 'font-semibold transition-all duration-300 flex items-center justify-center gap-2 rounded-2xl relative overflow-hidden';

  // Liquid glass variants (iOS 26 style)
  const liquidVariants = {
    primary: 'bg-primary-500/10 backdrop-blur-2xl text-primary-600 shadow-liquid-sm ring-1 ring-primary-500/20 ring-inset hover:bg-primary-500/15 hover:shadow-liquid active:scale-[0.98] before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary-400/10 before:to-transparent before:pointer-events-none',
    secondary: 'bg-neutral-500/10 backdrop-blur-2xl text-neutral-700 shadow-liquid-sm ring-1 ring-neutral-400/20 ring-inset hover:bg-neutral-500/15 hover:shadow-liquid active:scale-[0.98] before:absolute before:inset-0 before:bg-gradient-to-br before:from-neutral-300/10 before:to-transparent before:pointer-events-none',
    success: 'bg-success-500/10 backdrop-blur-2xl text-success-700 shadow-liquid-sm ring-1 ring-success-500/20 ring-inset hover:bg-success-500/15 hover:shadow-liquid active:scale-[0.98] before:absolute before:inset-0 before:bg-gradient-to-br before:from-success-400/10 before:to-transparent before:pointer-events-none',
    danger: 'bg-primary-500/10 backdrop-blur-2xl text-primary-600 shadow-liquid-sm ring-1 ring-primary-500/20 ring-inset hover:bg-primary-500/15 hover:shadow-liquid active:scale-[0.98] before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary-400/10 before:to-transparent before:pointer-events-none',
    accent: 'bg-accent-500/10 backdrop-blur-2xl text-accent-700 shadow-liquid-sm ring-1 ring-accent-500/20 ring-inset hover:bg-accent-500/15 hover:shadow-liquid active:scale-[0.98] before:absolute before:inset-0 before:bg-gradient-to-br before:from-accent-400/10 before:to-transparent before:pointer-events-none',
    outline: 'bg-white/[0.08] backdrop-blur-2xl text-neutral-700 shadow-liquid-sm ring-1 ring-neutral-300/30 ring-inset hover:bg-white/[0.12] hover:shadow-liquid active:scale-[0.98] before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none',
    ghost: 'bg-transparent backdrop-blur-sm text-neutral-700 hover:bg-white/[0.08] active:scale-[0.98]',
    glass: 'bg-white/[0.10] backdrop-blur-3xl text-neutral-800 shadow-liquid-sm ring-1 ring-white/20 ring-inset hover:bg-white/[0.15] hover:shadow-liquid active:scale-[0.98] before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/15 before:to-transparent before:pointer-events-none',
  };

  // Solid variants (tradizionali)
  const solidVariants = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-elevated active:scale-95',
    secondary: 'bg-neutral-200 hover:bg-neutral-300 text-neutral-900 shadow-elevated active:scale-95',
    success: 'bg-success-600 hover:bg-success-700 text-white shadow-elevated active:scale-95',
    danger: 'bg-primary-500 hover:bg-primary-600 text-white shadow-elevated active:scale-95',
    accent: 'bg-accent-600 hover:bg-accent-700 text-white shadow-elevated active:scale-95',
    outline: 'ring-2 ring-neutral-300 hover:bg-neutral-50 text-neutral-900 shadow-elevated-sm active:scale-95',
    ghost: 'hover:bg-neutral-100 text-neutral-900 active:scale-95',
    glass: 'bg-white/70 backdrop-blur-xl ring-1 ring-white/40 shadow-glass text-neutral-900 hover:bg-white/80 active:scale-95',
  };

  const variantClasses = liquid ? liquidVariants : solidVariants;

  const sizeClasses = {
    sm: 'px-4 py-2.5 text-sm',
    md: 'px-6 py-3.5 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const disabledClasses = 'bg-neutral-300/50 cursor-not-allowed hover:bg-neutral-300/50 active:scale-100 opacity-50';

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
      {icon && <span className="text-2xl relative z-10">{icon}</span>}
      <span className="relative z-10">{children}</span>
    </button>
  );
}