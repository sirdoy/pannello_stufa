'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Clock, Video, VideoOff } from 'lucide-react';
import CameraEventIcon from '@/app/components/devices/camera/CameraEventIcon';
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
import { getEventTypeName } from '@/lib/netatmo/netatmoCameraApi';
import EventPreviewModal from '@/app/components/devices/camera/EventPreviewModal';
import type { CameraStatus, CameraEvent } from '@/types/netatmoProxy';
import { PageHeader } from '@/app/components/EmberGlass/PageHeader';

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
  const handleLoadMore = useCallback((): void => {
    setDisplayCount(prev => prev + 20);
  }, []);

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
      <>
        <PageHeader title="Eventi" description="Caricamento..." backHref="/camera" />
        <Section spacing="none">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton.Card key={i} className="h-24" />
            ))}
          </div>
        </Section>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title="Eventi" backHref="/camera" />
        <Section spacing="none">
          <Banner
            variant="error"
            title="Errore"
            description={error}
          />
          <div className="mt-4 flex gap-2">
            <Button variant="ember" onClick={handleRefresh}>
              Riprova
            </Button>
            <Button variant="subtle" onClick={() => router.push('/camera')}>
              Torna alle camere
            </Button>
          </div>
        </Section>
      </>
    );
  }

  if (events.length === 0) {
    return (
      <>
        <PageHeader title="Eventi" backHref="/camera" />
        <Section spacing="none">
          <EmptyState
            icon={<VideoOff size={48} className="text-(--text-2)" />}
            title="Nessun evento registrato"
            description="Non sono stati trovati eventi registrati dalle tue videocamere."
          />
          <div className="mt-4 text-center">
            <Button variant="subtle" onClick={() => router.push('/camera')}>
              Torna alle camere
            </Button>
          </div>
        </Section>
      </>
    );
  }

  // Description showing total events
  const eventsDescription = selectedCameraId === 'all'
    ? `${totalEvents} eventi registrati`
    : `${filteredEvents.length} eventi (filtrati da ${totalEvents} totali)`;

  return (
    <>
      <PageHeader
        title="Eventi"
        description={eventsDescription}
        backHref="/camera"
        actions={
          <Button
            variant="subtle"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Aggiornamento...' : 'Aggiorna'}
          </Button>
        }
      />
      <Section spacing="none">
        {/* Camera filter */}
        {cameras.length > 1 && (
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
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
                <CardTitle icon={<CalendarDays size={20} className="text-(--text-2)" />} level={2}>
                  {date}
                  <Text as="span" variant="secondary" size="sm" weight="normal" className="ml-2">
                    ({dateEvents.length} {dateEvents.length === 1 ? 'evento' : 'eventi'})
                  </Text>
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
                        className="flex w-full cursor-pointer items-center gap-4 rounded-2xl border-[0.5px] border-white/6 bg-white/4 p-3 text-left transition-colors hover:bg-white/6"
                      >
                        {/* Snapshot preview */}
                        <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-black/40 sm:h-24 sm:w-40">
                          {event.snapshot_url ? (
                            <img
                              src={event.snapshot_url}
                              alt={getEventTypeName(event.event_type)}
                              className="size-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : null}
                          <div className={`absolute inset-0 flex items-center justify-center ${event.snapshot_url ? 'opacity-0' : ''}`}>
                            <CameraEventIcon type={event.event_type} size={24} className="opacity-60" />
                          </div>
                        </div>

                        {/* Event info */}
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <CameraEventIcon type={event.event_type} size={18} className="shrink-0 text-(--text-2)" />
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

                          <div className="mt-1 flex flex-wrap items-center gap-3">
                            <Text variant="tertiary" size="xs" className="flex items-center gap-1">
                              <Clock size={12} aria-hidden="true" />
                              {new Date(event.timestamp * 1000).toLocaleTimeString('it-IT', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Text>
                            {cameras.length > 1 && cameraName && (
                              <Text variant="tertiary" size="xs" className="flex items-center gap-1">
                                <Video size={12} aria-hidden="true" />
                                {cameraName}
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
          <div ref={loadMoreRef} className="flex justify-center py-4">
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
    </>
  );
}
