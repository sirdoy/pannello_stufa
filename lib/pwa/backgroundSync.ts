/**
 * Background Sync Service
 *
 * Queues commands when offline and executes them when connection is restored.
 * Uses Background Sync API where available, with fallback for unsupported browsers.
 *
 * Supported commands:
 * - stove/ignite - Turn on the stove
 * - stove/shutdown - Turn off the stove
 * - stove/set-power - Set stove power level
 *
 * @example
 * import { queueCommand, getQueuedCommands } from '@/lib/pwa/backgroundSync';
 *
 * // Queue a command when offline
 * await queueCommand('stove/ignite', { source: 'manual' });
 *
 * // Get queued commands for UI display
 * const pending = await getQueuedCommands('pending');
 */

import { put, getAll, getByIndex, remove, STORES } from './indexedDB';

// SyncManager interface (not in all TypeScript DOM libs yet)
interface SyncManager {
  register(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

// Extend ServiceWorkerRegistration to include sync
interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  sync: SyncManager;
}

// Command statuses
export const COMMAND_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

type CommandStatus = typeof COMMAND_STATUS[keyof typeof COMMAND_STATUS];

// Sync tag for Background Sync API
const SYNC_TAG = 'stove-command-sync';

// Maximum retry attempts
const MAX_RETRIES = 3;

// Retry delay in ms (exponential backoff: 1s, 2s, 4s)
const BASE_RETRY_DELAY = 1000;

interface QueuedCommand {
  id?: number;
  endpoint: string;
  method: string;
  data: Record<string, unknown>;
  status: CommandStatus;
  timestamp: string;
  retries: number;
  lastError: string | null;
}

interface ProcessQueueResult {
  processed: number;
  failed: number;
}

interface FormattedCommand extends QueuedCommand {
  label: string;
  icon: string;
  formattedTime: string;
}

/**
 * Check if Background Sync API is supported
 * @returns {boolean}
 */
function isBackgroundSyncSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    'SyncManager' in window
  );
}

/**
 * Queue a command for execution
 * @param {string} endpoint - API endpoint (e.g., 'stove/ignite')
 * @param {Object} data - Command payload
 * @param {string} method - HTTP method (default: 'POST')
 * @returns {Promise<number>} Command ID
 */
export async function queueCommand(
  endpoint: string,
  data: Record<string, unknown> = {},
  method = 'POST'
): Promise<number> {
  const command: QueuedCommand = {
    endpoint,
    method,
    data,
    status: COMMAND_STATUS.PENDING,
    timestamp: new Date().toISOString(),
    retries: 0,
    lastError: null,
  };

  // Save to IndexedDB
  const id = await put(STORES.COMMAND_QUEUE, command);


  // Try to register for Background Sync
  await registerSync();

  // If online, try to process immediately
  if (navigator.onLine) {
    // Don't await - let it process in background
    processQueue().catch(console.error);
  }

  return id as number;
}

/**
 * Register for Background Sync
 * Called when a command is queued
 */
async function registerSync(): Promise<void> {
  if (!isBackgroundSyncSupported()) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready as ServiceWorkerRegistrationWithSync;
    await registration.sync.register(SYNC_TAG);
  } catch (error) {
    console.error('[BackgroundSync] Failed to register sync:', error);
  }
}

/**
 * Process all pending commands in the queue
 * Called by Service Worker on sync event or manually when coming online
 * @returns {Promise<{processed: number, failed: number}>}
 */
export async function processQueue(): Promise<ProcessQueueResult> {
  const pendingCommands = await getByIndex<QueuedCommand>(
    STORES.COMMAND_QUEUE,
    'status',
    COMMAND_STATUS.PENDING
  );

  if (pendingCommands.length === 0) {
    return { processed: 0, failed: 0 };
  }


  let processed = 0;
  let failed = 0;

  for (const command of pendingCommands) {
    try {
      // Mark as processing
      await put(STORES.COMMAND_QUEUE, {
        ...command,
        status: COMMAND_STATUS.PROCESSING,
      });

      // Execute the command
      await executeCommand(command);

      // Mark as completed and remove
      await remove(STORES.COMMAND_QUEUE, command.id!);
      processed++;

    } catch (error) {
      console.error(`[BackgroundSync] Command failed: ${command.endpoint}`, error);

      const newRetries = command.retries + 1;

      if (newRetries >= MAX_RETRIES) {
        // Max retries reached, mark as failed
        await put(STORES.COMMAND_QUEUE, {
          ...command,
          status: COMMAND_STATUS.FAILED,
          retries: newRetries,
          lastError: (error as Error).message,
        });
        failed++;
      } else {
        // Retry later with exponential backoff
        await put(STORES.COMMAND_QUEUE, {
          ...command,
          status: COMMAND_STATUS.PENDING,
          retries: newRetries,
          lastError: (error as Error).message,
        });

        // Schedule retry
        const delay = BASE_RETRY_DELAY * Math.pow(2, newRetries - 1);
        setTimeout(() => processQueue(), delay);
      }
    }
  }

  return { processed, failed };
}

