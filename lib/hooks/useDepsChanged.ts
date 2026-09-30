'use client';

import { useState } from 'react';

/**
 * True on the render where `deps` differ (Object.is, element-wise) from the
 * previous render, and on the first render. That render is immediately
 * re-run by React (the hook updates its own state), so the value is meant to
 * gate render-phase state updates, not to be rendered.
 *
 * Lets a component reset its own state when inputs change *during render*
 * (React's "adjusting state when a prop changes" pattern) instead of calling
 * setState inside an effect:
 *
 * ```tsx
 * const opened = useDepsChanged([isOpen]);
 * if (opened && isOpen) setName('');
 * ```
 */
export function useDepsChanged(deps: readonly unknown[]): boolean {
  const [prev, setPrev] = useState<readonly unknown[] | null>(null);
  const changed =
    prev === null || prev.length !== deps.length || deps.some((d, i) => !Object.is(d, prev[i]));
  if (changed) setPrev(deps);
  return changed;
}
