/**
 * Detects fetch failures caused by the page going away rather than by the network.
 *
 * A full navigation cancels in-flight requests: Chromium rejects them with
 * `TypeError: Failed to fetch` (not an AbortError), which would otherwise be
 * logged as a real error (ROADMAP M55).
 */

/** Window after `beforeunload` during which a TypeError counts as an unload cancel. */
const UNLOAD_WINDOW_MS = 5000;

let unloadingSince: number | null = null;
let listening = false;

function markUnloading(): void {
  unloadingSince = Date.now();
}

function clearUnloading(): void {
  unloadingSince = null;
}

/** Installs the unload listeners once (no-op on the server). */
export function trackPageUnload(): void {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  window.addEventListener('beforeunload', markUnloading);
  window.addEventListener('pagehide', markUnloading);
  // Back/forward cache restore or a cancelled navigation: the page is alive again
  window.addEventListener('pageshow', clearUnloading);
}

// Listen from module load: the cancel happens right at navigation time
trackPageUnload();

export function isPageUnloading(): boolean {
  return unloadingSince !== null && Date.now() - unloadingSince < UNLOAD_WINDOW_MS;
}

/** True when the error is an aborted fetch or a request cancelled by page unload. */
export function isFetchInterrupted(err: unknown): boolean {
  if (err instanceof Error && err.name === 'AbortError') return true;
  return err instanceof TypeError && isPageUnloading();
}

/** Test helper: reset module state. */
export function __resetPageUnloadForTests(): void {
  if (typeof window !== 'undefined') {
    window.removeEventListener('beforeunload', markUnloading);
    window.removeEventListener('pagehide', markUnloading);
    window.removeEventListener('pageshow', clearUnloading);
  }
  listening = false;
  unloadingSince = null;
}
