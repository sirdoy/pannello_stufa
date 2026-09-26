'use client';
/**
 * useAutomationHistory — execution log of one rule, newest first.
 *
 * GET /api/v1/automations/{rule_id}/history (Next proxy → backend, paginated
 * `{items, total_count}`); `loadMore` appends the next page.
 */
import { useCallback, useEffect, useState } from 'react';
import type { AutomationExecution } from '@/types/automations';

export const HISTORY_PAGE_SIZE = 20;

export interface AutomationHistoryResult {
  items: AutomationExecution[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  reload: () => void;
}

interface HistoryPage {
  items?: AutomationExecution[];
  total_count?: number;
}

export function useAutomationHistory(ruleId: number): AutomationHistoryResult {
  const [items, setItems] = useState<AutomationExecution[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (offset: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/v1/automations/${ruleId}/history?limit=${HISTORY_PAGE_SIZE}&offset=${offset}`,
        );
        if (!res.ok) throw new Error('Errore nel caricamento dello storico');
        const page = (await res.json()) as HistoryPage;
        const pageItems = page.items ?? [];
        setItems((prev) => (offset === 0 ? pageItems : [...prev, ...pageItems]));
        setTotalCount(page.total_count ?? 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      } finally {
        setLoading(false);
      }
    },
    [ruleId],
  );

  useEffect(() => {
    void fetchPage(0);
  }, [fetchPage]);

  return {
    items,
    totalCount,
    loading,
    error,
    hasMore: items.length < totalCount,
    loadMore: () => void fetchPage(items.length),
    reload: () => void fetchPage(0),
  };
}
