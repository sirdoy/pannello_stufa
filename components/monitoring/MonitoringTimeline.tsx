'use client';

import { useState, useEffect, useCallback } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Card, Text, Skeleton, EmptyState } from '@/app/components/ui';
import HealthEventItem from './HealthEventItem';
import EventFilters from './EventFilters';

const MAX_EVENTS = 200; // Memory safeguard

interface HealthEvent {
  id: string;
  timestamp: string;
  hasStateMismatch: boolean;
  failureCount: number;
  checkedCount: number;
  successCount: number;
  duration: number;
  mismatchDetails?: string[];
}

interface EventsResponse {
  events: HealthEvent[];
  cursor: string | null;
  hasMore: boolean;
}

export default function MonitoringTimeline() {
  const [events, setEvents] = useState<HealthEvent[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  const isFiltered = typeFilter || severityFilter;

  // Fetch events
  const fetchEvents = useCallback(async (resetList = false) => {
    try {
      const params = new URLSearchParams({
        limit: '50',
      });

      if (!resetList && cursor) {
        params.set('cursor', cursor);
      }
      if (typeFilter) {
        params.set('type', typeFilter);
      }
      if (severityFilter) {
        params.set('severity', severityFilter);
      }

      const res = await fetch(`/api/health-monitoring/logs?${params}`);

      if (!res.ok) {
        throw new Error('Errore nel caricamento degli eventi');
      }

      const data: EventsResponse = await res.json();

      if (resetList) {
        setEvents(data.events);
      } else {
        setEvents(prev => [...prev, ...data.events]);
      }

      setCursor(data.cursor);

      // Check if we've hit max or no more data
      const totalAfter = resetList
        ? data.events.length
        : events.length + data.events.length;

      setHasMore(data.hasMore && totalAfter < MAX_EVENTS);
      setError(null);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [cursor, typeFilter, severityFilter, events.length]);

  // Initial load and filter changes
  useEffect(() => {
    setIsLoading(true);
    fetchEvents(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, severityFilter]); // Reset on filter change

  // Handle filter changes
  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
    setCursor(null);
    setEvents([]);
    setHasMore(true);
    setIsLoading(true);
  };

  const handleSeverityChange = (value: string) => {
    setSeverityFilter(value);
    setCursor(null);
    setEvents([]);
    setHasMore(true);
    setIsLoading(true);
  };

  // Loading state
  if (isLoading && events.length === 0) {
    return (
      <div className="space-y-4">
        <EventFilters
          type={typeFilter}
          severity={severityFilter}
          onTypeChange={handleTypeChange}
          onSeverityChange={handleSeverityChange}
        />
        <Card variant="glass">
          <div className="divide-y divide-slate-700/50 [html:not(.dark)_&]:divide-slate-200">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (error && events.length === 0) {
    return (
      <div className="space-y-4">
        <EventFilters
          type={typeFilter}
          severity={severityFilter}
          onTypeChange={handleTypeChange}
          onSeverityChange={handleSeverityChange}
        />
        <Card variant="glass" className="p-8 text-center">
          <Text variant="ember" size="lg" className="mb-2">
            {error}
          </Text>
        </Card>
      </div>
    );
  }

  // Empty state
  if (!isLoading && events.length === 0) {
    return (
      <div className="space-y-4">
        <EventFilters
          type={typeFilter}
          severity={severityFilter}
          onTypeChange={handleTypeChange}
          onSeverityChange={handleSeverityChange}
        />
        <Card variant="glass" className="p-8">
          <EmptyState
            icon="📊"
            title={isFiltered ? 'Nessun evento trovato' : 'Nessun evento'}
            description={
              isFiltered
                ? 'Prova a modificare i filtri di ricerca'
                : 'Gli eventi di monitoraggio appariranno qui'
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <EventFilters
        type={typeFilter}
        severity={severityFilter}
        onTypeChange={handleTypeChange}
        onSeverityChange={handleSeverityChange}
      />

      <Card variant="glass" className="overflow-hidden">
        <InfiniteScroll
          dataLength={events.length}
          next={() => fetchEvents(false)}
          hasMore={hasMore}
          loader={
            <div className="p-4 text-center" data-testid="load-more">
              <Text variant="secondary" size="sm">Caricamento...</Text>
            </div>
          }
          endMessage={
            <div className="p-4 text-center border-t border-slate-700/50 [html:not(.dark)_&]:border-slate-200">
              <Text variant="tertiary" size="sm">
                {events.length >= MAX_EVENTS
                  ? `Visualizzati ${MAX_EVENTS} eventi (limite raggiunto)`
                  : 'Tutti gli eventi caricati'}
              </Text>
            </div>
          }
          scrollableTarget="monitoring-scroll-container"
        >
          <div className="divide-y divide-slate-700/50 [html:not(.dark)_&]:divide-slate-200" data-testid="event-list">
            {events.map(event => (
              <HealthEventItem
                key={event.id}
                event={event}
              />
            ))}
          </div>
        </InfiniteScroll>
      </Card>

      {/* Count display */}
      <Text variant="tertiary" size="sm" className="text-center">
        {events.length} {events.length === 1 ? 'evento' : 'eventi'}
        {isFiltered && ' (filtrati)'}
      </Text>
    </div>
  );
}
