'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Skeleton, EmptyState, Heading, Text, Banner } from '@/app/components/ui';
import type { HueScene, HueGroup } from '@/types/hueProxy';

/**
 * Scenes Page - Philips Hue scene management
 * View and activate all available scenes (read-only, CRUD deferred)
 */

interface SceneCardProps {
  scene: HueScene;
  activatingScene: string | null;
  onActivate: (sceneId: string, groupId: string, sceneName: string) => void;
}

function SceneCard({ scene, activatingScene, onActivate }: SceneCardProps) {
  const isActivating = activatingScene === scene.scene_id;
  return (
    <button
      key={scene.scene_id}
      onClick={() => onActivate(scene.scene_id, scene.group_id, scene.name || 'Scena')}
      disabled={isActivating}
      className={`w-full relative p-6 rounded-2xl border-2 transition-all duration-200 active:scale-95 ${
        isActivating
          ? 'border-warning-500 bg-warning-50 bg-warning-900/20'
          : 'border-slate-200 border-slate-700 bg-white/60 bg-white/[0.03] hover:bg-warning-50 hover:bg-warning-900/20 hover:border-warning-300 hover:border-warning-600'
      }`}
    >
      <div className="text-4xl mb-3">🎨</div>
      <Text size="sm" className="text-center">
        {scene.name || 'Scena'}
      </Text>
      {isActivating && (
        <div className="absolute top-2 right-2">
          <div className="w-4 h-4 border-2 border-warning-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </button>
  );
}

export default function ScenesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [scenes, setScenes] = useState<HueScene[]>([]);
  const [rooms, setRooms] = useState<HueGroup[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activatingScene, setActivatingScene] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string>('all');

  const connectionCheckedRef = useRef<boolean>(false);

  const fetchData = async (): Promise<void> => {
    try {
      setError(null);
      const [scenesRes, roomsRes] = await Promise.all([
        fetch('/api/v1/hue/scenes'),
        fetch('/api/v1/hue/groups'),
      ]);
      const [scenesData, roomsData]: any[] = await Promise.all([
        scenesRes.json(),
        roomsRes.json(),
      ]);
      if (scenesData.reconnect || roomsData.reconnect) { setConnected(false); return; }
      if (scenesData.error) throw new Error(scenesData.error);
      if (roomsData.error) throw new Error(roomsData.error);
      setScenes(scenesData.scenes || []);
      const sortedGroups = (roomsData.groups || []).sort((a: HueGroup, b: HueGroup) => {
        if (a.name === 'Casa') return -1;
        if (b.name === 'Casa') return 1;
        return (a.name || '').localeCompare(b.name || '');
      });
      setRooms(sortedGroups);
    } catch (err) {
      console.error('Errore fetch scene Hue:', err);
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    }
  };

  const checkConnection = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/v1/hue/health');
      const data = await response.json();
      if (data.connected) { setConnected(true); await fetchData(); }
      else { setConnected(false); }
    } catch (err) {
      console.error('Errore connessione Hue:', err);
      setConnected(false);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connectionCheckedRef.current) return;
    connectionCheckedRef.current = true;
    checkConnection();
  }, [checkConnection]);

  async function handleActivateScene(sceneId: string, groupId: string, sceneName: string) {
    try {
      setActivatingScene(sceneId);
      setError(null);
      setSuccess(null);
      const response = await fetch(`/api/v1/hue/groups/${groupId}/scenes/${sceneId}`, { method: 'POST' });
      if (!response.ok) throw new Error(`Comando fallito: ${response.status}`);
      setSuccess(`Scena "${sceneName}" attivata con successo`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Errore attivazione scena:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActivatingScene(null);
    }
  }

  if (loading) return <Skeleton.LightsCard />;

  if (!connected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-8">
          <Heading level={1} size="lg" className="mb-4">Bridge Hue Non Connesso</Heading>
          <Text variant="secondary" className="mb-6">
            Il bridge Hue non e raggiungibile tramite il proxy. Verifica che Home Assistant sia attivo.
          </Text>
          <Button variant="ember" onClick={() => router.push('/')}>← Torna alla Homepage</Button>
        </Card>
      </div>
    );
  }

  const filteredScenes = selectedRoom === 'all'
    ? scenes
    : scenes.filter(scene => scene.group_id === selectedRoom);

  const scenesByRoom = rooms.map(room => ({
    room,
    scenes: scenes.filter(scene => scene.group_id === room.group_id),
  })).filter(group => group.scenes.length > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.push('/lights')} size="sm" className="mb-4">
          ← Indietro
        </Button>
        <Heading level={1} size="2xl" className="mb-2">Scene Philips Hue</Heading>
        <Text variant="secondary">Attiva le tue scene preferite con un click</Text>
      </div>

      {success && (
        <div className="mb-6">
          <Banner variant="success" icon="✅" title="Successo" description={success}
            dismissible onDismiss={() => setSuccess(null)} />
        </div>
      )}

      {error && (
        <div className="mb-6">
          <Banner variant="error" icon="⚠️" title="Errore" description={error}
            dismissible onDismiss={() => setError(null)} />
        </div>
      )}

      <Card className="p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Heading level={2} size="lg" className="mb-1">Scene Disponibili</Heading>
            <Text variant="secondary" size="sm">
              {filteredScenes.length} {filteredScenes.length === 1 ? 'scena' : 'scene'} disponibili
            </Text>
          </div>
          <Button variant="outline" onClick={async () => { setRefreshing(true); await fetchData(); setRefreshing(false); }}
            loading={refreshing} size="sm">
            🔄 Aggiorna
          </Button>
        </div>

        {rooms.length > 1 && (
          <div className="mt-4 pt-4 border-t border-slate-200 border-slate-700">
            <Text variant="secondary" size="xs" className="mb-2">Filtra per stanza:</Text>
            <div className="flex flex-wrap gap-2">
              <Button variant={selectedRoom === 'all' ? 'ember' : 'outline'}
                onClick={() => setSelectedRoom('all')} size="sm">
                Tutte ({scenes.length})
              </Button>
              {rooms.map(room => {
                const count = scenes.filter(s => s.group_id === room.group_id).length;
                if (count === 0) return null;
                return (
                  <Button key={room.group_id}
                    variant={selectedRoom === room.group_id ? 'ember' : 'outline'}
                    onClick={() => setSelectedRoom(room.group_id)} size="sm">
                    {room.name} ({count})
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {selectedRoom === 'all' ? (
        scenesByRoom.map(({ room, scenes: roomScenes }) => (
          <div key={room.group_id} className="mb-8">
            <Heading level={2} size="md" className="mb-4">{room.name || 'Stanza'}</Heading>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {roomScenes.map(scene => (
                <SceneCard key={scene.scene_id} scene={scene}
                  activatingScene={activatingScene} onActivate={handleActivateScene} />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredScenes.map(scene => (
            <SceneCard key={scene.scene_id} scene={scene}
              activatingScene={activatingScene} onActivate={handleActivateScene} />
          ))}
        </div>
      )}

      {filteredScenes.length === 0 && (
        <EmptyState icon="🎨" title="Nessuna scena disponibile"
          description="Crea scene nell'app Philips Hue per vederle qui" />
      )}
    </div>
  );
}
