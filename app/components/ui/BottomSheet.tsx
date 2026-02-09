'use client';
import { useEffect, useState, type ReactNode } from 'react';
// @ts-expect-error - react-dom types are available but strict mode check fails
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import ActionButton from './ActionButton';
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
  // In test environment, skip mounted check (JSDOM is always client-side)
  // In production, prevent SSR hydration mismatch for portals
  // Check: typeof window !== 'undefined' means we're client-side (browser or JSDOM)
  const [mounted, setMounted] = useState(typeof window !== 'undefined');

  // Client-side only mounting (production)
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
        className="fixed inset-0 bg-slate-950/60 [html:not(.dark)_&]:bg-slate-500/40 backdrop-blur-sm animate-fadeIn"
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
            bg-slate-900/95 [html:not(.dark)_&]:bg-white/95
            backdrop-blur-3xl
            rounded-t-3xl
            shadow-liquid-lg
            border-t border-slate-700/50 [html:not(.dark)_&]:border-slate-200/50
            p-6
            max-h-[85vh] overflow-y-auto
            ${className}
          `}
        >
          {/* Drag Handle */}
          {showHandle && (
            <div className="w-12 h-1.5 bg-slate-600/50 [html:not(.dark)_&]:bg-slate-400/50 rounded-full mx-auto mb-6" />
          )}

          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between mb-6">
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
                  {...({ icon: <X />, variant: "close", size: "md", onClick: onClose, ariaLabel: "Chiudi" } as any)}
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
