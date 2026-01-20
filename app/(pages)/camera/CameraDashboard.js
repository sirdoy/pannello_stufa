'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CAMERA_ROUTES, NETATMO_ROUTES } from '@/lib/routes';
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
} from '@/app/components/ui';
import NETATMO_CAMERA_API from '@/lib/netatmoCameraApi';
import HlsPlayer from '@/app/components/devices/camera/HlsPlayer';
import EventPreviewModal from '@/app/components/devices/camera/EventPreviewModal';

export default function CameraDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsReauth, setNeedsReauth] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [snapshotUrls, setSnapshotUrls] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      setNeedsReauth(false);

      const response = await fetch(CAMERA_ROUTES.list);
      const data = await response.json();

      // Check if needs reconnection
      if (data.reconnect) {
        setNeedsReauth(true);
        setError('Richiesta autorizzazione camera');
        return;
      }

      if (data.error) {
        // Check if error is related to invalid token or missing scopes
        const errorLower = data.error.toLowerCase();
        if (errorLower.includes('invalid access token') ||
            errorLower.includes('access_denied') ||
            errorLower.includes('insufficient scope')) {
          setNeedsReauth(true);
          setError('Autorizzazione videocamere mancante');
          return;
        }
        throw new Error(data.error);
      }

      setCameras(data.cameras || []);
      setEvents(data.events || []);

      // Fetch snapshots for all cameras
      const urls = {};
      for (const camera of data.cameras || []) {
        try {
          const snapRes = await fetch(CAMERA_ROUTES.snapshot(camera.id));
          const snapData = await snapRes.json();
          if (snapData.snapshot_url) {
            urls[camera.id] = snapData.snapshot_url;
          }
        } catch (e) {
          console.error(`Error fetching snapshot for ${camera.id}:`, e);
        }
      }
      setSnapshotUrls(urls);

      if (data.cameras?.length > 0 && !selectedCameraId) {
        setSelectedCameraId(data.cameras[0].id);
      }
    } catch (err) {
      console.error('Error fetching camera data:', err);
      // Also check thrown errors for token issues
      const errorMsg = err.message?.toLowerCase() || '';
      if (errorMsg.includes('invalid access token') ||
          errorMsg.includes('access_denied') ||
          errorMsg.includes('insufficient scope')) {
        setNeedsReauth(true);
        setError('Autorizzazione videocamere mancante');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    fetchedRef.current = false;
    await fetchData();
    setRefreshing(false);
  }

  async function handleReauthorize() {
    try {
      setLoading(true);
      // Disconnect first to clear old token without camera scopes
      await fetch(NETATMO_ROUTES.disconnect, { method: 'POST' });
      // Redirect to netatmo to reconnect with new scopes (including camera)
      router.push('/netatmo');
    } catch (err) {
      console.error('Errore disconnessione:', err);
      setError('Errore durante la disconnessione');
      setLoading(false);
    }
  }

  const selectedCamera = cameras.find(c => c.id === selectedCameraId);
  const cameraEvents = selectedCameraId
    ? events.filter(e => e.camera_id === selectedCameraId)
    : events;

  if (loading) {
    return (
      <Section title="Videocamere" description="Caricamento..." spacing="section">
        <Grid cols={{ mobile: 1, desktop: 2 }} gap="large">
          <Skeleton.Card className="min-h-[400px]" />
          <Skeleton.Card className="min-h-[400px]" />
        </Grid>
      </Section>
    );
  }

  // Needs re-authorization - token exists but missing camera scopes
  if (needsReauth) {
    return (
      <Section title="Videocamere" spacing="section">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <span className="text-5xl mb-4 block">📹</span>
              <Heading level={3} className="mb-2">Autorizzazione richiesta</Heading>
              <Text variant="secondary" className="mb-6 max-w-md mx-auto">
                L'accesso alle videocamere richiede una nuova autorizzazione con i permessi aggiornati.
                Clicca il pulsante per riautorizzare Netatmo.
              </Text>
              <Button variant="ocean" onClick={handleReauthorize}>
                Riautorizza Netatmo
              </Button>
            </div>
          </CardContent>
        </Card>
      </Section>
    );
  }

  if (error) {
    return (
      <Section title="Videocamere" spacing="section">
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
      <Section title="Videocamere" spacing="section">
        <EmptyState
          icon="📹"
          title="Nessuna videocamera trovata"
          description="Non sono state trovate videocamere Netatmo nel tuo account. Assicurati di aver autorizzato l'accesso alle videocamere."
        />
        <div className="text-center mt-4">
          <Button variant="ocean" onClick={handleReauthorize}>
            Riautorizza Netatmo
          </Button>
        </div>
      </Section>
    );
  }

  return (
    <Section
      title="Videocamere"
      description="Visualizza le tue videocamere Netatmo"
      spacing="section"
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
      <Grid cols={{ mobile: 1, desktop: 2 }} gap="large">
        {/* Camera list */}
        <Card>
          <CardHeader>
            <CardTitle icon="📹">Le tue telecamere</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cameras.map(camera => (
              <div
                key={camera.id}
                className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                  selectedCameraId === camera.id
                    ? 'bg-ocean-500/20 border-2 border-ocean-500 [html:not(.dark)_&]:bg-ocean-100 [html:not(.dark)_&]:border-ocean-400'
                    : 'bg-slate-800/50 hover:bg-slate-700/50 border-2 border-transparent [html:not(.dark)_&]:bg-slate-100 [html:not(.dark)_&]:hover:bg-slate-200'
                }`}
                onClick={() => setSelectedCameraId(camera.id)}
              >
                <div className="flex items-center gap-4">
                  {/* Snapshot thumbnail */}
                  <div className="w-24 h-16 rounded-lg overflow-hidden bg-slate-700 [html:not(.dark)_&]:bg-slate-200 flex-shrink-0">
                    {snapshotUrls[camera.id] ? (
                      <img
                        src={snapshotUrls[camera.id]}
                        alt={camera.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Text variant="tertiary" size="xs">N/D</Text>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <Heading level={4} size="md" className="truncate">{camera.name}</Heading>
                    <Text variant="tertiary" size="sm">
                      {NETATMO_CAMERA_API.getCameraTypeName(camera.type)}
                    </Text>
                    <div className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      camera.status === 'on'
                        ? 'bg-sage-500/20 text-sage-400 [html:not(.dark)_&]:bg-sage-100 [html:not(.dark)_&]:text-sage-700'
                        : 'bg-slate-600/50 text-slate-400 [html:not(.dark)_&]:bg-slate-200 [html:not(.dark)_&]:text-slate-600'
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
              <CardTitle icon="🎥">{selectedCamera.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Video/Snapshot toggle */}
              {selectedCamera.status === 'on' && (
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={!isLiveMode ? 'ocean' : 'subtle'}
                    size="sm"
                    onClick={() => setIsLiveMode(false)}
                  >
                    Snapshot
                  </Button>
                  <Button
                    variant={isLiveMode ? 'ocean' : 'subtle'}
                    size="sm"
                    onClick={() => setIsLiveMode(true)}
                  >
                    Live
                  </Button>
                </div>
              )}

              {/* Video preview */}
              <div className="aspect-video bg-slate-800 [html:not(.dark)_&]:bg-slate-200 rounded-xl overflow-hidden mb-4 relative">
                {isLiveMode && selectedCamera.status === 'on' ? (
                  <HlsPlayer
                    src={NETATMO_CAMERA_API.getLiveStreamUrl(selectedCamera)}
                    poster={snapshotUrls[selectedCamera.id]}
                    className="w-full h-full"
                    onError={() => setIsLiveMode(false)}
                  />
                ) : snapshotUrls[selectedCamera.id] ? (
                  <img
                    src={snapshotUrls[selectedCamera.id]}
                    alt={selectedCamera.name}
                    className="w-full h-full object-cover"
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
                <div className="p-3 bg-slate-800/50 [html:not(.dark)_&]:bg-slate-100 rounded-lg">
                  <Text variant="label" size="xs">Tipo</Text>
                  <Text variant="body" size="sm" className="mt-1">
                    {NETATMO_CAMERA_API.getCameraTypeName(selectedCamera.type)}
                  </Text>
                </div>
                <div className="p-3 bg-slate-800/50 [html:not(.dark)_&]:bg-slate-100 rounded-lg">
                  <Text variant="label" size="xs">Stato</Text>
                  <Text variant={selectedCamera.status === 'on' ? 'sage' : 'secondary'} size="sm" className="mt-1">
                    {selectedCamera.status === 'on' ? 'Attiva' : 'Inattiva'}
                  </Text>
                </div>
                {selectedCamera.sd_status && (
                  <div className="p-3 bg-slate-800/50 [html:not(.dark)_&]:bg-slate-100 rounded-lg">
                    <Text variant="label" size="xs">SD Card</Text>
                    <Text variant="body" size="sm" className="mt-1">
                      {selectedCamera.sd_status === 'on' ? 'Presente' : 'Assente'}
                    </Text>
                  </div>
                )}
                {selectedCamera.light_mode_status && (
                  <div className="p-3 bg-slate-800/50 [html:not(.dark)_&]:bg-slate-100 rounded-lg">
                    <Text variant="label" size="xs">Luce</Text>
                    <Text variant="body" size="sm" className="mt-1">
                      {selectedCamera.light_mode_status === 'on' ? 'Accesa' :
                       selectedCamera.light_mode_status === 'auto' ? 'Auto' : 'Spenta'}
                    </Text>
                  </div>
                )}
              </div>

              {/* Recent events for this camera */}
              <Heading level={4} size="sm" className="mb-3">Eventi recenti</Heading>
              {cameraEvents.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {cameraEvents.slice(0, 10).map(event => {
                    // Use snapshot URL for preview
                    const snapshotUrl = NETATMO_CAMERA_API.getEventSnapshotUrl(event);
                    const hasVideo = event.video_id && event.video_status !== 'deleted';

                    return (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className="w-full flex items-center gap-3 p-2 bg-slate-800/50 [html:not(.dark)_&]:bg-slate-100 rounded-lg hover:bg-slate-700/50 [html:not(.dark)_&]:hover:bg-slate-200 transition-colors cursor-pointer text-left"
                      >
                        {/* Snapshot preview */}
                        <div className="relative w-20 h-12 rounded-md overflow-hidden bg-slate-700 [html:not(.dark)_&]:bg-slate-200 flex-shrink-0">
                          {snapshotUrl ? (
                            <img
                              src={snapshotUrl}
                              alt={NETATMO_CAMERA_API.getEventTypeName(event.type)}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`absolute inset-0 items-center justify-center ${snapshotUrl ? 'hidden' : 'flex'}`}>
                            <span className="text-lg opacity-60">
                              {NETATMO_CAMERA_API.getEventIcon(event.type)}
                            </span>
                          </div>
                          {/* Play overlay if video available */}
                          {hasVideo && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
                                <svg className="w-3 h-3 text-slate-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Text variant="body" size="sm">
                            {NETATMO_CAMERA_API.getEventTypeName(event.type)}
                          </Text>
                          <Text variant="tertiary" size="xs">
                            {new Date(event.time * 1000).toLocaleString('it-IT', {
                              weekday: 'short',
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </div>
                      </button>
                    );
                  })}
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
      {selectedEvent && selectedCamera && (
        <EventPreviewModal
          event={selectedEvent}
          camera={selectedCamera}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </Section>
  );
}
