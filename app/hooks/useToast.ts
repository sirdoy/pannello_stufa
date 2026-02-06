'use client';

import { useContext } from 'react';
import { ToastContext } from '@/app/components/ui/ToastProvider';

/**
 * Hook for triggering toast notifications
 *
 * Must be used within a ToastProvider.
 *
 * @returns {Object} Toast API
 * @returns {Function} return.toast - Create toast with full options
 * @returns {Function} return.success - Create success toast
 * @returns {Function} return.error - Create error toast (8s duration)
 * @returns {Function} return.warning - Create warning toast
 * @returns {Function} return.info - Create info toast
 * @returns {Function} return.dismiss - Dismiss toast by ID
 * @returns {Function} return.dismissAll - Dismiss all toasts
 *
 * @example
 * const { toast, success, error, warning, info, dismiss, dismissAll } = useToast();
 *
 * // Quick methods
 * success('Saved successfully!');
 * error('Something went wrong');
 * warning('Check your input');
 * info('New update available');
 *
 * // Full control
 * const id = toast({
 *   variant: 'info',
 *   title: 'Update',
 *   message: 'New version available',
 *   duration: 10000,
 *   action: {
 *     label: 'Refresh',
 *     onClick: () => window.location.reload()
 *   }
 * });
 *
 * // Manual dismiss
 * dismiss(id);
 * dismissAll();
 *
 * @throws {Error} If used outside ToastProvider
 */
export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}
