'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Modal Component - Ember Noir Design System
 *
 * Centralized modal with:
 * - React Portal (renders at body level)
 * - Scroll lock with position restoration
 * - Backdrop overlay with click-to-close
 * - Escape key to close
 * - Dark-first Ember Noir styling
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Callback to close modal
 * @param {ReactNode} props.children - Modal content
 * @param {string} props.maxWidth - Max width class (default: 'max-w-2xl')
 * @param {boolean} props.closeOnOverlayClick - Close when clicking overlay (default: true)
 * @param {boolean} props.closeOnEscape - Close on Escape key (default: true)
 * @param {string} props.className - Additional classes for the modal container
 */
export default function Modal({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-2xl',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
}) {
  // Store scroll position in ref to preserve it across renders
  const scrollPositionRef = useRef(0);

  // Block body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      scrollPositionRef.current = window.scrollY;

      // Apply scroll lock
      document.body.classList.add('modal-open');
      document.body.style.top = `-${scrollPositionRef.current}px`;
    } else if (scrollPositionRef.current > 0) {
      // Restore scroll position BEFORE removing fixed positioning
      // This prevents any visible scroll jump
      const scrollY = scrollPositionRef.current;

      // Remove scroll lock first
      document.body.classList.remove('modal-open');
      document.body.style.top = '';

      // Restore scroll position instantly (no smooth scrolling)
      // Use simple syntax for maximum browser compatibility
      window.scrollTo(0, scrollY);

      // Reset ref
      scrollPositionRef.current = 0;
    }

    return () => {
      // Cleanup: always restore scroll on unmount
      if (document.body.classList.contains('modal-open')) {
        const scrollY = scrollPositionRef.current;
        document.body.classList.remove('modal-open');
        document.body.style.top = '';
        if (scrollY > 0) {
          window.scrollTo(0, scrollY);
        }
      }
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      aria-modal="true"
      role="dialog"
      onClick={handleOverlayClick}
    >
      {/* Backdrop - Ember Noir dark/light blur */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md [html:not(.dark)_&]:bg-slate-900/40"
        aria-hidden="true"
      />

      {/* Modal content - scrollable with max height */}
      <div
        className={`relative z-10 w-full ${maxWidth} max-h-[90vh] overflow-y-auto ${className}`}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
