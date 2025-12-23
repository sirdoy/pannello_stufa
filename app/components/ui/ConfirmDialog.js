'use client';

import { useEffect } from 'react';
import Button from './Button';
import Card from './Card';

export default function ConfirmDialog({
  isOpen,
  title = 'Conferma azione',
  message,
  confirmText = 'Conferma',
  cancelText = 'Annulla',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
  icon = '⚠️',
}) {
  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fadeIn"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <Card
        liquid
        className="max-w-md w-full p-6 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">{icon}</div>
          <h2
            id="dialog-title"
            className="text-xl font-bold text-neutral-900 dark:text-white mb-2"
          >
            {title}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">{message}</p>
        </div>

        <div className="flex gap-3">
          <Button
            liquid
            variant="ghost"
            onClick={onCancel}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            liquid
            variant={confirmVariant}
            onClick={onConfirm}
            className="flex-1"
            autoFocus
          >
            {confirmText}
          </Button>
        </div>
      </Card>
    </div>
  );
}
