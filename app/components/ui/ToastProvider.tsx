'use client';

import { createContext, useCallback, useState, useRef } from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import Toast, { ToastViewport } from './Toast';

/**
 * Toast Context
 * Provides imperative toast API across the app
 */
export const ToastContext = createContext(null);

/**
 * ToastProvider Component
 *
 * Wraps the app to provide toast notifications with stacking behavior.
 * Max 3 toasts visible at once, oldest removed when new ones added.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - App content
 *
 * @example
 * // In layout.js
 * <ToastProvider>
 *   {children}
 * </ToastProvider>
 *
 * // In any component
 * const { success, error } = useToast();
 * success('Saved successfully!');
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  /**
   * Create a new toast notification
   * @param {Object} options - Toast options
   * @param {'success'|'error'|'warning'|'info'} options.variant - Toast variant
   * @param {string} options.message - Toast message
   * @param {string} [options.title] - Optional title
   * @param {number} [options.duration] - Auto-dismiss duration (ms), default 5000 (8000 for errors)
   * @param {Object} [options.action] - Optional action button
   * @param {string} options.action.label - Action button label
   * @param {Function} options.action.onClick - Action button handler
   * @returns {number} Toast ID for manual dismissal
   */
  const toast = useCallback(({ variant = 'info', message, title, duration, action }) => {
    const id = ++toastIdRef.current;

    // Default duration: 5000ms, 8000ms for errors
    const defaultDuration = variant === 'error' ? 8000 : 5000;

    setToasts(prev => [
      ...prev,
      {
        id,
        variant,
        message,
        title,
        duration: duration ?? defaultDuration,
        action,
      },
    ]);

    return id;
  }, []);

  /**
   * Dismiss a specific toast by ID
   */
  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  /**
   * Dismiss all toasts
   */
  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods for common toast types
  const success = useCallback((message, opts = {}) =>
    toast({ variant: 'success', message, ...opts }), [toast]);

  const error = useCallback((message, opts = {}) =>
    toast({ variant: 'error', message, ...opts }), [toast]);

  const warning = useCallback((message, opts = {}) =>
    toast({ variant: 'warning', message, ...opts }), [toast]);

  const info = useCallback((message, opts = {}) =>
    toast({ variant: 'info', message, ...opts }), [toast]);

  // Only show max 3 toasts, slice from end (newest on top)
  const visibleToasts = toasts.slice(-3);

  return (
    <ToastContext.Provider value={{ toast, dismiss, dismissAll, success, error, warning, info }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {visibleToasts.map((t) => (
          <Toast
            key={t.id}
            variant={t.variant}
            title={t.title}
            open={true}
            onOpenChange={(open) => !open && dismiss(t.id)}
            duration={t.duration}
            action={t.action}
          >
            {t.message}
          </Toast>
        ))}
        <ToastViewport />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
