'use client';

import { useEffect, useRef, useState } from 'react';
import { useDebounce } from '@/app/hooks/useDebounce';

/**
 * useSyncedSetting — a numeric setting (setpoint, brightness, volume) edited locally and sent once
 * the taps stop (ROADMAP M84).
 *
 * The local value follows the device: when a new reading arrives and the user is not editing, the
 * control shows it (a change made by the schedule or from another client). A value is sent when
 * it differs from the last one sent or read, so going back to the old value right after a command
 * sends that too.
 */
export interface SyncedSettingOptions {
  /** Value read from the device */
  serverValue: number;
  delayMs: number;
  /** False while the command cannot be sent (ids missing, device off) */
  enabled: boolean;
  /** True while a command is in progress: the reading is not applied over it */
  busy: boolean;
  send: (value: number) => void;
}

export function useSyncedSetting({ serverValue, delayMs, enabled, busy, send }: SyncedSettingOptions) {
  const [value, setValue] = useState(serverValue);
  const [synced, setSynced] = useState(serverValue);
  const lastSent = useRef(serverValue);
  const debounced = useDebounce(value, delayMs);

  // New reading and no edit in progress: adopt it (state adjusted during render)
  if (serverValue !== synced && value === debounced && !busy) {
    setSynced(serverValue);
    setValue(serverValue);
  }

  useEffect(() => {
    lastSent.current = synced;
  }, [synced]);

  useEffect(() => {
    if (!enabled) return;
    if (debounced === lastSent.current) return;
    lastSent.current = debounced;
    send(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return [value, setValue] as const;
}
