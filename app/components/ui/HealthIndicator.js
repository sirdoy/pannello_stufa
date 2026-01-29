'use client';

import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import { CheckCircle2, AlertTriangle, XCircle, AlertOctagon } from 'lucide-react';

/**
 * HealthIndicator CVA variants for external styling access
 *
 * Provides status-based coloring and size variants.
 */
export const healthIndicatorVariants = cva(
  'inline-flex items-center gap-2 font-display font-medium',
  {
    variants: {
      status: {
        ok: 'text-sage-400 [html:not(.dark)_&]:text-sage-600',
        warning: 'text-warning-400 [html:not(.dark)_&]:text-warning-600',
        error: 'text-danger-400 [html:not(.dark)_&]:text-danger-600',
        critical: 'text-danger-500 [html:not(.dark)_&]:text-danger-700',
      },
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      status: 'ok',
      size: 'md',
    },
  }
);

/**
 * Icon mapping per status (lucide-react)
 */
const iconMap = {
  ok: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  critical: AlertOctagon,
};

/**
 * Icon sizes per component size
 */
const iconSizes = {
  sm: 14,
  md: 16,
  lg: 20,
};

/**
 * Default status labels in Italian
 */
const statusLabels = {
  ok: 'OK',
  warning: 'Attenzione',
  error: 'Errore',
  critical: 'Critico',
};

/**
 * HealthIndicator Component - Ember Noir Design System
 *
 * Displays health status with an appropriate severity icon and text label.
 * Uses CVA for variant styling and lucide-react icons.
 *
 * @param {Object} props - Component props
 * @param {'ok'|'warning'|'error'|'critical'} props.status - Health status
 * @param {'sm'|'md'|'lg'} props.size - Display size
 * @param {string} props.label - Override default label text
 * @param {boolean} props.showIcon - Show status icon (default: true)
 * @param {boolean} props.pulse - Enable pulse animation for critical states (default: false)
 * @param {string} props.className - Additional CSS classes
 *
 * @example
 * <HealthIndicator status="ok" />
 *
 * @example
 * <HealthIndicator status="critical" pulse size="lg" />
 *
 * @example
 * <HealthIndicator status="warning" label="Manutenzione richiesta" />
 */
const HealthIndicator = forwardRef(function HealthIndicator(
  {
    status = 'ok',
    size = 'md',
    label,
    showIcon = true,
    pulse = false,
    className,
    ...props
  },
  ref
) {
  // Get display label (custom or default)
  const displayLabel = label || statusLabels[status] || statusLabels.ok;

  // Get icon component for status
  const IconComponent = iconMap[status] || iconMap.ok;
  const iconSize = iconSizes[size] || iconSizes.md;

  return (
    <span
      ref={ref}
      role="status"
      aria-live="polite"
      className={cn(
        healthIndicatorVariants({ status, size }),
        pulse && 'animate-pulse',
        className
      )}
      {...props}
    >
      {showIcon && (
        <IconComponent
          size={iconSize}
          strokeWidth={2}
          aria-hidden="true"
          className="flex-shrink-0"
        />
      )}
      {displayLabel}
    </span>
  );
});

export default HealthIndicator;
export { HealthIndicator };
