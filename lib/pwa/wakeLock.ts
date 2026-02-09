/**
 * Screen Wake Lock Service
 *
 * Keeps the screen awake during active monitoring.
 * Useful when watching stove temperature or waiting for ignition.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
 */

let wakeLock: WakeLockSentinel | null = null;

/**
 * Check if Wake Lock API is supported
 * @returns {boolean}
 */
export function isWakeLockSupported(): boolean {
  return 'wakeLock' in navigator;
}

/**
 * Request a screen wake lock
 * @returns {Promise<boolean>} True if lock acquired successfully
 */
export async function requestWakeLock(): Promise<boolean> {
  if (!isWakeLockSupported()) {
    console.warn('[WakeLock] API not supported');
    return false;
  }

  try {
    wakeLock = await navigator.wakeLock.request('screen');

    wakeLock.addEventListener('release', () => {
      console.log('[WakeLock] Released');
      wakeLock = null;
    });

    console.log('[WakeLock] Acquired');
    return true;
  } catch (error) {
    // Wake lock request can fail if:
    // - Document is not visible
    // - Battery saver mode is on
    // - User denied permission
    console.warn('[WakeLock] Request failed:', (error as Error).message);
    return false;
  }
}

/**
 * Release the current wake lock
 * @returns {Promise<boolean>} True if released successfully
 */
export async function releaseWakeLock(): Promise<boolean> {
  if (!wakeLock) {
    return true;
  }

  try {
    await wakeLock.release();
    wakeLock = null;
    console.log('[WakeLock] Released manually');
    return true;
  } catch (error) {
    console.error('[WakeLock] Release failed:', error);
    return false;
  }
}

/**
 * Check if wake lock is currently active
 * @returns {boolean}
 */
export function isWakeLockActive(): boolean {
  return wakeLock !== null;
}

/**
 * Re-acquire wake lock after visibility change
 * Should be called when document becomes visible again
 * @returns {Promise<boolean>}
 */
async function reacquireWakeLock(): Promise<boolean> {
  if (!isWakeLockSupported()) {
    return false;
  }

  // Only reacquire if we had a lock before
  if (wakeLock === null) {
    return false;
  }

  return requestWakeLock();
}

