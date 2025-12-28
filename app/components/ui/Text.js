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
    body: 'text-base text-neutral-900 dark:text-white',
    secondary: 'text-base text-neutral-600 dark:text-neutral-400',
    tertiary: 'text-sm text-neutral-500 dark:text-neutral-500',
  };

  const classes = `${variantClasses[variant]} ${className}`.trim();

  return <p className={classes}>{children}</p>;
}
