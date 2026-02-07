'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Skeleton, EmptyState, Heading, Text, Banner } from '@/app/components/ui';
import CreateSceneModal from '@/app/components/lights/CreateSceneModal';
import EditSceneModal from '@/app/components/lights/EditSceneModal';
import ContextMenu from '@/app/components/ui/ContextMenu';
import ConfirmDialog from '@/app/components/ui/ConfirmDialog';
import Toast from '@/app/components/ui/Toast';

/**
 * Scenes Page - Philips Hue scene management
 * View and activate all available scenes
 */
interface HueScene {
  id: string;
  metadata?: { name?: string };
  group?: { rid?: string };
}

interface HueRoom {
  id: string;
  metadata?: { name?: string };
}

export default function ScenesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [scenes, setScenes] = useState<HueScene[]>([]);
  const [rooms, setRooms] = useState<HueRoom[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activatingScene, setActivatingScene] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [editingScene, setEditingScene] = useState<HueScene | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<HueScene | null>(null);
  const [toast, setToast] = useState<{ message: string; icon?: string; variant?: 'success' | 'error' | 'warning' | 'info' } | null>(null);

  const connectionCheckedRef = useRef<boolean>(false);

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      setError(null);

      const [scenesRes, roomsRes] = await Promise.all([
        fetch('/api/hue/scenes'),
        fetch('/api/hue/rooms'),
      ]);

      const [scenesData, roomsData]: any[] = await Promise.all([
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
      // Sort rooms with 'Casa' first, then alphabetical
      const sortedRooms = (roomsData.rooms || []).sort((a: HueRoom, b: HueRoom) => {
        if (a.metadata?.name === 'Casa') return -1;
        if (b.metadata?.name === 'Casa') return 1;
        return (a.metadata?.name || '').localeCompare(b.metadata?.name || '');
      });
      setRooms(sortedRooms);
    } catch (err) {
      console.error('Errore fetch scene Hue:', err);
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    }
  }, []);

  const checkConnection = useCallback(async (): Promise<void> => {
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
  }, [fetchData]);

  // Check connection on mount
  useEffect(() => {
    if (connectionCheckedRef.current) return;
    connectionCheckedRef.current = true;
    checkConnection();
  }, [checkConnection]);

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

  async function handleCreateScene(data) {
    try {
      setError(null);

      const response = await fetch('/api/hue/scenes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      // Success
      setCreateModalOpen(false);
      await fetchData(); // Refresh scenes list
      setToast({ message: `Scena "${data.name}" creata con successo`, variant: 'success', icon: '✅' });

    } catch (err) {
      console.error('Error creating scene:', err);
      setError(err.message);
    }
  }

  async function handleUpdateScene(data) {
    try {
      setError(null);

      const { sceneId, ...updates } = data;

      const response = await fetch(`/api/hue/scenes/${sceneId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      // Success
      setEditingScene(null);
      await fetchData(); // Refresh scenes list
      setToast({ message: `Scena aggiornata con successo`, variant: 'success', icon: '✅' });

    } catch (err) {
      console.error('Error updating scene:', err);
      setError(err.message);
    }
  }

  async function handleDeleteSceneConfirmed() {
    const scene = deleteConfirm;
    setDeleteConfirm(null); // Close dialog immediately

    try {
      setError(null);

      const response = await fetch(`/api/hue/scenes/${scene.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      // Optimistic update - remove from local state
      setScenes(prev => prev.filter(s => s.id !== scene.id));
      setToast({ message: `Scena "${scene.metadata?.name}" eliminata`, variant: 'success', icon: '✅' });

    } catch (err) {
      console.error('Error deleting scene:', err);
      setError(err.message);
      // Re-fetch to revert optimistic update
      await fetchData();
    }
  }

  if (loading) {
    return <Skeleton.LightsCard />;
  }

  if (!connected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-8">
          <Heading level={1} size="lg" className="mb-4">
            Bridge Hue Non Connesso
          </Heading>

          <Text variant="secondary" className="mb-6">
            Effettua il pairing con il bridge Hue dalla homepage per gestire le scene.
          </Text>

          <Button variant="ember" onClick={() => router.push('/')}>
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

        <Heading level={1} size="2xl" className="mb-2">
          Scene Philips Hue
        </Heading>
        <Text variant="secondary">
          Attiva le tue scene preferite con un click
        </Text>
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
            <Heading level={2} size="lg" className="mb-1">
              Scene Disponibili
            </Heading>
            <Text variant="secondary" size="sm">
              {filteredScenes.length} {filteredScenes.length === 1 ? 'scena' : 'scene'} disponibili
            </Text>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ember"
              onClick={() => setCreateModalOpen(true)}
              size="sm"
            >
              ➕ Crea Nuova Scena
            </Button>
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
          <div className="mt-4 pt-4 border-t border-slate-200 [html:not(.dark)_&]:border-slate-200 border-slate-700">
            <Text variant="secondary" size="xs" className="mb-2">Filtra per stanza:</Text>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedRoom === 'all' ? 'ember' : 'outline'}
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
                    variant={selectedRoom === room.id ? 'ember' : 'outline'}
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
                <div key={scene.id} className="relative">
                  <button
                    onClick={() => handleActivateScene(scene.id, scene.metadata?.name)}
                    disabled={activatingScene === scene.id}
                    className={`w-full relative p-6 rounded-2xl border-2 transition-all duration-200 active:scale-95 ${
                      activatingScene === scene.id
                        ? 'border-warning-500 bg-warning-50 [html:not(.dark)_&]:bg-warning-50 bg-warning-900/20'
                        : 'border-slate-200 [html:not(.dark)_&]:border-slate-200 border-slate-700 bg-white/60 [html:not(.dark)_&]:bg-white/60 bg-white/[0.03] hover:bg-warning-50 [html:not(.dark)_&]:hover:bg-warning-50 hover:bg-warning-900/20 hover:border-warning-300 [html:not(.dark)_&]:hover:border-warning-300 hover:border-warning-600'
                    }`}
                  >
                    <div className="text-4xl mb-3">🎨</div>
                    <Text size="sm" className="text-center">
                      {scene.metadata?.name || 'Scena'}
                    </Text>
                    {activatingScene === scene.id && (
                      <div className="absolute top-2 right-2">
                        <div className="w-4 h-4 border-2 border-warning-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </button>

                  {/* Context Menu */}
                  <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                    <ContextMenu
                      ariaLabel={`Azioni per ${scene.metadata?.name}`}
                      items={[
                        {
                          label: 'Modifica',
                          icon: '✏️',
                          onClick: () => setEditingScene(scene)
                        },
                        {
                          label: 'Elimina',
                          icon: '🗑️',
                          variant: 'danger',
                          onClick: () => setDeleteConfirm(scene)
                        }
                      ]}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredScenes.map(scene => (
            <div key={scene.id} className="relative">
              <button
                onClick={() => handleActivateScene(scene.id, scene.metadata?.name)}
                disabled={activatingScene === scene.id}
                className={`w-full relative p-6 rounded-2xl border-2 transition-all duration-200 active:scale-95 ${
                  activatingScene === scene.id
                    ? 'border-warning-500 bg-warning-50 [html:not(.dark)_&]:bg-warning-50 bg-warning-900/20'
                    : 'border-slate-200 [html:not(.dark)_&]:border-slate-200 border-slate-700 bg-white/60 [html:not(.dark)_&]:bg-white/60 bg-white/[0.03] hover:bg-warning-50 [html:not(.dark)_&]:hover:bg-warning-50 hover:bg-warning-900/20 hover:border-warning-300 [html:not(.dark)_&]:hover:border-warning-300 hover:border-warning-600'
                }`}
              >
                <div className="text-4xl mb-3">🎨</div>
                <Text size="sm" className="text-center">
                  {scene.metadata?.name || 'Scena'}
                </Text>
                {activatingScene === scene.id && (
                  <div className="absolute top-2 right-2">
                    <div className="w-4 h-4 border-2 border-warning-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </button>

              {/* Context Menu */}
              <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                <ContextMenu
                  ariaLabel={`Azioni per ${scene.metadata?.name}`}
                  items={[
                    {
                      label: 'Modifica',
                      icon: '✏️',
                      onClick: () => setEditingScene(scene)
                    },
                    {
                      label: 'Elimina',
                      icon: '🗑️',
                      variant: 'danger',
                      onClick: () => setDeleteConfirm(scene)
                    }
                  ]}
                />
              </div>
            </div>
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

      {/* Create Scene Modal */}
      <CreateSceneModal
        isOpen={createModalOpen}
        rooms={rooms}
        onConfirm={handleCreateScene}
        onCancel={() => setCreateModalOpen(false)}
      />

      {/* Edit Scene Modal */}
      {editingScene && (
        <EditSceneModal
          isOpen={!!editingScene}
          scene={editingScene}
          rooms={rooms}
          onConfirm={handleUpdateScene}
          onCancel={() => setEditingScene(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Elimina Scena"
        message={`Sei sicuro di voler eliminare la scena "${deleteConfirm?.metadata?.name}"? Questa azione non può essere annullata.`}
        confirmText="Elimina"
        cancelText="Annulla"
        confirmVariant="danger"
        icon="🗑️"
        onConfirm={handleDeleteSceneConfirmed}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          variant={toast.variant}
          onOpenChange={(open) => { if (!open) setToast(null); }}
        >
          {toast.message}
        </Toast>
      )}
    </div>
  );
}
