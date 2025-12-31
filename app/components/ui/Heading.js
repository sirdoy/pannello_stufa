/**
 * Heading Component
 *
 * Semantic heading (h1-h6) with size and variant options.
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

  // Variant classes
  const variantClasses = {
    default: 'text-neutral-900 dark:text-neutral-50',
    gradient: 'bg-gradient-to-r from-primary-600 to-accent-600 dark:from-primary-300 dark:to-accent-300 bg-clip-text text-transparent',
    subtle: 'text-neutral-700 dark:text-neutral-300',
  };

  const classes = `
    ${sizeClasses[finalSize]}
    ${variantClasses[variant]}
    font-bold
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return <Tag className={classes}>{children}</Tag>;
}
