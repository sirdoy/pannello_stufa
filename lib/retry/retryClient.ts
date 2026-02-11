/**
 * Retry Client with Exponential Backoff
 *
 * Provides automatic retry logic for transient network errors.
 * Non-retryable errors (validation, auth, device offline) throw immediately.
 *
 * Usage:
 *   const response = await retryFetch('https://api.example.com/data', {
 *     method: 'POST',
 *     body: JSON.stringify({ data }),
 *   });
 */

import { ERROR_CODES } from '@/lib/core/apiErrors';

/**
 * Transient error codes that should be auto-retried
 *
 * These errors are typically temporary and may succeed on retry:
 * - NETWORK_ERROR: Network connectivity issues
 * - TIMEOUT: Request timeout
 * - SERVICE_UNAVAILABLE: Server temporarily unavailable (503)
 * - STOVE_TIMEOUT: Stove response timeout (might recover)
 * - EXTERNAL_API_ERROR: Third-party API errors
 */
const TRANSIENT_ERROR_CODES: ReadonlySet<string> = new Set([
  ERROR_CODES.NETWORK_ERROR,
  ERROR_CODES.TIMEOUT,
  ERROR_CODES.SERVICE_UNAVAILABLE,
  ERROR_CODES.STOVE_TIMEOUT,
  ERROR_CODES.EXTERNAL_API_ERROR,
]);

/**
 * Configuration options for retry behavior
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Initial delay in milliseconds before first retry (default: 1000ms) */
  initialDelay?: number;
  /** Maximum delay between retries in milliseconds (default: 10000ms) */
  maxDelay?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** Callback invoked before each retry attempt */
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Error thrown after all retry attempts are exhausted
 */
export class RetryError extends Error {
  /** Number of retry attempts made */
  public readonly attempts: number;
  /** The original error that caused the final failure */
  public readonly cause: Error;

  constructor(message: string, attempts: number, cause: Error) {
    super(message);
    this.name = 'RetryError';
    this.attempts = attempts;
    this.cause = cause;

    // Maintains proper stack trace (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RetryError);
    }
  }
}

/**
 * Checks if an error code represents a transient error that should be retried
 *
 * @param code - Error code to check
 * @returns true if the error is transient and should be retried
 *
 * @example
 * if (isTransientError(ERROR_CODES.NETWORK_ERROR)) {
 *   // Will retry
 * }
 */
export function isTransientError(code: string): boolean {
  return TRANSIENT_ERROR_CODES.has(code);
}

/**
 * Calculates the delay before the next retry attempt using exponential backoff with jitter
 *
 * @param attempt - Current attempt number (0-indexed)
 * @param options - Retry configuration options
 * @returns Delay in milliseconds
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const { initialDelay, maxDelay, backoffMultiplier } = options;

  // Exponential backoff: initialDelay * (multiplier ^ attempt)
  const exponentialDelay = initialDelay * Math.pow(backoffMultiplier, attempt);

  // Cap at maxDelay
  const cappedDelay = Math.min(exponentialDelay, maxDelay);

  // Add jitter: random value between 0% and 30% of the delay
  const jitter = Math.random() * 0.3 * cappedDelay;

  return cappedDelay + jitter;
}

/**
 * Attempts to parse error code from response body
 *
 * @param response - Fetch response
 * @returns Error code if found, null otherwise
 */
async function extractErrorCode(response: Response): Promise<string | null> {
  try {
    // Clone response so caller can still read the body
    const clone = response.clone();
    const data = await clone.json();

    if (data && typeof data === 'object' && 'code' in data && typeof data.code === 'string') {
      return data.code;
    }
  } catch {
    // Response is not JSON or cannot be parsed
  }

  return null;
}

/**
 * Fetch wrapper with automatic retry on transient errors
 *
 * Retries requests that fail with transient errors (network issues, timeouts).
 * Non-retryable errors (validation, auth, device offline) throw immediately.
 *
 * Uses exponential backoff with jitter to prevent thundering herd.
 *
 * @param url - URL to fetch
 * @param options - Standard fetch options
 * @param retryOptions - Retry configuration
 * @returns Response from successful fetch
 * @throws RetryError if all retry attempts are exhausted
 * @throws Error immediately for non-retryable errors
 *
 * @example
 * // Basic usage with defaults (3 retries, 1s initial delay)
 * const response = await retryFetch('https://api.example.com/data', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ action: 'ignite' }),
 * });
 *
 * @example
 * // Custom retry configuration
 * const response = await retryFetch('https://api.example.com/data', {}, {
 *   maxAttempts: 5,
 *   initialDelay: 500,
 *   maxDelay: 5000,
 *   onRetry: (attempt, error) => {
 *     console.log(`Retry attempt ${attempt}:`, error.message);
 *   },
 * });
 */
export async function retryFetch(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const config: Required<RetryOptions> = {
    maxAttempts: retryOptions.maxAttempts ?? 3,
    initialDelay: retryOptions.initialDelay ?? 1000,
    maxDelay: retryOptions.maxDelay ?? 10000,
    backoffMultiplier: retryOptions.backoffMultiplier ?? 2,
    onRetry: retryOptions.onRetry ?? (() => {}),
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      const response = await fetch(url, options);

      // Check if response contains a retryable error code
      const errorCode = await extractErrorCode(response);

      if (errorCode) {
        // Check if error is transient (retryable)
        if (!isTransientError(errorCode)) {
          // Non-retryable error - throw immediately without retry
          const error = new Error(`Non-retryable error: ${errorCode}`);
          (error as { code?: string }).code = errorCode;
          throw error;
        }

        // Transient error - will retry
        const error = new Error(`Transient error: ${errorCode}`);
        (error as { code?: string }).code = errorCode;
        lastError = error;

        // Don't delay after last attempt
        if (attempt < config.maxAttempts - 1) {
          config.onRetry(attempt, error);
          const delay = calculateDelay(attempt, config);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        continue;
      }

      // Success - return response
      return response;
    } catch (error) {
      const err = error as Error;

      // Network errors (TypeError from fetch) are always retryable
      if (error instanceof TypeError) {
        lastError = err;

        // Don't delay after last attempt
        if (attempt < config.maxAttempts - 1) {
          config.onRetry(attempt, err);
          const delay = calculateDelay(attempt, config);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        continue;
      }

      // Check if error has a code property (from our error extraction above)
      const errorCode = (err as { code?: string }).code;
      if (errorCode && !isTransientError(errorCode)) {
        // Non-retryable error - throw immediately
        throw err;
      }

      // Other errors - treat as transient
      lastError = err;

      // Don't delay after last attempt
      if (attempt < config.maxAttempts - 1) {
        config.onRetry(attempt, err);
        const delay = calculateDelay(attempt, config);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All retry attempts exhausted
  throw new RetryError(
    `Request failed after ${config.maxAttempts} attempts`,
    config.maxAttempts,
    lastError ?? new Error('Unknown error')
  );
}
