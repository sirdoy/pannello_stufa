'use client';

import { forwardRef, useId, useState, useCallback } from 'react';
import * as Label from '@radix-ui/react-label';
import { cva } from 'class-variance-authority';
import { AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Input Component - Ember Noir Design System
 *
 * Enhanced form input with dark-first design, validation states,
 * and optional features (clearable, character count).
 *
 * @param {Object} props
 * @param {string} props.type - Input type (default: 'text')
 * @param {string} props.label - Label text
 * @param {string} props.icon - Optional emoji icon
 * @param {'default'|'error'|'success'} props.variant - Visual variant
 * @param {string} props.error - Error message (triggers error variant)
 * @param {boolean} props.clearable - Show clear button when has value
 * @param {boolean} props.showCount - Show character count (requires maxLength)
 * @param {function} props.validate - Real-time validation function (value) => errorString | null
 * @param {string} props.className - Additional input classes
 * @param {string} props.containerClassName - Container classes
 */

const inputVariants = cva(
  // Base styles
  cn(
    'w-full px-4 py-3 rounded-xl',
    'bg-slate-800/60 backdrop-blur-xl',
    'text-slate-100 placeholder:text-slate-500',
    'font-medium font-display',
    'focus:outline-none focus-visible:ring-2',
    'transition-all duration-200',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    // Light mode base
    '[html:not(.dark)_&]:bg-white/80',
    '[html:not(.dark)_&]:text-slate-900',
    '[html:not(.dark)_&]:placeholder:text-slate-400'
  ),
  {
    variants: {
      variant: {
        default: cn(
          'border border-slate-700/50',
          'focus-visible:ring-ember-500/50 focus-visible:border-ember-500/60',
          '[html:not(.dark)_&]:border-slate-300/60'
        ),
        error: cn(
          'border border-danger-500',
          'focus-visible:ring-danger-500/50 focus-visible:border-danger-500/60'
        ),
        success: cn(
          'border border-sage-500',
          'focus-visible:ring-sage-500/50 focus-visible:border-sage-500/60'
        ),
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Input = forwardRef(function Input(
  {
    type = 'text',
    label,
    icon,
    variant: externalVariant = 'default',
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
  const [validationError, setValidationError] = useState(null);

  // Determine if we need to manage value internally (for clearable, showCount, or validate)
  const needsInternalControl = clearable || showCount || validate;
  const isControlled = controlledValue !== undefined;

  // Track value for clearable and showCount (works for both controlled and uncontrolled)
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const currentValue = isControlled ? controlledValue : internalValue;

  // Determine final error and variant
  const displayError = externalError || validationError;
  const computedVariant = displayError ? 'error' : externalVariant;

  // Handle input changes
  const handleChange = useCallback(
    (e) => {
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
    },
    [isControlled, validate, onChange]
  );

  // Handle clear button click
  const handleClear = useCallback(() => {
    // Create a synthetic event for controlled components
    const syntheticEvent = {
      target: { value: '' },
      currentTarget: { value: '' },
    };

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
  }, [isControlled, validate, onChange]);

  // Determine if we need extra padding for clear button
  const needsClearPadding = clearable && currentValue;

  return (
    <div className={containerClassName}>
      {/* Label using Radix Label for proper association */}
      {label && (
        <Label.Root
          htmlFor={inputId}
          className={cn(
            'block text-sm font-semibold mb-2 font-display',
            'text-slate-300',
            '[html:not(.dark)_&]:text-slate-700'
          )}
        >
          {icon && <span className="mr-1.5">{icon}</span>}
          {label}
        </Label.Root>
      )}

      {/* Input wrapper for positioning clear button */}
      <div className="relative">
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
            inputVariants({ variant: computedVariant }),
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
              'absolute right-3 top-1/2 -translate-y-1/2',
              'p-1 rounded-full',
              'text-slate-400 hover:text-slate-200',
              'hover:bg-slate-700/50',
              'transition-colors duration-150',
              '[html:not(.dark)_&]:text-slate-500',
              '[html:not(.dark)_&]:hover:text-slate-700',
              '[html:not(.dark)_&]:hover:bg-slate-200/50'
            )}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Error message and character count row */}
      <div className="flex justify-between items-start mt-1 min-h-5">
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
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{displayError}</span>
          </div>
        )}

        {/* Character count */}
        {showCount && maxLength && (
          <div
            className={cn(
              'text-sm text-slate-500 ml-auto',
              '[html:not(.dark)_&]:text-slate-400'
            )}
          >
            {currentValue?.length || 0}/{maxLength}
          </div>
        )}
      </div>
    </div>
  );
});

export default Input;
