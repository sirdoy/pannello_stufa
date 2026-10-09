'use client';

import type React from 'react';
import { forwardRef, useId, useState, useSyncExternalStore } from 'react';
import * as Label from '@radix-ui/react-label';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Input Component - Ember Noir Design System
 *
 * Enhanced form input with dark-first design, validation states,
 * and optional features (clearable, character count).
 */

const inputVariants = cva(
  // Base styles
  cn(
    'w-full rounded-xl',
    'bg-white/6',
    'text-(--text-1) placeholder:text-(--text-2)',
    'font-display font-medium',
    'focus:outline-none focus-visible:ring-2',
    'transition-colors duration-200',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ),
  {
    variants: {
      variant: {
        default: cn(
          'border-[0.5px] border-white/8',
          'focus-visible:border-ember-500/60 focus-visible:ring-ember-500/50',
        ),
        error: cn(
          'border border-danger-500',
          'focus-visible:border-danger-500/60 focus-visible:ring-danger-500/50'
        ),
        success: cn(
          'border border-sage-500',
          'focus-visible:border-sage-500/60 focus-visible:ring-sage-500/50'
        ),
      },
      size: {
        // Compact field for toolbars and dense forms
        sm: 'min-h-9 px-3 py-1.5 text-[13px]',
        md: 'px-4 py-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  /** Label text */
  label?: string;
  /** Optional icon shown before the label (emoji string or icon element) */
  icon?: React.ReactNode;
  /** Error message (triggers error variant) */
  error?: string;
  /** Helper text (reserved for future use) */
  helperText?: string;
  /** Show clear button when has value */
  clearable?: boolean;
  /** Show character count (requires maxLength) */
  showCount?: boolean;
  /** Real-time validation function */
  validate?: (value: string) => string | null;
  /** Container classes */
  containerClassName?: string;
}

const subscribeNoop = () => () => {};

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    type = 'text',
    label,
    icon,
    variant: externalVariant = 'default',
    size = 'md',
    error: externalError,
    helperText, // Destructure to prevent passing to DOM (not yet implemented, but documented)
    clearable = false,
    showCount = false,
    validate,
    className = '',
    containerClassName = '',
    maxLength,
    value: controlledValue,
    defaultValue,
    onChange,
    id: providedId,
    disabled,
    ...props
  },
  ref
) {
  // Generate unique IDs for accessibility
  const generatedId = useId();
  const inputId = providedId || generatedId;
  const errorId = `${inputId}-error`;

  // Internal state for validation errors
  const [validationError, setValidationError] = useState<string | null>(null);

  // Determine if we need to manage value internally (for clearable, showCount, or validate)
  const needsInternalControl = clearable || showCount || validate;
  const isControlled = controlledValue !== undefined;

  // Track value for clearable and showCount (works for both controlled and uncontrolled)
  const [internalValue, setInternalValue] = useState<string>(
    (defaultValue as string) || ''
  );
  const currentValue = isControlled ? controlledValue : internalValue;

  // Determine final error and variant
  const displayError = externalError || validationError;
  const computedVariant = displayError ? 'error' : externalVariant;

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Update internal state for uncontrolled mode
    if (!isControlled) {
      setInternalValue(newValue);
    }

    // Run validation if provided
    if (validate) {
      const error = validate(newValue);
      setValidationError(error);
    }

    // Call external onChange
    if (onChange) {
      onChange(e);
    }
  };

  // Handle clear button click
  const handleClear = () => {
    // Create a synthetic event for controlled components
    const syntheticEvent = {
      target: { value: '' },
      currentTarget: { value: '' },
    } as React.ChangeEvent<HTMLInputElement>;

    // Update internal state
    if (!isControlled) {
      setInternalValue('');
    }

    // Clear validation error
    if (validate) {
      const error = validate('');
      setValidationError(error);
    }

    // Call external onChange
    if (onChange) {
      onChange(syntheticEvent);
    }
  };

  // Defer input rendering to avoid hydration mismatch from browser extensions
  // (e.g. LastPass injecting data-lastpass-icon-root into the DOM before hydration)
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  // Determine if we need extra padding for clear button
  const needsClearPadding = clearable && currentValue;

  return (
    <div className={containerClassName}>
      {/* Label using Radix Label for proper association */}
      {label && (
        <Label.Root
          htmlFor={inputId}
          className={cn(
            'mb-2 flex items-center gap-1.5 font-display text-sm font-semibold',
            'text-(--text-2)',
          )}
        >
          {icon && <span className="inline-flex shrink-0 items-center" aria-hidden="true">{icon}</span>}
          {label}
        </Label.Root>
      )}

      {/* Input wrapper for positioning clear button */}
      <div className="relative">
        {mounted ? (
          <>
            <input
              ref={ref}
              type={type}
              id={inputId}
              // Use controlled mode if: externally controlled OR we need internal control
              value={isControlled || needsInternalControl ? currentValue : undefined}
              defaultValue={!isControlled && !needsInternalControl ? defaultValue : undefined}
              onChange={handleChange}
              maxLength={maxLength}
              disabled={disabled}
              aria-invalid={displayError ? 'true' : undefined}
              aria-describedby={displayError ? errorId : undefined}
              className={cn(
                inputVariants({ variant: computedVariant, size }),
                needsClearPadding && 'pr-10',
                className
              )}
              {...props}
            />

            {/* Clear button */}
            {clearable && currentValue && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear input"
                className={cn(
                  'absolute top-1/2 right-3 -translate-y-1/2',
                  'rounded-full p-1',
                  'text-(--text-2) hover:text-(--text-1)',
                  'hover:bg-white/8',
                  'transition-colors duration-150',
                )}
              >
                <X className="size-4" />
              </button>
            )}
          </>
        ) : (
          /* SSR placeholder — matches input dimensions to prevent layout shift.
             No <input> tag means password manager extensions cannot inject DOM nodes. */
          <div
            role="presentation"
            className={cn(
              inputVariants({ variant: computedVariant, size }),
              className
            )}
          />
        )}
      </div>

      {/* Error message and character count row (only when there is something to show) */}
      {(displayError || (showCount && maxLength)) && (
      <div className="mt-1 flex min-h-5 items-start justify-between">
        {/* Error message */}
        {displayError && (
          <div
            id={errorId}
            role="alert"
            className={cn(
              'flex items-center gap-1.5',
              'text-sm text-danger-500'
            )}
          >
            <AlertCircle className="size-4 shrink-0" />
            <span>{displayError}</span>
          </div>
        )}

        {/* Character count */}
        {showCount && maxLength && (
          <div
            className={cn(
              'ml-auto text-sm text-(--text-2)',
            )}
          >
            {(currentValue as string)?.length || 0}/{maxLength}
          </div>
        )}
      </div>
      )}
    </div>
  );
});

export default Input;
