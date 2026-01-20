'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CAMERA_ROUTES, NETATMO_ROUTES } from '@/lib/routes';
import Skeleton from '../../ui/Skeleton';
import DeviceCard from '../../ui/DeviceCard';
import { Text, Button } from '../../ui';
import NETATMO_CAMERA_API from '@/lib/netatmoCameraApi';
import HlsPlayer from './HlsPlayer';

/**
 * CameraCard - Camera summary view for homepage
 * Shows camera status with snapshot and live video preview
 */
export default function CameraCard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [needsReauth, setNeedsReauth] = useState(false); // Token exists but missing camera scopes
  const [cameras, setCameras] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [snapshotUrl, setSnapshotUrl] = useState(null);
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

  async function fetchCameras() {
    try {
      setLoading(true);
      setError(null);
      setNeedsReauth(false);

      const response = await fetch(CAMERA_ROUTES.list);
      const data = await response.json();

      if (data.reconnect) {
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
          // Token exists but doesn't have camera permissions
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
      const errorMsg = err.message?.toLowerCase() || '';
      if (errorMsg.includes('invalid access token') ||
          errorMsg.includes('access_denied') ||
          errorMsg.includes('insufficient scope')) {
        setNeedsReauth(true);
        setError('Autorizzazione videocamere mancante');
      } else {
        setError(err.message);
      }
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSnapshot(cameraId) {
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
      {/* Camera selector if multiple */}
      {cameras.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 -mx-2 px-2">
          {cameras.map(camera => (
            <Button
              key={camera.id}
              variant={selectedCameraId === camera.id ? 'ocean' : 'subtle'}
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
      <div className="relative aspect-video bg-slate-800 rounded-xl overflow-hidden mb-4">
        {isLiveMode && selectedCamera?.status === 'on' ? (
          // Live video mode
          <HlsPlayer
            src={NETATMO_CAMERA_API.getLiveStreamUrl(selectedCamera)}
            poster={snapshotUrl}
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
          <button
            onClick={handleRefresh}
            className="absolute bottom-2 right-2 p-2 rounded-full bg-slate-900/70 backdrop-blur-sm hover:bg-slate-800/90 transition-colors"
            title="Aggiorna snapshot"
          >
            <svg className={`w-4 h-4 text-white ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
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
