'use client';

import type React from 'react';
import { useEffect } from 'react';
import Button from './Button';
import Card from './Card';
import Heading from './Heading';
import Text from './Text';

/**
 * @deprecated Use ConfirmationDialog instead.
 * This component will be removed in a future version.
 * Migration: Replace ConfirmDialog with ConfirmationDialog from '@/app/components/ui'
 *
 * Old API: <ConfirmDialog isOpen onConfirm onCancel title message />
 * New API: <ConfirmationDialog isOpen onClose onConfirm title description />
 *
 * Key differences:
 * - onCancel -> onClose
 * - message -> description
 * - confirmVariant -> variant ("danger" | "default")
 * - Smart focus management (Cancel focused for danger, Confirm for default)
 * - Loading state protection (blocks ESC and backdrop click)
 *
 * @see /debug/design-system#dialog-patterns for examples
 */

// Deprecation warning (development only)
let hasWarnedDeprecation = false;

export interface ConfirmDialogProps {
  /** Dialog open state */
  isOpen: boolean;
  /** Dialog title */
  title?: string;
  /** Dialog message */
  message?: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Confirm button variant */
  confirmVariant?: 'danger' | 'ember' | 'success';
  /** Confirm action handler */
  onConfirm: () => void;
  /** Cancel action handler */
  onCancel: () => void;
  /** Dialog icon emoji */
  icon?: string;
}

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
}: ConfirmDialogProps): React.ReactElement | null {
  // Emit deprecation warning once in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !hasWarnedDeprecation) {
      hasWarnedDeprecation = true;
      console.warn(
        '[DEPRECATED] ConfirmDialog is deprecated. Use ConfirmationDialog instead. ' +
        'See: /debug/design-system#dialog-patterns'
      );
    }
  }, []);

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
    const handleEscape = (e: KeyboardEvent) => {
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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn [html:not(.dark)_&]:bg-slate-500/40"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <Card
        variant="elevated"
        className="max-w-md w-full p-6 animate-scaleIn"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        {...({} as any)}
      >
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">{icon}</div>
          <Heading level={2} size="xl" id="dialog-title" className="mb-2">
            {title}
          </Heading>
          <Text variant="secondary">{message}</Text>
        </div>

        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
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
