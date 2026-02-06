'use client';

import { forwardRef, useRef, useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

/**
 * ConfirmationDialog Component - Ember Noir Design System v4.0
 *
 * Radix-based confirmation dialog built on Modal foundation with:
 * - Smart focus management (Cancel focused for danger, Confirm for default)
 * - Loading state protection (blocks ESC and backdrop click)
 * - Danger variant with outline styling (not solid red)
 * - Accessible by default (role="dialog", aria-modal, focus management)
 *
 * @example
 * // Destructive action with danger variant
 * <ConfirmationDialog
 *   isOpen={showDelete}
 *   onClose={() => setShowDelete(false)}
 *   onConfirm={handleDelete}
 *   title="Delete device?"
 *   description="This will permanently remove 'Living Room Thermostat'."
 *   confirmLabel="Delete Device"
 *   variant="danger"
 *   loading={isDeleting}
 * />
 *
 * @example
 * // Non-destructive confirmation
 * <ConfirmationDialog
 *   isOpen={showSave}
 *   onClose={() => setShowSave(false)}
 *   onConfirm={handleSave}
 *   title="Save changes?"
 *   description="Your changes will be applied immediately."
 *   confirmLabel="Save"
 * />
 */

// CVA variants for overlay
const overlayVariants = cva([
  'fixed inset-0 z-50',
  'bg-slate-950/70 [html:not(.dark)_&]:bg-slate-900/40',
  'backdrop-blur-md',
  'data-[state=open]:animate-fade-in',
  'data-[state=closed]:animate-fade-out',
]);

// CVA variants for content
const contentVariants = cva([
  'fixed z-50 p-6',
  'bg-slate-900/95 [html:not(.dark)_&]:bg-white/95',
  'backdrop-blur-3xl',
  'border border-slate-700/50 [html:not(.dark)_&]:border-slate-200',
  'shadow-card-elevated',
  'focus:outline-none',
  'overflow-y-auto',
  // Desktop: centered
  'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
  'rounded-3xl max-h-[85vh]',
  // Size: sm for compact dialog
  'w-full max-w-sm',
  // Animation
  'data-[state=open]:animate-scale-in-center',
  'data-[state=closed]:animate-fade-out',
  // Mobile bottom sheet override (max-sm = < 640px)
  'max-sm:left-0 max-sm:right-0 max-sm:bottom-0 max-sm:top-auto',
  'max-sm:translate-x-0 max-sm:translate-y-0',
  'max-sm:rounded-t-3xl max-sm:rounded-b-none',
  'max-sm:max-h-[85vh] max-sm:w-full max-sm:max-w-none',
  'max-sm:data-[state=open]:animate-slide-in-from-bottom',
]);

// CVA for confirm button styling based on variant
const confirmButtonVariants = cva([], {
  variants: {
    variant: {
      default: [],
      danger: [
        // Danger outline style - red outline/ghost, NOT solid red
        'bg-transparent',
        'text-danger-400',
        'border-2 border-danger-500/40',
        'hover:bg-danger-500/10',
        'hover:border-danger-500/60',
        '[html:not(.dark)_&]:text-danger-600',
        '[html:not(.dark)_&]:border-danger-500/50',
        '[html:not(.dark)_&]:hover:bg-danger-500/10',
        '[html:not(.dark)_&]:hover:border-danger-500/70',
      ],
    },
  },
  defaultVariants: { variant: 'default' },
});

/**
 * ConfirmationDialog
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Dialog open state
 * @param {Function} props.onClose - Callback when dialog should close
 * @param {Function} props.onConfirm - Async function called when confirm clicked
 * @param {Function} props.onCancel - Callback when cancel clicked (defaults to onClose)
 * @param {string} props.title - Dialog title (required)
 * @param {string} props.description - Dialog description (required)
 * @param {string} props.confirmLabel - Confirm button label (default: "Confirm")
 * @param {string} props.cancelLabel - Cancel button label (default: "Cancel")
 * @param {'default'|'danger'} props.variant - Dialog variant (default: "default")
 * @param {boolean} props.loading - Loading state (default: false)
 * @param {ReactNode} props.icon - Custom icon (defaults to AlertTriangle for danger)
 */
const ConfirmationDialog = forwardRef(function ConfirmationDialog(
  {
    isOpen,
    onClose,
    onConfirm,
    onCancel,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'default',
    loading = false,
    icon,
    className,
    ...props
  },
  ref
) {
  const cancelButtonRef = useRef(null);
  const confirmButtonRef = useRef(null);

  // Handle cancel action
  const handleCancel = () => {
    if (loading) return;
    if (onCancel) {
      onCancel();
    } else if (onClose) {
      onClose();
    }
  };

  // Handle confirm action
  const handleConfirm = async () => {
    if (loading) return;
    if (onConfirm) {
      await onConfirm();
    }
  };

  // Determine which button to focus based on variant
  // danger: Cancel button (safe default)
  // default: Confirm button
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure dialog is mounted
      const timeoutId = setTimeout(() => {
        if (variant === 'danger' && cancelButtonRef.current) {
          cancelButtonRef.current.focus();
        } else if (confirmButtonRef.current) {
          confirmButtonRef.current.focus();
        }
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, variant]);

  // Determine icon to display
  const displayIcon =
    icon !== undefined
      ? icon
      : variant === 'danger'
        ? <AlertTriangle className="h-6 w-6 text-danger-500" />
        : null;

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => !open && !loading && onClose?.()}
    >
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay className={cn(overlayVariants())} />

        {/* Content */}
        <DialogPrimitive.Content
          ref={ref}
          className={cn(contentVariants(), className)}
          onEscapeKeyDown={(e) => loading && e.preventDefault()}
          onPointerDownOutside={(e) => loading && e.preventDefault()}
          onInteractOutside={(e) => loading && e.preventDefault()}
          {...props}
        >
          {/* Visually hidden title for accessibility when using custom title display */}
          <VisuallyHidden.Root asChild>
            <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
          </VisuallyHidden.Root>

          {/* Header with icon and title */}
          <div className="flex items-start gap-4 mb-4">
            {displayIcon && (
              <div className="flex-shrink-0 mt-0.5">
                {displayIcon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {/* Visible title */}
              <h2
                className={cn(
                  'text-lg font-display font-semibold',
                  'text-slate-100 [html:not(.dark)_&]:text-slate-900'
                )}
              >
                {title}
              </h2>
              {/* Description */}
              <DialogPrimitive.Description
                className={cn(
                  'mt-2 text-sm',
                  'text-slate-400 [html:not(.dark)_&]:text-slate-600'
                )}
              >
                {description}
              </DialogPrimitive.Description>
            </div>
          </div>

          {/* Footer with buttons - Cancel | Confirm order */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <Button
              ref={cancelButtonRef}
              variant="subtle"
              onClick={handleCancel}
              disabled={loading}
              data-testid="confirmation-cancel"
            >
              {cancelLabel}
            </Button>
            <Button
              ref={confirmButtonRef}
              variant={variant === 'danger' ? 'ghost' : 'ember'}
              onClick={handleConfirm}
              loading={loading}
              disabled={loading}
              className={cn(confirmButtonVariants({ variant }))}
              data-testid="confirmation-confirm"
            >
              {confirmLabel}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
});

ConfirmationDialog.displayName = 'ConfirmationDialog';

// Default export
export default ConfirmationDialog;
