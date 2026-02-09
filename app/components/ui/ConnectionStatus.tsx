'use client';

import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * ConnectionStatus CVA variants for external styling access
 *
 * Provides status-based coloring and size variants.
 */
export const connectionStatusVariants = cva(
  'inline-flex items-center gap-2 font-display font-medium',
  {
    variants: {
      status: {
        online: 'text-sage-400 [html:not(.dark)_&]:text-sage-600',
        offline: 'text-slate-400 [html:not(.dark)_&]:text-slate-600',
        connecting: 'text-warning-400 [html:not(.dark)_&]:text-warning-700',
        unknown: 'text-slate-400/70 [html:not(.dark)_&]:text-slate-500',
      },
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      status: 'unknown',
      size: 'md',
    },
  }
);

/**
 * Dot CVA variants for the status indicator dot
 */
export const dotVariants = cva(
  'rounded-full',
  {
    variants: {
      status: {
        online: 'bg-sage-500 [html:not(.dark)_&]:bg-sage-600',
        offline: 'bg-slate-500 [html:not(.dark)_&]:bg-slate-400',
        connecting: 'bg-warning-500 animate-pulse [html:not(.dark)_&]:bg-warning-500',
        unknown: 'bg-slate-400 [html:not(.dark)_&]:bg-slate-400',
      },
      size: {
        sm: 'w-1.5 h-1.5',
        md: 'w-2 h-2',
        lg: 'w-2.5 h-2.5',
      },
    },
    defaultVariants: {
      status: 'unknown',
      size: 'md',
    },
  }
);

/**
 * Default status labels in Italian
 */
const statusLabels: Record<string, string> = {
  online: 'Online',
  offline: 'Offline',
  connecting: 'Connessione...',
  unknown: 'Sconosciuto',
};

/**
 * ConnectionStatus Component - Ember Noir Design System
 *
 * Displays device connection state with a status dot and text label.
 * Uses CVA for variant styling and proper accessibility with aria-live.
 *
 * @example
 * <ConnectionStatus status="online" />
 *
 * @example
 * <ConnectionStatus status="connecting" size="lg" />
 *
 * @example
 * <ConnectionStatus status="offline" label="Dispositivo disconnesso" />
 */
export interface ConnectionStatusProps
  extends ComponentPropsWithoutRef<'span'>,
    VariantProps<typeof connectionStatusVariants> {
  label?: string;
  showDot?: boolean;
}

const ConnectionStatus = forwardRef<HTMLSpanElement, ConnectionStatusProps>(function ConnectionStatus(
  {
    status = 'unknown',
    size = 'md',
    label,
    showDot = true,
    className,
    ...props
  },
  ref
) {
  // Get display label (custom or default)
  const displayLabel = label || statusLabels[status ?? 'unknown'] || statusLabels.unknown;

  return (
    <span
      ref={ref}
      role="status"
      aria-live="polite"
      className={cn(connectionStatusVariants({ status, size }), className)}
      {...props}
    >
      {showDot && (
        <span
          aria-hidden="true"
          className={dotVariants({ status, size })}
        />
      )}
      {displayLabel}
    </span>
  );
});

export default ConnectionStatus;
export { ConnectionStatus };
