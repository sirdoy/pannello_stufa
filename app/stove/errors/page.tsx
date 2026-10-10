'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Check, CircleCheck } from 'lucide-react';
import { Banner, Badge, Button, Card, EmptyState, Heading, Pagination, Skeleton, Text } from '@/app/components/ui';
import { PageHeader } from '@/app/components/EmberGlass/PageHeader';
import type { ThermorossiErrorEvent, ThermorossiErrorEventsResponse } from '@/types/thermorossiProxy';

type Filter = 'all' | 'active' | 'ended';

const ERRORS_PER_PAGE = 20;
const EMPTY_TEXT: Record<Filter, string> = {
  all: 'La stufa non ha mai segnalato allarmi.',
  active: 'Nessun allarme attivo in questo momento.',
  ended: 'Nessun allarme rientrato da mostrare.',
};

const formatDate = (epochSeconds: number): string =>
  new Date(epochSeconds * 1000).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatDuration = (startSeconds: number, endSeconds: number): string => {
  const minutes = Math.max(0, Math.round((endSeconds - startSeconds) / 60));
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
};

/** Alarm episodes recorded by the Pi (GET /api/v1/thermorossi/errors, D22). */
export default function ErrorsPage() {
  const [events, setEvents] = useState<ThermorossiErrorEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const res = await fetch('/api/v1/thermorossi/errors?limit=200');
        if (!res.ok) throw new Error(`Errors fetch failed: ${res.status}`);
        const json = await res.json() as ThermorossiErrorEventsResponse;
        if (!cancelled) setEvents(json.items);
      } catch (err) {
        console.error('Errore storico allarmi:', err);
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  const activeCount = events.filter((event) => event.active).length;
  const filtered = events.filter((event) => {
    if (filter === 'active') return event.active;
    if (filter === 'ended') return !event.active;
    return true;
  });
  const totalPages = Math.ceil(filtered.length / ERRORS_PER_PAGE);
  const paginated = filtered.slice(currentPage * ERRORS_PER_PAGE, (currentPage + 1) * ERRORS_PER_PAGE);

  const selectFilter = (next: Filter): void => {
    setFilter(next);
    setCurrentPage(0);
  };

  const pageHeader = (
    <PageHeader
      title="Storico allarmi"
      description="Allarmi segnalati dalla stufa"
      backHref="/stove"
    />
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        {pageHeader}
        <Skeleton.Card>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="mb-4">
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </Skeleton.Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {pageHeader}

      {failed && (
        <Banner
          variant="error"
          title="Storico non disponibile"
          description="Non riesco a leggere gli allarmi dal server di casa. Riprova tra poco."
        />
      )}

      <Card variant="glass" className="p-6">
        <Button.Group>
          <Button variant={filter === 'all' ? 'subtle' : 'ghost'} size="sm" onClick={() => selectFilter('all')}>
            Tutti ({events.length})
          </Button>
          <Button variant={filter === 'active' ? 'ember' : 'ghost'} size="sm" onClick={() => selectFilter('active')}>
            Attivi ({activeCount})
          </Button>
          <Button variant={filter === 'ended' ? 'success' : 'ghost'} size="sm" onClick={() => selectFilter('ended')}>
            Rientrati ({events.length - activeCount})
          </Button>
        </Button.Group>
      </Card>

      <div className="space-y-4">
        {paginated.length === 0 && !failed ? (
          <Card variant="glass" className="p-6">
            <EmptyState
              icon={<CircleCheck size={40} />}
              title="Nessun allarme"
              description={EMPTY_TEXT[filter]}
              level={2}
            />
          </Card>
        ) : (
          paginated.map((event) => (
            <Card variant="glass" key={event.id} className="p-6" data-testid="stove-error-event">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Heading level={2} size="lg">
                    {event.error_description ?? `Allarme con codice ${event.error_code}`}
                  </Heading>
                  <Text variant="tertiary" size="xs" className="mt-1">
                    Codice {event.error_code}
                  </Text>
                </div>
                {event.active ? (
                  <Badge variant="danger" size="sm" icon={<AlertTriangle size={12} />}>Attivo</Badge>
                ) : (
                  <Badge variant="sage" size="sm" icon={<Check size={12} />}>Rientrato</Badge>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 border-t border-white/8 pt-4 md:grid-cols-3">
                <div>
                  <Text variant="tertiary" size="xs" className="mb-1">Inizio</Text>
                  <Text size="sm">{formatDate(event.started_at)}</Text>
                </div>
                <div>
                  <Text variant="tertiary" size="xs" className="mb-1">Fine</Text>
                  <Text size="sm">{event.ended_at ? formatDate(event.ended_at) : 'Ancora attivo'}</Text>
                </div>
                <div>
                  <Text variant="tertiary" size="xs" className="mb-1">Durata</Text>
                  <Text size="sm">{formatDuration(event.started_at, event.ended_at ?? event.last_seen_at)}</Text>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <Card variant="glass" className="p-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPrevious={() => setCurrentPage((p) => Math.max(0, p - 1))}
            onNext={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            hasPrev={currentPage > 0}
            hasNext={currentPage < totalPages - 1}
          />
        </Card>
      )}
    </div>
  );
}
