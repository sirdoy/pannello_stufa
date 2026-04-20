'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CAMERA_ROUTES } from '@/lib/routes';
import {
  Section,
  Grid,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Heading,
  Text,
  Button,
  Banner,
  EmptyState,
  Skeleton,
  Switch,
} from '@/app/components/ui';
import { getCameraTypeName, getEventTypeName, getEventIcon } from '@/lib/netatmo/netatmoCameraApi';
import HlsPlayer from '@/app/components/devices/camera/HlsPlayer';
import EventPreviewModal from '@/app/components/devices/camera/EventPreviewModal';
import type { CameraStatus, CameraEvent, DataFreshness } from '@/types/netatmoProxy';

export default function CameraDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<CameraStatus[]>([]);
  const [events, setEvents] = useState<CameraEvent[]>([]);
  const [dataFreshness, setDataFreshness] = useState<DataFreshness | null>(null);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [snapshotUrls, setSnapshotUrls] = useState<Record<string, string>>({});
  const [snapshotErrors, setSnapshotErrors] = useState<Record<string, boolean>>({});
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [streamLoading, setStreamLoading] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isLiveMode, setIsLiveMode] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<CameraEvent | null>(null);
  const [monitoringStates, setMonitoringStates] = useState<Record<string, boolean>>({});
  const [monitoringLoading, setMonitoringLoading] = useState<Record<string, boolean>>({});

  const fetchedRef = useRef<boolean>(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchData();
  }, []);

  async function fetchData(bustCache = false): Promise<void> {
    try {
      setLoading(true);
      setError(null);

      // Split fetches: status + events separately
      const [statusRes, eventsRes] = await Promise.all([
        fetch(CAMERA_ROUTES.status),
        fetch(CAMERA_ROUTES.allEvents),
      ]);

      const statusData = await statusRes.json() as { cameras?: CameraStatus[]; data_freshness?: DataFreshness; error?: string };
      const eventsData = await eventsRes.json() as { events?: CameraEvent[]; count?: number; error?: string };

      if (!statusRes.ok || statusData.error) {
        throw new Error(statusData.error ?? `Errore ${statusRes.status}`);
      }

      setCameras(statusData.cameras ?? []);
      setDataFreshness(statusData.data_freshness ?? null);
      setEvents(eventsData.events ?? []);

      // Initialize monitoring states from camera status
      const initialMonitoring: Record<string, boolean> = {};
      for (const camera of statusData.cameras ?? []) {
        initialMonitoring[camera.camera_id] = camera.status === 'on';
      }
      setMonitoringStates(initialMonitoring);

      // Build snapshot URLs — the API route redirects to the Netatmo CDN snapshot URL.
      // Append a timestamp when bustCache=true (explicit refresh) to bypass browser cache.
      const cacheParam = bustCache ? `?t=${Date.now()}` : '';
      const urls: Record<string, string> = {};
      for (const camera of statusData.cameras ?? []) {
        urls[camera.camera_id] = CAMERA_ROUTES.snapshot(camera.camera_id) + cacheParam;
      }
      setSnapshotUrls(urls);
      // Reset snapshot errors on data refresh so images are retried
      setSnapshotErrors({});

      const firstCamera = statusData.cameras?.[0];
      if (firstCamera && !selectedCameraId) {
        setSelectedCameraId(firstCamera.camera_id);
      }
    } catch (err) {
      console.error('Error fetching camera data:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function fetchStreamUrl(cameraId: string) {
    setStreamLoading(true);
    setStreamError(false);
    try {
      const response = await fetch(CAMERA_ROUTES.stream(cameraId));
      if (!response.ok) {
        console.error('Error fetching stream URL:', response.status, response.statusText);
        setStreamError(true);
        return;
      }
      const data = await response.json() as { vpn_streams?: { high: string }; is_local?: boolean; local_streams?: { high: string } };
      if (data.is_local && data.local_streams?.high) {
        setStreamUrl(data.local_streams.high);
      } else if (data.vpn_streams?.high) {
        setStreamUrl(data.vpn_streams.high);
      } else {
        // Proxy responded OK but no stream URL available
        setStreamError(true);
      }
    } catch (err) {
      console.error('Error fetching stream URL:', err);
      setStreamError(true);
    } finally {
      setStreamLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    fetchedRef.current = false;
    setStreamUrl(null);
    await fetchData(true); // bustCache=true: append timestamp to snapshot URLs
    setRefreshing(false);
  }

  function handleEnterLiveMode() {
    if (selectedCameraId) {
      setIsLiveMode(true);
      setStreamUrl(null);
      setStreamError(false);
      fetchStreamUrl(selectedCameraId);
    }
  }

  async function handleMonitoringToggle(cameraId: string, newValue: boolean) {
    if (monitoringLoading[cameraId] ?? false) return;
    const previousValue = monitoringStates[cameraId] ?? false;
    setMonitoringStates(prev => ({ ...prev, [cameraId]: newValue })); // optimistic
    setMonitoringLoading(prev => ({ ...prev, [cameraId]: true }));
    try {
      const res = await fetch(CAMERA_ROUTES.monitoring(cameraId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monitoring: newValue ? 'on' : 'off',
        }),
      });
      if (!res.ok) {
        setMonitoringStates(prev => ({ ...prev, [cameraId]: previousValue })); // rollback
      }
    } catch {
      setMonitoringStates(prev => ({ ...prev, [cameraId]: previousValue })); // rollback
    } finally {
      setMonitoringLoading(prev => ({ ...prev, [cameraId]: false }));
    }
  }

  const selectedCamera = cameras.find(c => c.camera_id === selectedCameraId);
  const cameraEvents = selectedCameraId
    ? events.filter(e => e.camera_id === selectedCameraId)
    : events;

  if (loading) {
    return (
      <Section title="Videocamere" description="Caricamento..." spacing="lg" level={1}>
        <Grid cols={2} gap="lg">
          <Skeleton.Card className="min-h-[400px]" />
          <Skeleton.Card className="min-h-[400px]" />
        </Grid>
      </Section>
    );
  }

  if (error) {
    return (
      <Section title="Videocamere" spacing="lg" level={1}>
        <Banner
          variant="error"
          title="Errore"
          description={error}
        />
        <Button variant="ember" onClick={handleRefresh} className="mt-4">
          Riprova
        </Button>
      </Section>
    );
  }

  if (cameras.length === 0) {
    return (
      <Section title="Videocamere" spacing="lg" level={1}>
        <EmptyState
          icon="📹"
          title="Nessuna videocamera trovata"
          description="Non sono state trovate videocamere Netatmo nel tuo account."
        />
      </Section>
    );
  }

  const isStale = dataFreshness === 'UNREACHABLE';

  return (
    <Section
      title="Videocamere"
      description="Visualizza le tue videocamere Netatmo"
      spacing="lg"
      level={1}
      action={
        <div className="flex gap-2">
          <Button
            variant="subtle"
            size="sm"
            onClick={() => router.push('/camera/events')}
          >
            Tutti gli eventi
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
      {/* Staleness banner */}
      {isStale && (
        <Banner
          variant="warning"
          title="Dati non aggiornati"
          description="La videocamera potrebbe essere offline. I dati mostrati potrebbero non essere recenti."
        />
      )}

      <Grid cols={2} gap="lg">
        {/* Camera list */}
        <Card>
          <CardHeader>
            <CardTitle icon="📹" level={2}>Le tue telecamere</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cameras.map(camera => (
              <div
                key={camera.camera_id}
                className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                  selectedCameraId === camera.camera_id
                    ? 'bg-ocean-500/20 border-2 border-ocean-500'
                    : 'bg-slate-800/50 hover:bg-slate-700/50 border-2 border-transparent'
                }`}
                onClick={() => setSelectedCameraId(camera.camera_id)}
              >
                <div className="flex items-center gap-4">
                  {/* Snapshot thumbnail */}
                  <div className="w-24 h-16 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
                    {snapshotUrls[camera.camera_id] && !snapshotErrors[camera.camera_id] ? (
                      <img
                        src={snapshotUrls[camera.camera_id]}
                        alt={camera.name ?? camera.camera_id}
                        className="w-full h-full object-cover"
                        onError={() => setSnapshotErrors(prev => ({ ...prev, [camera.camera_id]: true }))}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Text variant="tertiary" size="xs">N/D</Text>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <Heading level={3} size="md" className="truncate">{camera.name ?? camera.camera_id}</Heading>
                    <Text variant="tertiary" size="sm">
                      {getCameraTypeName(camera.device_type ?? '')}
                    </Text>
                    <div className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      camera.status === 'on'
                        ? 'bg-sage-500/20 text-sage-400'
                        : 'bg-slate-600/50 text-slate-400'
                    }`}>
                      {camera.status === 'on' ? 'Attiva' : 'Inattiva'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Selected camera details */}
        {selectedCamera && (
          <Card>
            <CardHeader>
              <CardTitle icon="🎥" level={2}>{selectedCamera.name ?? selectedCamera.camera_id}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Video/Snapshot toggle */}
              {selectedCamera.status === 'on' && !isStale && (
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={!isLiveMode ? 'ember' : 'subtle'}
                    size="sm"
                    onClick={() => setIsLiveMode(false)}
                  >
                    Snapshot
                  </Button>
                  <Button
                    variant={isLiveMode ? 'ember' : 'subtle'}
                    size="sm"
                    onClick={handleEnterLiveMode}
                  >
                    Live
                  </Button>
                </div>
              )}

              {/* Video preview */}
              <div className="aspect-video bg-slate-800 rounded-xl overflow-hidden mb-4 relative">
                {isLiveMode && selectedCamera.status === 'on' && streamUrl ? (
                  // Live video mode — stream URL obtained
                  <HlsPlayer
                    src={streamUrl}
                    poster={snapshotUrls[selectedCamera.camera_id] ?? ''}
                    className="w-full h-full"
                    onError={() => {
                      setIsLiveMode(false);
                      setStreamError(true);
                    }}
                  />
                ) : isLiveMode && streamLoading ? (
                  // Stream URL is being fetched
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <div className="w-8 h-8 border-2 border-ocean-500 border-t-transparent rounded-full animate-spin" />
                    <Text variant="secondary">Connessione al live...</Text>
                  </div>
                ) : isLiveMode && streamError ? (
                  // Stream fetch failed
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <span className="text-4xl opacity-50">📡</span>
                    <Text variant="secondary">Live non disponibile</Text>
                  </div>
                ) : snapshotUrls[selectedCamera.camera_id] && !snapshotErrors[selectedCamera.camera_id] ? (
                  // Snapshot mode — URL redirects to Netatmo CDN
                  <img
                    src={snapshotUrls[selectedCamera.camera_id]}
                    alt={selectedCamera.name ?? selectedCamera.camera_id}
                    className="w-full h-full object-cover"
                    onError={() => setSnapshotErrors(prev => ({ ...prev, [selectedCamera.camera_id]: true }))}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <span className="text-4xl opacity-50">📹</span>
                    <Text variant="secondary">Snapshot non disponibile</Text>
                  </div>
                )}

                {/* Status badge overlay */}
                {!isLiveMode && (
                  <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                    selectedCamera.status === 'on'
                      ? 'bg-sage-500/80 text-white'
                      : 'bg-slate-600/80 text-slate-300'
                  }`}>
                    {selectedCamera.status === 'on' ? 'Attiva' : 'Inattiva'}
                  </div>
                )}
              </div>

              {/* Camera info */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <Text variant="label" size="xs">Tipo</Text>
                  <Text variant="body" size="sm" className="mt-1">
                    {getCameraTypeName(selectedCamera.device_type ?? '')}
                  </Text>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <Text variant="label" size="xs">Stato</Text>
                  <Text variant={selectedCamera.status === 'on' ? 'sage' : 'secondary'} size="sm" className="mt-1">
                    {selectedCamera.status === 'on' ? 'Attiva' : 'Inattiva'}
                  </Text>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <Text variant="label" size="xs">Monitoraggio</Text>
                  <div className="flex items-center gap-2 mt-1">
                    <Switch
                      checked={monitoringStates[selectedCamera.camera_id] ?? false}
                      onCheckedChange={(val) => handleMonitoringToggle(selectedCamera.camera_id, val)}
                      disabled={isStale || (monitoringLoading[selectedCamera.camera_id] ?? false)}
                      size="sm"
                      variant="ocean"
                      label="Monitoraggio camera"
                    />
                    <Text variant={monitoringStates[selectedCamera.camera_id] ? 'sage' : 'secondary'} size="sm">
                      {monitoringStates[selectedCamera.camera_id] ? 'Attivo' : 'Disattivo'}
                    </Text>
                  </div>
                </div>
                {selectedCamera.sd_status && (
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <Text variant="label" size="xs">SD Card</Text>
                    <Text variant="body" size="sm" className="mt-1">
                      {selectedCamera.sd_status === 'on' ? 'Presente' : 'Assente'}
                    </Text>
                  </div>
                )}
              </div>

              {/* Recent events for this camera */}
              <Heading level={3} size="sm" className="mb-3">Eventi recenti</Heading>
              {cameraEvents.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {cameraEvents.slice(0, 10).map(event => (
                    <button
                      key={event.event_id}
                      onClick={() => setSelectedEvent(event)}
                      className="w-full flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer text-left"
                    >
                      {/* Snapshot preview */}
                      <div className="relative w-20 h-12 rounded-md overflow-hidden bg-slate-700 flex-shrink-0">
                        {event.snapshot_url ? (
                          <img
                            src={event.snapshot_url}
                            alt={getEventTypeName(event.event_type)}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const sibling = target.nextSibling as HTMLElement | null;
                              if (sibling) sibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`absolute inset-0 items-center justify-center ${event.snapshot_url ? 'hidden' : 'flex'}`}>
                          <span className="text-lg opacity-60">
                            {getEventIcon(event.event_type)}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Text variant="body" size="sm">
                          {getEventTypeName(event.event_type)}
                        </Text>
                        <Text variant="tertiary" size="xs">
                          {new Date(event.timestamp * 1000).toLocaleString('it-IT', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Text variant="secondary" size="sm">Nessun evento recente per questa camera</Text>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </Grid>

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
