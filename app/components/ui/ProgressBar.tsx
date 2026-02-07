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
  leftContent?: ReactNode;
  rightContent?: ReactNode;
  // Legacy prop
  color?: string;
}

/**
 * ProgressBar Component - Ember Noir Design System
 *
 * Reusable progress indicator with gradient support and customizable styling.
 * Used for power/fan indicators, maintenance tracking, and percentage displays.
 * Handles dark/light mode internally.
 *
 * @param {Object} props - Component props
 * @param {number} props.value - Progress value (0-100)
 * @param {string} props.gradient - Custom Tailwind gradient classes
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
  leftContent,
  rightContent,
  className = '',
  // Legacy prop
  color,
  ...props
}: ProgressBarProps) {
  // Map legacy color prop to variant
  const resolvedVariant = color || variant;

  // Ember Noir color variants
  const variantGradients: Record<string, string> = {
    ember: 'from-ember-400 via-ember-500 to-flame-600',
    ocean: 'from-ocean-400 via-ocean-500 to-ocean-600',
    sage: 'from-sage-400 via-sage-500 to-sage-600',
    warning: 'from-warning-400 via-warning-500 to-warning-600',
    danger: 'from-danger-400 via-danger-500 to-danger-600',
    // Legacy mappings
    primary: 'from-ember-400 via-ember-500 to-flame-600',
    success: 'from-sage-400 via-sage-500 to-sage-600',
    info: 'from-ocean-400 via-ocean-500 to-ocean-600',
  };

  // Size variants
  const sizeClasses: Record<string, string> = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const gradientClass = gradient || variantGradients[resolvedVariant] || variantGradients.ember;
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className={className} {...props}>
      {/* Label & Content Row */}
      {(label || leftContent || rightContent) && (
        <div className="flex items-center justify-between mb-2">
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
          relative rounded-full overflow-hidden backdrop-blur-sm
          bg-slate-700/50 [html:not(.dark)_&]:bg-slate-200/60
          ${sizeClasses[size]}
        `.trim().replace(/\s+/g, ' ')}
      >
        <div
          className={`
            absolute inset-y-0 left-0 bg-gradient-to-r ${gradientClass}
            rounded-full shadow-md
            ${animated ? 'transition-all duration-500' : ''}
          `.trim().replace(/\s+/g, ' ')}
          style={{ width: `${clampedValue}%` }}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
