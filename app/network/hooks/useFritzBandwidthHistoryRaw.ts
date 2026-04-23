'use client';

import { useState, useEffect, useRef } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';

/**
 * Raw bandwidth record returned by /api/fritzbox/history/bandwidth.
 * Shape mirrors lib/fritzbox/fritzboxClient.ts:507-517 exactly.
 * NOTE: `timestamp` is Unix SECONDS — multiply by 1000 before constructing a Date.
 */
export interface BandwidthRawRecord {
  timestamp: number;
  bytes_sent: number;
  bytes_received: number;
  upstream_rate: number;
  downstream_rate: number;
  latency_ms: number | null;
  connection_uptime: number | null;
  external_ip: string | null;
  connection_type: string | null;
}

const HOURS_MAP: Record<'1h' | '24h' | '7d', number> = { '1h': 1, '24h': 24, '7d': 168 };
const PAGE_SIZE = 100;

interface UseFritzBandwidthHistoryRawOptions {
  paused?: boolean;
  hours?: '1h' | '24h' | '7d';
}

interface UseFritzBandwidthHistoryRawReturn {
  items: BandwidthRawRecord[];
  loading: boolean;
  stale: boolean;
  totalCount: number;
  page: number;
  setPage: (p: number) => void;
}

/**
 * useFritzBandwidthHistoryRaw (FRITZ-04)
 *
 * Polls /api/fritzbox/history/bandwidth with hours + limit/offset pagination.
 * - 60s cadence when visible, 300s when hidden (useAdaptivePolling + useVisibility).
 * - Pauses entirely when `paused: true` (tab inactive).
 * - Defensively re-fetches on paused→active transition (lazy-loaded tab UX).
 * - Degrades gracefully on non-OK response: sets stale=true, items=[], NEVER throws.
 * - Pitfall 2 guard: resets `page` to 0 when shrinking total_count crosses page boundary.
 */
export function useFritzBandwidthHistoryRaw(
  options: UseFritzBandwidthHistoryRawOptions = {}
): UseFritzBandwidthHistoryRawReturn {
  const { paused = false, hours = '24h' } = options;

  const [items, setItems] = useState<BandwidthRawRecord[]>([]);
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
      const res = await fetch(`/api/fritzbox/history/bandwidth?${params.toString()}`);
      if (!res.ok) {
        setStale(true);
        setItems([]);
        setTotalCount(0);
        return;
      }
      const json = await res.json() as { bandwidth: { items: BandwidthRawRecord[]; total_count: number } };
      setItems(json.bandwidth.items);
      setTotalCount(json.bandwidth.total_count);
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

  // Defensive paused→active re-fetch (Open Question #2 RESOLVED).
  // Ensures immediate data after user re-activates the lazy-loaded tab.
  useEffect(() => {
    if (!paused) void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  // Refetch + page reset when hours changes (skip first render).
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

  // Refetch when page changes (skip first render — handled by the shared ref above).
  useEffect(() => {
    if (isFirstRender.current) return;
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Pitfall 2: reset page to 0 if total shrinks past current page boundary.
  useEffect(() => {
    if (page > 0 && totalCount > 0 && page * PAGE_SIZE >= totalCount) {
      setPage(0);
    }
  }, [totalCount, page]);

  return { items, loading, stale, totalCount, page, setPage };
}
