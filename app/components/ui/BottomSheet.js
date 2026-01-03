'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import ActionButton from './ActionButton';

/**
 * BottomSheet Component
 *
 * Mobile-friendly bottom sheet dialog with backdrop, scroll lock, and animations.
 * Portal-based rendering ensures correct z-index layering.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Controls visibility
 * @param {Function} props.onClose - Close handler
 * @param {ReactNode} props.children - Sheet content
 * @param {string} props.title - Optional title header
 * @param {string} props.icon - Optional icon emoji for title
 * @param {boolean} props.showCloseButton - Show close button in header (default: true)
 * @param {boolean} props.showHandle - Show drag handle bar (default: true)
 * @param {boolean} props.closeOnBackdrop - Close when clicking backdrop (default: true)
 * @param {string} props.className - Additional classes for content
 * @param {number} props.zIndex - Base z-index (default: 8999)
 */
export default function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  icon,
  showCloseButton = true,
  showHandle = true,
  closeOnBackdrop = true,
  className = '',
  zIndex = 8999,
}) {
  const [mounted, setMounted] = useState(false);

  // Client-side only mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll lock quando aperto
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const handleBackdropClick = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm animate-fadeIn"
        style={{ zIndex }}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        className="fixed inset-x-0 bottom-0 animate-slide-in-from-bottom"
        style={{ zIndex: zIndex + 1 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
      >
        <div
          className={`
            bg-white/90 dark:bg-neutral-900/90
            backdrop-blur-3xl
            rounded-t-3xl
            shadow-liquid-lg
            border-t border-neutral-300/50 dark:border-neutral-700/50
            p-6
            max-h-[85vh] overflow-y-auto
            ${className}
          `}
        >
          {/* Drag Handle */}
          {showHandle && (
            <div className="w-12 h-1.5 bg-neutral-400/50 dark:bg-neutral-600/50 rounded-full mx-auto mb-6" />
          )}

          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between mb-6">
              {/* Title */}
              {title && (
                <div>
                  <div
                    id="bottom-sheet-title"
                    className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2"
                  >
                    {icon && <span className="text-2xl">{icon}</span>}
                    {title}
                  </div>
                </div>
              )}

              {/* Close Button */}
              {showCloseButton && (
                <ActionButton
                  icon={<X />}
                  variant="close"
                  size="md"
                  onClick={onClose}
                  ariaLabel="Chiudi"
                />
              )}
            </div>
          )}

          {/* Content */}
          {children}
        </div>
      </div>
    </>,
    document.body
  );
}
