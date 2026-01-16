'use client';

import { useState, useEffect, useCallback } from 'react';
import Button from '../ui/Button';
import ActionButton from '../ui/ActionButton';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Heading from '../ui/Heading';
import Text from '../ui/Text';
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
  const fetchRoomLights = useCallback(async (roomId) => {
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
  }, [rooms]);

  useEffect(() => {
    if (selectedRoom) {
      fetchRoomLights(selectedRoom);
    } else {
      setLights([]);
      setLightConfigs({});
    }
  }, [selectedRoom, fetchRoomLights]);

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
            <Heading level={3} size="xl">
              Modifica Scena
            </Heading>
            <Text variant="secondary" size="sm" className="mt-1">
              Aggiorna nome e configurazione luci
            </Text>
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
            <label className="block text-sm font-semibold text-slate-700 [html:not(.dark)_&]:text-slate-300 mb-2">
              Nome Scena <span className="text-ember-500">*</span>
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
            <Text variant="tertiary" size="xs" className="mt-2">
              {name.length}/255 caratteri
            </Text>
          </div>

          {/* Room Selection (READ-ONLY) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 [html:not(.dark)_&]:text-slate-300 mb-2">
              Stanza <Text as="span" variant="tertiary" size="xs">(non modificabile)</Text>
            </label>
            <div className="w-full px-4 py-3 bg-slate-100/60 [html:not(.dark)_&]:bg-slate-700/60 backdrop-blur-xl rounded-xl border border-slate-300/50 [html:not(.dark)_&]:border-slate-600/50 text-slate-600 [html:not(.dark)_&]:text-slate-400 cursor-not-allowed">
              {roomName}
            </div>
            <Text variant="tertiary" size="xs" className="mt-1">
              La stanza non può essere modificata dopo la creazione della scena
            </Text>
          </div>

          {/* Lights Configuration */}
          {loadingLights && (
            <div className="text-center py-4">
              <div className="w-8 h-8 border-3 border-ember-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <Text variant="secondary" size="sm">Caricamento luci...</Text>
            </div>
          )}

          {!loadingLights && lights.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 [html:not(.dark)_&]:text-slate-300 mb-3">
                Configurazione Luci
              </label>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {lights.map(light => {
                  const config = lightConfigs[light.id] || {};
                  return (
                    <div key={light.id} className="p-4 bg-white/40 [html:not(.dark)_&]:bg-slate-800/40 rounded-xl border border-slate-200/50 [html:not(.dark)_&]:border-slate-700/50">
                      {/* Light Name + Toggle */}
                      <div className="flex items-center justify-between mb-3">
                        <Text as="span" weight="medium">
                          {light.metadata?.name || 'Luce'}
                        </Text>
                        <button
                          onClick={() => handleLightToggle(light.id)}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            config.on
                              ? 'bg-flame-500'
                              : 'bg-slate-300 [html:not(.dark)_&]:bg-slate-600'
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
                          <label className="block text-xs text-slate-600 [html:not(.dark)_&]:text-slate-400 mb-1">
                            Luminosità: {config.brightness}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={config.brightness || 100}
                            onChange={(e) => handleBrightnessChange(light.id, e.target.value)}
                            className="w-full h-2 bg-slate-200 [html:not(.dark)_&]:bg-slate-700 rounded appearance-none cursor-pointer accent-flame-500"
                          />
                        </div>
                      )}

                      {/* Color Picker */}
                      {light.color && config.on && (
                        <div>
                          <label className="block text-xs text-slate-600 [html:not(.dark)_&]:text-slate-400 mb-1">
                            Colore (preset comuni)
                          </label>
                          <div className="grid grid-cols-5 gap-2">
                            {COLOR_PRESETS.map(preset => (
                              <button
                                key={preset.name}
                                onClick={() => handleColorChange(light.id, preset.x, preset.y)}
                                className="p-2 rounded-lg bg-slate-200/50 [html:not(.dark)_&]:bg-slate-700/50 hover:bg-slate-300/50 [html:not(.dark)_&]:hover:bg-slate-600/50 text-xs transition-colors"
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
            <Text variant="ember" size="sm" className="flex items-center gap-1">
              <span>⚠️</span>
              <span>{error}</span>
            </Text>
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
