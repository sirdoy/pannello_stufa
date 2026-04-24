'use client';

import { useState, useEffect, useRef } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';

/**
 * Raw device-event record returned by /api/v1/fritzbox/history/device-events.
 * Shape mirrors lib/fritzbox/fritzboxClient.ts:526-532.
 * NOTE: `timestamp` is Unix SECONDS — multiply by 1000 before constructing a Date.
 */
export interface DeviceEventRawRecord {
  timestamp: number;
  mac: string;
  name: string;
  ip: string;
  event_type: 'connected' | 'disconnected';
}

const HOURS_MAP: Record<'1h' | '24h' | '7d', number> = { '1h': 1, '24h': 24, '7d': 168 };
const PAGE_SIZE = 100;

interface UseFritzDeviceEventsRawOptions {
  paused?: boolean;
  hours?: '1h' | '24h' | '7d';
}

interface UseFritzDeviceEventsRawReturn {
  items: DeviceEventRawRecord[];
  loading: boolean;
  stale: boolean;
  totalCount: number;
  page: number;
  setPage: (p: number) => void;
}

/**
 * useFritzDeviceEventsRaw (FRITZ-06)
 *
 * Polls /api/v1/fritzbox/history/device-events with hours + limit/offset pagination.
 * Never sends a `mac` filter param here (the UI has no per-device filter on Storico tab).
 * - Defensive paused→active re-fetch for lazy-loaded tab UX.
 * - Pitfall 2 guard: resets `page` when total shrinks past current page.
 */
export function useFritzDeviceEventsRaw(
  options: UseFritzDeviceEventsRawOptions = {}
): UseFritzDeviceEventsRawReturn {
  const { paused = false, hours = '24h' } = options;

  const [items, setItems] = useState<DeviceEventRawRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);

  const isVisible = useVisibility();
  const interval = paused ? null : (isVisible ? 60000 : 300000);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams({
        hours: String(HOURS_MAP[hours]),
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      });
      const res = await fetch(`/api/v1/fritzbox/history/device-events?${params.toString()}`);
      if (!res.ok) {
        setStale(true);
        setItems([]);
        setTotalCount(0);
        return;
      }
      const json = await res.json() as { events: { items: DeviceEventRawRecord[]; total_count: number } };
      setItems(json.events.items);
      setTotalCount(json.events.total_count);
      setStale(false);
    } catch {
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

  // Refetch + page reset when hours changes.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setPage(0);
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hours]);

  // Refetch when page changes.
  useEffect(() => {
    if (isFirstRender.current) return;
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Pitfall 2: reset page when total shrinks past current boundary.
  useEffect(() => {
    if (page > 0 && totalCount > 0 && page * PAGE_SIZE >= totalCount) {
      setPage(0);
    }
  }, [totalCount, page]);

  return { items, loading, stale, totalCount, page, setPage };
}
