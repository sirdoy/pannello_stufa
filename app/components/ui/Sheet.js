'use client';

import { forwardRef } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import { X } from 'lucide-react';

/**
 * Sheet Component - Ember Noir Design System v4.0
 *
 * Built on Radix Dialog primitive with side-based positioning:
 * - Slides in from configured edge (top, bottom, left, right)
 * - Built-in focus trap (Radix handles automatically)
 * - ESC key to close (Radix onEscapeKeyDown)
 * - Backdrop click to close (Radix onPointerDownOutside)
 * - Size variants (sm, md, lg, auto)
 * - iOS safe area padding for bottom sheet
 * - Accessible by default (role="dialog", aria-modal, focus management)
 *
 * @example
 * // Basic usage with controlled state
 * <Sheet open={open} onOpenChange={setOpen}>
 *   <Sheet.Trigger asChild>
 *     <Button>Open Sheet</Button>
 *   </Sheet.Trigger>
 *   <Sheet.Content side="bottom" size="md">
 *     <Sheet.Header>
 *       <Sheet.Title>Settings</Sheet.Title>
 *       <Sheet.Description>Adjust your preferences</Sheet.Description>
 *     </Sheet.Header>
 *     {content}
 *     <Sheet.Footer>
 *       <Button onClick={() => setOpen(false)}>Done</Button>
 *     </Sheet.Footer>
 *   </Sheet.Content>
 * </Sheet>
 *
 * @example
 * // Different sides
 * <Sheet.Content side="right" size="md">...</Sheet.Content>  // Desktop side panel
 * <Sheet.Content side="bottom" size="lg">...</Sheet.Content> // Mobile bottom sheet
 */

// CVA variants for overlay (same as Modal)
const overlayVariants = cva([
  'fixed inset-0 z-50',
  'bg-slate-950/70 [html:not(.dark)_&]:bg-slate-900/40',
  'backdrop-blur-md',
  'data-[state=open]:animate-fade-in',
  'data-[state=closed]:animate-fade-out',
]);

// CVA variants for content with side positioning
const contentVariants = cva(
  [
    'fixed z-50 p-6',
    'bg-slate-900/95 [html:not(.dark)_&]:bg-white/95',
    'backdrop-blur-3xl',
    'border border-slate-700/50 [html:not(.dark)_&]:border-slate-200',
    'shadow-card-elevated',
    'focus:outline-none',
    'overflow-y-auto',
  ],
  {
    variants: {
      side: {
        top: [
          'inset-x-0 top-0',
          'rounded-b-3xl',
          'max-h-[85vh]',
          'data-[state=open]:animate-slide-down',
          'data-[state=closed]:animate-slide-up',
        ],
        bottom: [
          'inset-x-0 bottom-0',
          'rounded-t-3xl',
          'max-h-[85vh]',
          'pb-safe', // iOS safe area
          'data-[state=open]:animate-slide-in-from-bottom',
          'data-[state=closed]:animate-slide-up',
        ],
        left: [
          'inset-y-0 left-0',
          'h-full rounded-r-3xl',
          'w-3/4',
          'data-[state=open]:animate-fade-in-up',
          'data-[state=closed]:animate-fade-out',
        ],
        right: [
          'inset-y-0 right-0',
          'h-full rounded-l-3xl',
          'w-3/4',
          'data-[state=open]:animate-fade-in-up',
          'data-[state=closed]:animate-fade-out',
        ],
      },
      size: {
        sm: '', // Applied via compound variants
        md: '',
        lg: '',
        auto: 'w-auto',
      },
    },
    compoundVariants: [
      // Left/right side size variants (width)
      { side: 'left', size: 'sm', class: 'max-w-sm' },
      { side: 'left', size: 'md', class: 'max-w-md' },
      { side: 'left', size: 'lg', class: 'max-w-lg' },
      { side: 'right', size: 'sm', class: 'max-w-sm' },
      { side: 'right', size: 'md', class: 'max-w-md' },
      { side: 'right', size: 'lg', class: 'max-w-lg' },
      // Top/bottom use full width, size controls height
      { side: 'top', size: 'sm', class: 'max-h-[30vh]' },
      { side: 'top', size: 'md', class: 'max-h-[50vh]' },
      { side: 'top', size: 'lg', class: 'max-h-[70vh]' },
      { side: 'bottom', size: 'sm', class: 'max-h-[30vh]' },
      { side: 'bottom', size: 'md', class: 'max-h-[50vh]' },
      { side: 'bottom', size: 'lg', class: 'max-h-[70vh]' },
    ],
    defaultVariants: {
      side: 'bottom',
      size: 'md',
    },
  }
);

