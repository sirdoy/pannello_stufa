'use client';

import { useState, useRef, useEffect } from 'react';

/**
 * Select Component - Ember Noir Design System
 *
 * Custom dropdown select with dark-first design.
 *
 * @param {Object} props
 * @param {string} props.label - Label text
 * @param {string} props.icon - Optional emoji icon
 * @param {Array} props.options - Array of {value, label, disabled?}
 * @param {string} props.value - Selected value
 * @param {Function} props.onChange - Change handler
 * @param {boolean} props.disabled - Disabled state
 * @param {'default'|'ember'|'ocean'} props.variant - Color variant
 * @param {string} props.className - Additional classes
 * @param {string} props.containerClassName - Container classes
 */
export default function Select({
  label,
  icon,
  options = [],
  value,
  onChange,
  disabled = false,
  variant = 'default',
  liquid = false, // Legacy prop - ignored
  className = '',
  containerClassName = '',
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Calculate if dropdown should open upward
  useEffect(() => {
    if (isOpen && containerRef.current && dropdownRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const dropdownHeight = dropdownRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - containerRect.bottom - 100;

      if (spaceBelow < dropdownHeight && containerRect.top > dropdownHeight) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  const handleSelect = (option) => {
    if (option.disabled) return;

    const syntheticEvent = {
      target: { value: option.value }
    };
    onChange?.(syntheticEvent);
    setIsOpen(false);
  };

  // Variant colors - Ember Noir palette
  const variantColors = {
    default: {
      selected: 'bg-ember-900/40 text-ember-300 border-ember-500/50',
      check: 'text-ember-400',
    },
    ember: {
      selected: 'bg-ember-900/40 text-ember-300 border-ember-500/50',
      check: 'text-ember-400',
    },
    ocean: {
      selected: 'bg-ocean-900/40 text-ocean-300 border-ocean-500/50',
      check: 'text-ocean-400',
    },
  };

  const colors = variantColors[variant] || variantColors.default;

  return (
    <div className={containerClassName} ref={containerRef}>
      {label && (
        <label className="
          block text-sm font-bold mb-3 font-display
          text-slate-300
          [html:not(.dark)_&]:text-slate-700
        ">
          {icon && <span className="mr-2">{icon}</span>}
          {label}
        </label>
      )}

      <div className="relative">
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full px-4 py-4 pr-12 rounded-xl text-left font-medium font-display cursor-pointer
            bg-slate-800/60 backdrop-blur-xl
            border border-slate-700/50
            text-slate-100
            focus:outline-none
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            hover:bg-slate-800/80 hover:border-slate-600/60
            [html:not(.dark)_&]:bg-white/80
            [html:not(.dark)_&]:border-slate-300/60
            [html:not(.dark)_&]:text-slate-900
            [html:not(.dark)_&]:hover:bg-white/90
            [html:not(.dark)_&]:hover:border-slate-400/60
            ${isOpen ? 'ring-2 ring-ember-500/50 border-ember-500/60' : ''}
            ${className}
          `.trim().replace(/\s+/g, ' ')}
          {...props}
        >
          {selectedOption?.label}
        </button>

        {/* Dropdown Arrow */}
        <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 [html:not(.dark)_&]:text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className={`
              absolute z-[9000] w-full rounded-xl overflow-hidden
              ${openUpward ? 'bottom-full mb-2' : 'top-full mt-2'}
              ${openUpward ? 'animate-dropdown-up' : 'animate-dropdown'}
              bg-slate-800/95 backdrop-blur-2xl
              border border-slate-700/60
              shadow-[0_8px_32px_rgba(0,0,0,0.4)]
              [html:not(.dark)_&]:bg-white/95
              [html:not(.dark)_&]:border-slate-200
              [html:not(.dark)_&]:shadow-[0_8px_32px_rgba(0,0,0,0.15)]
            `}
          >
            <div className="max-h-64 overflow-y-auto scrollbar-thin">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  disabled={option.disabled}
                  className={`
                    w-full px-4 py-3 text-left font-medium font-display transition-all duration-150
                    ${option.value === value
                      ? `${colors.selected} border-l-4 [html:not(.dark)_&]:bg-ember-100/80 [html:not(.dark)_&]:text-ember-700`
                      : 'text-slate-200 hover:bg-slate-700/50 border-l-4 border-transparent [html:not(.dark)_&]:text-slate-700 [html:not(.dark)_&]:hover:bg-slate-100'
                    }
                    ${option.disabled
                      ? 'opacity-40 cursor-not-allowed'
                      : 'cursor-pointer'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span>{option.label}</span>
                    {option.value === value && (
                      <span className={`${colors.check} [html:not(.dark)_&]:text-ember-600`}>✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
