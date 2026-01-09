'use client';

import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import ActionButton from '../ui/ActionButton';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { X } from 'lucide-react';

/**
 * EditSceneModal Component
 *
 * Loads existing scene data and allows modifications.
 * Cannot change room (Hue API limitation), only name and light configs.
 *
 * @param {boolean} isOpen - Modal open state
 * @param {Object} scene - Scene object {id, metadata: {name}, group: {rid}}
 * @param {Array} rooms - Array of room objects
 * @param {Function} onConfirm - Callback with {sceneId, name?, actions?}
 * @param {Function} onCancel - Callback to close modal
 */
export default function EditSceneModal({
  isOpen,
  scene,
  rooms = [],
  onConfirm,
  onCancel,
}) {
  const [name, setName] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [lights, setLights] = useState([]);
  const [lightConfigs, setLightConfigs] = useState({});
  const [loadingLights, setLoadingLights] = useState(false);
  const [error, setError] = useState('');

  // Pre-populate with scene data when modal opens
  useEffect(() => {
    if (isOpen && scene) {
      setName(scene.metadata?.name || '');
      setSelectedRoom(scene.group?.rid || '');
      setError('');
      // Fetch lights will be triggered by selectedRoom change
    }
  }, [isOpen, scene]);

  // Fetch lights when room is available
  useEffect(() => {
    if (selectedRoom) {
      fetchRoomLights(selectedRoom);
    } else {
      setLights([]);
      setLightConfigs({});
    }
  }, [selectedRoom]);

  async function fetchRoomLights(roomId) {
    try {
      setLoadingLights(true);
      setError('');

      const response = await fetch('/api/hue/lights');
      const data = await response.json();

      if (data.error) throw new Error(data.error);

      // Filter lights for selected room
      const selectedRoomObj = rooms.find(r => r.id === roomId);
      const roomLights = data.lights.filter(light => {
        return selectedRoomObj?.services?.some(
          service => service.rid === light.id
        );
      });

      setLights(roomLights);

      // Pre-populate with CURRENT states (not scene.actions)
      // This allows hybrid flow - user sees current state and can adjust
      const initialConfigs = {};
      roomLights.forEach(light => {
        initialConfigs[light.id] = {
          on: light.on?.on ?? true,
          brightness: light.dimming?.brightness ?? 100,
          color: light.color ? {
            x: light.color.xy?.x ?? 0.3227,
            y: light.color.xy?.y ?? 0.329
          } : null
        };
      });
      setLightConfigs(initialConfigs);

    } catch (err) {
      console.error('Error fetching lights:', err);
      setError('Impossibile caricare le luci della stanza');
    } finally {
      setLoadingLights(false);
    }
  }

  function handleLightToggle(lightId) {
    setLightConfigs(prev => ({
      ...prev,
      [lightId]: {
        ...prev[lightId],
        on: !prev[lightId]?.on
      }
    }));
  }

  function handleBrightnessChange(lightId, brightness) {
    setLightConfigs(prev => ({
      ...prev,
      [lightId]: {
        ...prev[lightId],
        brightness: Number(brightness)
      }
    }));
  }

  function handleColorChange(lightId, x, y) {
    setLightConfigs(prev => ({
      ...prev,
      [lightId]: {
        ...prev[lightId],
        color: { x: Number(x), y: Number(y) }
      }
    }));
  }

  function handleConfirm() {
    // Validation
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Il nome della scena è obbligatorio');
      return;
    }

    if (trimmedName.length > 255) {
      setError('Il nome non può superare 255 caratteri');
      return;
    }

    if (lights.length === 0) {
      setError('La stanza non contiene luci');
      return;
    }

    // Build actions array for Hue API
    const actions = lights.map(light => {
      const config = lightConfigs[light.id] || {};

      const action = {
        target: { rid: light.id, rtype: 'light' },
        action: {
          on: { on: config.on ?? true }
        }
      };

      if (light.dimming) {
        action.action.dimming = { brightness: config.brightness ?? 100 };
      }

      if (light.color && config.color) {
        action.action.color = {
          xy: {
            x: config.color.x,
            y: config.color.y
          }
        };
      }

      return action;
    });

    onConfirm({
      sceneId: scene.id,
      name: trimmedName,
      actions
    });
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleConfirm();
    }
  }

  // Color presets (same as CreateSceneModal)
  const COLOR_PRESETS = [
    { name: 'Bianco', x: 0.3227, y: 0.329 },
    { name: 'Rosso', x: 0.675, y: 0.322 },
    { name: 'Verde', x: 0.408, y: 0.517 },
    { name: 'Blu', x: 0.168, y: 0.041 },
    { name: 'Giallo', x: 0.4432, y: 0.5154 },
  ];

  // Get room name for display
  const roomName = rooms.find(r => r.id === selectedRoom)?.metadata?.name || 'Stanza';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      maxWidth="max-w-3xl"
    >
      <Card liquid className="animate-scale-in-center p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
              Modifica Scena
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Aggiorna nome e configurazione luci
            </p>
          </div>
          <ActionButton
            icon={<X />}
            variant="close"
            size="md"
            onClick={onCancel}
            ariaLabel="Chiudi"
          />
        </div>

        {/* Body */}
        <div className="space-y-6">
          {/* Scene Name */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Nome Scena <span className="text-primary-500">*</span>
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              onKeyPress={handleKeyPress}
              placeholder="Es: Relax serale, Lettura..."
              maxLength={255}
              autoFocus
              liquid
            />
            <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              {name.length}/255 caratteri
            </p>
          </div>

          {/* Room Selection (READ-ONLY) */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Stanza <span className="text-neutral-500 text-xs">(non modificabile)</span>
            </label>
            <div className="w-full px-4 py-3 bg-neutral-100/60 dark:bg-neutral-700/60 backdrop-blur-xl rounded-xl border border-neutral-300/50 dark:border-neutral-600/50 text-neutral-600 dark:text-neutral-400 cursor-not-allowed">
              {roomName}
            </div>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              La stanza non può essere modificata dopo la creazione della scena
            </p>
          </div>

          {/* Lights Configuration */}
          {loadingLights && (
            <div className="text-center py-4">
              <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Caricamento luci...</p>
            </div>
          )}

          {!loadingLights && lights.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                Configurazione Luci
              </label>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {lights.map(light => {
                  const config = lightConfigs[light.id] || {};
                  return (
                    <div key={light.id} className="p-4 bg-white/40 dark:bg-neutral-800/40 rounded-xl border border-neutral-200/50 dark:border-neutral-700/50">
                      {/* Light Name + Toggle */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-neutral-900 dark:text-white">
                          {light.metadata?.name || 'Luce'}
                        </span>
                        <button
                          onClick={() => handleLightToggle(light.id)}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            config.on
                              ? 'bg-warning-500'
                              : 'bg-neutral-300 dark:bg-neutral-600'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                            config.on ? 'translate-x-6' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </div>

                      {/* Brightness Slider */}
                      {light.dimming && config.on && (
                        <div className="mb-3">
                          <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                            Luminosità: {config.brightness}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={config.brightness || 100}
                            onChange={(e) => handleBrightnessChange(light.id, e.target.value)}
                            className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded appearance-none cursor-pointer accent-warning-500"
                          />
                        </div>
                      )}

                      {/* Color Picker */}
                      {light.color && config.on && (
                        <div>
                          <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                            Colore (preset comuni)
                          </label>
                          <div className="grid grid-cols-5 gap-2">
                            {COLOR_PRESETS.map(preset => (
                              <button
                                key={preset.name}
                                onClick={() => handleColorChange(light.id, preset.x, preset.y)}
                                className="p-2 rounded-lg bg-neutral-200/50 dark:bg-neutral-700/50 hover:bg-neutral-300/50 dark:hover:bg-neutral-600/50 text-xs transition-colors"
                                title={preset.name}
                              >
                                {preset.name[0]}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <p className="text-sm text-primary-600 dark:text-primary-400 flex items-center gap-1">
              <span>⚠️</span>
              <span>{error}</span>
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 mt-8">
          <Button
            liquid
            variant="secondary"
            onClick={onCancel}
            className="flex-1"
          >
            Annulla
          </Button>
          <Button
            liquid
            variant="primary"
            onClick={handleConfirm}
            className="flex-1"
            disabled={!name.trim() || lights.length === 0 || loadingLights}
          >
            Salva Modifiche
          </Button>
        </div>
      </Card>
    </Modal>
  );
}
