'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Camera, Video, Image, Activity, Settings } from 'lucide-react';
import { CAMERA_ROUTES, NETATMO_ROUTES } from '@/lib/routes';
import Skeleton from '../../ui/Skeleton';
import DeviceCard from '../../ui/DeviceCard';
import { Text, Button } from '../../ui';
import NETATMO_CAMERA_API from '@/lib/netatmoCameraApi';
import HlsPlayer from './HlsPlayer';

interface NetatmoCamera {
  id: string;
  name: string;
  status: 'on' | 'off';
  type: string;
  is_local?: boolean;
  home_id?: string;
  home_name?: string;
  vpn_url?: string;
  [key: string]: any;
}

/**
 * CameraCard - Camera summary view for homepage
 * Shows camera status with snapshot and live video preview
 */
export default function CameraCard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [needsReauth, setNeedsReauth] = useState(false); // Token exists but missing camera scopes
  const [cameras, setCameras] = useState<NetatmoCamera[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [snapshotError, setSnapshotError] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);

  const connectionCheckedRef = useRef(false);

  // Check connection on mount
  useEffect(() => {
    if (connectionCheckedRef.current) return;
    connectionCheckedRef.current = true;
    fetchCameras();
  }, []);

  // Auto-select first camera
  useEffect(() => {
    if (cameras.length > 0 && !selectedCameraId) {
      setSelectedCameraId(cameras[0].id);
    }
  }, [cameras, selectedCameraId]);

  // Fetch snapshot when camera selected
  useEffect(() => {
    if (selectedCameraId) {
      fetchSnapshot(selectedCameraId);
    }
  }, [selectedCameraId]);

  async function fetchCameras(retryCount: number = 0) {
    const MAX_RETRIES = 1;
    const RETRY_DELAY_MS = 1500;

    try {
      setLoading(true);
      setError(null);
      setNeedsReauth(false);

      const response = await fetch(CAMERA_ROUTES.list);
      const data = await response.json();

      if (data.reconnect) {
        // Token issue - retry once in case token was just refreshed
        if (retryCount < MAX_RETRIES) {
          console.log(`⏳ Camera token issue, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
          return fetchCameras(retryCount + 1);
        }
        setConnected(false);
        setNeedsReauth(false);
        setError('Richiesta autorizzazione camera');
        return;
      }

      if (data.error) {
        // Check if error is related to invalid token or missing scopes
        const errorLower = data.error.toLowerCase();
        if (errorLower.includes('invalid access token') ||
            errorLower.includes('access_denied') ||
            errorLower.includes('insufficient scope')) {
          // Token exists but doesn't have camera permissions - no retry needed
          setConnected(false);
          setNeedsReauth(true);
          setError('Autorizzazione videocamere mancante');
          return;
        }
        throw new Error(data.error);
      }

      setConnected(true);
      setNeedsReauth(false);
      setCameras(data.cameras || []);
    } catch (err) {
      console.error('Errore fetch cameras:', err);
      // Also check thrown errors for token issues
      const errorMsg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
      if (errorMsg.includes('invalid access token') ||
          errorMsg.includes('access_denied') ||
          errorMsg.includes('insufficient scope')) {
        setNeedsReauth(true);
        setError('Autorizzazione videocamere mancante');
        setConnected(false);
      } else {
        // Retry on network errors
        if (retryCount < MAX_RETRIES) {
          console.log(`⏳ Camera fetch error, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
          return fetchCameras(retryCount + 1);
        }
        setError(err instanceof Error ? err.message : String(err));
        setConnected(false);
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchSnapshot(cameraId: string) {
    try {
      setSnapshotLoading(true);
      setSnapshotError(false);
      const response = await fetch(CAMERA_ROUTES.snapshot(cameraId));
      const data = await response.json();

      if (data.snapshot_url) {
        setSnapshotUrl(data.snapshot_url);
      } else {
        setSnapshotError(true);
      }
    } catch (err) {
      console.error('Errore fetch snapshot:', err);
      setSnapshotError(true);
    } finally {
      setSnapshotLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    connectionCheckedRef.current = false;
    await fetchCameras();
    if (selectedCameraId) {
      await fetchSnapshot(selectedCameraId);
    }
    setRefreshing(false);
  }

  const selectedCamera = cameras.find(c => c.id === selectedCameraId);

  // Get status badge based on camera state
  const getStatusBadge = () => {
    if (!connected) return { label: 'Non connesso', color: 'neutral' };
    if (cameras.length === 0) return { label: 'Nessuna camera', color: 'neutral' };
    if (selectedCamera?.status === 'on') return { label: 'Attiva', color: 'sage' };
    return { label: 'Inattiva', color: 'warning' };
  };

  // Loading state
  if (loading) {
    return <Skeleton.CameraCard />;
  }

  // Needs re-authorization - token exists but missing camera scopes
  if (needsReauth) {
    const handleReauthorize = async () => {
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
    };

    return (
      <DeviceCard
        icon="📹"
        title="Videocamera"
        colorTheme="ocean"
        connected={false}
        connectionError="L'accesso alle videocamere richiede una nuova autorizzazione con i permessi aggiornati."
        onConnect={handleReauthorize}
        connectButtonLabel="Riautorizza Netatmo"
      />
    );
  }

  // Not connected state - redirect to netatmo for OAuth
  if (!connected) {
    return (
      <DeviceCard
        icon="📹"
        title="Videocamera"
        colorTheme="ocean"
        connected={false}
        connectionError="Collega il tuo account Netatmo per visualizzare le videocamere."
        onConnect={() => router.push('/netatmo')}
        connectButtonLabel="Connetti Netatmo"
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

  // Context menu items for extended actions
  const cameraContextMenuItems = [
    {
      icon: 'Activity' as any,
      label: 'Eventi Camera',
      onSelect: () => router.push('/camera/events'),
    },
    {
      icon: 'Settings' as any,
      label: 'Impostazioni',
      onSelect: () => router.push('/camera/settings'),
    },
    { separator: true } as any,
    {
      icon: 'RefreshCw' as any,
      label: 'Aggiorna',
      onSelect: handleRefresh,
    },
  ];

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
      contextMenuItems={cameraContextMenuItems}
    >
      {/* Quick Actions */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <Button.Icon
          icon={<Camera className="w-5 h-5" /> as any}
          aria-label="Cattura Snapshot"
          variant="subtle"
          size="md"
          onClick={() => selectedCameraId && fetchSnapshot(selectedCameraId)}
          disabled={snapshotLoading || !selectedCameraId}
        />
        {selectedCamera?.status === 'on' && (
          <Button.Icon
            icon={(isLiveMode ? <Image className="w-5 h-5" /> : <Video className="w-5 h-5" />) as any}
            aria-label={isLiveMode ? "Mostra Snapshot" : "Mostra Live"}
            variant="subtle"
            size="md"
            onClick={() => setIsLiveMode(!isLiveMode)}
          />
        )}
      </div>

      {/* Camera selector if multiple */}
      {cameras.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 -mx-2 px-2">
          {cameras.map(camera => (
            <Button
              key={camera.id}
              variant={selectedCameraId === camera.id ? 'ember' : 'subtle'}
              size="sm"
              onClick={() => setSelectedCameraId(camera.id)}
              className="whitespace-nowrap"
            >
              {camera.name}
            </Button>
          ))}
        </div>
      )}

      {/* Video/Snapshot toggle */}
      {selectedCamera?.status === 'on' && (
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
            onClick={() => setIsLiveMode(true)}
          >
            Live
          </Button>
        </div>
      )}

      {/* Video preview */}
      <div className="relative aspect-video bg-slate-800 rounded-xl overflow-hidden mb-4">
        {isLiveMode && selectedCamera?.status === 'on' ? (
          // Live video mode
          <HlsPlayer
            src={NETATMO_CAMERA_API.getLiveStreamUrl(selectedCamera as any) || ''}
            poster={snapshotUrl ?? undefined}
            className="w-full h-full"
            onError={() => {
              // Fallback to snapshot on live error
              setIsLiveMode(false);
            }}
          />
        ) : (
          // Snapshot mode
          <>
            {snapshotLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-pulse">
                  <Text variant="secondary">Caricamento...</Text>
                </div>
              </div>
            ) : snapshotUrl && !snapshotError ? (
              <img
                src={snapshotUrl}
                alt={`Snapshot ${selectedCamera?.name}`}
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

      {/* Camera info */}
      {selectedCamera && (
        <div className="flex items-center gap-2 text-sm">
          <Text variant="tertiary">
            {NETATMO_CAMERA_API.getCameraTypeName(selectedCamera.type)}
          </Text>
        </div>
      )}
    </DeviceCard>
  );
}
