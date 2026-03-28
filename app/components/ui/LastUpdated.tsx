'use client';

import { useRelativeTime } from '@/lib/hooks/useRelativeTime';
import { cn } from '@/lib/utils/cn';

interface LastUpdatedProps {
  /** Timestamp in milliseconds (e.g. Date.now()), or null to render nothing */
  tsMs: number | null;
  className?: string;
}

/**
 * Presentational component for card footer timestamps.
 *
 * Renders an Italian "Aggiornato {relative}" string that auto-updates every 10s.
 * Returns null when tsMs is null (data not yet loaded).
 *
 * @example
 * <LastUpdated tsMs={lastFetchedAt} className="mt-2" />
 */
export function LastUpdated({ tsMs, className }: LastUpdatedProps) {
  const relative = useRelativeTime(tsMs);
  if (!relative) return null;
  return (
    <p className={cn('text-xs text-slate-500 dark:text-slate-400', className)}>
      Aggiornato {relative}
    </p>
  );
}
