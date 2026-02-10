/**
 * Coordination Debounce Timer Service
 *
 * Manages debounce timers for stove-thermostat coordination.
 * Prevents rapid state changes from triggering immediate coordination actions.
 *
 * Design:
 * - In-memory Map storage following rateLimiter.js pattern
 * - Native setTimeout/clearTimeout (no persistence across restarts)
 * - State persistence via coordinationState.js (pendingDebounce flag)
 * - 2-minute default delay for stove ON events
 * - 30-second retry timer for early shutoff (stove OFF during debounce)
 *
 * Timer Lifecycle:
 * 1. Stove turns ON → start 2-min debounce timer
 * 2. If stove turns OFF during timer → cancel, start 30s retry
 * 3. If stove turns OFF with no pending timer → execute immediately (restore setpoints)
 * 4. Timer callback fires → execute coordination action
 */

import { updateCoordinationState } from '@/lib/coordinationState';

/**
 * Stove target state for debouncing
 */
type StoveTargetState = 'ON' | 'OFF';

/**
 * Timer entry structure
 */
interface TimerEntry {
  timer: NodeJS.Timeout;
  startedAt: number;
  targetState: StoveTargetState;
  duration: number;
}

/**
 * Debounce result
 */
interface DebounceResult {
  started: boolean;
  duration: number;
}

/**
 * Cancel result
 */
interface CancelResult {
  cancelled: boolean;
}

/**
 * Debounce status
 */
interface DebounceStatus {
  pending: boolean;
  startedAt: number | null;
  remainingMs: number | null;
  targetState: StoveTargetState | null;
}

/**
 * State change result
 */
interface StateChangeResult {
  action: 'timer_started' | 'retry_started' | 'executed_immediately' | 'no_change';
  delayMs: number | null;
}

// In-memory storage: Map<userId, timerEntry>
// Timer does NOT persist across server restarts (intentional per RESEARCH.md)
const activeTimers = new Map<string, TimerEntry>();

/**
 * Start a debounce timer for a user
 */
export async function startDebounceTimer(
  userId: string,
  targetState: StoveTargetState,
  callback: () => Promise<void>,
  delayMs = 120000
): Promise<DebounceResult> {
  // Cancel existing timer if any
  await cancelDebounceTimer(userId);

  const startedAt = Date.now();

  // Create timer
  const timer = setTimeout(async () => {

    // Remove from Map
    activeTimers.delete(userId);

    // Update state BEFORE callback (callback might throw)
    await updateCoordinationState({
      pendingDebounce: false,
      debounceStartedAt: null,
    });

    // Execute callback
    try {
      await callback();
    } catch (error) {
      console.error(`❌ Debounce callback error for ${userId}:`, error);
    }
  }, delayMs);

  // Store timer info
  activeTimers.set(userId, {
    timer,
    startedAt,
    targetState,
    duration: delayMs,
  });

  // Update coordination state
  await updateCoordinationState({
    pendingDebounce: true,
    debounceStartedAt: startedAt,
  });


  return { started: true, duration: delayMs };
}

/**
 * Cancel debounce timer for a user
 */
export async function cancelDebounceTimer(userId: string): Promise<CancelResult> {
  const entry = activeTimers.get(userId);

  if (!entry) {
    return { cancelled: false };
  }

  // Clear timeout
  clearTimeout(entry.timer);

  // Remove from Map
  activeTimers.delete(userId);

  // Update coordination state
  await updateCoordinationState({
    pendingDebounce: false,
    debounceStartedAt: null,
  });


  return { cancelled: true };
}

/**
 * Check if user has pending debounce timer
 */
export function hasPendingDebounce(userId: string): boolean {
  return activeTimers.has(userId);
}

/**
 * Get debounce status for a user
 */
export function getDebounceStatus(userId: string): DebounceStatus {
  const entry = activeTimers.get(userId);

  if (!entry) {
    return {
      pending: false,
      startedAt: null,
      remainingMs: null,
      targetState: null,
    };
  }

  const now = Date.now();
  const elapsed = now - entry.startedAt;
  const remainingMs = Math.max(0, entry.duration - elapsed);

  return {
    pending: true,
    startedAt: entry.startedAt,
    remainingMs,
    targetState: entry.targetState,
  };
}

/**
 * Handle stove state change with context-aware debouncing
 *
 * This implements the coordination logic from 08-CONTEXT.md:
 * - ON + no pending: Start 2-min timer
 * - OFF during debounce with targetState ON: Cancel, start 30s retry
 * - OFF + no pending: Execute immediately (restore setpoints)
 * - State matches targetState: No action needed
 */
export async function handleStoveStateChange(
  userId: string,
  newState: StoveTargetState,
  callback: () => Promise<void>
): Promise<StateChangeResult> {
  const entry = activeTimers.get(userId);
  const hasPending = !!entry;


  // Case 1: Stove ON with no pending debounce → Start 2-min timer
  if (newState === 'ON' && !hasPending) {
    await startDebounceTimer(userId, 'ON', callback, 120000); // 2 minutes
    return { action: 'timer_started', delayMs: 120000 };
  }

  // Case 2: Stove OFF during debounce with targetState ON → Cancel and start 30s retry
  if (newState === 'OFF' && hasPending && entry.targetState === 'ON') {
    await cancelDebounceTimer(userId);
    await startDebounceTimer(userId, 'OFF', callback, 30000); // 30 seconds retry
    return { action: 'retry_started', delayMs: 30000 };
  }

  // Case 3: Stove OFF with no pending debounce → Execute immediately
  if (newState === 'OFF' && !hasPending) {
    await callback();
    return { action: 'executed_immediately', delayMs: 0 };
  }

  // Case 4: State matches targetState → No change needed
  if (hasPending && newState === entry.targetState) {
    return { action: 'no_change', delayMs: null };
  }

  // Default: No action
  return { action: 'no_change', delayMs: null };
}

/**
 * Periodic cleanup to prevent memory leaks
 * Removes stale entries (timers that should have fired but are still in Map)
 * This shouldn't happen in normal operation, but provides safety
 */
function cleanupOldEntries(): void {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes (safety buffer)
  let totalCleaned = 0;

  for (const [userId, entry] of activeTimers) {
    const age = now - entry.startedAt;
    if (age > maxAge) {
      console.warn(`⚠️ Cleaning stale debounce entry: ${userId} (age: ${Math.floor(age / 1000)}s)`);
      clearTimeout(entry.timer);
      activeTimers.delete(userId);
      totalCleaned++;
    }
  }

  if (totalCleaned > 0) {
  }
}

// Start cleanup interval (runs every 5 minutes)
const cleanupInterval = setInterval(cleanupOldEntries, 5 * 60 * 1000);

// Cleanup on process exit (prevent dangling interval in tests)
if (typeof process !== 'undefined') {
  process.on('exit', () => {
    clearInterval(cleanupInterval);
  });
}

/**
 * Export internals for testing
 */
export const _internals = {
  activeTimers,
  cleanupOldEntries,
};
