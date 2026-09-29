'use client';
import { useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import ActionButton, { type ActionButtonProps } from './ActionButton';
import Heading from './Heading';

/**
 * BottomSheet Component
 *
 * Mobile-friendly bottom sheet dialog with backdrop, scroll lock, and animations.
 * Portal-based rendering ensures correct z-index layering.
 */
export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
  title?: string;
  icon?: string;
  showCloseButton?: boolean;
  showHandle?: boolean;
  closeOnBackdrop?: boolean;
  className?: string;
  zIndex?: number;
}

const subscribeNoop = () => () => {};

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
}: BottomSheetProps) {
  // Portals need document.body: false on the server and during hydration (no
  // mismatch), true on the client (JSDOM included) without a setState in an effect
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

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

    const handleEscape = (e: KeyboardEvent) => {
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
        className="animate-fadeIn fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
        style={{ zIndex }}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        className="animate-slide-in-from-bottom fixed inset-x-0 bottom-0"
        style={{ zIndex: zIndex + 1 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
      >
        <div
          className={`
            shadow-liquid-lg 
            max-h-[85vh]
            overflow-y-auto
            rounded-t-3xl
            border-t border-slate-700/50 
            bg-slate-900/95
            p-6 backdrop-blur-3xl
            ${className}
          `}
        >
          {/* Drag Handle */}
          {showHandle && (
            <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-slate-600/50" />
          )}

          {/* Header */}
          {(title || showCloseButton) && (
            <div className="mb-6 flex items-start justify-between">
              {/* Title */}
              {title && (
                <Heading level={2} size="2xl" id="bottom-sheet-title" className="flex items-center gap-2">
                  {icon && <span className="text-2xl">{icon}</span>}
                  {title}
                </Heading>
              )}

              {/* Close Button */}
              {showCloseButton && (
                <ActionButton
                  {...({ icon: <X />, variant: 'ghost', size: 'md', onClick: onClose, ariaLabel: 'Chiudi' } satisfies ActionButtonProps)}
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
