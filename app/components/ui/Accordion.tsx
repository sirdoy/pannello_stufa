'use client';

import type React from 'react';
import { forwardRef } from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import { ChevronDown } from 'lucide-react';

/**
 * Accordion Component - Ember Noir Design System v4.0
 *
 * Built on Radix Accordion primitive with:
 * - Single/multiple item expansion modes
 * - Smooth height animation with Radix CSS variables
 * - Rotating chevron indicator
 * - Keyboard navigation (Arrow Up/Down, Home, End, Enter/Space)
 * - Accessible by default (aria-expanded, aria-controls)
 * - 48px minimum touch targets for mobile
 *
 * @example
 * // Single mode (one item open at a time)
 * <Accordion type="single" defaultValue="item-1" collapsible>
 *   <Accordion.Item value="item-1">
 *     <Accordion.Trigger>Is this collapsible?</Accordion.Trigger>
 *     <Accordion.Content>Yes, click trigger to collapse.</Accordion.Content>
 *   </Accordion.Item>
 *   <Accordion.Item value="item-2">
 *     <Accordion.Trigger>Another question?</Accordion.Trigger>
 *     <Accordion.Content>Another answer here.</Accordion.Content>
 *   </Accordion.Item>
 * </Accordion>
 *
 * @example
 * // Multiple mode (multiple items can be open)
 * <Accordion type="multiple" defaultValue={['item-1', 'item-2']}>
 *   <Accordion.Item value="item-1">
 *     <Accordion.Trigger>First section</Accordion.Trigger>
 *     <Accordion.Content>First content</Accordion.Content>
 *   </Accordion.Item>
 *   <Accordion.Item value="item-2">
 *     <Accordion.Trigger>Second section</Accordion.Trigger>
 *     <Accordion.Content>Second content</Accordion.Content>
 *   </Accordion.Item>
 * </Accordion>
 */

// CVA variants for AccordionItem
const itemVariants = cva([
  'border-b border-white/[0.06]',
  '[html:not(.dark)_&]:border-black/[0.06]',
  'last:border-b-0',
]);

// CVA variants for AccordionTrigger
const triggerVariants = cva([
  'group flex w-full items-center justify-between',
  'min-h-[48px] px-4 py-3',
  'font-display font-medium text-sm',
  // Text colors - Ember Noir
  'text-slate-200 [html:not(.dark)_&]:text-slate-900',
  // Hover state
  'hover:text-ember-400 [html:not(.dark)_&]:hover:text-ember-700',
  // Transition
  'transition-colors duration-[var(--duration-fast)]',
  // Focus ring
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/50 focus-visible:ring-inset',
  // Disabled state
  'disabled:pointer-events-none disabled:opacity-50',
]);

// CVA variants for AccordionContent
const contentVariants = cva([
  'overflow-hidden',
  // Text colors - Ember Noir
  'text-slate-400 [html:not(.dark)_&]:text-slate-600',
  'text-sm',
  // Animation based on open/closed state
  'data-[state=open]:animate-accordion-down',
  'data-[state=closed]:animate-accordion-up',
]);

/**
 * AccordionItem - Individual accordion section wrapper
 */
export interface AccordionItemProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> {}

const AccordionItem = forwardRef<React.ElementRef<typeof AccordionPrimitive.Item>, AccordionItemProps>(
  function AccordionItem({ className, children, ...props }, ref) {
    return (
      <AccordionPrimitive.Item
        ref={ref}
        className={cn(itemVariants(), className)}
        {...props}
      >
        {children}
      </AccordionPrimitive.Item>
    );
  }
);
AccordionItem.displayName = 'AccordionItem';

/**
 * AccordionTrigger - Clickable header that toggles content visibility
 *
 * Includes rotating chevron indicator that rotates 180deg when open.
 */
export interface AccordionTriggerProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> {}

const AccordionTrigger = forwardRef<React.ElementRef<typeof AccordionPrimitive.Trigger>, AccordionTriggerProps>(
  function AccordionTrigger({ className, children, ...props }, ref) {
    return (
      <AccordionPrimitive.Header className="flex">
        <AccordionPrimitive.Trigger
          ref={ref}
          className={cn(triggerVariants(), className)}
          {...props}
        >
          {children}
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0',
              'text-slate-400 [html:not(.dark)_&]:text-slate-500',
              // Rotate chevron when open - smooth transition with animation token
              'transition-transform duration-[var(--duration-smooth)]',
              'group-data-[state=open]:rotate-180',
              // Reduced motion support
              'motion-reduce:transition-none'
            )}
            aria-hidden="true"
          />
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
    );
  }
);
AccordionTrigger.displayName = 'AccordionTrigger';

/**
 * AccordionContent - Collapsible content area
 *
 * Uses inner padding div to avoid margin/padding animation issues.
 */
export interface AccordionContentProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> {}

const AccordionContent = forwardRef<React.ElementRef<typeof AccordionPrimitive.Content>, AccordionContentProps>(
  function AccordionContent({ className, children, ...props }, ref) {
    return (
      <AccordionPrimitive.Content
        ref={ref}
        className={cn(contentVariants(), className)}
        {...props}
      >
        {/* Inner div for padding - avoids animation glitches with margin */}
        <div className="px-4 pb-4">
          {children}
        </div>
      </AccordionPrimitive.Content>
    );
  }
);
AccordionContent.displayName = 'AccordionContent';

/**
 * Accordion - Root component with single/multiple modes
 */
export type AccordionProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>;

function Accordion({
  children,
  className,
  ...props
}: AccordionProps) {
  return (
    <AccordionPrimitive.Root
      className={cn('w-full', className)}
      {...props}
    >
      {children}
    </AccordionPrimitive.Root>
  );
}

// Namespace type
type AccordionComponent = typeof Accordion & {
  Item: typeof AccordionItem;
  Trigger: typeof AccordionTrigger;
  Content: typeof AccordionContent;
};

// Attach namespace components
(Accordion as AccordionComponent).Item = AccordionItem;
(Accordion as AccordionComponent).Trigger = AccordionTrigger;
(Accordion as AccordionComponent).Content = AccordionContent;

// Named exports for tree-shaking
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };

// Default export for backwards compatibility
export default Accordion as AccordionComponent;
