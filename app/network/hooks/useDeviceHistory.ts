'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DeviceEvent, DeviceHistoryTimeRange } from '@/app/components/devices/network/types';

export interface UseDeviceHistoryReturn {
  events: DeviceEvent[];
  timeRange: DeviceHistoryTimeRange;
  setTimeRange: (range: DeviceHistoryTimeRange) => void;
  deviceFilter: string | null;
  setDeviceFilter: (mac: string | null) => void;
  isLoading: boolean;
  isEmpty: boolean;
  refresh: () => Promise<void>;
}

/**
 * useDeviceHistory Hook
 *
 * Fetches device connection/disconnection events from Fritz!Box history API.
 * Supports filtering by time range and device MAC address.
 *
 * @returns {UseDeviceHistoryReturn} Hook interface with events, controls, and status
 */
export function useDeviceHistory(): UseDeviceHistoryReturn {
  const [events, setEvents] = useState<DeviceEvent[]>([]);
  const [timeRange, setTimeRange] = useState<DeviceHistoryTimeRange>('24h');
  const [deviceFilter, setDeviceFilter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);

    try {
      // Build query params
      const params = new URLSearchParams();
      params.append('range', timeRange);
      if (deviceFilter) {
        params.append('device', deviceFilter);
      }

      const response = await fetch(`/api/fritzbox/history?${params}`);
      const data = await response.json();

      if (data.success && data.data?.events) {
        setEvents(data.data.events);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Failed to fetch device history:', error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, deviceFilter]);

  // Fetch events when filters change
  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    timeRange,
    setTimeRange,
    deviceFilter,
    setDeviceFilter,
    isLoading,
    isEmpty: events.length === 0,
    refresh: fetchEvents,
  };
}
