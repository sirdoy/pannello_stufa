'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

/**
 * ContextMenu Component
 *
 * Dropdown menu with icon button trigger.
 * Follows existing dropdown patterns for click-outside handling.
 *
 * @param {Array} items - Menu items [{label, icon, onClick, variant}]
 * @param {string} ariaLabel - Accessible label for the trigger button
 */
export default function ContextMenu({ items = [], ariaLabel = 'Menu' }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  function handleItemClick(item) {
    item.onClick();
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent parent element click (e.g., scene card)
          setIsOpen(!isOpen);
        }}
        className="p-2 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50 transition-colors"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <MoreVertical className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-2xl rounded-xl shadow-liquid-lg ring-1 ring-neutral-300/40 dark:ring-neutral-600/40 overflow-hidden animate-scale-in origin-top-right z-50">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => handleItemClick(item)}
              className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors flex items-center gap-3
                ${
                  item.variant === 'danger'
                    ? 'text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/80 dark:hover:bg-neutral-700/50'
                }
              `}
            >
              {item.icon && <span className="text-lg">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
