'use client';

import type React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { forwardRef } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

/**
 * Toast variants using CVA
 * Supports success, error, warning, info with Ember Noir styling
 */
const toastVariants = cva(
  [
    'group pointer-events-auto relative flex w-full items-center gap-3',
    'overflow-hidden rounded-2xl p-4 shadow-lg',
    'backdrop-blur-xl',
    'border',
    // Animations
    'data-[state=open]:animate-slide-in-from-right',
    'data-[state=closed]:animate-fade-out',
    'data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x)',
    'data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-transform',
    'data-[swipe=end]:animate-slide-out-to-right',
  ],
  {
    variants: {
      variant: {
        success: [
          'bg-sage-900/90',
          'border-sage-500/30',
          'text-sage-100',
        ],
        error: [
          'bg-danger-900/90',
          'border-danger-500/30',
          'text-danger-100',
        ],
        warning: [
          'bg-warning-900/90',
          'border-warning-500/30',
          'text-warning-100',
        ],
        info: [
          'bg-ocean-900/90',
          'border-ocean-500/30',
          'text-ocean-100',
        ],
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  }
);

/**
 * Icon map for each variant
 */
const variantIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
} as const;

export interface ToastProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root>,
    VariantProps<typeof toastVariants> {
  /** Optional title */
  title?: string;
  /** Toast message */
  children?: React.ReactNode;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Toast Component
 *
 * Notification toast built on Radix Toast primitive.
 * Supports auto-dismiss, manual dismiss, swipe to dismiss, and action buttons.
 *
 * @example
 * // Used via ToastProvider/useToast hook
 * const { success } = useToast();
 * success('Saved!');
 *
 * // With action
 * toast({
 * variant: 'info',
 * message: 'Update available',
 * action: { label: 'Refresh', onClick: () => location.reload() }
 * });
 */
const Toast = forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  ToastProps
>(({ className, variant = 'info', title, children, action, ...props }, ref) => {
  const Icon = variantIcons[variant || 'info'];

    return (
      <ToastPrimitive.Root
        ref={ref}
        className={cn(toastVariants({ variant: variant || 'info' }), className)}
        {...props}
      >
        {/* Icon */}
        <div className="shrink-0">
          <Icon className="size-5" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {title && (
            <ToastPrimitive.Title className="text-sm font-semibold">
              {title}
            </ToastPrimitive.Title>
          )}
          <ToastPrimitive.Description className="text-sm opacity-90">
            {children}
          </ToastPrimitive.Description>
        </div>

        {/* Action button */}
        {action && (
          <ToastPrimitive.Action asChild altText={action.label}>
            <button
              onClick={action.onClick}
              className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-sm
                font-medium transition-colors hover:bg-white/20
                 "
            >
              {action.label}
            </button>
          </ToastPrimitive.Action>
        )}

        {/* Close button */}
        <ToastPrimitive.Close
          className="shrink-0 rounded-lg p-1.5
            transition-colors hover:bg-white/10
            "
          aria-label="Close"
        >
          <X className="size-4" />
        </ToastPrimitive.Close>
      </ToastPrimitive.Root>
    );
  }
);
Toast.displayName = 'Toast';

export type ToastViewportProps = React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>;

/**
 * ToastViewport Component
 *
 * Container for toast notifications, positioned in bottom-right corner.
 * Stacks toasts with newest on top (flex-col-reverse).
 */
function ToastViewport({ className, ...props }: ToastViewportProps) {
  return (
    <ToastPrimitive.Viewport
      className={cn(
        'fixed right-4 bottom-4 z-9999',
        'flex flex-col-reverse gap-2',
        'w-full max-w-sm',
        'outline-none',
        // Mobile: full width with padding
        'max-sm:inset-x-0 max-sm:bottom-0 max-sm:p-4',
        className
      )}
      {...props}
    />
  );
}

export default Toast;
export { Toast, ToastViewport, toastVariants };