/**
 * Execute a single command
 * @param {Object} command - Command object
 * @returns {Promise<Response>}
 */
async function executeCommand(command: QueuedCommand): Promise<Response> {
  const { endpoint, method, data } = command;
  const url = `/api/${endpoint}`;

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (method !== 'GET' && data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response;
}

/**
 * Get queued commands by status
 * @param {string} status - Status to filter by (optional)
 * @returns {Promise<Object[]>}
 */
export async function getQueuedCommands(status: CommandStatus | null = null): Promise<QueuedCommand[]> {
  if (status) {
    return getByIndex<QueuedCommand>(STORES.COMMAND_QUEUE, 'status', status);
  }
  return getAll<QueuedCommand>(STORES.COMMAND_QUEUE);
}

/**
 * Get count of pending commands
 * @returns {Promise<number>}
 */
export async function getPendingCount(): Promise<number> {
  const pending = await getByIndex<QueuedCommand>(
    STORES.COMMAND_QUEUE,
    'status',
    COMMAND_STATUS.PENDING
  );
  return pending.length;
}

/**
 * Clear failed commands from queue
 * @returns {Promise<number>} Number of commands cleared
 */
export async function clearFailedCommands(): Promise<number> {
  const failed = await getByIndex<QueuedCommand>(
    STORES.COMMAND_QUEUE,
    'status',
    COMMAND_STATUS.FAILED
  );

  for (const command of failed) {
    await remove(STORES.COMMAND_QUEUE, command.id!);
  }

  return failed.length;
}

/**
 * Retry a failed command
 * @param {number} commandId - Command ID to retry
 * @returns {Promise<boolean>}
 */
export async function retryCommand(commandId: number): Promise<boolean> {
  const commands = await getAll<QueuedCommand>(STORES.COMMAND_QUEUE);
  const command = commands.find((c) => c.id === commandId);

  if (!command) {
    console.warn('[BackgroundSync] Command not found:', commandId);
    return false;
  }

  // Reset to pending with reset retry count
  await put(STORES.COMMAND_QUEUE, {
    ...command,
    status: COMMAND_STATUS.PENDING,
    retries: 0,
    lastError: null,
  });

  // Try to process if online
  if (navigator.onLine) {
    processQueue().catch(console.error);
  } else {
    await registerSync();
  }

  return true;
}

/**
 * Cancel a pending command
 * @param {number} commandId - Command ID to cancel
 * @returns {Promise<boolean>}
 */
export async function cancelCommand(commandId: number): Promise<boolean> {
  try {
    await remove(STORES.COMMAND_QUEUE, commandId);
    return true;
  } catch (error) {
    console.error('[BackgroundSync] Failed to cancel command:', error);
    return false;
  }
}

/**
 * Format command for display
 * @param {Object} command - Command object
 * @returns {Object} Formatted command info
 */
export function formatCommandForDisplay(command: QueuedCommand): FormattedCommand {
  const actionMap: Record<string, { label: string; icon: string }> = {
    'stove/ignite': { label: 'Accensione stufa', icon: '🔥' },
    'stove/shutdown': { label: 'Spegnimento stufa', icon: '🌙' },
    'stove/set-power': { label: 'Imposta potenza', icon: '⚡' },
  };

  const action = actionMap[command.endpoint] || {
    label: command.endpoint,
    icon: '📤',
  };

  return {
    ...command,
    ...action,
    formattedTime: new Date(command.timestamp).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

// Export sync tag for service worker
export { SYNC_TAG };
