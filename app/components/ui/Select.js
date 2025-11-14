'use client';

import { useState, useRef, useEffect } from 'react';

export default function Select({
  label,
  icon,
  options = [],
  value,
  onChange,
  disabled = false,
  liquid = false,
  className = '',
  containerClassName = '',
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Calcola se aprire verso l'alto o verso il basso
  useEffect(() => {
    if (isOpen && containerRef.current && dropdownRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const dropdownHeight = dropdownRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;

      // Spazio disponibile sotto (considerando footer di ~100px)
      const spaceBelow = viewportHeight - containerRect.bottom - 100;

      // Se non c'è spazio sufficiente sotto, apri verso l'alto
      if (spaceBelow < dropdownHeight && containerRect.top > dropdownHeight) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [isOpen]);

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
        <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-3">
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
          className={`w-full px-4 py-4 pr-12 rounded-xl text-left font-medium cursor-pointer
            focus:outline-none
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            ${liquid
              ? `bg-white/[0.08] dark:bg-white/[0.05] backdrop-blur-2xl text-neutral-900 dark:text-neutral-100 shadow-liquid-sm ring-1 ring-white/20 dark:ring-white/10 ring-inset
                 hover:bg-white/[0.12] dark:hover:bg-white/[0.08] hover:shadow-liquid
                 ${isOpen ? 'bg-white/[0.15] dark:bg-white/[0.10] shadow-liquid ring-2 ring-primary-500/30' : ''}`
              : `bg-white dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100
                 hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-700
                 ${isOpen ? 'ring-2 ring-primary-500 dark:ring-primary-400 border-transparent' : ''}`
            }
            ${className}`}
          {...props}
        >
          {selectedOption?.label}
        </button>

        {/* Freccia dropdown */}
        <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500 dark:text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className={`absolute z-[9000] w-full rounded-xl overflow-hidden
              ${openUpward ? 'bottom-full mb-2' : 'top-full mt-2'}
              ${openUpward ? 'animate-dropdown-up' : 'animate-dropdown'}
              ${liquid
                ? 'bg-white/[0.10] dark:bg-white/[0.08] backdrop-blur-3xl shadow-liquid-lg ring-1 ring-white/20 dark:ring-white/10 ring-inset'
                : 'bg-white/90 dark:bg-neutral-800/90 backdrop-blur-xl border border-white/40 dark:border-neutral-600 shadow-glass-lg'
              }`}
          >
            <div className="max-h-64 overflow-y-auto scrollbar-thin">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  disabled={option.disabled}
                  className={`w-full px-4 py-3 text-left font-medium transition-all duration-150
                    ${option.value === value
                      ? liquid
                        ? 'bg-primary-500/10 dark:bg-primary-500/20 text-primary-700 dark:text-primary-400 border-l-4 border-primary-500/50 dark:border-primary-500/70'
                        : 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border-l-4 border-primary-500 dark:border-primary-400'
                      : liquid
                        ? 'text-neutral-900 dark:text-neutral-100 hover:bg-white/[0.08] dark:hover:bg-white/[0.05] border-l-4 border-transparent'
                        : 'text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-700 border-l-4 border-transparent'
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