'use client';

import * as ToastPrimitive from '@radix-ui/react-toast';
import { forwardRef } from 'react';
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
    'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]',
    'data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-transform',
    'data-[swipe=end]:animate-slide-out-to-right',
  ],
  {
    variants: {
      variant: {
        success: [
          'bg-sage-900/90 [html:not(.dark)_&]:bg-sage-50/95',
          'border-sage-500/30',
          'text-sage-100 [html:not(.dark)_&]:text-sage-800',
        ],
        error: [
          'bg-danger-900/90 [html:not(.dark)_&]:bg-danger-50/95',
          'border-danger-500/30',
          'text-danger-100 [html:not(.dark)_&]:text-danger-800',
        ],
        warning: [
          'bg-warning-900/90 [html:not(.dark)_&]:bg-warning-50/95',
          'border-warning-500/30',
          'text-warning-100 [html:not(.dark)_&]:text-warning-800',
        ],
        info: [
          'bg-ocean-900/90 [html:not(.dark)_&]:bg-ocean-50/95',
          'border-ocean-500/30',
          'text-ocean-100 [html:not(.dark)_&]:text-ocean-800',
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
};

/**
 * Toast Component
 *
 * Notification toast built on Radix Toast primitive.
 * Supports auto-dismiss, manual dismiss, swipe to dismiss, and action buttons.
 *
 * @param {Object} props
 * @param {'success'|'error'|'warning'|'info'} props.variant - Toast variant
 * @param {string} [props.title] - Optional title
 * @param {React.ReactNode} props.children - Toast message
 * @param {Object} [props.action] - Optional action button
 * @param {string} props.action.label - Action button label
 * @param {Function} props.action.onClick - Action button handler
 * @param {string} [props.className] - Additional classes
 * @param {boolean} [props.open] - Controlled open state
 * @param {Function} [props.onOpenChange] - Open state change handler
 * @param {number} [props.duration] - Auto-dismiss duration in ms
 *
 * @example
 * // Used via ToastProvider/useToast hook
 * const { success } = useToast();
 * success('Saved!');
 *
 * // With action
 * toast({
 *   variant: 'info',
 *   message: 'Update available',
 *   action: { label: 'Refresh', onClick: () => location.reload() }
 * });
 */
const Toast = forwardRef(
  ({ className, variant = 'info', title, children, action, ...props }, ref) => {
    const Icon = variantIcons[variant];

    return (
      <ToastPrimitive.Root
        ref={ref}
        className={cn(toastVariants({ variant }), className)}
        {...props}
      >
        {/* Icon */}
        <div className="flex-shrink-0">
          <Icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
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
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium
                bg-white/10 hover:bg-white/20 transition-colors
                [html:not(.dark)_&]:bg-black/5 [html:not(.dark)_&]:hover:bg-black/10"
            >
              {action.label}
            </button>
          </ToastPrimitive.Action>
        )}

        {/* Close button */}
        <ToastPrimitive.Close
          className="flex-shrink-0 p-1.5 rounded-lg
            hover:bg-white/10 transition-colors
            [html:not(.dark)_&]:hover:bg-black/5"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </ToastPrimitive.Close>
      </ToastPrimitive.Root>
    );
  }
);
Toast.displayName = 'Toast';

/**
 * ToastViewport Component
 *
 * Container for toast notifications, positioned in bottom-right corner.
 * Stacks toasts with newest on top (flex-col-reverse).
 *
 * @param {Object} props
 * @param {string} [props.className] - Additional classes
 */
function ToastViewport({ className }) {
  return (
    <ToastPrimitive.Viewport
      className={cn(
        'fixed bottom-4 right-4 z-[9999]',
        'flex flex-col-reverse gap-2',
        'w-full max-w-sm',
        'outline-none',
        // Mobile: full width with padding
        'max-sm:bottom-0 max-sm:right-0 max-sm:left-0 max-sm:p-4',
        className
      )}
    />
  );
}

export default Toast;
export { Toast, ToastViewport, toastVariants };
