'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { NETATMO_ROUTES } from '@/lib/routes';

/**
 * Hook for fetching and managing Netatmo schedule data
 *
 * Provides schedule data with loading/error states and cache awareness.
 * Automatically fetches on mount, exposes refetch for manual refresh.
 *
 * Handles transient 503 SERVICE_UNAVAILABLE responses (proxy topology not yet
 * ready) by retrying up to MAX_RETRIES times with RETRY_DELAY_MS between
 * attempts, keeping the loading state active during retries. Only surfaces an
 * error after all retries are exhausted or on a permanent failure code.
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

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3_000;

interface Schedule {
  selected?: boolean;
  [key: string]: unknown;
}

export function useScheduleData(): { schedules: Schedule[]; activeSchedule: Schedule | null; homeId: string | null; loading: boolean; error: string | null; source: string | null; refetch: () => Promise<void> } {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [homeId, setHomeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null); // 'cache' | 'api'

  // Track retry count across calls without triggering re-renders
  const retryCountRef = useRef(0);
  // Track the active retry timeout so we can clear it on unmount
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSchedules = useCallback(async (isRetry = false) => {
    if (!isRetry) {
      // Reset retry counter on explicit (non-retry) invocations
      retryCountRef.current = 0;
    }

    setLoading(true);
    setError(null);

    let retryScheduled = false;

    try {
      const res = await fetch(NETATMO_ROUTES.schedules);

      // Parse response body
      let data: Record<string, unknown>;
      try {
        data = await res.json();
      } catch {
        throw new Error('Errore nel parsing della risposta');
      }

      if (!res.ok) {
        // Handle rate limit errors specially
        if (res.status === 429) {
          const retryAfter = (data.retryAfter as number) || 60;
          throw new Error(
            `Limite API raggiunto. Riprova tra ${retryAfter} secondi.`
          );
        }

        // Handle transient "topology not yet ready" (503 SERVICE_UNAVAILABLE)
        // The proxy returns this during its warm-up phase before the first poll completes.
        // Stay in loading state and retry rather than surfacing an error to the user.
        if (res.status === 503 || data.code === 'SERVICE_UNAVAILABLE') {
          if (retryCountRef.current < MAX_RETRIES) {
            retryCountRef.current += 1;
            console.info(
              `[useScheduleData] Proxy not ready yet, retrying (${retryCountRef.current}/${MAX_RETRIES}) in ${RETRY_DELAY_MS}ms`
            );
            retryScheduled = true;
            retryTimeoutRef.current = setTimeout(() => {
              retryTimeoutRef.current = null;
              fetchSchedules(true);
            }, RETRY_DELAY_MS);
            // Keep loading: true — return without setting error
            return;
          }
          // Max retries exhausted — always use a user-friendly message
          throw new Error('Servizio Netatmo non disponibile, riprova più tardi');
        }

        throw new Error(
          (data.message as string) ||
          (data.error as string) ||
          'Errore nel caricamento dei programmi'
        );
      }

      setSchedules((data.schedules as Schedule[]) || []);
      setHomeId((data.home_id as string) || null);
      setSource(data._source as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('[useScheduleData] Fetch error:', err);
    } finally {
      // Only clear loading state when we are NOT waiting for a retry
      if (!retryScheduled) {
        setLoading(false);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Wrapper exposed to consumers: always resets retry state
  const refetch = useCallback(async () => {
    if (retryTimeoutRef.current !== null) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    retryCountRef.current = 0;
    await fetchSchedules(false);
  }, [fetchSchedules]);

  // Initial fetch on mount
  useEffect(() => {
    fetchSchedules(false);
    return () => {
      // Cancel any pending retry on unmount
      if (retryTimeoutRef.current !== null) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [fetchSchedules]);

  // Derive active schedule from schedules array
  const activeSchedule = schedules.find(s => s.selected) || null;

  return {
    schedules,
    activeSchedule,
    homeId,
    loading,
    error,
    source,
    refetch,
  };
}

export default useScheduleData;
