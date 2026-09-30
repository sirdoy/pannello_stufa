'use client';

import { useState, useEffect } from 'react';

/**
 * Converts a timestamp (ms) into a human-readable Italian relative string.
 *
 * - < 5 seconds  → "Adesso"
 * - < 60 seconds → "{n}s fa"
 * - < 60 minutes → "{n}m fa"
 * - otherwise    → "{n}h fa"
 */
export function formatRelativeTime(tsMs: number): string {
  const diffSeconds = Math.floor((Date.now() - tsMs) / 1000);
  if (diffSeconds < 5) return 'Adesso';
  if (diffSeconds < 60) return `${diffSeconds}s fa`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m fa`;
  const diffHours = Math.floor(diffMinutes / 60);
  return `${diffHours}h fa`;
}

/**
 * React hook that returns a live-updating Italian relative time string.
 *
 * Returns null when tsMs is null. Refreshes every 10 seconds via setInterval
 * and clears the interval on unmount.
 *
 * @param tsMs - Timestamp in milliseconds (e.g. Date.now()), or null
 */
export function useRelativeTime(tsMs: number | null): string | null {
  // The string is derived at render time; the interval only forces a re-render
  const [, setTick] = useState(0);

  useEffect(() => {
    if (tsMs === null) return;
    const id = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(id);
  }, [tsMs]);

  return tsMs !== null ? formatRelativeTime(tsMs) : null;
}
