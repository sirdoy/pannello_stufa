'use client';

import { useState, useRef, useEffect } from 'react';

export default function Select({
  label,
  icon,
  options = [],
  value,
  onChange,
  disabled = false,
  className = '',
  containerClassName = '',
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Chiudi dropdown quando clicchi fuori
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

    // Simula evento nativo per compatibilità
    const syntheticEvent = {
      target: { value: option.value }
    };
    onChange?.(syntheticEvent);
    setIsOpen(false);
  };

  return (
    <div className={containerClassName} ref={containerRef}>
      {label && (
        <label className="block text-sm font-bold text-neutral-700 mb-3">
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
          className={`w-full px-4 py-4 pr-12 bg-white border-2 border-neutral-300 rounded-xl text-left text-neutral-900 font-medium cursor-pointer
            hover:border-neutral-400 hover:bg-neutral-50
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200 ${isOpen ? 'ring-2 ring-primary-500 border-transparent' : ''} ${className}`}
          {...props}
        >
          {selectedOption?.label}
        </button>

        {/* Freccia dropdown */}
        <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-[100] w-full mt-2 bg-white/90 backdrop-blur-xl border border-white/40 rounded-xl shadow-glass-lg overflow-hidden animate-dropdown">
            <div className="max-h-64 overflow-y-auto scrollbar-thin">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  disabled={option.disabled}
                  className={`w-full px-4 py-3 text-left font-medium transition-all duration-150
                    ${option.value === value
                      ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500'
                      : 'text-neutral-900 hover:bg-neutral-50 border-l-4 border-transparent'
                    }
                    ${option.disabled
                      ? 'opacity-40 cursor-not-allowed'
                      : 'cursor-pointer active:bg-primary-100'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span>{option.label}</span>
                    {option.value === value && (
                      <span className="text-primary-600">✓</span>
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