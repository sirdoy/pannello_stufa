'use client';

import type React from 'react';
import { forwardRef, useId } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Select Component - Ember Noir Design System
 *
 * Accessible dropdown select built on Radix UI primitives.
 * Supports both simple API (options array) and compound component pattern.
 *
 * @example
 * // Simple API (backwards compatible)
 * <Select
 *   label="Choose mode"
 *   options={[
 *     { value: 'auto', label: 'Automatic' },
 *     { value: 'manual', label: 'Manual' },
 *   ]}
 *   value={mode}
 *   onChange={(e) => setMode(e.target.value)}
 * />
 *
 * @example
 * // Compound component pattern (advanced)
 * <SelectRoot value={mode} onValueChange={setMode}>
 *   <SelectTrigger>
 *     <SelectValue placeholder="Select..." />
 *   </SelectTrigger>
 *   <SelectContent>
 *     <SelectItem value="auto">Automatic</SelectItem>
 *     <SelectItem value="manual">Manual</SelectItem>
 *   </SelectContent>
 * </SelectRoot>
 */

// CVA variants for trigger
const selectTriggerVariants = cva(
  [
    // Base styles
    'flex items-center justify-between w-full rounded-xl font-medium font-display cursor-pointer',
    'bg-slate-800/60 backdrop-blur-xl border border-slate-700/50',
    'text-slate-100 placeholder:text-slate-500',
    'transition-all duration-200',
    // Focus ring - ember glow
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/50',
    'focus-visible:border-ember-500/60',
    // Hover
    'hover:bg-slate-800/80 hover:border-slate-600/60',
    // Disabled
    'disabled:opacity-50 disabled:cursor-not-allowed',
    // Light mode
    '[html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-slate-300/60',
    '[html:not(.dark)_&]:text-slate-900 [html:not(.dark)_&]:placeholder:text-slate-400',
    '[html:not(.dark)_&]:hover:bg-white/90 [html:not(.dark)_&]:hover:border-slate-400/60',
  ],
  {
    variants: {
      variant: {
        default: '',
        ember: 'data-[state=open]:ring-2 data-[state=open]:ring-ember-500/50 data-[state=open]:border-ember-500/60',
        ocean: 'data-[state=open]:ring-2 data-[state=open]:ring-ocean-500/50 data-[state=open]:border-ocean-500/60',
      },
      size: {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-4 text-base',
        lg: 'px-5 py-5 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// CVA variants for items
const selectItemVariants = cva(
  [
    'relative flex items-center px-4 py-3 cursor-pointer select-none',
    'font-medium font-display transition-colors duration-150',
    'outline-none',
    // Hover/highlighted state
    'data-[highlighted]:bg-slate-700/50',
    '[html:not(.dark)_&]:data-[highlighted]:bg-slate-100',
    // Disabled state
    'data-[disabled]:opacity-40 data-[disabled]:cursor-not-allowed data-[disabled]:pointer-events-none',
  ],
  {
    variants: {
      variant: {
        default: [
          'text-slate-200 [html:not(.dark)_&]:text-slate-700',
          'data-[state=checked]:bg-ember-900/40 data-[state=checked]:text-ember-300',
          '[html:not(.dark)_&]:data-[state=checked]:bg-ember-100/80 [html:not(.dark)_&]:data-[state=checked]:text-ember-700',
        ],
        ember: [
          'text-slate-200 [html:not(.dark)_&]:text-slate-700',
          'data-[state=checked]:bg-ember-900/40 data-[state=checked]:text-ember-300',
          '[html:not(.dark)_&]:data-[state=checked]:bg-ember-100/80 [html:not(.dark)_&]:data-[state=checked]:text-ember-700',
        ],
        ocean: [
          'text-slate-200 [html:not(.dark)_&]:text-slate-700',
          'data-[state=checked]:bg-ocean-900/40 data-[state=checked]:text-ocean-300',
          '[html:not(.dark)_&]:data-[state=checked]:bg-ocean-100/80 [html:not(.dark)_&]:data-[state=checked]:text-ocean-700',
        ],
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

/**
 * SelectRoot - Root component (wraps Radix Select.Root)
 */
const SelectRoot = SelectPrimitive.Root;
SelectRoot.displayName = 'SelectRoot';

export interface SelectTriggerProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>,
    VariantProps<typeof selectTriggerVariants> {}

/**
 * SelectTrigger - Trigger button for the select
 */
const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(({
  className,
  children,
  variant = 'default',
  size = 'md',
  ...props
}, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(selectTriggerVariants({ variant, size }), className)}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown
        className={cn(
          'h-5 w-5 text-slate-400 transition-transform duration-200 shrink-0 ml-2',
          '[html:not(.dark)_&]:text-slate-500'
        )}
      />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = 'SelectTrigger';

/**
 * SelectValue - Display selected value
 */
const SelectValue = SelectPrimitive.Value;
SelectValue.displayName = 'SelectValue';

export interface SelectContentProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> {}

/**
 * SelectContent - Dropdown content container
 */
const SelectContent = forwardRef<HTMLDivElement, SelectContentProps>(({
  className,
  children,
  position = 'popper',
  sideOffset = 4,
  ...props
}, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      sideOffset={sideOffset}
      className={cn(
        // Base styles
        'relative z-50 max-h-64 min-w-32 overflow-hidden rounded-xl',
        // Background and border
        'bg-slate-800/95 backdrop-blur-2xl border border-slate-700/60',
        'shadow-lg',
        // Light mode
        '[html:not(.dark)_&]:bg-white/95 [html:not(.dark)_&]:border-slate-200',
        '[html:not(.dark)_&]:shadow-lg',
        // Animation
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className
      )}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = 'SelectContent';

export interface SelectItemProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>,
    VariantProps<typeof selectItemVariants> {}

/**
 * SelectItem - Individual option item
 */
const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(({
  className,
  children,
  variant = 'default',
  ...props
}, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(selectItemVariants({ variant }), 'pr-10', className)}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <SelectPrimitive.ItemIndicator className="absolute right-3 flex items-center justify-center">
      <Check className="h-4 w-4 text-ember-400 [html:not(.dark)_&]:text-ember-600" />
    </SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
));
SelectItem.displayName = 'SelectItem';

/**
 * SelectGroup - Group of related items
 */
const SelectGroup = SelectPrimitive.Group;
SelectGroup.displayName = 'SelectGroup';

export interface SelectLabelProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label> {}

/**
 * SelectLabel - Label for a group
 */
const SelectLabel = forwardRef<HTMLDivElement, SelectLabelProps>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      'px-4 py-2 text-sm font-semibold text-slate-400',
      '[html:not(.dark)_&]:text-slate-500',
      className
    )}
    {...props}
  />
));
SelectLabel.displayName = 'SelectLabel';

export interface SelectSeparatorProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator> {}

/**
 * SelectSeparator - Visual separator between items
 */
const SelectSeparator = forwardRef<HTMLDivElement, SelectSeparatorProps>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn(
      '-mx-1 my-1 h-px bg-slate-700/50',
      '[html:not(.dark)_&]:bg-slate-200',
      className
    )}
    {...props}
  />
));
SelectSeparator.displayName = 'SelectSeparator';

export interface SelectProps extends Omit<React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>, 'value' | 'onValueChange'> {
  /** Label text */
  label?: string;
  /** Optional emoji icon */
  icon?: string;
  /** Array of {value, label, disabled?} */
  options?: Array<{ value: string | number; label: string; disabled?: boolean }>;
  /** Selected value */
  value?: string | number;
  /** Change handler (receives synthetic event) */
  onChange?: (event: { target: { value: string | number } }) => void;
  /** Color variant */
  variant?: 'default' | 'ember' | 'ocean';
  /** Searchable mode (logs warning, not supported) */
  searchable?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Additional classes for trigger */
  className?: string;
  /** Container classes */
  containerClassName?: string;
  /** Legacy prop - ignored */
  liquid?: boolean;
}

/**
 * Simple Select API - Backwards compatible wrapper
 */
function Select({
  label,
  icon,
  options = [],
  value,
  onChange,
  disabled = false,
  variant = 'default',
  searchable = false,
  placeholder = 'Select...',
  className = '',
  containerClassName = '',
  // eslint-disable-next-line no-unused-vars
  liquid = false, // Legacy prop - ignored
  ...props
}: SelectProps) {
  const labelId = useId();

  // Warn about searchable prop
  if (searchable && typeof console !== 'undefined') {
    console.warn(
      'Select: searchable={true} is not supported with Radix Select. ' +
      'Use Combobox pattern for searchable dropdowns. ' +
      'Radix Select provides built-in typeahead (type first letter to jump to matching option).'
    );
  }

  // Convert value to string for Radix (handles number values)
  const stringValue = value !== undefined && value !== null ? String(value) : undefined;

  // Handle value change - wrap in synthetic event for backwards compatibility
  const handleValueChange = (newValue) => {
    // Find the original value type from options
    const option = options.find(opt => String(opt.value) === newValue);
    const originalValue = option ? option.value : newValue;

    const syntheticEvent = {
      target: { value: originalValue }
    };
    onChange?.(syntheticEvent);
  };

  return (
    <div className={containerClassName} suppressHydrationWarning>
      {label && (
        <label
          id={labelId}
          className={cn(
            'block text-sm font-bold mb-3 font-display',
            'text-slate-300 [html:not(.dark)_&]:text-slate-700'
          )}
          suppressHydrationWarning
        >
          {icon && <span className="mr-2">{icon}</span>}
          {label}
        </label>
      )}

      <SelectRoot
        value={stringValue}
        onValueChange={handleValueChange}
        disabled={disabled}
        {...props}
      >
        <SelectTrigger
          variant={variant as 'default' | 'ember' | 'ocean'}
          className={className}
          aria-labelledby={label ? labelId : undefined}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={String(option.value)}
              disabled={option.disabled}
              variant={variant as 'default' | 'ember' | 'ocean'}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectRoot>
    </div>
  );
}

// Named exports for compound component pattern
export {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
};

// Default export for simple API
export default Select;
