'use client';

import { forwardRef } from 'react';
import * as ContextMenuPrimitive from '@radix-ui/react-context-menu';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import { Check } from 'lucide-react';

/**
 * RightClickMenu Component - Ember Noir Design System v4.0
 *
 * Built on Radix Context Menu primitive with:
 * - Right-click trigger on desktop
 * - Automatic viewport collision detection (Radix Portal)
 * - Keyboard navigation (Arrow Up/Down, Home, End, Enter/Space, Escape)
 * - Checkable items for toggle states
 * - Accessible by default (role="menu", aria-haspopup)
 * - Icons required on all items (design system decision)
 *
 * For mobile long-press support, combine with useContextMenuLongPress hook.
 *
 * @example
 * // Basic context menu
 * <RightClickMenu>
 *   <RightClickMenu.Trigger asChild>
 *     <div className="p-4 rounded-xl bg-slate-800">
 *       Right-click me
 *     </div>
 *   </RightClickMenu.Trigger>
 *   <RightClickMenu.Content>
 *     <RightClickMenu.Item icon={<Eye />} onSelect={handleView}>
 *       View Details
 *     </RightClickMenu.Item>
 *     <RightClickMenu.Separator />
 *     <RightClickMenu.CheckboxItem
 *       icon={<Power />}
 *       checked={autoMode}
 *       onCheckedChange={setAutoMode}
 *     >
 *       Auto Mode
 *     </RightClickMenu.CheckboxItem>
 *   </RightClickMenu.Content>
 * </RightClickMenu>
 *
 * @example
 * // With mobile long-press support
 * const { bind, isPressed } = useContextMenuLongPress(openMenu);
 *
 * <RightClickMenu open={isOpen} onOpenChange={setIsOpen}>
 *   <RightClickMenu.Trigger asChild>
 *     <div
 *       {...bind()}
 *       style={{
 *         transform: isPressed ? 'scale(0.95)' : 'scale(1)',
 *         ...longPressPreventSelection
 *       }}
 *     >
 *       Right-click or long-press me
 *     </div>
 *   </RightClickMenu.Trigger>
 *   <RightClickMenu.Content>...</RightClickMenu.Content>
 * </RightClickMenu>
 */

// CVA variants for Content
const contentVariants = cva([
  'z-50 min-w-[180px] p-2',
  // Ember Noir styling
  'bg-slate-900/95 [html:not(.dark)_&]:bg-white/95',
  'backdrop-blur-3xl',
  'rounded-xl',
  'border border-slate-700/50 [html:not(.dark)_&]:border-slate-200',
  'shadow-card-elevated',
  // Animation
  'data-[state=open]:animate-scale-in',
  'data-[state=closed]:animate-fade-out',
  // Overflow
  'overflow-hidden',
]);

// CVA variants for Item
const itemVariants = cva([
  'relative flex items-center gap-3 px-3 py-2 rounded-lg',
  'text-sm font-medium cursor-pointer',
  // Ember Noir colors
  'text-slate-300 [html:not(.dark)_&]:text-slate-700',
  // Hover state
  'hover:bg-slate-700/50 [html:not(.dark)_&]:hover:bg-slate-100',
  // Focus state - keyboard navigation
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/50 focus-visible:ring-inset',
  'data-[highlighted]:bg-slate-700/50 [html:not(.dark)_&]:data-[highlighted]:bg-slate-100',
  // Disabled state
  'data-[disabled]:opacity-50 data-[disabled]:pointer-events-none',
  // Transition
  'transition-colors duration-150',
  // Outline reset
  'outline-none',
]);

// CVA variants for Separator
const separatorVariants = cva([
  'h-px mx-2 my-1',
  'bg-slate-700/50 [html:not(.dark)_&]:bg-slate-200',
]);

// CVA variants for Label
const labelVariants = cva([
  'px-3 py-1.5',
  'text-xs font-semibold uppercase tracking-wider',
  'text-slate-500 [html:not(.dark)_&]:text-slate-400',
]);

// CVA variants for CheckboxItem indicator
const checkboxIndicatorVariants = cva([
  'absolute left-3 top-1/2 -translate-y-1/2',
  'w-4 h-4',
  'flex items-center justify-center',
]);

/**
 * RightClickMenuContent - Menu content container with styling
 */
const RightClickMenuContent = forwardRef(function RightClickMenuContent(
  { className, children, sideOffset = 5, alignOffset = 0, ...props },
  ref
) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        className={cn(contentVariants(), className)}
        {...props}
      >
        {children}
      </ContextMenuPrimitive.Content>
    </ContextMenuPrimitive.Portal>
  );
});
RightClickMenuContent.displayName = 'RightClickMenuContent';

/**
 * RightClickMenuItem - Individual menu item
 *
 * @param {ReactNode} icon - Icon element to display (required per design system)
 * @param {ReactNode} children - Item text content
 * @param {boolean} disabled - Whether item is disabled
 * @param {Function} onSelect - Callback when item is selected
 */
