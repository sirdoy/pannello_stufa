'use client';

import { forwardRef } from 'react';
import { Check, Minus } from 'lucide-react';

/**
 * Checkbox Component - Ember Noir Design System
 *
 * A styled checkbox with liquid glass aesthetics and full dark mode support.
 *
 * @param {Object} props
 * @param {boolean} props.checked - Checked state
 * @param {boolean} props.indeterminate - Indeterminate state (overrides checked)
 * @param {Function} props.onChange - Change handler
 * @param {boolean} props.disabled - Disabled state
 * @param {ReactNode} props.label - Optional label text
 * @param {string} props.variant - Color variant: 'primary' | 'sage' | 'ocean' | 'ember' | 'flame'
 * @param {string} props.size - Size: 'sm' | 'md' | 'lg'
 * @param {string} props.className - Additional classes for wrapper
 * @param {string} props.id - Input id (for label association)
 * @param {string} props.name - Input name
 * @param {string} props.value - Input value
 */
const Checkbox = forwardRef(function Checkbox(
  {
    checked = false,
    indeterminate = false,
    onChange,
    disabled = false,
    label,
    variant = 'ocean',
    size = 'md',
    className = '',
    id,
    name,
    value,
    ...props
  },
  ref
) {
  // Size classes
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  // Variant classes - Dark mode first (default), light mode with [html:not(.dark)_&]
  const variantClasses = {
    primary: {
      border: 'border-slate-500 [html:not(.dark)_&]:border-slate-400',
      checked: 'bg-ember-500 border-ember-500 [html:not(.dark)_&]:bg-ember-600 [html:not(.dark)_&]:border-ember-600',
      hover: 'hover:border-ember-400 [html:not(.dark)_&]:hover:border-ember-500',
      focus: 'focus-visible:ring-2 focus-visible:ring-ember-500/50 [html:not(.dark)_&]:focus-visible:ring-ember-600/50',
    },
    sage: {
      border: 'border-slate-500 [html:not(.dark)_&]:border-slate-400',
      checked: 'bg-sage-500 border-sage-500 [html:not(.dark)_&]:bg-sage-600 [html:not(.dark)_&]:border-sage-600',
      hover: 'hover:border-sage-400 [html:not(.dark)_&]:hover:border-sage-500',
      focus: 'focus-visible:ring-2 focus-visible:ring-sage-500/50 [html:not(.dark)_&]:focus-visible:ring-sage-600/50',
    },
    ocean: {
      border: 'border-slate-500 [html:not(.dark)_&]:border-slate-400',
      checked: 'bg-ocean-500 border-ocean-500 [html:not(.dark)_&]:bg-ocean-600 [html:not(.dark)_&]:border-ocean-600',
      hover: 'hover:border-ocean-400 [html:not(.dark)_&]:hover:border-ocean-500',
      focus: 'focus-visible:ring-2 focus-visible:ring-ocean-500/50 [html:not(.dark)_&]:focus-visible:ring-ocean-600/50',
    },
    ember: {
      border: 'border-slate-500 [html:not(.dark)_&]:border-slate-400',
      checked: 'bg-ember-500 border-ember-500 [html:not(.dark)_&]:bg-ember-600 [html:not(.dark)_&]:border-ember-600',
      hover: 'hover:border-ember-400 [html:not(.dark)_&]:hover:border-ember-500',
      focus: 'focus-visible:ring-2 focus-visible:ring-ember-500/50 [html:not(.dark)_&]:focus-visible:ring-ember-600/50',
    },
    flame: {
      border: 'border-slate-500 [html:not(.dark)_&]:border-slate-400',
      checked: 'bg-flame-500 border-flame-500 [html:not(.dark)_&]:bg-flame-600 [html:not(.dark)_&]:border-flame-600',
      hover: 'hover:border-flame-400 [html:not(.dark)_&]:hover:border-flame-500',
      focus: 'focus-visible:ring-2 focus-visible:ring-flame-500/50 [html:not(.dark)_&]:focus-visible:ring-flame-600/50',
    },
  };

  const v = variantClasses[variant] || variantClasses.ocean;
  const isChecked = indeterminate || checked;

  const checkboxClasses = `
    ${sizeClasses[size]}
    appearance-none
    rounded-md
    border-2
    ${isChecked ? v.checked : v.border}
    ${!disabled && v.hover}
    ${v.focus}
    transition-all
    duration-200
    cursor-pointer
    disabled:opacity-50
    disabled:cursor-not-allowed
    flex
    items-center
    justify-center
    outline-none
  `.trim().replace(/\s+/g, ' ');

  const wrapperClasses = `
    inline-flex
    items-center
    gap-2
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const content = (
    <>
      <div className="relative">
        <input
          ref={ref}
          type="checkbox"
          id={id}
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only peer"
          {...props}
        />
        <div className={checkboxClasses}>
          {isChecked && (
            <span className="text-white">
              {indeterminate ? (
                <Minus className={iconSizeClasses[size]} strokeWidth={3} />
              ) : (
                <Check className={iconSizeClasses[size]} strokeWidth={3} />
              )}
            </span>
          )}
        </div>
      </div>
      {label && (
        <label
          htmlFor={id}
          className={`
            text-sm
            font-medium
            text-white
            [html:not(.dark)_&]:text-slate-900
            select-none
            ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          `.trim().replace(/\s+/g, ' ')}
        >
          {label}
        </label>
      )}
    </>
  );

  // If there's a label, wrap in a label element
  if (label) {
    return <div className={wrapperClasses}>{content}</div>;
  }

  // Otherwise, just return the checkbox
  return <div className={wrapperClasses}>{content}</div>;
});

export default Checkbox;
