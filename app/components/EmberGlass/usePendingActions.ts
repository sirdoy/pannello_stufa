'use client';

import { useRef, useState } from 'react';

/**
 * usePendingActions (ROADMAP M80) — tracks which commands of a card or sheet are running, so the
 * control that started one can show a spinner until it settles.
 *
 * Each command has a key (`'all'`, `` `light:${id}` ``). `run(key, action)` marks the key pending,
 * awaits the action and clears it, also when the action throws. A second `run` with a key that is
 * still pending is ignored: one tap, one command.
 *
 * RC-clean — no manual memoization hooks (React Compiler discipline).
 */
export interface PendingActions {
  /** True while the command with this key is running */
  isPending: (key: string) => boolean;
  /** True while any command is running */
  anyPending: boolean;
  run: (key: string, action: () => unknown) => Promise<void>;
}

export function usePendingActions(): PendingActions {
  const [pending, setPending] = useState<ReadonlySet<string>>(() => new Set());
  // The ref answers "is it already running?" inside the same tick, before the state update lands.
  const running = useRef<Set<string>>(new Set());

  const run = async (key: string, action: () => unknown) => {
    if (running.current.has(key)) return;
    running.current.add(key);
    setPending(new Set(running.current));
    try {
      await action();
    } finally {
      running.current.delete(key);
      setPending(new Set(running.current));
    }
  };

  return {
    isPending: (key) => pending.has(key),
    anyPending: pending.size > 0,
    run,
  };
}
