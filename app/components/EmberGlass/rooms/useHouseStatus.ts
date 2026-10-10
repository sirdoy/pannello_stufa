'use client';

import { useRef, useState } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { isFetchInterrupted } from '@/lib/utils/fetchInterruption';
import type { HouseStatusResponse, RoomStatusResponse } from '@/types/rooms';

/**
 * useHouseStatus (ROADMAP M84) — rooms of the Pi with the devices assigned to each one
 * (`GET /api/rooms/house/status`).
 *
 * The room layout changes only when someone edits it, so one read a minute is enough: the live
 * state of the devices comes from the provider hooks. A failed refresh keeps the last layout read.
 */
export interface UseHouseStatusReturn {
  rooms: RoomStatusResponse[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const REFRESH_MS = 60_000;

export function useHouseStatus(): UseHouseStatusReturn {
  const [rooms, setRooms] = useState<RoomStatusResponse[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasData = useRef(false);

  const refetch = async () => {
    try {
      const res = await fetch('/api/rooms/house/status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as HouseStatusResponse;
      hasData.current = true;
      setRooms(body.rooms ?? []);
      setError(null);
    } catch (err) {
      if (isFetchInterrupted(err)) return;
      // Keep the last layout read: the error is shown only when there is nothing to show
      if (!hasData.current) setError('Stanze non disponibili');
    } finally {
      setLoading(false);
    }
  };

  useAdaptivePolling({ callback: refetch, interval: REFRESH_MS, immediate: true });

  return { rooms, loading, error, refetch };
}
