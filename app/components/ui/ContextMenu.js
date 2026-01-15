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
        className="p-2 rounded-lg hover:bg-slate-200/50 [html:not(.dark)_&]:hover:bg-slate-200/50 hover:bg-slate-700/50 transition-colors"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <MoreVertical className="w-5 h-5 text-slate-600 [html:not(.dark)_&]:text-slate-600 text-slate-400" />
      </button>

      {/* Dropdown Menu - Enhanced iOS 18 Liquid Glass */}
      {isOpen && (
        <div className="
          absolute right-0 top-full mt-1 w-48
          bg-white/[0.15] [html:not(.dark)_&]:bg-white/[0.15] bg-white/[0.10]
          backdrop-blur-4xl backdrop-saturate-[1.8] backdrop-brightness-[1.05]
          rounded-xl shadow-liquid-lg
          isolation-isolate
          overflow-hidden animate-scale-in origin-top-right z-50
        ">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => handleItemClick(item)}
              className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors flex items-center gap-3
                ${
                  item.variant === 'danger'
                    ? 'text-danger-600 [html:not(.dark)_&]:text-danger-600 text-danger-400 hover:bg-danger-50 [html:not(.dark)_&]:hover:bg-danger-50 hover:bg-danger-900/20'
                    : 'text-slate-700 [html:not(.dark)_&]:text-slate-700 text-slate-300 hover:bg-slate-100/80 [html:not(.dark)_&]:hover:bg-slate-100/80 hover:bg-slate-700/50'
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
