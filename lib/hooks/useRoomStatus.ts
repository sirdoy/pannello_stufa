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

/**
 * Consumer-facing room list item shape (what setRooms emits).
 *
 * Mapped from v1 /homestatus raw-proxy response rooms:
 * - setpoint ← therm_setpoint_temperature (nullable)
 * - heating ← (heating_power_request ?? 0) > 0
 * - mode: ALWAYS null (v1 does not expose room mode — legacy enriched it from Firebase topology).
 * - endtime: ALWAYS null (v1 does not expose override endtime).
 *
 * Consumer impact documented in 168-RESEARCH.md Open Q1 RESOLVED + 168-DEFERRED.md
 * (stoveSync/topology regression). Downstream consumers (ActiveOverrideBadge,
 * ManualOverrideSheet, thermostat/schedule/page) already guard via `mode === 'manual'`
 * and `endtime ?` ternaries — null-fallback is safe without consumer rewrites.
 */
interface RoomListItem {
  id: string;
  name: string;
  temperature: number | null;
  setpoint: number | null;
  mode: string | null;
  heating: boolean;
  endtime: number | null;
}

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
      // Phase 168 D-04: /api/v1/netatmo/homestatus returns raw-proxy shape
      // (no legacy enrichment for mode/endtime/modules/battery fields).
      const data = await res.json() as {
        rooms?: Array<{
          room_id: string;
          room_name: string;
          temperature: number | null;
          therm_setpoint_temperature: number | null;
          heating_power_request: number | null;
          timestamp?: number;
        }>;
        code?: string;
        message?: string;
        error?: string;
      };

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
          data.message ||
          data.error ||
          'Failed to fetch rooms'
        );
      }

      // Transform v1 /homestatus rooms directly to the { id, name, ... } shape consumers expect.
      // v1 response does NOT include legacy fields (mode, endtime) — set to null; consumers
      // already null-guard via `r.mode === 'manual'` and `room.endtime ? ...` ternaries.
      // See 168-RESEARCH.md Open Q1 RESOLVED + 168-DEFERRED.md for the stoveSync/topology regression.
      const typedRooms = data.rooms ?? [];
      const roomList: RoomListItem[] = typedRooms.map((r) => ({
        id: r.room_id,
        name: r.room_name,
        temperature: r.temperature,
        // v1: therm_setpoint_temperature → legacy consumer field: setpoint
        setpoint: r.therm_setpoint_temperature ?? null,
        // v1 does not emit mode; null-fallback (consumers guard via `=== 'manual'`).
        mode: null,
        // v1: heating_power_request (0..100) → legacy: heating (boolean). Any non-zero power = heating.
        heating: (r.heating_power_request ?? 0) > 0,
        // v1 does not emit endtime; null-fallback (consumers guard with truthy check).
        endtime: null,
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
