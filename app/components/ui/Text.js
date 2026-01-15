/**
 * Text Component - Ember Noir Design System
 *
 * Body text with semantic variants for hierarchy.
 * Handles dark/light mode internally - use variants instead of external color classes.
 *
 * @param {Object} props - Component props
 * @param {'body'|'secondary'|'tertiary'|'ember'|'ocean'|'sage'|'warning'|'danger'|'info'|'label'} props.variant - Text style variant
 * @param {'xs'|'sm'|'base'|'lg'} props.size - Font size override (optional)
 * @param {'normal'|'medium'|'semibold'|'bold'|'black'} props.weight - Font weight
 * @param {boolean} props.uppercase - Transform to uppercase
 * @param {boolean} props.tracking - Add letter spacing (tracking-wider)
 * @param {boolean} props.mono - Use monospace font
 * @param {'p'|'span'|'label'|'div'} props.as - HTML element to render
 * @param {ReactNode} props.children - Text content
 * @param {string} props.className - Additional layout/spacing classes (NOT colors)
 *
 * @example
 * // ✅ Correct - use variant and size props
 * <Text variant="secondary" size="sm">Description</Text>
 * <Text variant="tertiary" size="xs" uppercase>Label</Text>
 * <Text variant="ocean" weight="bold">Highlighted</Text>
 *
 * // ❌ Wrong - external color classes
 * <Text className="text-slate-400">Text</Text>
 */
export default function Text({
  variant = 'body',
  size,
  weight,
  uppercase = false,
  tracking = false,
  mono = false,
  as = 'p',
  children,
  className = ''
}) {
  const Tag = as;

  // Ember Noir variant classes with light mode support
  const variantClasses = {
    // Neutral hierarchy
    body: 'text-slate-100 [html:not(.dark)_&]:text-slate-900',
    secondary: 'text-slate-300 [html:not(.dark)_&]:text-slate-600',
    tertiary: 'text-slate-400 [html:not(.dark)_&]:text-slate-500',
    // Accent colors - Ember Noir palette
    ember: 'text-ember-400 [html:not(.dark)_&]:text-ember-600',
    ocean: 'text-ocean-400 [html:not(.dark)_&]:text-ocean-600',
    sage: 'text-sage-400 [html:not(.dark)_&]:text-sage-600',
    warning: 'text-warning-400 [html:not(.dark)_&]:text-warning-600',
    danger: 'text-danger-400 [html:not(.dark)_&]:text-danger-600',
    info: 'text-ocean-400 [html:not(.dark)_&]:text-ocean-600', // alias for ocean
    // Special variants
    label: 'text-slate-400 [html:not(.dark)_&]:text-slate-500 uppercase tracking-wider',
  };

  // Size classes
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  // Weight classes
  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    black: 'font-black',
  };

  // Default sizes per variant (backwards compatibility)
  const defaultSizes = {
    body: 'base',
    secondary: 'base',
    tertiary: 'sm',
    ember: 'base',
    ocean: 'base',
    sage: 'base',
    warning: 'base',
    danger: 'base',
    info: 'base',
    label: 'xs',
  };

  const finalSize = size || defaultSizes[variant] || 'base';

  const classes = [
    sizeClasses[finalSize],
    variantClasses[variant],
    weight ? weightClasses[weight] : '',
    uppercase && !variant.includes('label') ? 'uppercase' : '',
    tracking ? 'tracking-wider' : '',
    mono ? 'font-mono' : '',
    className
  ].filter(Boolean).join(' ').trim();

  return <Tag className={classes}>{children}</Tag>;
}
