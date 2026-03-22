'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { CAMERA_ROUTES } from '@/lib/routes';
import Skeleton from '../../ui/Skeleton';
import DeviceCard from '../../ui/DeviceCard';
import { Text, Button, Switch } from '../../ui';
import { getCameraTypeName } from '@/lib/netatmo/netatmoCameraApi';
import HlsPlayer from './HlsPlayer';
import type { CameraStatus, DataFreshness } from '@/types/netatmoProxy';

/**
 * CameraCard - Camera summary view for homepage
 * Shows camera status with snapshot and live video preview
 */
export default function CameraCard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [cameras, setCameras] = useState<CameraStatus[]>([]);
  const [dataFreshness, setDataFreshness] = useState<DataFreshness | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [snapshotError, setSnapshotError] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const [monitoringOn, setMonitoringOn] = useState<boolean>(false);
  const [monitoringLoading, setMonitoringLoading] = useState(false);

  const connectionCheckedRef = useRef(false);

  // Check connection on mount — staggered 400ms to avoid thundering herd on dashboard mount
  useEffect(() => {
    if (connectionCheckedRef.current) return;
    connectionCheckedRef.current = true;
    const t = setTimeout(() => fetchCameras(), 400);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select first camera
  useEffect(() => {
    const firstCamera = cameras[0];
    if (cameras.length > 0 && !selectedCameraId && firstCamera) {
      setSelectedCameraId(firstCamera.camera_id);
    }
  }, [cameras, selectedCameraId]);

  // Set snapshot URL when camera is selected — the API route proxies the binary JPEG server-side
  // so we can use the URL directly as <img src> without CORS issues
  useEffect(() => {
    if (selectedCameraId) {
      setSnapshotError(false);
      setSnapshotUrl(CAMERA_ROUTES.snapshot(selectedCameraId));
    }
  }, [selectedCameraId]);

  // Sync monitoring state from selected camera
  useEffect(() => {
    const camera = cameras.find(c => c.camera_id === selectedCameraId);
    if (camera) {
      setMonitoringOn(camera.status === 'on');
    }
  }, [selectedCameraId, cameras]);

  async function fetchCameras(retryCount: number = 0) {
    const MAX_RETRIES = 1;
    const RETRY_DELAY_MS = 1500;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(CAMERA_ROUTES.status);
      const data = await response.json() as { cameras?: CameraStatus[]; data_freshness?: DataFreshness | null; error?: string };

      if (!response.ok || data.error) {
        // Retry on server errors
        if (retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
          return fetchCameras(retryCount + 1);
        }
        setConnected(false);
        setError(data.error ?? `Errore ${response.status}`);
        return;
      }

      setConnected(true);
      setCameras(data.cameras ?? []);
      setDataFreshness(data.data_freshness ?? null);
    } catch (err) {
      console.error('Errore fetch cameras:', err);
      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        return fetchCameras(retryCount + 1);
      }
      setError(err instanceof Error ? err.message : String(err));
      setConnected(false);
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
        console.error('Errore fetch stream URL:', response.status, response.statusText);
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
      console.error('Errore fetch stream URL:', err);
      setStreamError(true);
    } finally {
      setStreamLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    connectionCheckedRef.current = false;
    // Bust snapshot cache by appending a new timestamp — forces a fresh image load
    if (selectedCameraId) {
      setSnapshotError(false);
      setSnapshotUrl(CAMERA_ROUTES.snapshot(selectedCameraId) + `&t=${Date.now()}`);
    }
    await fetchCameras();
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

  async function handleMonitoringToggle(newValue: boolean) {
    if (!selectedCameraId || monitoringLoading || dataFreshness === 'UNREACHABLE') return;
    const previousValue = monitoringOn;
    setMonitoringOn(newValue); // optimistic
    setMonitoringLoading(true);
    try {
      const res = await fetch(CAMERA_ROUTES.monitoring, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          camera_id: selectedCameraId,
          monitoring: newValue ? 'on' : 'off',
        }),
      });
      if (!res.ok) {
        setMonitoringOn(previousValue); // rollback
      }
    } catch {
      setMonitoringOn(previousValue); // rollback
    } finally {
      setMonitoringLoading(false);
    }
  }

  const selectedCamera = cameras.find(c => c.camera_id === selectedCameraId);
  const isStale = dataFreshness === 'UNREACHABLE';

  // Get status badge based on camera state
  const getStatusBadge = () => {
    if (!connected) return { label: 'Non connesso', color: 'neutral' };
    if (cameras.length === 0) return { label: 'Nessuna camera', color: 'neutral' };
    if (isStale) return { label: 'Dati non aggiornati', color: 'warning' };
    if (selectedCamera?.status === 'on') return { label: 'Attiva', color: 'sage' };
    return { label: 'Inattiva', color: 'warning' };
  };

  // Loading state
  if (loading) {
    return <Skeleton.CameraCard />;
  }

  // Error state - standard error card with retry
  if (!connected) {
    return (
      <DeviceCard
        icon="📹"
        title="Videocamera"
        colorTheme="ocean"
        connected={false}
        connectionError={error ?? 'Errore di connessione alle videocamere.'}
        onConnect={() => {
          connectionCheckedRef.current = false;
          void fetchCameras();
        }}
        connectButtonLabel="Riprova"
      />
    );
  }

  // Connected but no cameras found
  if (cameras.length === 0) {
    return (
      <DeviceCard
        icon="📹"
        title="Videocamera"
        colorTheme="ocean"
        statusBadge={{ label: 'Nessuna camera', color: 'neutral' }}
      >
        <div className="text-center py-8">
          <span className="text-4xl mb-4 block">📷</span>
          <Text variant="secondary" className="mb-2">
            Nessuna videocamera Netatmo trovata nel tuo account.
          </Text>
          <Text variant="tertiary" size="sm">
            Se hai una Welcome o Presence, assicurati che sia configurata nell&apos;app Netatmo.
          </Text>
        </div>
      </DeviceCard>
    );
  }

  return (
    <DeviceCard
      icon="📹"
      title="Videocamera"
      colorTheme="ocean"
      statusBadge={getStatusBadge()}
      loading={refreshing}
      loadingMessage="Aggiornamento..."
      footerActions={[
        {
          label: 'Vedi tutte le telecamere',
          variant: 'subtle',
          onClick: () => router.push('/camera'),
        },
      ]}
    >
      {/* Staleness banner */}
      {isStale && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
          Dati non aggiornati — la videocamera potrebbe essere offline
        </div>
      )}

      {/* Camera selector if multiple */}
      {cameras.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 -mx-2 px-2">
          {cameras.map(camera => (
            <Button
              key={camera.camera_id}
              variant={selectedCameraId === camera.camera_id ? 'ember' : 'subtle'}
              size="sm"
              onClick={() => setSelectedCameraId(camera.camera_id)}
              className="whitespace-nowrap"
            >
              {camera.name ?? camera.camera_id}
            </Button>
          ))}
        </div>
      )}

      {/* Video/Snapshot toggle */}
      {selectedCamera?.status === 'on' && !isStale && (
        <div className="flex gap-2 mb-3">
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
      <div className="relative aspect-video bg-slate-800 rounded-xl overflow-hidden mb-4">
        {isLiveMode && selectedCamera?.status === 'on' && streamUrl ? (
          // Live video mode — stream URL obtained, HLS player active
          <HlsPlayer
            src={streamUrl}
            poster={snapshotUrl ?? undefined}
            className="w-full h-full"
            onError={() => {
              // Fallback to snapshot on live error
              setIsLiveMode(false);
              setStreamError(true);
            }}
          />
        ) : isLiveMode && streamLoading ? (
          // Stream URL is being fetched
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-2 border-ocean-500 border-t-transparent rounded-full animate-spin" />
            <Text variant="secondary" size="sm">Connessione al live...</Text>
          </div>
        ) : isLiveMode && streamError ? (
          // Stream fetch failed
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span className="text-3xl opacity-50">📡</span>
            <Text variant="secondary" size="sm">Live non disponibile</Text>
          </div>
        ) : (
          // Snapshot mode — URL points to /api/netatmo/camera/snapshot which redirects to Netatmo CDN
          <>
            {snapshotUrl && !snapshotError ? (
              <img
                src={snapshotUrl}
                alt={`Snapshot ${selectedCamera?.name ?? ''}`}
                className="w-full h-full object-cover"
                onError={() => setSnapshotError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <span className="text-3xl opacity-50">📹</span>
                <Text variant="secondary" size="sm">
                  {snapshotError ? 'Snapshot non disponibile' : 'Nessuna anteprima'}
                </Text>
              </div>
            )}
          </>
        )}

        {/* Camera status badge overlay */}
        {selectedCamera && (
          <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
            selectedCamera.status === 'on'
              ? 'bg-sage-500/80 text-white'
              : 'bg-slate-600/80 text-slate-300'
          }`}>
            {selectedCamera.status === 'on' ? 'Attiva' : 'Inattiva'}
          </div>
        )}

        {/* Refresh button overlay (only in snapshot mode) */}
        {!isLiveMode && (
          <Button.Icon
            icon={<RefreshCw className={`w-4 h-4 text-white ${refreshing ? 'animate-spin' : ''}`} /> as any}
            onClick={handleRefresh}
            variant="ghost"
            size="sm"
            aria-label="Aggiorna snapshot"
            className="absolute bottom-2 right-2 bg-slate-900/70 backdrop-blur-sm hover:bg-slate-800/90"
          />
        )}
      </div>

      {/* Camera info + monitoring toggle */}
      {selectedCamera && (
        <div className="flex items-center justify-between gap-2 text-sm">
          <Text variant="tertiary">
            {getCameraTypeName(selectedCamera.device_type ?? '')}
          </Text>
          <div className="flex items-center gap-2">
            <Text variant="tertiary" size="xs">
              {monitoringOn ? 'Monitoraggio attivo' : 'Monitoraggio disattivo'}
            </Text>
            <Switch
              checked={monitoringOn}
              onCheckedChange={handleMonitoringToggle}
              disabled={isStale || monitoringLoading}
              size="sm"
              variant="ocean"
              label="Monitoraggio camera"
            />
          </div>
        </div>
      )}
    </DeviceCard>
  );
}
