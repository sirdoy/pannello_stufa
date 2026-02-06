'use client';

import { useState, useEffect, useCallback } from 'react';
import { NETATMO_ROUTES } from '@/lib/routes';

/**
 * Hook for fetching and managing Netatmo schedule data
 *
 * Provides schedule data with loading/error states and cache awareness.
 * Automatically fetches on mount, exposes refetch for manual refresh.
 *
 * @returns {Object} Schedule data state and utilities
 * @returns {Array} schedules - List of all schedules
 * @returns {Object|null} activeSchedule - Currently active schedule (where selected=true)
 * @returns {boolean} loading - Whether initial fetch is in progress
 * @returns {string|null} error - Error message if fetch failed
 * @returns {string|null} source - Data source: 'cache' | 'api' | null
 * @returns {Function} refetch - Manually trigger schedule data refresh
 *
 * @example
 * const { schedules, activeSchedule, loading, error, refetch } = useScheduleData();
 *
 * if (loading) return <Spinner />;
 * if (error) return <ErrorBanner message={error} onRetry={refetch} />;
 *
 * return (
 *   <div>
 *     <h2>Active: {activeSchedule.name}</h2>
 *     <ScheduleList schedules={schedules} />
 *   </div>
 * );
 */
export function useScheduleData(): { schedules: unknown[]; activeSchedule: unknown | null; loading: boolean; error: string | null; source: string | null; refetch: () => Promise<void> } {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState(null); // 'cache' | 'api'

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(NETATMO_ROUTES.schedules);

      // Parse response body
      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        throw new Error('Errore nel parsing della risposta');
      }

      if (!res.ok) {
        // Handle rate limit errors specially
        if (res.status === 429) {
          const retryAfter = data.retryAfter || 60;
          throw new Error(
            `Limite API raggiunto. Riprova tra ${retryAfter} secondi.`
          );
        }

        throw new Error(data.message || data.error || 'Errore nel caricamento dei programmi');
      }

      setSchedules(data.schedules || []);
      setSource(data._source);
    } catch (err) {
      setError(err.message);
      console.error('[useScheduleData] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Derive active schedule from schedules array
  const activeSchedule = schedules.find(s => s.selected) || null;

  return {
    schedules,
    activeSchedule,
    loading,
    error,
    source,
    refetch: fetchSchedules,
  };
}

export default useScheduleData;
