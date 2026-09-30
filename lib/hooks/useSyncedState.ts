'use client';

import { useState, type Dispatch, type SetStateAction } from 'react';

/**
 * Local state seeded from a source value (typically server data) that resets
 * whenever the source changes, while staying freely editable in between
 * (e.g. a slider moved locally, then confirmed by a WS push).
 *
 * The reset happens during render (React's "adjusting state when a prop
 * changes" pattern) instead of in an effect, so there is no extra commit
 * showing the stale value.
 *
 * Pass `paused = true` to drop source changes (e.g. while the user drags):
 * they are skipped, not queued, so releasing does not snap back to a stale
 * value; the next change after resuming is applied.
 */
export function useSyncedState<T>(
  source: T,
  paused = false
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(source);
  const [seen, setSeen] = useState<T>(source);

  if (!Object.is(source, seen)) {
    setSeen(source);
    if (!paused) setValue(source);
  }

  return [value, setValue];
}
