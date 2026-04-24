'use client';

import { useState, useEffect } from 'react';

export interface BudgetStats {
  window_seconds: number;
  current_window_requests: number;
  soft_limit: number;
  hard_limit: number;
  total_lifetime_requests: number;
  warning_count: number;
  utilization_percent: number;
  status: 'ok' | 'warning' | 'danger';
  message: string;
}

/**
 * useFritzBudgetStats
 *
 * Single-fetch hook for Fritz!Box API budget stats.
 * Fetches once on mount (NOT a polling hook).
 *
 * @returns { data, loading, error }
 */
export function useFritzBudgetStats(): {
  data: BudgetStats | null;
  loading: boolean;
  error: boolean;
} {
  const [data, setData] = useState<BudgetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/v1/fritzbox/budget-stats')
      .then((res) => res.json())
      .then((json: unknown) => {
        const body = json as { stats: BudgetStats };
        setData(body.stats);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}