const RightClickMenuItem = forwardRef(function RightClickMenuItem(
  { className, icon, children, ...props },
  ref
) {
  return (
    <ContextMenuPrimitive.Item
      ref={ref}
      className={cn(itemVariants(), className)}
      {...props}
    >
      {icon && (
        <span className="flex-shrink-0 w-4 h-4 text-slate-400 [html:not(.dark)_&]:text-slate-500">
          {icon}
        </span>
      )}
      <span className="flex-1">{children}</span>
    </ContextMenuPrimitive.Item>
  );
});
RightClickMenuItem.displayName = 'RightClickMenuItem';

/**
 * RightClickMenuCheckboxItem - Toggleable menu item
 *
 * @param {ReactNode} icon - Icon element to display
 * @param {boolean} checked - Whether item is checked
 * @param {Function} onCheckedChange - Callback when checked state changes
 */
const RightClickMenuCheckboxItem = forwardRef(function RightClickMenuCheckboxItem(
  { className, icon, children, checked, ...props },
  ref
) {
  return (
    <ContextMenuPrimitive.CheckboxItem
      ref={ref}
      checked={checked}
      className={cn(itemVariants(), 'pl-9', className)}
      {...props}
    >
      <ContextMenuPrimitive.ItemIndicator className={cn(checkboxIndicatorVariants())}>
        <Check className="w-4 h-4 text-ember-500" />
      </ContextMenuPrimitive.ItemIndicator>
      {icon && (
        <span className="flex-shrink-0 w-4 h-4 text-slate-400 [html:not(.dark)_&]:text-slate-500">
          {icon}
        </span>
      )}
      <span className="flex-1">{children}</span>
    </ContextMenuPrimitive.CheckboxItem>
  );
});
RightClickMenuCheckboxItem.displayName = 'RightClickMenuCheckboxItem';

/**
 * RightClickMenuSeparator - Visual separator between items
 */
const RightClickMenuSeparator = forwardRef(function RightClickMenuSeparator(
  { className, ...props },
  ref
) {
  return (
    <ContextMenuPrimitive.Separator
      ref={ref}
      className={cn(separatorVariants(), className)}
      {...props}
    />
  );
});
RightClickMenuSeparator.displayName = 'RightClickMenuSeparator';

/**
 * RightClickMenuLabel - Non-interactive label/header
 */
const RightClickMenuLabel = forwardRef(function RightClickMenuLabel(
  { className, children, ...props },
  ref
) {
  return (
    <ContextMenuPrimitive.Label
      ref={ref}
      className={cn(labelVariants(), className)}
      {...props}
    >
      {children}
    </ContextMenuPrimitive.Label>
  );
});
RightClickMenuLabel.displayName = 'RightClickMenuLabel';

/**
 * RightClickMenuGroup - Group wrapper for related items
 */
const RightClickMenuGroup = forwardRef(function RightClickMenuGroup(
  { className, children, ...props },
  ref
) {
  return (
    <ContextMenuPrimitive.Group
      ref={ref}
      className={className}
      {...props}
    >
      {children}
    </ContextMenuPrimitive.Group>
  );
});
RightClickMenuGroup.displayName = 'RightClickMenuGroup';

/**
 * RightClickMenuTrigger - Element that triggers context menu on right-click
 */
const RightClickMenuTrigger = ContextMenuPrimitive.Trigger;
RightClickMenuTrigger.displayName = 'RightClickMenuTrigger';

/**
 * RightClickMenu - Root component
 *
 * @param {Object} props
 * @param {ReactNode} props.children - Menu content (Trigger and Content)
 * @param {boolean} props.open - Controlled open state
 * @param {Function} props.onOpenChange - Callback when open state changes
 * @param {string} props.dir - Reading direction ('ltr' | 'rtl')
 * @param {boolean} props.modal - Whether menu is modal (default: true)
 */
function RightClickMenu({ children, ...props }) {
  return (
    <ContextMenuPrimitive.Root {...props}>
      {children}
    </ContextMenuPrimitive.Root>
  );
}

// Attach namespace components
RightClickMenu.Trigger = RightClickMenuTrigger;
RightClickMenu.Content = RightClickMenuContent;
RightClickMenu.Item = RightClickMenuItem;
RightClickMenu.CheckboxItem = RightClickMenuCheckboxItem;
RightClickMenu.Separator = RightClickMenuSeparator;
RightClickMenu.Label = RightClickMenuLabel;
RightClickMenu.Group = RightClickMenuGroup;

// Named exports for tree-shaking
export {
  RightClickMenu,
  RightClickMenuTrigger,
  RightClickMenuContent,
  RightClickMenuItem,
  RightClickMenuCheckboxItem,
  RightClickMenuSeparator,
  RightClickMenuLabel,
  RightClickMenuGroup,
};

// Default export
export default RightClickMenu;
