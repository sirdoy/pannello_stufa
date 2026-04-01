'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CAMERA_ROUTES } from '@/lib/routes';
import {
  Section,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Text,
  Button,
  Banner,
  EmptyState,
  Skeleton,
} from '@/app/components/ui';
import { getEventTypeName, getEventIcon } from '@/lib/netatmo/netatmoCameraApi';
import EventPreviewModal from '@/app/components/devices/camera/EventPreviewModal';
import type { CameraStatus, CameraEvent } from '@/types/netatmoProxy';

export default function CameraEventsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<CameraStatus[]>([]);
  const [events, setEvents] = useState<CameraEvent[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<CameraEvent | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [totalEvents, setTotalEvents] = useState<number>(0);
  const [displayCount, setDisplayCount] = useState<number>(20);

  const fetchedRef = useRef<boolean>(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchData();
  }, []);

  async function fetchData(): Promise<void> {
    try {
      setLoading(true);
      setError(null);

      // Fetch events and camera list in parallel
      const [eventsRes, statusRes] = await Promise.all([
        fetch(CAMERA_ROUTES.allEvents),
        fetch(CAMERA_ROUTES.status),
      ]);

      const eventsData = await eventsRes.json() as { events?: CameraEvent[]; count?: number; error?: string };
      const statusData = await statusRes.json() as { cameras?: CameraStatus[]; error?: string };

      if (!eventsRes.ok || eventsData.error) {
        throw new Error(eventsData.error ?? `Errore ${eventsRes.status}`);
      }

      setCameras(statusData.cameras ?? []);
      setEvents(eventsData.events ?? []);
      setTotalEvents(eventsData.count ?? eventsData.events?.length ?? 0);
      setDisplayCount(20);
    } catch (err) {
      console.error('Error fetching camera events:', err);
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }

  // Virtual scrolling - show more events when scrolling
  const handleLoadMore = (): void => {
    setDisplayCount(prev => prev + 20);
  };

  // Filter events by selected camera
  const filteredEvents = selectedCameraId === 'all'
    ? events
    : events.filter((e: CameraEvent) => e.camera_id === selectedCameraId);

  // Check if there are more events to show
  const hasMore = displayCount < filteredEvents.length;

  // Infinite scroll with IntersectionObserver (client-side virtual scrolling)
  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry?.isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observerRef.current = observer;

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, handleLoadMore]);

  async function handleRefresh() {
    setRefreshing(true);
    setEvents([]);
    fetchedRef.current = false;
    await fetchData();
    setRefreshing(false);
  }

  // Events to display (limited by displayCount for virtual scrolling)
  const displayedEvents = filteredEvents.slice(0, displayCount);

  // Get camera name for an event
  const getCameraName = (event: CameraEvent) => cameras.find(c => c.camera_id === event.camera_id)?.name ?? null;

  // Strip HTML tags from message
  const stripHtml = (html: string) => {
    if (!html) return null;
    return html.replace(/<[^>]*>/g, '');
  };

  // Group events by date
  const groupEventsByDate = (evts: CameraEvent[]): Record<string, CameraEvent[]> => {
    const groups: Record<string, CameraEvent[]> = {};
    evts.forEach(event => {
      const date = new Date(event.timestamp * 1000).toLocaleDateString('it-IT', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(event);
    });
    return groups;
  };

  const groupedEvents = groupEventsByDate(displayedEvents);

  if (loading) {
    return (
      <Section title="Eventi Camera" description="Caricamento..." spacing="lg" level={1}>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton.Card key={i} className="h-24" />
          ))}
        </div>
      </Section>
    );
  }

  if (error) {
    return (
      <Section title="Eventi Camera" spacing="lg" level={1}>
        <Banner
          variant="error"
          title="Errore"
          description={error}
        />
        <div className="flex gap-2 mt-4">
          <Button variant="ember" onClick={handleRefresh}>
            Riprova
          </Button>
          <Button variant="subtle" onClick={() => router.push('/camera')}>
            Torna alle camere
          </Button>
        </div>
      </Section>
    );
  }

  if (events.length === 0) {
    return (
      <Section title="Eventi Camera" spacing="lg" level={1}>
        <EmptyState
          icon="📹"
          title="Nessun evento registrato"
          description="Non sono stati trovati eventi registrati dalle tue videocamere."
        />
        <div className="text-center mt-4">
          <Button variant="subtle" onClick={() => router.push('/camera')}>
            Torna alle camere
          </Button>
        </div>
      </Section>
    );
  }

  // Description showing total events
  const eventsDescription = selectedCameraId === 'all'
    ? `${totalEvents} eventi registrati`
    : `${filteredEvents.length} eventi (filtrati da ${totalEvents} totali)`;

  return (
    <Section
      title="Eventi Camera"
      description={eventsDescription}
      spacing="lg"
      level={1}
      action={
        <div className="flex gap-2">
          <Button
            variant="subtle"
            size="sm"
            onClick={() => router.push('/camera')}
          >
            Torna alle camere
          </Button>
          <Button
            variant="subtle"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Aggiornamento...' : 'Aggiorna'}
          </Button>
        </div>
      }
    >
      {/* Camera filter */}
      {cameras.length > 1 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Button
            variant={selectedCameraId === 'all' ? 'ember' : 'subtle'}
            size="sm"
            onClick={() => {
              setSelectedCameraId('all');
              setDisplayCount(20);
            }}
          >
            Tutte le camere
          </Button>
          {cameras.map(camera => (
            <Button
              key={camera.camera_id}
              variant={selectedCameraId === camera.camera_id ? 'ember' : 'subtle'}
              size="sm"
              onClick={() => {
                setSelectedCameraId(camera.camera_id);
                setDisplayCount(20);
              }}
              className="whitespace-nowrap"
            >
              {camera.name ?? camera.camera_id}
            </Button>
          ))}
        </div>
      )}

      {/* Events grouped by date */}
      <div className="space-y-6">
        {Object.entries(groupedEvents).map(([date, dateEvents]) => (
          <Card key={date}>
            <CardHeader>
              <CardTitle icon="📅" level={2}>
                {date}
                <span className="ml-2 text-sm font-normal text-slate-400">
                  ({dateEvents.length} {dateEvents.length === 1 ? 'evento' : 'eventi'})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dateEvents.map(event => {
                  const cameraName = getCameraName(event);

                  return (
                    <button
                      key={event.event_id}
                      onClick={() => setSelectedEvent(event)}
                      className="w-full flex items-center gap-4 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 hover:ring-2 hover:ring-ocean-500 transition-all text-left group"
                    >
                      {/* Snapshot preview */}
                      <div className="relative w-32 h-20 sm:w-40 sm:h-24 rounded-lg overflow-hidden bg-slate-900 flex-shrink-0">
                        {event.snapshot_url ? (
                          <img
                            src={event.snapshot_url}
                            alt={getEventTypeName(event.event_type)}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : null}
                        <div className={`absolute inset-0 flex items-center justify-center ${event.snapshot_url ? 'opacity-0' : ''}`}>
                          <span className="text-2xl opacity-60">
                            {getEventIcon(event.event_type)}
                          </span>
                        </div>
                      </div>

                      {/* Event info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">
                            {getEventIcon(event.event_type)}
                          </span>
                          <Text variant="body">
                            {getEventTypeName(event.event_type)}
                          </Text>
                        </div>

                        {/* Event message (if available) */}
                        {event.message && (
                          <Text variant="secondary" size="sm" className="line-clamp-2">
                            {stripHtml(event.message)}
                          </Text>
                        )}

                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <Text variant="tertiary" size="xs">
                            🕐 {new Date(event.timestamp * 1000).toLocaleTimeString('it-IT', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                          {cameras.length > 1 && cameraName && (
                            <Text variant="tertiary" size="xs">
                              📹 {cameraName}
                            </Text>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Infinite scroll sentinel for virtual scrolling */}
      {hasMore && (
        <div ref={loadMoreRef} className="py-4 flex justify-center">
          <Text variant="tertiary" size="sm">
            Mostrando {displayedEvents.length} di {filteredEvents.length} eventi
          </Text>
        </div>
      )}

      {/* Event preview modal */}
      {selectedEvent && (
        <EventPreviewModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </Section>
  );
}
