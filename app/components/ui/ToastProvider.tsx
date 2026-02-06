'use client';

import type React from 'react';
import { createContext, useCallback, useState, useRef } from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import Toast, { ToastViewport } from './Toast';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  variant?: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  duration?: number;
  action?: ToastAction;
}

export interface ToastContextValue {
  toast: (options: ToastOptions) => number;
  dismiss: (id: number) => void;
  dismissAll: () => void;
  success: (message: string, opts?: Partial<ToastOptions>) => number;
  error: (message: string, opts?: Partial<ToastOptions>) => number;
  warning: (message: string, opts?: Partial<ToastOptions>) => number;
  info: (message: string, opts?: Partial<ToastOptions>) => number;
}

/**
 * Toast Context
 * Provides imperative toast API across the app
 */
export const ToastContext = createContext<ToastContextValue | null>(null);

interface ToastData {
  id: number;
  variant: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  duration: number;
  action?: ToastAction;
}

export interface ToastProviderProps {
  children: React.ReactNode;
}

/**
 * ToastProvider Component
 *
 * Wraps the app to provide toast notifications with stacking behavior.
 * Max 3 toasts visible at once, oldest removed when new ones added.
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
export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const toastIdRef = useRef(0);

  /**
   * Create a new toast notification
   */
  const toast = useCallback(({ variant = 'info', message, title, duration, action }: ToastOptions) => {
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
  const success = useCallback((message: string, opts: Partial<ToastOptions> = {}) =>
    toast({ variant: 'success', message, ...opts }), [toast]);

  const error = useCallback((message: string, opts: Partial<ToastOptions> = {}) =>
    toast({ variant: 'error', message, ...opts }), [toast]);

  const warning = useCallback((message: string, opts: Partial<ToastOptions> = {}) =>
    toast({ variant: 'warning', message, ...opts }), [toast]);

  const info = useCallback((message: string, opts: Partial<ToastOptions> = {}) =>
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
