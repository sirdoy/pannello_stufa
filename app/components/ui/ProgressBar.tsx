import type { ReactNode, HTMLAttributes } from 'react';
import Text from './Text';

/**
 * ProgressBar Component Props
 */
export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value?: number;
  gradient?: string;
  variant?: 'ember' | 'ocean' | 'sage' | 'warning' | 'danger' | 'primary' | 'success' | 'info';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  label?: string;
  ariaLabel?: string;
  leftContent?: ReactNode;
  rightContent?: ReactNode;
  // Legacy prop
  color?: string;
}

/**
 * ProgressBar Component - Ember Noir Design System
 *
 * Reusable progress indicator with a flat fill.
 * Used for power/fan indicators, maintenance tracking, and percentage displays.
 *
 * @param {Object} props - Component props
 * @param {number} props.value - Progress value (0-100)
 * @param {string} props.gradient - Custom Tailwind fill classes (overrides the variant colour)
 * @param {'ember'|'ocean'|'sage'|'warning'|'danger'} props.variant - Color variant
 * @param {'sm'|'md'|'lg'} props.size - Bar height
 * @param {boolean} props.animated - Enable smooth transitions
 * @param {string} props.label - Optional label above bar
 * @param {ReactNode} props.leftContent - Optional content on left (icon, text)
 * @param {ReactNode} props.rightContent - Optional content on right (value, text)
 * @param {string} props.className - Additional layout classes
 */
export default function ProgressBar({
  value = 0,
  gradient,
  variant = 'ember',
  size = 'md',
  animated = true,
  label,
  ariaLabel,
  leftContent,
  rightContent,
  className = '',
  // Legacy prop
  color,
  ...props
}: ProgressBarProps) {
  // Map legacy color prop to variant
  const resolvedVariant = color || variant;

  // Flat fill per variant
  const variantFills: Record<string, string> = {
    ember: 'bg-(--accent)',
    ocean: 'bg-ocean-400',
    sage: 'bg-sage-400',
    warning: 'bg-warning-400',
    danger: 'bg-danger-400',
    // Legacy mappings
    primary: 'bg-(--accent)',
    success: 'bg-sage-400',
    info: 'bg-ocean-400',
  };

  // Size variants
  const sizeClasses: Record<string, string> = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const fillClass = gradient || variantFills[resolvedVariant] || variantFills.ember;
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className={className} {...props}>
      {/* Label & Content Row */}
      {(label || leftContent || rightContent) && (
        <div className="mb-2 flex items-center justify-between">
          {/* Left side */}
          {leftContent && <div className="flex items-center gap-2">{leftContent}</div>}
          {label && !leftContent && (
            <Text variant="secondary" size="sm" as="span">{label}</Text>
          )}

          {/* Right side */}
          {rightContent && <div className="flex items-center gap-2.5">{rightContent}</div>}
        </div>
      )}

      {/* Progress Bar */}
      <div
        className={`
          relative rounded-full overflow-hidden
          bg-white/8
          ${sizeClasses[size]}
        `.trim().replace(/\s+/g, ' ')}
      >
        <div
          className={`
            absolute inset-y-0 left-0 ${fillClass}
            rounded-full
            ${animated ? 'transition-all duration-500' : ''}
          `.trim().replace(/\s+/g, ' ')}
          style={{ width: `${clampedValue}%` }}
          role="progressbar"
          aria-label={ariaLabel || label || `${clampedValue}%`}
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
