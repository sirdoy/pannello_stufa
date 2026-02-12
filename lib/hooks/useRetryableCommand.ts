'use client';

import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/app/hooks/useToast';
import { retryFetch, isTransientError, RetryError } from '@/lib/retry/retryClient';
import { deduplicationManager, createRequestKey } from '@/lib/retry/deduplicationManager';
import { idempotencyManager } from '@/lib/retry/idempotencyManager';

/**
 * Options for configuring a retryable command
 */
interface CommandOptions {
  /** Device name for dedup key (e.g., 'stove', 'hue', 'netatmo') */
  device: string;
  /** Action name for dedup key (e.g., 'ignite', 'shutdown', 'setFan') */
  action: string;
  /** Show success toast after recovery from error (not on first success) */
  showSuccessOnRecovery?: boolean;
}

/**
 * Result object returned by the hook
 */
interface CommandResult {
  /** Execute a device command with retry + dedup + idempotency */
  execute: (url: string, fetchOptions?: RequestInit) => Promise<Response | null>;
  /** Whether a retry is currently in progress */
  isRetrying: boolean;
  /** Number of retry attempts made */
  attemptCount: number;
  /** Last error that occurred (null if none) */
  lastError: Error | null;
  /** Whether the command is currently executing (including retries) */
  isExecuting: boolean;
  /** Manual retry: re-execute the last failed command */
  retry: () => Promise<Response | null>;
  /** Clear error state */
  clearError: () => void;
}

/**
 * Stored command for retry capability
 */
interface StoredCommand {
  url: string;
  options?: RequestInit;
}

/**
 * Hook for executing device commands with automatic retry, deduplication, and idempotency.
 *
 * This is the SINGLE integration point for device commands (RETRY-06: single retry layer at API boundary).
 * Device components don't need to know about retry logic, dedup, or idempotency - just call `execute()`.
 *
 * Features:
 * - Automatic retry with exponential backoff for transient errors
 * - Request deduplication (2-second window) to prevent double-tap
 * - Idempotency key injection to prevent duplicate physical actions
 * - Persistent error toasts with inline "Riprova" button
 * - Success toast only on recovery (not first-try success)
 * - Manual retry capability via `retry()` method
 * - Error state exposed for device card integration
 *
 * @param options - Configuration options
 * @returns Command execution API
 *
 * @example
 * const { execute, retry, lastError, isExecuting } = useRetryableCommand({
 *   device: 'stove',
 *   action: 'ignite'
 * });
 *
 * // Execute command
 * await execute('/api/stove/ignite', {
 *   method: 'POST',
 *   body: JSON.stringify({ command: 'ignite' })
 * });
 *
 * // Manual retry after error
 * if (lastError) {
 *   await retry();
 * }
 */
export function useRetryableCommand(options: CommandOptions): CommandResult {
  const { device, action, showSuccessOnRecovery = true } = options;
  const { success, error: showError } = useToast();

  const [isExecuting, setIsExecuting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);

  // Store the last failed command for retry
  const lastCommandRef = useRef<StoredCommand | null>(null);
  const hadErrorRef = useRef(false);

  /**
   * Execute a device command with full retry infrastructure
   */
  const execute = useCallback(
    async (url: string, fetchOptions?: RequestInit): Promise<Response | null> => {
      // 1. Deduplication check
      const dedupKey = createRequestKey(device, action);
      if (deduplicationManager.isDuplicate(dedupKey)) {
        // Silently block duplicate request
        return null;
      }

      // Store command for potential retry
      lastCommandRef.current = { url, options: fetchOptions };

      setIsExecuting(true);
      setIsRetrying(false);

      try {
        // 2. Get idempotency key
        let idempotencyKey: string;
        try {
          const body = fetchOptions?.body ? JSON.parse(fetchOptions.body as string) : {};
          idempotencyKey = await idempotencyManager.registerKey(url, body);
        } catch (parseError) {
          // If body parsing fails, use empty object
          idempotencyKey = await idempotencyManager.registerKey(url, {});
        }

        // 3. Inject idempotency key into headers
        const enhancedOptions: RequestInit = {
          ...fetchOptions,
          headers: {
            ...fetchOptions?.headers,
            'Idempotency-Key': idempotencyKey,
          },
        };

        // 4. Execute with retry
        const response = await retryFetch(url, enhancedOptions);

        // 5. Success handling
        if (hadErrorRef.current && showSuccessOnRecovery) {
          // Show success toast only on recovery (not first-try success)
          success('Comando eseguito con successo');
        }

        // Clear error state
        setLastError(null);
        setAttemptCount(0);
        hadErrorRef.current = false;

        return response;
      } catch (err) {
        // 6. Error handling
        const error = err as Error;

        if (error instanceof RetryError) {
          // All retries exhausted
          setLastError(error);
          setAttemptCount(error.attempts);
          hadErrorRef.current = true;

          // Show persistent error toast with retry button
          showError('Comando fallito dopo più tentativi. Riprova.', {
            action: {
              label: 'Riprova',
              onClick: () => {
                retry();
              },
            },
          });
        } else {
          // Non-retryable error or other error
          setLastError(error);
          setAttemptCount(0);
          hadErrorRef.current = true;

          // Show persistent error toast with retry button
          showError(error.message || 'Comando fallito. Riprova.', {
            action: {
              label: 'Riprova',
              onClick: () => {
                retry();
              },
            },
          });
        }

        return null;
      } finally {
        setIsExecuting(false);
        // Clear dedup after completion (success or failure)
        deduplicationManager.clear(dedupKey);
      }
    },
    [device, action, showSuccessOnRecovery, success, showError]
  );

  /**
   * Manually retry the last failed command
   */
  const retry = useCallback(async (): Promise<Response | null> => {
    if (!lastCommandRef.current) {
      return null;
    }

    const { url, options } = lastCommandRef.current;

    // Clear error state before retry
    setLastError(null);
    setIsRetrying(true);

    // Execute the stored command
    return execute(url, options);
  }, [execute]);

  /**
   * Clear all error state
   */
  const clearError = useCallback(() => {
    setLastError(null);
    setAttemptCount(0);
    setIsRetrying(false);
    hadErrorRef.current = false;
  }, []);

  return {
    execute,
    retry,
    clearError,
    isExecuting,
    isRetrying,
    attemptCount,
    lastError,
  };
}
