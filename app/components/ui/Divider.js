/**
 * Divider Component
 *
 * Visual separator with optional label and variant styles.
 *
 * @example
 * <Divider label="Modalità" variant="gradient" spacing="large" />
 */
export default function Divider({
  label,
  variant = 'solid',
  spacing = 'medium',
  orientation = 'horizontal',
  className = ''
}) {
  // Spacing classes (margin)
  const spacingClasses = {
    small: orientation === 'horizontal' ? 'my-4' : 'mx-4',      // 16px
    medium: orientation === 'horizontal' ? 'my-6' : 'mx-6',     // 24px
    large: orientation === 'horizontal' ? 'my-8' : 'mx-8',      // 32px
  };

  // Variant classes for the line
  const variantClasses = {
    solid: 'bg-neutral-300 dark:bg-neutral-600',
    dashed: 'border-t-2 border-dashed border-neutral-300 dark:border-neutral-600',
    gradient: 'bg-gradient-to-r from-transparent via-neutral-300/50 dark:via-neutral-600/50 to-transparent',
  };

  if (orientation === 'vertical') {
    return (
      <div className={`${spacingClasses[spacing]} ${className}`.trim()}>
        <div className={`w-px h-full ${variantClasses[variant]}`} />
      </div>
    );
  }

  // Horizontal with optional label
  if (label) {
    return (
      <div className={`relative ${spacingClasses[spacing]} ${className}`.trim()}>
        <div className="absolute inset-0 flex items-center">
          <div className={`w-full h-px ${variantClasses[variant]}`} />
        </div>
        <div className="relative flex justify-center">
          <span className="px-4 py-1.5 bg-white/[0.10] dark:bg-white/[0.05] backdrop-blur-2xl text-neutral-700 dark:text-neutral-300 font-semibold text-xs uppercase tracking-[0.15em] rounded-full shadow-liquid-sm border border-white/20 dark:border-white/10 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/10 dark:before:from-white/5 before:to-transparent before:pointer-events-none">
            <span className="relative z-10">{label}</span>
          </span>
        </div>
      </div>
    );
  }

  // Horizontal without label
  return (
    <div className={`${spacingClasses[spacing]} ${className}`.trim()}>
      <div className={`w-full h-px ${variantClasses[variant]}`} />
    </div>
  );
}
