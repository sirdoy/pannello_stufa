'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  queueCommand,
  getQueuedCommands,
  getPendingCount,
  clearFailedCommands,
  retryCommand,
  cancelCommand,
  formatCommandForDisplay,
  processQueue,
  COMMAND_STATUS,
} from '@/lib/pwa/backgroundSync';

/**
 * Hook for using Background Sync functionality
 *
 * Provides UI integration for offline command queuing with:
 * - Automatic queue updates
 * - Service Worker message handling
 * - Command management (retry, cancel)
 *
 * @returns {Object} Background Sync state and utilities
 *
 * @example
 * const {
 *   pendingCommands,
 *   failedCommands,
 *   queueStoveCommand,
 *   isOffline,
 * } = useBackgroundSync();
 *
 * // Queue a command (automatically syncs when online)
 * await queueStoveCommand('ignite', { source: 'manual' });
 *
 * // Show pending commands in UI
 * {pendingCommands.map(cmd => <QueuedCommand key={cmd.id} command={cmd} />)}
 */
/** Background Sync hook return type */
export interface UseBackgroundSyncReturn {
  pendingCommands: unknown[];
  failedCommands: unknown[];
  pendingCount: number;
  isProcessing: boolean;
  lastSyncedCommand: unknown | null;
  hasPendingCommands: boolean;
  hasFailedCommands: boolean;
  queueStoveCommand: (action: string, body?: Record<string, unknown>) => Promise<number>;
  refreshCommands: () => Promise<void>;
  retryCommand: (id: string) => Promise<void>;
  cancelCommand: (id: string) => Promise<void>;
  clearFailedCommands: () => Promise<void>;
  triggerSync: () => Promise<void>;
}

export function useBackgroundSync(): UseBackgroundSyncReturn {
  const [pendingCommands, setPendingCommands] = useState<unknown[]>([]);
  const [failedCommands, setFailedCommands] = useState<unknown[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastSyncedCommand, setLastSyncedCommand] = useState<unknown | null>(null);

  /**
   * Refresh command lists from IndexedDB
   */
  const refreshCommands = useCallback(async () => {
    try {
      const pending = await getQueuedCommands(COMMAND_STATUS.PENDING);
      const failed = await getQueuedCommands(COMMAND_STATUS.FAILED);

      setPendingCommands(pending.map(formatCommandForDisplay));
      setFailedCommands(failed.map(formatCommandForDisplay));
      setPendingCount(pending.length);
    } catch (error) {
      console.error('[useBackgroundSync] Failed to refresh commands:', error);
    }
  }, []);

  // Initial load and periodic refresh
  useEffect(() => {
    refreshCommands();

    // Refresh every 5 seconds
    const interval = setInterval(refreshCommands, 5000);

    return () => clearInterval(interval);
  }, [refreshCommands]);

  // Listen for Service Worker messages
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const handleMessage = (event) => {
      const { type, commandId, endpoint } = event.data || {};

      if (type === 'COMMAND_SYNCED') {
        console.log('[useBackgroundSync] Command synced:', commandId, endpoint);
        setLastSyncedCommand({ commandId, endpoint, timestamp: Date.now() });
        refreshCommands();

        // Clear lastSyncedCommand after 5 seconds
        setTimeout(() => setLastSyncedCommand(null), 5000);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [refreshCommands]);

  // Listen for online/offline events to trigger sync
  useEffect(() => {
    const handleOnline = async () => {
      console.log('[useBackgroundSync] Online - triggering sync');
      setIsProcessing(true);

      try {
        // Notify Service Worker to process queue
        const registration = await navigator.serviceWorker?.ready;
        if (registration?.active) {
          registration.active.postMessage({ type: 'PROCESS_QUEUE' });
        }

        // Also process directly in case SW message fails
        await processQueue();
      } finally {
        setIsProcessing(false);
        await refreshCommands();
      }
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [refreshCommands]);

  /**
   * Queue a stove command
   * @param {string} action - 'ignite', 'shutdown', or 'set-power'
   * @param {Object} data - Command payload
   * @returns {Promise<number>} Command ID
   */
  const queueStoveCommand = useCallback(
    async (action, data = {}) => {
      const endpoint = `stove/${action}`;
      const id = await queueCommand(endpoint, data);
      await refreshCommands();
      return id;
    },
    [refreshCommands]
  );

  /**
   * Retry a failed command
   * @param {number} commandId - Command ID
   */
  const handleRetry = useCallback(
    async (commandId) => {
      await retryCommand(commandId);
      await refreshCommands();
    },
    [refreshCommands]
  );

  /**
   * Cancel a pending command
   * @param {number} commandId - Command ID
   */
  const handleCancel = useCallback(
    async (commandId) => {
      await cancelCommand(commandId);
      await refreshCommands();
    },
    [refreshCommands]
  );

  /**
   * Clear all failed commands
   */
  const handleClearFailed = useCallback(async () => {
    await clearFailedCommands();
    await refreshCommands();
  }, [refreshCommands]);

  /**
   * Manually trigger queue processing
   */
  const triggerSync = useCallback(async () => {
    if (!navigator.onLine) {
      console.log('[useBackgroundSync] Cannot sync - offline');
      return;
    }

    setIsProcessing(true);
    try {
      await processQueue();
    } finally {
      setIsProcessing(false);
      await refreshCommands();
    }
  }, [refreshCommands]);

  return {
    // State
    pendingCommands,
    failedCommands,
    pendingCount,
    isProcessing,
    lastSyncedCommand,
    hasPendingCommands: pendingCount > 0,
    hasFailedCommands: failedCommands.length > 0,

    // Actions
    queueStoveCommand,
    retryCommand: handleRetry,
    cancelCommand: handleCancel,
    clearFailedCommands: handleClearFailed,
    triggerSync,
    refreshCommands,
  };
}

export default useBackgroundSync;
