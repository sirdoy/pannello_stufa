import type { HTMLAttributes, ReactNode } from 'react';
import Text from './Text';

/**
 * InfoBox Component Props
 */
export interface InfoBoxProps extends HTMLAttributes<HTMLDivElement> {
  /** Emoji string or icon element (e.g. a 18px lucide icon) */
  icon?: ReactNode;
  label: string;
  value: string | number;
  variant?: 'neutral' | 'ember' | 'ocean' | 'sage' | 'warning' | 'danger';
  layout?: 'vertical' | 'horizontal';
}

/**
 * InfoBox Component - Ember Noir Design System
 *
 * Reusable info box with icon, label, and value display.
 * Used in device cards to show summary statistics.
 * Supports vertical (default) and horizontal compact layouts.
 *
 * @param {Object} props
 * @param {ReactNode} props.icon - Optional emoji or icon element
 * @param {string} props.label - Label text (uppercase)
 * @param {string|number} props.value - Value to display
 * @param {'neutral'|'ember'|'ocean'|'sage'|'warning'|'danger'} props.variant - Color variant for value text
 * @param {'vertical'|'horizontal'} props.layout - Layout orientation
 * @param {string} props.className - Additional classes
 */
export default function InfoBox({
  icon,
  label,
  value,
  variant = 'neutral',
  layout: _layout = 'horizontal',
  className = '',
  ...props
}: InfoBoxProps) {
  // Value colours (semantic tints)
  const variantClasses: Record<string, string> = {
    neutral: 'text-(--text-1)',
    ember: 'text-ember-400',
    ocean: 'text-ocean-400',
    sage: 'text-sage-400',
    warning: 'text-warning-400',
    danger: 'text-danger-400',
  };

  // Compact vertical layout optimized for 2-column grid
  return (
    <div className={`
      relative overflow-hidden rounded-2xl
      border-[0.5px] border-white/6
      bg-white/4
      ${className}
    `} {...props}>
      <div className="relative z-10 flex min-h-[90px] flex-col items-center justify-center p-3 sm:p-4">
        {/* Icon */}
        {icon !== undefined && icon !== null && icon !== false && icon !== '' && (
          <span
            aria-hidden="true"
            className={
              typeof icon === 'string'
                ? 'mb-1.5 text-2xl sm:text-3xl'
                : 'mb-2 inline-flex size-5 items-center justify-center text-(--text-2)'
            }
          >
            {icon}
          </span>
        )}

        {/* Label */}
        <Text
          variant="label"
          size="xs"
          as="span"
          className="mb-0.5 text-center"
        >
          {label}
        </Text>

        {/* Value */}
        <span className={`text-center font-display text-lg leading-tight font-bold sm:text-xl ${variantClasses[variant]}`}>
          {value}
        </span>
      </div>
    </div>
  );
}
