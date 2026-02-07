'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
import NETATMO_CAMERA_API from '@/lib/netatmoCameraApi';
import EventPreviewModal from '@/app/components/devices/camera/EventPreviewModal';

interface Camera {
  id: string;
  name: string;
}

interface CameraEvent {
  id: string;
  type: string;
  time: number;
  camera_id: string;
  snapshot?: { url?: string };
  video_id?: string;
}

export default function CameraEventsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
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

      // Fetch all events at once (API returns up to ~200)
      const response = await fetch(CAMERA_ROUTES.allEvents);
      const data: any = await response.json();

      if (data.reconnect || data.error) {
        throw new Error(data.error || 'Autorizzazione richiesta');
      }

      setCameras(data.cameras || []);
      setEvents(data.events || []);
      setTotalEvents(data.total || 0);
      setDisplayCount(20); // Reset to initial display count
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
        if (entries[0].isIntersecting) {
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

  // Get camera for an event
  const getCameraForEvent = (event) => cameras.find(c => c.id === event.camera_id);

  // Strip HTML tags from message
  const stripHtml = (html) => {
    if (!html) return null;
    return html.replace(/<[^>]*>/g, '');
  };

  // Group events by date
  const groupEventsByDate = (events) => {
    const groups = {};
    events.forEach(event => {
      const date = new Date(event.time * 1000).toLocaleDateString('it-IT', {
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
      <Section title="Eventi Camera" description="Caricamento..." spacing="section">
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
      <Section title="Eventi Camera" spacing="section">
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
      <Section title="Eventi Camera" spacing="section">
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
      spacing="section"
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
            variant={selectedCameraId === 'all' ? 'ocean' : 'subtle'}
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
              key={camera.id}
              variant={selectedCameraId === camera.id ? 'ocean' : 'subtle'}
              size="sm"
              onClick={() => {
                setSelectedCameraId(camera.id);
                setDisplayCount(20);
              }}
              className="whitespace-nowrap"
            >
              {camera.name}
            </Button>
          ))}
        </div>
      )}

      {/* Events grouped by date */}
      <div className="space-y-6">
        {Object.entries(groupedEvents).map(([date, dateEvents]) => (
          <Card key={date}>
            <CardHeader>
              <CardTitle icon="📅">
                {date}
                <span className="ml-2 text-sm font-normal text-slate-400">
                  ({dateEvents.length} {dateEvents.length === 1 ? 'evento' : 'eventi'})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dateEvents.map(event => {
                  const camera = getCameraForEvent(event);
                  // Prefer snapshot URL for preview (more reliable)
                  const snapshotUrl = NETATMO_CAMERA_API.getEventSnapshotUrl(event);
                  const hasVideo = event.video_id && event.video_status !== 'deleted';

                  return (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="w-full flex items-center gap-4 p-3 rounded-xl bg-slate-800/50 [html:not(.dark)_&]:bg-slate-100 hover:bg-slate-700/50 [html:not(.dark)_&]:hover:bg-slate-200 hover:ring-2 hover:ring-ocean-500 transition-all text-left group"
                    >
                      {/* Snapshot preview */}
                      <div className="relative w-32 h-20 sm:w-40 sm:h-24 rounded-lg overflow-hidden bg-slate-900 [html:not(.dark)_&]:bg-slate-200 flex-shrink-0">
                        {snapshotUrl ? (
                          <img
                            src={snapshotUrl}
                            alt={NETATMO_CAMERA_API.getEventTypeName(event.type)}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : null}
                        <div className={`absolute inset-0 flex items-center justify-center ${snapshotUrl ? 'opacity-0' : ''}`}>
                          <span className="text-2xl opacity-60">
                            {NETATMO_CAMERA_API.getEventIcon(event.type)}
                          </span>
                        </div>

                        {/* Play overlay - only for events with video */}
                        {hasVideo && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center shadow-lg transition-all group-hover:scale-110">
                              <svg className="w-5 h-5 text-slate-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Event info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">
                            {event.sub_type
                              ? NETATMO_CAMERA_API.getSubTypeIcon(event.sub_type)
                              : NETATMO_CAMERA_API.getEventIcon(event.type)}
                          </span>
                          <Text variant="body" weight="semibold">
                            {event.sub_type
                              ? NETATMO_CAMERA_API.getSubTypeName(event.sub_type)
                              : NETATMO_CAMERA_API.getEventTypeName(event.type)}
                          </Text>
                        </div>

                        {/* Event message from Netatmo (if available) */}
                        {event.message && (
                          <Text variant="secondary" size="sm" className="line-clamp-2">
                            {stripHtml(event.message)}
                          </Text>
                        )}

                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <Text variant="tertiary" size="xs">
                            🕐 {new Date(event.time * 1000).toLocaleTimeString('it-IT', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                          {cameras.length > 1 && camera && (
                            <Text variant="tertiary" size="xs">
                              📹 {camera.name}
                            </Text>
                          )}
                          {hasVideo && (
                            <Text variant="sage" size="xs">
                              🎬 Video
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
          camera={getCameraForEvent(selectedEvent)}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </Section>
  );
}
