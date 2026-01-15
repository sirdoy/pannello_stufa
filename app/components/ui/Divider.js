/**
 * Divider Component - Ember Noir Design System
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
    small: orientation === 'horizontal' ? 'my-4' : 'mx-4',
    medium: orientation === 'horizontal' ? 'my-6' : 'mx-6',
    large: orientation === 'horizontal' ? 'my-8' : 'mx-8',
  };

  // Variant classes for the line - Ember Noir palette with light mode
  const variantClasses = {
    solid: 'bg-slate-700 [html:not(.dark)_&]:bg-slate-300',
    dashed: 'border-t-2 border-dashed border-slate-600 [html:not(.dark)_&]:border-slate-300',
    gradient: 'bg-gradient-to-r from-transparent via-slate-600/50 to-transparent [html:not(.dark)_&]:via-slate-300/60',
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
          <span className="
            px-4 py-1.5 backdrop-blur-xl font-semibold font-display text-xs uppercase tracking-[0.15em] rounded-full
            bg-slate-800/80 text-slate-300 border border-slate-700/50
            [html:not(.dark)_&]:bg-white/90 [html:not(.dark)_&]:text-slate-600 [html:not(.dark)_&]:border-slate-200
          ">
            {label}
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
