'use client';

import { useEffect, useRef, useState } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';

export const PAGE_SIZE = 50;

export interface CallRecord {
  id: string;
  call_type: string; // 'incoming' | 'outgoing' | 'missed' | 'voicemail' | unknown
  number: string;
  name: string | null;
  duration_seconds: number;
  timestamp: number; // Unix SECONDS (Pitfall 6 — *1000 for Date)
  port: string | null;
}

interface UseFritzCallHistoryOptions {
  paused?: boolean;
}

/**
 * useFritzCallHistory
 *
 * Polls /api/fritzbox/telephony/calls (FRITZ-02).
 * Server-paginated (50/page) via limit/offset URLSearchParams.
 * Pitfall 2: resets page to 0 if current offset is beyond a shrunken total_count.
 * Defensive paused->active re-fetch (Open Question #2 RESOLVED).
 */
export function useFritzCallHistory(options: UseFritzCallHistoryOptions = {}): {
  calls: CallRecord[];
  loading: boolean;
  stale: boolean;
  totalCount: number;
  page: number;
  setPage: (p: number) => void;
} {
  const { paused = false } = options;

  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);

  const isVisible = useVisibility();
  const interval = paused ? null : (isVisible ? 60000 : 300000);

  const fetchData = async (): Promise<void> => {
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      });
      const res = await fetch(`/api/fritzbox/telephony/calls?${params.toString()}`);
      if (!res.ok) {
        setStale(true);
        setCalls([]);
        setTotalCount(0);
        return;
      }
      const json = (await res.json()) as {
        calls: { items: CallRecord[]; total_count: number; limit: number; offset: number };
      };
      setCalls(json.calls.items);
      setTotalCount(json.calls.total_count);
      setStale(false);
    } catch {
      setStale(true);
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

  // Re-fetch on page change (skip first render — immediate already fetched).
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Pitfall 2 — pagination reset on shrink: if the current page offset is
  // beyond the new total_count, reset to page 0.
  useEffect(() => {
    if (page > 0 && totalCount > 0 && page * PAGE_SIZE >= totalCount) {
      setPage(0);
    }
  }, [totalCount, page]);

  // Defensive paused->active re-fetch (Open Question #2 RESOLVED).
  useEffect(() => {
    if (!paused) void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  return { calls, loading, stale, totalCount, page, setPage };
}
