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
 * label="Choose mode"
 * options={[
 * { value: 'auto', label: 'Automatic' },
 * { value: 'manual', label: 'Manual' },
 * ]}
 * value={mode}
 * onChange={(e) => setMode(e.target.value)}
 * />
 *
 * @example
 * // Compound component pattern (advanced)
 * <SelectRoot value={mode} onValueChange={setMode}>
 * <SelectTrigger>
 * <SelectValue placeholder="Select..." />
 * </SelectTrigger>
 * <SelectContent>
 * <SelectItem value="auto">Automatic</SelectItem>
 * <SelectItem value="manual">Manual</SelectItem>
 * </SelectContent>
 * </SelectRoot>
 */

// CVA variants for trigger
const selectTriggerVariants = cva(
  [
    // Base styles
    'flex w-full cursor-pointer items-center justify-between rounded-xl font-display font-medium',
    'border-[0.5px] border-white/8 bg-white/6',
    'text-(--text-1) placeholder:text-(--text-2)',
    'transition-colors duration-200',
    // Focus ring
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/50',
    'focus-visible:border-ember-500/60',
    // Hover
    'hover:border-white/14 hover:bg-white/8',
    // Disabled
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        default: '',
        ember: 'data-[state=open]:border-ember-500/60 data-[state=open]:ring-2 data-[state=open]:ring-ember-500/50',
        ocean: 'data-[state=open]:border-ocean-500/60 data-[state=open]:ring-2 data-[state=open]:ring-ocean-500/50',
      },
      size: {
        // Compact trigger for toolbars and dense forms
        sm: 'min-h-9 px-3 py-1.5 text-[13px]',
        md: 'p-4 text-base',
        lg: 'p-5 text-lg',
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
    'relative flex cursor-pointer items-center px-4 py-3 select-none',
    'font-display font-medium transition-colors duration-150',
    'outline-none',
    // Hover/highlighted state
    'rounded-lg data-highlighted:bg-white/8',
    // Disabled state
    'data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-40',
  ],
  {
    variants: {
      variant: {
        default: [
          'text-(--text-1)',
          'data-[state=checked]:bg-ember-500/15 data-[state=checked]:text-ember-300',
        ],
        ember: [
          'text-(--text-1)',
          'data-[state=checked]:bg-ember-500/15 data-[state=checked]:text-ember-300',
        ],
        ocean: [
          'text-(--text-1)',
          'data-[state=checked]:bg-ocean-500/15 data-[state=checked]:text-ocean-300',
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
          'ml-2 shrink-0 text-(--text-2) transition-transform duration-200',
          size === 'sm' ? 'size-4' : 'size-5',
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

export type SelectContentProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>;

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
        // Opaque floating surface
        'border-[0.5px] border-white/8 bg-(--surface-solid) backdrop-blur-xl',
        'shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
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
      <Check className="size-4 text-ember-400" />
    </SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
));
SelectItem.displayName = 'SelectItem';

/**
 * SelectGroup - Group of related items
 */
const SelectGroup = SelectPrimitive.Group;
SelectGroup.displayName = 'SelectGroup';

export type SelectLabelProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>;

/**
 * SelectLabel - Label for a group
 */
const SelectLabel = forwardRef<HTMLDivElement, SelectLabelProps>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      'px-4 py-2 text-sm font-semibold text-(--text-2)',
      className
    )}
    {...props}
  />
));
SelectLabel.displayName = 'SelectLabel';

export type SelectSeparatorProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>;

/**
 * SelectSeparator - Visual separator between items
 */
const SelectSeparator = forwardRef<HTMLDivElement, SelectSeparatorProps>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn(
      '-mx-1 my-1 h-px bg-white/8',
      className
    )}
    {...props}
  />
));
SelectSeparator.displayName = 'SelectSeparator';

export interface SelectProps extends Omit<React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>, 'value' | 'onValueChange'> {
  /** Label text */
  label?: string;
  /** Optional icon shown before the label (emoji string or icon element) */
  icon?: React.ReactNode;
  /** Accessible name for the trigger when no visible label is given */
  'aria-label'?: string;
  /** Trigger size (sm = compact) */
  size?: 'sm' | 'md' | 'lg';
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
  size = 'md',
  'aria-label': ariaLabel,
  searchable = false,
  placeholder = 'Select...',
  className = '',
  containerClassName = '',
  liquid: _liquid = false, // Legacy prop - ignored
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
  const handleValueChange = (newValue: string) => {
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
            'mb-2 flex items-center gap-2 font-display text-sm font-semibold',
            'text-(--text-2)'
          )}
          suppressHydrationWarning
        >
          {icon && <span className="inline-flex shrink-0 items-center" aria-hidden="true">{icon}</span>}
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
          size={size}
          className={className}
          aria-labelledby={label ? labelId : undefined}
          aria-label={label ? undefined : ariaLabel}
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