/**
 * Sheet Overlay - Background overlay with blur
 */
const SheetOverlay = forwardRef(function SheetOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(overlayVariants(), className)}
      {...props}
    />
  );
});
SheetOverlay.displayName = 'SheetOverlay';

/**
 * Sheet Content - Main content container with side variants
 */
const SheetContent = forwardRef(function SheetContent(
  { className, side = 'bottom', size = 'md', showCloseButton = true, children, ...props },
  ref
) {
  return (
    <DialogPrimitive.Portal>
      <SheetOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(contentVariants({ side, size }), className)}
        {...props}
      >
        {showCloseButton && (
          <DialogPrimitive.Close
            className={cn(
              'absolute right-4 top-4 p-2 rounded-xl',
              'text-slate-400 hover:text-slate-200',
              '[html:not(.dark)_&]:text-slate-500 [html:not(.dark)_&]:hover:text-slate-700',
              'hover:bg-white/[0.06] [html:not(.dark)_&]:hover:bg-black/[0.04]',
              'transition-colors duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/50'
            )}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});
SheetContent.displayName = 'SheetContent';

/**
 * Sheet Header - Container for title and description
 */
const SheetHeader = forwardRef(function SheetHeader({ className, children, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-2 mb-4', className)}
      {...props}
    >
      {children}
    </div>
  );
});
SheetHeader.displayName = 'SheetHeader';

/**
 * Sheet Footer - Container for action buttons
 */
const SheetFooter = forwardRef(function SheetFooter({ className, children, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn('flex items-center justify-end gap-3 mt-6', className)}
      {...props}
    >
      {children}
    </div>
  );
});
SheetFooter.displayName = 'SheetFooter';

/**
 * Sheet Title - Accessible title (Radix DialogTitle)
 */
const SheetTitle = forwardRef(function SheetTitle({ className, children, ...props }, ref) {
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
SheetTitle.displayName = 'SheetTitle';

/**
 * Sheet Description - Accessible description (Radix DialogDescription)
 */
const SheetDescription = forwardRef(function SheetDescription(
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
SheetDescription.displayName = 'SheetDescription';

/**
 * Sheet - Main component wrapping DialogRoot
 *
 * @param {Object} props
 * @param {boolean} props.open - Sheet open state (controlled)
 * @param {Function} props.onOpenChange - Callback when open state changes
 * @param {ReactNode} props.children - Sheet content (includes Trigger and Content)
 */
function Sheet({ open, onOpenChange, children, ...props }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} {...props}>
      {children}
    </DialogPrimitive.Root>
  );
}

// Create trigger and close aliases
const SheetTrigger = DialogPrimitive.Trigger;
SheetTrigger.displayName = 'SheetTrigger';

const SheetClose = DialogPrimitive.Close;
SheetClose.displayName = 'SheetClose';

// Attach namespace components
Sheet.Trigger = SheetTrigger;
Sheet.Content = SheetContent;
Sheet.Header = SheetHeader;
Sheet.Footer = SheetFooter;
Sheet.Title = SheetTitle;
Sheet.Description = SheetDescription;
Sheet.Close = SheetClose;

// Named exports for tree-shaking
export {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose,
};

// Default export
export default Sheet;
