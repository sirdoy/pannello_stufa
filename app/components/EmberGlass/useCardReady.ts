'use client';

import { useContext, useEffect, useState } from 'react';
import { WebSocketContext } from '@/app/context/WebSocketContext';
import type { Topic } from '@/types/websocket';

/** Upper bound for the loading skeleton when the first data never arrives. */
export const CARD_READY_TIMEOUT_MS = 8000;

/**
 * useCardReady — ROADMAP M15 / M16.
 *
 * Gates a dashboard card behind its first fresh data (REST response or WS
 * snapshot): returns false while `ready` is false, so the card renders
 * `GlassCardSkeleton` instead of placeholder values ("0%", "Spenta", "0 di 0").
 *
 * - Latches: once ready, later reloads (polling, WS reconnect) never bring the
 *   skeleton back.
 * - Resume (M16): with a `topic`, after the WS manager forces a fresh connection
 *   on return to foreground, returns false again until that topic receives a
 *   frame on the new connection — the data on screen may be minutes old.
 * - Safety timeout: after `timeoutMs` (from mount or from the resume) the card
 *   renders anyway, so a missing snapshot (empty backend cache) cannot leave it
 *   loading forever.
 */
export function useCardReady(
  ready: boolean,
  topic?: Topic,
  timeoutMs: number = CARD_READY_TIMEOUT_MS,
): boolean {
  const [latched, setLatched] = useState(ready);
  if (ready && !latched) setLatched(true);

  useEffect(() => {
    if (latched) return;
    const id = setTimeout(() => setLatched(true), timeoutMs);
    return () => clearTimeout(id);
  }, [latched, timeoutMs]);

  // Nullable on purpose: cards render without a provider in unit tests.
  const ws = useContext(WebSocketContext);
  const resumeEpoch = ws?.resumeEpoch ?? 0;
  const topicEpoch = topic ? ws?.topicEpochs?.get(topic) : undefined;
  const [timedOutEpoch, setTimedOutEpoch] = useState(0);
  const awaitingResume =
    topic !== undefined && resumeEpoch > 0 && topicEpoch !== resumeEpoch && timedOutEpoch !== resumeEpoch;

  useEffect(() => {
    if (!awaitingResume) return;
    const id = setTimeout(() => setTimedOutEpoch(resumeEpoch), timeoutMs);
    return () => clearTimeout(id);
  }, [awaitingResume, resumeEpoch, timeoutMs]);

  return (latched || ready) && !awaitingResume;
}
