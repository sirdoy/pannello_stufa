'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Skeleton, EmptyState, Heading, Text, Banner } from '@/app/components/ui';
import { ArrowLeft, Palette, RefreshCw } from 'lucide-react';
import type { HueScene, HueGroup } from '@/types/hueProxy';
import { PageHeader } from '@/app/components/EmberGlass/PageHeader';

/** JSON bodies of GET /api/v1/hue/scenes and /api/v1/hue/groups (or an error payload) */
interface HueScenesApiResponse {
  scenes?: HueScene[];
  reconnect?: boolean;
  error?: string;
}

interface HueGroupsApiResponse {
  groups?: HueGroup[];
  reconnect?: boolean;
  error?: string;
}

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
      className={`relative w-full rounded-2xl border-[0.5px] p-6 transition-colors active:scale-95 ${
        isActivating
          ? 'border-warning-500 bg-warning-500/10'
          : 'border-white/6 bg-white/4 hover:bg-white/6'
      }`}
    >
      <Palette size={24} className="mx-auto mb-3 text-(--text-2)" aria-hidden="true" />
      <Text size="sm" className="text-center">
        {scene.name || 'Scena'}
      </Text>
      {isActivating && (
        <div className="absolute top-2 right-2">
          <div className="size-4 animate-spin rounded-full border-2 border-warning-500 border-t-transparent"></div>
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

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      const [scenesRes, roomsRes] = await Promise.all([
        fetch('/api/v1/hue/scenes'),
        fetch('/api/v1/hue/groups'),
      ]);
      const [scenesData, roomsData]: [HueScenesApiResponse, HueGroupsApiResponse] = await Promise.all([
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
  }, []);


  const checkConnection = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/v1/hue/health');
      const data = await response.json();
      // Backend returns 503 when UNREACHABLE; `connected` is false also on STALE
      // cache, where lights/scenes are still served — don't block the page then.
      if (response.ok && data.data_freshness !== 'UNREACHABLE') { setConnected(true); await fetchData(); }
      else { setConnected(false); }
    } catch (err) {
      console.error('Errore connessione Hue:', err);
      setConnected(false);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [fetchData]);


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

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <PageHeader title="Scene" backHref="/lights" />
        <Skeleton.LightsCard />
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="mx-auto max-w-7xl">
        <PageHeader title="Scene" backHref="/lights" />
        <Card className="p-8">
          <Heading level={2} size="lg" className="mb-4">Bridge Hue Non Connesso</Heading>
          <Text variant="secondary" className="mb-6">
            Il bridge Hue non e raggiungibile tramite il proxy. Verifica che Home Assistant sia attivo.
          </Text>
          <Button variant="ember" onClick={() => router.push('/')} icon={<ArrowLeft size={16} />}>Torna alla Homepage</Button>
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
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Scene" description="Attiva le tue scene preferite con un click" backHref="/lights" />

      {success && (
        <div className="mb-6">
          <Banner variant="success" title="Successo" description={success}
            dismissible onDismiss={() => setSuccess(null)} />
        </div>
      )}

      {error && (
        <div className="mb-6">
          <Banner variant="error" title="Errore" description={error}
            dismissible onDismiss={() => setError(null)} />
        </div>
      )}

      <Card className="mb-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Heading level={2} size="lg" className="mb-1">Scene Disponibili</Heading>
            <Text variant="secondary" size="sm">
              {filteredScenes.length} {filteredScenes.length === 1 ? 'scena' : 'scene'} disponibili
            </Text>
          </div>
          <Button variant="outline" onClick={async () => { setRefreshing(true); await fetchData(); setRefreshing(false); }}
            loading={refreshing} size="sm" icon={<RefreshCw size={16} />}>
            Aggiorna
          </Button>
        </div>

        {rooms.length > 1 && (
          <div className="mt-4 border-t border-white/8 pt-4">
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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {roomScenes.map(scene => (
                <SceneCard key={scene.scene_id} scene={scene}
                  activatingScene={activatingScene} onActivate={handleActivateScene} />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredScenes.map(scene => (
            <SceneCard key={scene.scene_id} scene={scene}
              activatingScene={activatingScene} onActivate={handleActivateScene} />
          ))}
        </div>
      )}

      {filteredScenes.length === 0 && (
        <EmptyState icon={<Palette size={32} />} title="Nessuna scena disponibile"
          description="Crea scene nell'app Philips Hue per vederle qui" />
      )}
    </div>
  );
}
