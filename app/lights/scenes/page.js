'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Skeleton, EmptyState, Heading, Text, Banner } from '@/app/components/ui';

/**
 * Scenes Page - Philips Hue scene management
 * View and activate all available scenes
 */
export default function ScenesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [connected, setConnected] = useState(false);
  const [scenes, setScenes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activatingScene, setActivatingScene] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState('all');

  const connectionCheckedRef = useRef(false);

  // Check connection on mount
  useEffect(() => {
    if (connectionCheckedRef.current) return;
    connectionCheckedRef.current = true;
    checkConnection();
  }, []);

  async function checkConnection() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/hue/status');
      const data = await response.json();

      if (data.connected) {
        setConnected(true);
        await fetchData();
      } else {
        setConnected(false);
      }
    } catch (err) {
      console.error('Errore connessione Hue:', err);
      setConnected(false);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchData() {
    try {
      setError(null);

      const [scenesRes, roomsRes] = await Promise.all([
        fetch('/api/hue/scenes'),
        fetch('/api/hue/rooms'),
      ]);

      const [scenesData, roomsData] = await Promise.all([
        scenesRes.json(),
        roomsRes.json(),
      ]);

      if (scenesData.reconnect || roomsData.reconnect) {
        setConnected(false);
        return;
      }

      if (scenesData.error) throw new Error(scenesData.error);
      if (roomsData.error) throw new Error(roomsData.error);

      setScenes(scenesData.scenes || []);
      setRooms(roomsData.rooms || []);
    } catch (err) {
      console.error('Errore fetch scene Hue:', err);
      setError(err.message);
    }
  }

  async function handleActivateScene(sceneId, sceneName) {
    try {
      setActivatingScene(sceneId);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/hue/scenes/${sceneId}/activate`, {
        method: 'PUT',
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setSuccess(`Scena "${sceneName}" attivata con successo`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Errore attivazione scena:', err);
      setError(err.message);
    } finally {
      setActivatingScene(null);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }

  if (loading) {
    return <Skeleton.LightsCard />;
  }

  if (!connected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-8">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
            Bridge Hue Non Connesso
          </h2>

          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Effettua il pairing con il bridge Hue dalla homepage per gestire le scene.
          </p>

          <Button variant="primary" onClick={() => router.push('/')}>
            ← Torna alla Homepage
          </Button>
        </Card>
      </div>
    );
  }

  // Filter scenes by room
  const filteredScenes = selectedRoom === 'all'
    ? scenes
    : scenes.filter(scene => scene.group?.rid === selectedRoom);

  // Group scenes by room
  const scenesByRoom = rooms.map(room => ({
    room,
    scenes: scenes.filter(scene => scene.group?.rid === room.id),
  })).filter(group => group.scenes.length > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/lights')}
          size="sm"
          className="mb-4"
        >
          ← Indietro
        </Button>

        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
          🎨 Scene Philips Hue
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Attiva le tue scene preferite con un click
        </p>
      </div>

      {/* Success Banner */}
      {success && (
        <div className="mb-6">
          <Banner
            variant="success"
            icon="✅"
            title="Successo"
            description={success}
            dismissible
            onDismiss={() => setSuccess(null)}
          />
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-6">
          <Banner
            variant="error"
            icon="⚠️"
            title="Errore"
            description={error}
            dismissible
            onDismiss={() => setError(null)}
          />
        </div>
      )}

      {/* Summary Card */}
      <Card className="p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-1">
              Scene Disponibili
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {filteredScenes.length} {filteredScenes.length === 1 ? 'scena' : 'scene'} disponibili
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              loading={refreshing}
              size="sm"
            >
              🔄 Aggiorna
            </Button>
          </div>
        </div>

        {/* Room Filter */}
        {rooms.length > 1 && (
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <Text variant="secondary" className="text-xs mb-2">Filtra per stanza:</Text>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedRoom === 'all' ? 'primary' : 'outline'}
                onClick={() => setSelectedRoom('all')}
                size="sm"
              >
                Tutte ({scenes.length})
              </Button>
              {rooms.map(room => {
                const roomSceneCount = scenes.filter(s => s.group?.rid === room.id).length;
                if (roomSceneCount === 0) return null;

                return (
                  <Button
                    key={room.id}
                    variant={selectedRoom === room.id ? 'primary' : 'outline'}
                    onClick={() => setSelectedRoom(room.id)}
                    size="sm"
                  >
                    {room.metadata?.name} ({roomSceneCount})
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Scenes by Room */}
      {selectedRoom === 'all' ? (
        scenesByRoom.map(({ room, scenes: roomScenes }) => (
          <div key={room.id} className="mb-8">
            <Heading level={2} size="md" className="mb-4">
              {room.metadata?.name || 'Stanza'}
            </Heading>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {roomScenes.map(scene => (
                <button
                  key={scene.id}
                  onClick={() => handleActivateScene(scene.id, scene.metadata?.name)}
                  disabled={activatingScene === scene.id}
                  className={`relative p-6 rounded-2xl border-2 transition-all duration-200 active:scale-95 ${
                    activatingScene === scene.id
                      ? 'border-warning-500 bg-warning-50 dark:bg-warning-900/20'
                      : 'border-neutral-200 dark:border-neutral-700 bg-white/60 dark:bg-white/[0.03] hover:bg-warning-50 dark:hover:bg-warning-900/20 hover:border-warning-300 dark:hover:border-warning-600'
                  }`}
                >
                  <div className="text-4xl mb-3">🎨</div>
                  <Text className="text-sm font-semibold text-center">
                    {scene.metadata?.name || 'Scena'}
                  </Text>
                  {activatingScene === scene.id && (
                    <div className="absolute top-2 right-2">
                      <div className="w-4 h-4 border-2 border-warning-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredScenes.map(scene => (
            <button
              key={scene.id}
              onClick={() => handleActivateScene(scene.id, scene.metadata?.name)}
              disabled={activatingScene === scene.id}
              className={`relative p-6 rounded-2xl border-2 transition-all duration-200 active:scale-95 ${
                activatingScene === scene.id
                  ? 'border-warning-500 bg-warning-50 dark:bg-warning-900/20'
                  : 'border-neutral-200 dark:border-neutral-700 bg-white/60 dark:bg-white/[0.03] hover:bg-warning-50 dark:hover:bg-warning-900/20 hover:border-warning-300 dark:hover:border-warning-600'
              }`}
            >
              <div className="text-4xl mb-3">🎨</div>
              <Text className="text-sm font-semibold text-center">
                {scene.metadata?.name || 'Scena'}
              </Text>
              {activatingScene === scene.id && (
                <div className="absolute top-2 right-2">
                  <div className="w-4 h-4 border-2 border-warning-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredScenes.length === 0 && (
        <EmptyState
          icon="🎨"
          title="Nessuna scena disponibile"
          description="Crea scene nell'app Philips Hue per vederle qui"
        />
      )}

      {/* Phase 2 Notice */}
      <Card className="p-6 mt-8 bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <Heading level={3} size="sm" className="mb-1">
              Fase 2: Creazione e Modifica Scene
            </Heading>
            <Text variant="secondary" className="text-sm">
              Prossimamente potrai creare e modificare scene direttamente dall'app. Per ora puoi attivarle tutte le scene create nell'app Philips Hue.
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
}
