'use client';

import { useState, useCallback } from 'react';
import type { SonosQueueItemResponse, SonosQueueResponse } from '@/types/sonosProxy';

const QUEUE_PAGE_SIZE = 20;

export interface UseSonosQueueReturn {
  items: SonosQueueItemResponse[];
  total: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  fetchInitial: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export function useSonosQueue(groupId: string): UseSonosQueueReturn {
  const [items, setItems] = useState<SonosQueueItemResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async (pageOffset: number, append: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/sonos/zones/${groupId}/queue?limit=${QUEUE_PAGE_SIZE}&offset=${pageOffset}`
      );
      if (!res.ok) throw new Error('Queue non disponibile');
      const data = (await res.json()) as SonosQueueResponse;
      setItems(prev => append ? [...prev, ...data.items] : data.items);
      setTotal(data.total);
      setOffset(pageOffset + data.items.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore coda');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const fetchInitial = useCallback(() => fetchPage(0, false), [fetchPage]);
  const loadMore = useCallback(() => fetchPage(offset, true), [fetchPage, offset]);
  const hasMore = items.length < total;

  return { items, total, loading, error, hasMore, fetchInitial, loadMore };
}
