'use client';

import { useState, useEffect } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';

/**
 * Raw device presence record returned by /api/fritzbox/history/devices.
 * Shape mirrors lib/fritzbox/fritzboxClient.ts:541-547.
 * NOTE: `timestamp` is Unix SECONDS — multiply by 1000 before constructing a Date.
 */
export interface DevicePresenceRecord {
  timestamp: number;
  mac: string;
  name: string;
  ip: string;
  is_online: boolean;
}

const PAGE_SIZE = 100;

interface UseFritzDevicePresenceHistoryOptions {
  paused?: boolean;
}

interface UseFritzDevicePresenceHistoryReturn {
  items: DevicePresenceRecord[];
  loading: boolean;
  stale: boolean;
  notFound: boolean;
  totalCount: number;
  page: number;
  setPage: (p: number) => void;
}

/**
 * useFritzDevicePresenceHistory (FRITZ-05)
 *
 * Polls /api/fritzbox/history/devices (presence log). Per phase 162 D-05, the HA proxy
 * may NOT expose this endpoint — when it returns 404 the hook sets `notFound: true` and
 * NEVER throws. Consumers render a friendly "endpoint unavailable" message in that state.
 *
 * - No `hours` param (endpoint does not support it).
 * - Defensive paused→active re-fetch for lazy-loaded tab UX.
 * - Pitfall 2 guard: resets `page` when total shrinks past current page.
 */
export function useFritzDevicePresenceHistory(
  options: UseFritzDevicePresenceHistoryOptions = {}
): UseFritzDevicePresenceHistoryReturn {
  const { paused = false } = options;

  const [items, setItems] = useState<DevicePresenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);

  const isVisible = useVisibility();
  const interval = paused ? null : (isVisible ? 60000 : 300000);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      });
      const res = await fetch(`/api/fritzbox/history/devices?${params.toString()}`);
      if (!res.ok) {
        setStale(true);
        setItems([]);
        setTotalCount(0);
        if (res.status === 404) setNotFound(true);
        return;
      }
      const json = await res.json() as { devices: { items: DevicePresenceRecord[]; total_count: number } };
      setItems(json.devices.items);
      setTotalCount(json.devices.total_count);
      setStale(false);
      setNotFound(false);
    } catch {
      // Never throw — treat network errors as stale.
      setStale(true);
      setItems([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useAdaptivePolling({
    callback: fetchData,
    interval,
    alwaysActive: false,
    immediate: true,
    initialDelay: 0,
  });

  // Defensive paused→active re-fetch.
  useEffect(() => {
    if (!paused) void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  // Refetch when page changes.
  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Pitfall 2: reset page when total shrinks past current boundary.
  useEffect(() => {
    if (page > 0 && totalCount > 0 && page * PAGE_SIZE >= totalCount) {
      setPage(0);
    }
  }, [totalCount, page]);

  return { items, loading, stale, notFound, totalCount, page, setPage };
}
