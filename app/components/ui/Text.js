/**
 * Text Component
 *
 * Body text with semantic variants for hierarchy.
 *
 * @example
 * <Text variant="secondary">
 *   Description text
 * </Text>
 */
export default function Text({
  variant = 'body',
  children,
  className = ''
}) {
  // Variant classes
  const variantClasses = {
    body: 'text-base text-neutral-900 dark:text-neutral-50',
    secondary: 'text-base text-neutral-600 dark:text-neutral-300',
    tertiary: 'text-sm text-neutral-500 dark:text-neutral-400',
  };

  const classes = `${variantClasses[variant]} ${className}`.trim();

  return <p className={classes}>{children}</p>;
}
