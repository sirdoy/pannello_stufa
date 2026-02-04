'use client';

import { forwardRef } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import { X } from 'lucide-react';

/**
 * Modal Component - Ember Noir Design System v3.0
 *
 * Built on Radix Dialog primitive with:
 * - Built-in focus trap (Radix handles automatically)
 * - ESC key to close (Radix onEscapeKeyDown)
 * - Backdrop click to close (Radix onPointerDownOutside)
 * - Size variants (sm, md, lg, xl, full)
 * - Centered modal on all screen sizes (desktop and mobile)
 * - Accessible by default (role="dialog", aria-modal, focus management)
 *
 * @example
 * // Basic usage with controlled state
 * <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
 *   <Modal.Header>
 *     <Modal.Title>Confirm Action</Modal.Title>
 *     <Modal.Close />
 *   </Modal.Header>
 *   <p>Content here</p>
 *   <Modal.Footer>
 *     <Button onClick={handleConfirm}>Confirm</Button>
 *   </Modal.Footer>
 * </Modal>
 *
 * @example
 * // Different sizes
 * <Modal isOpen={isOpen} onClose={onClose} size="lg">...</Modal>
 * <Modal isOpen={isOpen} onClose={onClose} size="full">...</Modal>
 */

// CVA variants for overlay
const overlayVariants = cva([
  'fixed inset-0 z-50',
  'bg-slate-950/70 [html:not(.dark)_&]:bg-slate-900/40',
  'backdrop-blur-md',
  'data-[state=open]:animate-fade-in',
  'data-[state=closed]:animate-fade-out',
]);

// CVA variants for content with sizes
const contentVariants = cva(
  [
    'fixed z-50 p-6',
    'bg-slate-900/95 [html:not(.dark)_&]:bg-white/95',
    'backdrop-blur-3xl',
    'border border-slate-700/50 [html:not(.dark)_&]:border-slate-200',
    'shadow-card-elevated',
    'focus:outline-none',
    'overflow-y-auto',
    // Centered on all screen sizes (desktop and mobile)
    'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
    'rounded-3xl max-h-[85vh]',
    // Animation
    'data-[state=open]:animate-scale-in-center',
    'data-[state=closed]:animate-fade-out',
  ],
  {
    variants: {
      size: {
        sm: 'w-full max-w-sm',
        md: 'w-full max-w-md',
        lg: 'w-full max-w-lg',
        xl: 'w-full max-w-xl',
        full: 'w-[95vw] h-[85vh] max-w-none',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

/**
 * Modal Overlay - Background overlay with blur
 */
const ModalOverlay = forwardRef(function ModalOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(overlayVariants(), className)}
      {...props}
    />
  );
});
ModalOverlay.displayName = 'ModalOverlay';

/**
 * Modal Content - Main content container with size variants
 *
 * Includes a VisuallyHidden fallback title for accessibility when
 * Modal.Title is not used by consumers (e.g., when using custom Heading components).
 * This prevents Radix's "DialogContent requires a DialogTitle" console warning.
 */
const ModalContent = forwardRef(function ModalContent(
  { className, size, children, ...props },
  ref
) {
  return (
    <DialogPrimitive.Content
      ref={ref}
      className={cn(contentVariants({ size }), className)}
      {...props}
    >
      {/* Fallback accessible title - hidden from view but available to screen readers */}
      <VisuallyHidden.Root asChild>
        <DialogPrimitive.Title>Dialog</DialogPrimitive.Title>
      </VisuallyHidden.Root>
      {children}
    </DialogPrimitive.Content>
  );
});
ModalContent.displayName = 'ModalContent';

/**
 * Modal Header - Container for title and close button
 */
const ModalHeader = forwardRef(function ModalHeader({ className, children, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-between gap-4 mb-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
ModalHeader.displayName = 'ModalHeader';

/**
 * Modal Title - Accessible title (Radix DialogTitle)
 */
const ModalTitle = forwardRef(function ModalTitle({ className, children, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn(
        'text-xl font-display font-semibold',
        'text-slate-100 [html:not(.dark)_&]:text-slate-900',
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Title>
  );
});
ModalTitle.displayName = 'ModalTitle';

/**
 * Modal Description - Accessible description (Radix DialogDescription)
 */
const ModalDescription = forwardRef(function ModalDescription(
  { className, children, ...props },
  ref
) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn(
        'text-sm text-slate-400 [html:not(.dark)_&]:text-slate-600',
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Description>
  );
});
ModalDescription.displayName = 'ModalDescription';

/**
 * Modal Footer - Container for action buttons
 */
const ModalFooter = forwardRef(function ModalFooter({ className, children, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-end gap-3 mt-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
ModalFooter.displayName = 'ModalFooter';

/**
 * Modal Close - Close button with X icon
 */
const ModalClose = forwardRef(function ModalClose(
  { className, children, ...props },
  ref
) {
  return (
    <DialogPrimitive.Close
      ref={ref}
      className={cn(
        'p-2 rounded-xl',
        'text-slate-400 hover:text-slate-200',
        '[html:not(.dark)_&]:text-slate-500 [html:not(.dark)_&]:hover:text-slate-700',
        'hover:bg-white/[0.06] [html:not(.dark)_&]:hover:bg-black/[0.04]',
        'transition-colors duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/50',
        className
      )}
      aria-label="Close"
      {...props}
    >
      {children || <X className="h-5 w-5" />}
    </DialogPrimitive.Close>
  );
});
ModalClose.displayName = 'ModalClose';

/**
 * Modal - Main component with backwards-compatible API
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Callback when modal should close
 * @param {ReactNode} props.children - Modal content
 * @param {'sm'|'md'|'lg'|'xl'|'full'} props.size - Modal size variant
 * @param {string} props.maxWidth - Legacy: custom max-width class (use size prop instead)
 * @param {string} props.className - Additional classes for content
 */
function Modal({ isOpen, onClose, children, size = 'md', maxWidth, className, closeOnOverlayClick, closeOnEscape, ...props }) {
  // Support legacy maxWidth prop by merging into className
  // This allows existing code using maxWidth="max-w-lg" to continue working
  const mergedClassName = cn(maxWidth, className);
  // Note: closeOnOverlayClick and closeOnEscape are destructured to prevent them from being spread to DOM

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      <DialogPrimitive.Portal>
        <ModalOverlay />
        <ModalContent size={size} className={mergedClassName} {...props}>
          {children}
        </ModalContent>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// Attach namespace components
Modal.Header = ModalHeader;
Modal.Title = ModalTitle;
Modal.Description = ModalDescription;
Modal.Footer = ModalFooter;
Modal.Close = ModalClose;

// Named exports for tree-shaking
export {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose,
};

// Default export for backwards compatibility
export default Modal;
