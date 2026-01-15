/**
 * Heading Component - Ember Noir Design System
 *
 * Semantic heading (h1-h6) with size and variant options.
 * Handles dark/light mode internally.
 *
 * @example
 * <Heading level={1} size="3xl" variant="gradient">
 *   Main Title
 * </Heading>
 */
export default function Heading({
  level = 2,
  size,
  variant = 'default',
  children,
  className = ''
}) {
  const Tag = `h${level}`;

  // Auto-calculate size from level if not provided
  const sizeMapping = {
    1: '3xl',  // 30px-36px
    2: '2xl',  // 24px
    3: 'xl',   // 20px
    4: 'lg',   // 18px
    5: 'md',   // 16px
    6: 'sm',   // 14px
  };

  const finalSize = size || sizeMapping[level] || 'md';

  // Size classes with fluid typography
  const sizeClasses = {
    sm: 'text-sm',                    // 14px
    md: 'text-base',                  // 16px
    lg: 'text-lg',                    // 18px
    xl: 'text-xl sm:text-2xl',        // 20px-24px
    '2xl': 'text-2xl sm:text-3xl',    // 24px-30px
    '3xl': 'text-3xl sm:text-4xl',    // 30px-36px
  };

  // Variant classes - Ember Noir palette with internal dark/light mode handling
  const variantClasses = {
    default: 'text-slate-100 [html:not(.dark)_&]:text-slate-900',
    gradient: 'bg-gradient-to-r from-ember-500 to-flame-600 bg-clip-text text-transparent',
    subtle: 'text-slate-400 [html:not(.dark)_&]:text-slate-600',
  };

  const classes = `
    ${sizeClasses[finalSize]}
    ${variantClasses[variant]}
    font-bold font-display
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return <Tag className={classes}>{children}</Tag>;
}
