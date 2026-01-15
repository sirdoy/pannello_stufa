/**
 * Text Component - Ember Noir Design System
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
  // Ember Noir variant classes with light mode support
  const variantClasses = {
    body: 'text-base text-slate-100 [html:not(.dark)_&]:text-slate-900',
    secondary: 'text-base text-slate-300 [html:not(.dark)_&]:text-slate-600',
    tertiary: 'text-sm text-slate-400 [html:not(.dark)_&]:text-slate-500',
  };

  const classes = `${variantClasses[variant]} ${className}`.trim();

  return <p className={classes}>{children}</p>;
}
