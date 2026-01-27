'use client';
import { useState, useEffect, useCallback } from 'react';
import { NETATMO_ROUTES } from '@/lib/routes';

/**
 * useRoomStatus - Fetch rooms with current temperature/setpoint
 *
 * Returns rooms from homestatus API enriched with status info.
 */
export function useRoomStatus() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(NETATMO_ROUTES.homeStatus);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to fetch rooms');
      }

      // Transform to room selector format
      const roomList = (data.rooms || []).map(room => ({
        id: room.room_id,
        name: room.room_name,
        temperature: room.temperature,
        setpoint: room.setpoint,
        mode: room.mode,
        heating: room.heating,
      }));

      setRooms(roomList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return {
    rooms,
    loading,
    error,
    refetch: fetchRooms,
  };
}
