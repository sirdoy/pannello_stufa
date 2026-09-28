'use client';

import { useEffect, useState } from 'react';

/** Upper bound for the loading skeleton when the first data never arrives. */
export const CARD_READY_TIMEOUT_MS = 8000;

/**
 * useCardReady — ROADMAP M15.
 *
 * Gates a dashboard card behind its first fresh data (REST response or WS
 * snapshot): returns false while `ready` is false, so the card renders
 * `GlassCardSkeleton` instead of placeholder values ("0%", "Spenta", "0 di 0").
 *
 * - Latches: once ready, later reloads (polling, WS reconnect) never bring the
 *   skeleton back.
 * - Safety timeout: after `timeoutMs` the card renders anyway, so a missing
 *   snapshot (empty backend cache) cannot leave it loading forever.
 */
export function useCardReady(ready: boolean, timeoutMs: number = CARD_READY_TIMEOUT_MS): boolean {
  const [latched, setLatched] = useState(ready);

  if (ready && !latched) setLatched(true);

  useEffect(() => {
    if (latched) return;
    const id = setTimeout(() => setLatched(true), timeoutMs);
    return () => clearTimeout(id);
  }, [latched, timeoutMs]);

  return latched || ready;
}
