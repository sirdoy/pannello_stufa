'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { isNewVersionAvailable, type DeployedVersion } from '@/lib/buildVersion';

/** Periodic check while the page stays visible */
export const VERSION_CHECK_INTERVAL_MS = 15 * 60 * 1000;
/** Visibility changes and WS reconnects can fire in bursts: at most one check per window */
export const VERSION_CHECK_MIN_GAP_MS = 30 * 1000;

/**
 * Detects a new frontend (Vercel) or backend (Pi) deploy (M17).
 *
 * Checks GET /api/version on mount, when the app returns to the foreground,
 * every 15 min while visible, and when the live connection re-opens (the WS
 * reconnects after a backend restart). Stops once an update is found.
 *
 * @param connected - Whether the live WS connection is open
 */
export function useNewVersion(connected = false): {
  updateAvailable: boolean;
  checkNow: () => Promise<void>;
} {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const backendBaseline = useRef<string | null>(null);
  const lastCheck = useRef(0);
  const found = useRef(false);

  const checkNow = useCallback(async (): Promise<void> => {
    const now = Date.now();
    if (found.current || now - lastCheck.current < VERSION_CHECK_MIN_GAP_MS) return;
    lastCheck.current = now;
    try {
      const res = await fetch('/api/version', { cache: 'no-store' });
      if (!res.ok) return;
      const deployed = (await res.json()) as DeployedVersion;
      if (isNewVersionAvailable(deployed, backendBaseline.current)) {
        found.current = true;
        setUpdateAvailable(true);
        return;
      }
      if (backendBaseline.current === null && deployed.backend) {
        backendBaseline.current = deployed.backend;
      }
    } catch {
      // Offline or backend down: try again on the next trigger
    }
  }, []);

  useEffect(() => {
    const initial = setTimeout(() => void checkNow(), 0);
    const onVisible = () => {
      if (!document.hidden) void checkNow();
    };
    const timer = setInterval(() => {
      if (!document.hidden) void checkNow();
    }, VERSION_CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', onVisible);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', onVisible);
    };
  }, [checkNow]);

  const wasConnected = useRef(false);
  const everConnected = useRef(false);
  useEffect(() => {
    // Only a re-connection (open -> closed -> open) hints at a restart; the first open does not
    let recheck: ReturnType<typeof setTimeout> | undefined;
    if (connected && !wasConnected.current && everConnected.current) {
      lastCheck.current = 0;
      recheck = setTimeout(() => void checkNow(), 0);
    }
    if (connected) everConnected.current = true;
    wasConnected.current = connected;
    return () => clearTimeout(recheck);
  }, [connected, checkNow]);

  return { updateAvailable, checkNow };
}

/**
 * Loads the new deploy: asks the service worker to fetch the new sw.js
 * (skipWaiting + clientsClaim make it take over) and reloads the page.
 */
export async function reloadToNewVersion(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    await registration?.update();
  } catch {
    // No service worker (dev, unsupported): a plain reload is enough
  }
  window.location.reload();
}
