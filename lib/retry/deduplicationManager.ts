/**
 * Request Deduplication Manager
 *
 * Prevents duplicate requests within a 2-second window.
 * Protects against double-tap and accidental rapid re-requests.
 *
 * Usage:
 *   const key = createRequestKey('stove', 'ignite');
 *   if (deduplicationManager.isDuplicate(key)) {
 *     return; // Silently block duplicate
 *   }
 *   // Proceed with request
 *   try {
 *     await makeRequest();
 *   } finally {
 *     deduplicationManager.clear(key);
 *   }
 */

/**
 * Manages request deduplication with a 2-second window
 *
 * Uses a Map<string, number> to track in-flight requests by timestamp.
 * Requests within the DEDUP_WINDOW_MS are considered duplicates.
 */
export class DeduplicationManager {
  private inFlightRequests = new Map<string, number>();
  private readonly DEDUP_WINDOW_MS = 2000; // 2 seconds (locked decision)

  /**
   * Checks if a request is a duplicate (within 2-second window)
   *
   * @param key - Request key (typically "device:action")
   * @returns true if request is a duplicate and should be blocked
   *
   * @example
   * if (manager.isDuplicate('stove:ignite')) {
   *   return; // Silently block
   * }
   */
  isDuplicate(key: string): boolean {
    const now = Date.now();
    const lastRequestTime = this.inFlightRequests.get(key);

    if (lastRequestTime !== undefined) {
      const timeSinceLastRequest = now - lastRequestTime;

      if (timeSinceLastRequest < this.DEDUP_WINDOW_MS) {
        // Still within deduplication window - this is a duplicate
        return true;
      }
    }

    // Not a duplicate - store timestamp for future checks
    this.inFlightRequests.set(key, now);
    return false;
  }

  /**
   * Checks if a request is currently in-flight (within window)
   *
   * @param key - Request key
   * @returns true if request is in-flight
   *
   * @example
   * if (manager.isInFlight('stove:ignite')) {
   *   console.log('Request already in progress');
   * }
   */
  isInFlight(key: string): boolean {
    const lastRequestTime = this.inFlightRequests.get(key);

    if (lastRequestTime === undefined) {
      return false;
    }

    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    return timeSinceLastRequest < this.DEDUP_WINDOW_MS;
  }

  /**
   * Clears deduplication state for a request
   *
   * Call this after a request completes (success or failure) to allow
   * immediate re-requests.
   *
   * @param key - Request key to clear
   *
   * @example
   * try {
   *   await makeRequest();
   * } finally {
   *   manager.clear('stove:ignite');
   * }
   */
  clear(key: string): void {
    this.inFlightRequests.delete(key);
  }
}

/**
 * Creates a consistent request key from device and action
 *
 * @param device - Device name (e.g., "stove", "netatmo", "hue")
 * @param action - Action name (e.g., "ignite", "shutdown", "sync")
 * @returns Request key in format "device:action"
 *
 * @example
 * const key = createRequestKey('stove', 'ignite');
 * // Returns: "stove:ignite"
 */
export function createRequestKey(device: string, action: string): string {
  return `${device}:${action}`;
}

/**
 * Singleton instance for global deduplication
 *
 * Use this instance to deduplicate requests across the entire application.
 *
 * @example
 * import { deduplicationManager, createRequestKey } from '@/lib/retry/deduplicationManager';
 *
 * const key = createRequestKey('stove', 'ignite');
 * if (deduplicationManager.isDuplicate(key)) {
 *   return; // Silently block duplicate
 * }
 */
export const deduplicationManager = new DeduplicationManager();
