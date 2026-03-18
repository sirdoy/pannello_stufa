'use client';
import { useState, useEffect, useRef } from 'react';
import { NETATMO_ROUTES } from '@/lib/routes';

/**
 * useRoomStatus - Fetch rooms with current temperature/setpoint
 *
 * Returns rooms from homestatus API enriched with status info.
 *
 * Handles transient 503 SERVICE_UNAVAILABLE responses (proxy topology not yet
 * ready) by retrying up to MAX_RETRIES times with RETRY_DELAY_MS between
 * attempts, keeping the loading state active during retries.
 */

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3_000;

export function useRoomStatus(): { rooms: unknown[]; loading: boolean; error: string | null; fetchRooms: () => Promise<void>; refetch: () => Promise<void> } {
  const [rooms, setRooms] = useState<unknown[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Track retry count across calls without triggering re-renders
  const retryCountRef = useRef(0);
  // Track the active retry timeout so we can clear it on unmount
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchRooms = async (isRetry = false) => {
    if (!isRetry) {
      retryCountRef.current = 0;
    }

    setLoading(true);
    setError(null);

    let retryScheduled = false;

    try {
      const res = await fetch(NETATMO_ROUTES.homeStatus);
      const data = await res.json() as Record<string, unknown>;

      if (!res.ok) {
        // Handle transient "topology not yet ready" (503 SERVICE_UNAVAILABLE)
        // The proxy returns this during its warm-up phase before the first poll completes.
        if (res.status === 503 || data.code === 'SERVICE_UNAVAILABLE') {
          if (retryCountRef.current < MAX_RETRIES) {
            retryCountRef.current += 1;
            console.info(
              `[useRoomStatus] Proxy not ready yet, retrying (${retryCountRef.current}/${MAX_RETRIES}) in ${RETRY_DELAY_MS}ms`
            );
            retryScheduled = true;
            retryTimeoutRef.current = setTimeout(() => {
              retryTimeoutRef.current = null;
              fetchRooms(true);
            }, RETRY_DELAY_MS);
            return;
          }
          // Max retries exhausted — always use a user-friendly message
          throw new Error('Servizio Netatmo non disponibile, riprova più tardi');
        }

        throw new Error(
          (data.message as string) ||
          (data.error as string) ||
          'Failed to fetch rooms'
        );
      }

      // Transform to room selector format
      const roomList = (data.rooms as any[] || []).map((room: any) => ({
        id: room.room_id,
        name: room.room_name,
        temperature: room.temperature,
        setpoint: room.setpoint,
        mode: room.mode,
        heating: room.heating,
        endtime: room.endtime, // UNIX timestamp (seconds) when manual override ends
      }));

      setRooms(roomList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      if (!retryScheduled) {
        setLoading(false);
      }
    }
  };

  // Wrapper exposed to consumers: always resets retry state
  const refetch = async () => {
    if (retryTimeoutRef.current !== null) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    retryCountRef.current = 0;
    await fetchRooms(false);
  };

  useEffect(() => {
    fetchRooms(false);
    return () => {
      if (retryTimeoutRef.current !== null) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    rooms,
    loading,
    error,
    fetchRooms: refetch,
    refetch,
  };
}
